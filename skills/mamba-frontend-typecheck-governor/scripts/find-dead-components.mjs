#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const SOURCE_EXTENSIONS = [".vue", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".cts"]

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    app: null,
    json: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === "--root") args.root = argv[++index]
    else if (value === "--app") args.app = argv[++index]
    else if (value === "--json") args.json = true
    else if (value === "--help" || value === "-h") {
      printHelp()
      process.exit(0)
    }
    else {
      throw new Error(`Unknown argument: ${value}`)
    }
  }

  if (!args.app) throw new Error("Missing required --app apps/<name> argument")
  return args
}

function printHelp() {
  console.log(`Usage:
  node scripts/find-dead-components.mjs --app apps/hashrate [--root <project-root>] [--json]

Purpose:
  Static candidate scan for project-mamba app-local components before TypeScript repair.
  Output is evidence for review, not an automatic deletion decision.`)
}

function walkFiles(dir, predicate = () => true, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".turbo") continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(fullPath, predicate, files)
    else if (predicate(fullPath)) files.push(fullPath)
  }
  return files
}

function normalize(filePath) {
  return filePath.replace(/\\/g, "/")
}

function toProjectRelative(root, filePath) {
  return normalize(path.relative(root, filePath))
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8")
}

function isSourceFile(filePath) {
  return SOURCE_EXTENSIONS.includes(path.extname(filePath))
}

function isVueFile(filePath) {
  return path.extname(filePath) === ".vue"
}

function isInsideComponentDirectory(appSrc, filePath) {
  const relative = normalize(path.relative(appSrc, filePath))
  return relative.startsWith("components/") || relative.includes("/components/")
}

function extractSpecifiers(text) {
  const specifiers = []
  const importExportPattern = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s*)?["']([^"']+)["']/gs
  const dynamicImportPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  let match

  while ((match = importExportPattern.exec(text))) specifiers.push(match[1])
  while ((match = dynamicImportPattern.exec(text))) specifiers.push(match[1])
  return specifiers
}

function candidatesForBase(basePath) {
  const candidates = []
  const extension = path.extname(basePath)
  if (extension) {
    candidates.push(basePath)
    return candidates
  }

  for (const ext of SOURCE_EXTENSIONS) candidates.push(`${basePath}${ext}`)
  for (const ext of SOURCE_EXTENSIONS) candidates.push(path.join(basePath, `index${ext}`))
  return candidates
}

function resolveSpecifier(specifier, importer, aliases) {
  const cleanSpecifier = specifier.split("?")[0]
  let basePath = null

  if (cleanSpecifier.startsWith(".")) {
    basePath = path.resolve(path.dirname(importer), cleanSpecifier)
  }
  else {
    for (const [alias, target] of aliases) {
      if (cleanSpecifier === alias) {
        basePath = target
        break
      }
      if (cleanSpecifier.startsWith(`${alias}/`)) {
        basePath = path.join(target, cleanSpecifier.slice(alias.length + 1))
        break
      }
    }
  }

  if (!basePath) return null
  return candidatesForBase(basePath).find((candidate) => fs.existsSync(candidate)) ?? null
}

function pascalToKebab(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase()
}

function componentNames(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath))
  const parentName = path.basename(path.dirname(filePath))
  const name = baseName === "index" ? parentName : baseName
  return {
    pascal: name,
    kebab: pascalToKebab(name),
  }
}

function hasTemplateReference(text, names) {
  return (
    new RegExp(`<${names.pascal}(\\s|>|/)`).test(text)
    || new RegExp(`<${names.kebab}(\\s|>|/)`).test(text)
  )
}

function commonEquivalentPaths(root, appSrc, componentFile) {
  const commonSrc = path.join(root, "apps", "common", "src")
  if (!fs.existsSync(commonSrc)) return []
  const relative = normalize(path.relative(path.join(appSrc, "components"), componentFile))
  if (relative.startsWith("..")) return []

  const target = path.join(commonSrc, "components", relative)
  const variants = [target]

  if (path.basename(componentFile) === "index.vue") {
    variants.push(path.join(commonSrc, "components", path.basename(path.dirname(componentFile)), "index.vue"))
  }

  return variants.filter((candidate) => fs.existsSync(candidate) && normalize(candidate) !== normalize(componentFile))
}

function classifyInbound(root, inbound) {
  const barrelOrInstall = inbound.filter((entry) => {
    const rel = toProjectRelative(root, entry.importer)
    return rel.endsWith("/src/components/index.ts") || rel.endsWith("/src/install.ts") || rel.endsWith("/install.ts")
  })
  const nonBarrel = inbound.filter((entry) => !barrelOrInstall.includes(entry))

  if (inbound.length === 0) return "no-inbound-import"
  if (nonBarrel.length === 0) return "only-barrel-or-install"
  return "has-active-static-import"
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const root = path.resolve(args.root)
  const appPath = path.resolve(root, args.app)
  const appName = path.basename(appPath)
  const appSrc = path.join(appPath, "src")

  if (!fs.existsSync(appSrc)) throw new Error(`App source directory not found: ${appSrc}`)

  const aliases = new Map([
    [`@${appName}`, appSrc],
    ["@common", path.join(root, "apps", "common", "src")],
  ])

  const sourceFiles = walkFiles(appSrc, isSourceFile)
  const componentFiles = sourceFiles
    .filter((filePath) => isVueFile(filePath) && isInsideComponentDirectory(appSrc, filePath))
    .sort()

  const inboundByComponent = new Map(componentFiles.map((filePath) => [normalize(filePath), []]))
  const templateRefsByComponent = new Map(componentFiles.map((filePath) => [normalize(filePath), []]))
  const componentNamesByPath = new Map(componentFiles.map((filePath) => [normalize(filePath), componentNames(filePath)]))

  for (const importer of sourceFiles) {
    const text = readText(importer)
    for (const specifier of extractSpecifiers(text)) {
      const resolved = resolveSpecifier(specifier, importer, aliases)
      if (!resolved) continue
      const normalizedResolved = normalize(resolved)
      if (inboundByComponent.has(normalizedResolved)) {
        inboundByComponent.get(normalizedResolved).push({
          importer,
          specifier,
        })
      }
    }

    if (!isVueFile(importer)) continue
    for (const [normalizedComponent, names] of componentNamesByPath) {
      if (normalize(importer) === normalizedComponent) continue
      if (hasTemplateReference(text, names)) {
        templateRefsByComponent.get(normalizedComponent).push({ importer })
      }
    }
  }

  const components = componentFiles.map((componentFile) => {
    const normalizedComponent = normalize(componentFile)
    const inbound = inboundByComponent.get(normalizedComponent) ?? []
    const templateRefs = templateRefsByComponent.get(normalizedComponent) ?? []
    const commonEquivalents = commonEquivalentPaths(root, appSrc, componentFile)
    const importStatus = classifyInbound(root, inbound)
    const status = templateRefs.length > 0 && importStatus !== "has-active-static-import"
      ? "template-reference-without-static-import"
      : importStatus

    return {
      file: toProjectRelative(root, componentFile),
      status,
      inboundImports: inbound.map((entry) => ({
        importer: toProjectRelative(root, entry.importer),
        specifier: entry.specifier,
      })),
      templateReferences: templateRefs.map((entry) => toProjectRelative(root, entry.importer)),
      commonEquivalents: commonEquivalents.map((entry) => toProjectRelative(root, entry)),
    }
  })

  const candidates = components.filter((component) => (
    component.status === "no-inbound-import"
    || component.status === "only-barrel-or-install"
    || component.commonEquivalents.length > 0
  ))

  const result = {
    app: normalize(args.app),
    scannedComponents: components.length,
    candidateCount: candidates.length,
    candidates,
    components,
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log(`Dead component candidate scan for ${result.app}`)
  console.log(`Scanned components: ${result.scannedComponents}`)
  console.log(`Candidates: ${result.candidateCount}`)

  for (const candidate of candidates) {
    console.log("")
    console.log(`- ${candidate.file}`)
    console.log(`  status: ${candidate.status}`)
    if (candidate.commonEquivalents.length > 0) {
      console.log(`  common equivalents: ${candidate.commonEquivalents.join(", ")}`)
    }
    if (candidate.inboundImports.length > 0) {
      console.log(`  inbound imports: ${candidate.inboundImports.map((entry) => `${entry.importer} -> ${entry.specifier}`).join("; ")}`)
    }
    if (candidate.templateReferences.length > 0) {
      console.log(`  template references: ${candidate.templateReferences.join(", ")}`)
    }
  }

  console.log("")
  console.log("Treat this as a review queue, not an automatic deletion list.")
}

try {
  main()
}
catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
