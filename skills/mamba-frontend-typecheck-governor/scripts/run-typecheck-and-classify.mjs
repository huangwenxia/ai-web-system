#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    app: null,
    command: null,
    log: null,
    json: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === "--root") args.root = argv[++index]
    else if (value === "--app") args.app = argv[++index]
    else if (value === "--command") args.command = argv[++index]
    else if (value === "--log") args.log = argv[++index]
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
  if (args.command && args.log) throw new Error("Use either --command or --log, not both")
  return args
}

function printHelp() {
  console.log(`Usage:
  node scripts/run-typecheck-and-classify.mjs --app apps/hashrate --command "pnpm --filter hashrate type-check"
  node scripts/run-typecheck-and-classify.mjs --app apps/hashrate --log .tmp/hashrate-typecheck.log

Purpose:
  Run or parse project-mamba frontend type-check output and classify errors by ownership.`)
}

function normalize(filePath) {
  return filePath.replace(/\\/g, "/")
}

function readTextMaybeUtf16(filePath) {
  const buffer = fs.readFileSync(filePath)
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le")
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff && buffer.length % 2 === 0) {
    return Buffer.from(buffer).swap16().toString("utf16le")
  }

  const sample = buffer.subarray(0, Math.min(buffer.length, 200))
  const nulCount = [...sample].filter((value) => value === 0).length
  if (sample.length > 0 && nulCount / sample.length > 0.2) {
    return buffer.toString("utf16le")
  }

  return buffer.toString("utf8")
}

function inferCommand(root, app) {
  const appPath = path.resolve(root, app)
  const packageJsonPath = path.join(appPath, "package.json")
  if (!fs.existsSync(packageJsonPath)) return null

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
  const filter = pkg.name ?? path.basename(appPath)
  if (pkg.scripts?.["type-check"]) return `pnpm --filter ${filter} type-check`
  if (pkg.scripts?.tsc) return `pnpm --filter ${filter} tsc`
  return null
}

function runCommand(command, cwd) {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 40,
  })

  return {
    command,
    exitCode: typeof result.status === "number" ? result.status : 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
    error: result.error ? String(result.error.message ?? result.error) : null,
  }
}

function parseErrors(output, root, app) {
  const appName = path.basename(app)
  const rootPath = normalize(path.resolve(root))
  const errors = []

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^(.*)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/)
    if (!match) continue

    const rawFile = normalize(match[1].trim())
    const file = normalizePathForReport(rawFile, rootPath)
    errors.push({
      file,
      line: Number(match[2]),
      column: Number(match[3]),
      code: match[4],
      message: match[5],
      owner: classifyOwner(file, line, appName),
      raw: line,
    })
  }

  return errors
}

function normalizePathForReport(rawFile, rootPath) {
  let file = rawFile
  const normalizedRoot = rootPath.endsWith("/") ? rootPath : `${rootPath}/`
  if (file.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
    file = file.slice(normalizedRoot.length)
  }
  return file.replace(/^\.\//, "")
}

function classifyOwner(file, rawLine, appName) {
  const normalized = normalize(file)
  const line = rawLine.toLowerCase()
  const appPrefix = `apps/${appName}/src/`

  if (normalized.includes("packages/api/")) return "generated-api"
  if (normalized.includes("packages/request/") || line.includes("@repo/request")) return "request-public"
  if (normalized.includes("node_modules/")) return "dependency"
  if (normalized.startsWith(appPrefix) || normalized.startsWith("src/")) return "target-app"
  if (normalized.startsWith(`apps/${appName}/`)) return "target-app"
  if (/^apps\/[^/]+\/src\//.test(normalized)) return "common-or-cross-app"
  if (/^\.\.\/[^/]+\/src\//.test(normalized)) return "common-or-cross-app"
  if (normalized.includes("/apps/common/src/") || normalized.includes("../common/src/")) return "common-or-cross-app"
  if (normalized.startsWith("../")) return "common-or-cross-app"
  return "unknown"
}

function summarize(errors) {
  const byOwner = new Map()
  const byCode = new Map()
  const byFile = new Map()

  for (const error of errors) {
    byOwner.set(error.owner, (byOwner.get(error.owner) ?? 0) + 1)
    byCode.set(error.code, (byCode.get(error.code) ?? 0) + 1)
    const fileKey = `${error.owner} ${error.file}`
    byFile.set(fileKey, {
      owner: error.owner,
      file: error.file,
      count: (byFile.get(fileKey)?.count ?? 0) + 1,
    })
  }

  return {
    byOwner: Object.fromEntries([...byOwner.entries()].sort()),
    byCode: Object.fromEntries([...byCode.entries()].sort()),
    topFiles: [...byFile.values()]
      .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file))
      .slice(0, 20),
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const root = path.resolve(args.root)
  let commandExitCode = null
  let command = args.command
  let commandError = null
  let output

  if (args.log) {
    const logPath = path.resolve(root, args.log)
    output = readTextMaybeUtf16(logPath)
  }
  else {
    command = command ?? inferCommand(root, args.app)
    if (!command) {
      throw new Error("No --command provided and no app type-check/tsc script could be inferred")
    }
    const result = runCommand(command, root)
    commandExitCode = result.exitCode
    commandError = result.error
    output = result.output
  }

  const errors = parseErrors(output, root, args.app)
  const summary = summarize(errors)
  const result = {
    app: normalize(args.app),
    source: args.log ? "log" : "command",
    command,
    commandExitCode,
    commandError,
    errorCount: errors.length,
    summary,
    errors,
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log(`Type-check classification for ${result.app}`)
  if (command) console.log(`Command: ${command}`)
  if (commandExitCode !== null) console.log(`Command exit code: ${commandExitCode}`)
  if (commandError) console.log(`Command error: ${commandError}`)
  console.log(`Errors: ${errors.length}`)
  console.log("")
  console.log("By owner:")
  for (const [owner, count] of Object.entries(summary.byOwner)) {
    console.log(`- ${owner}: ${count}`)
  }
  if (Object.keys(summary.byOwner).length === 0) console.log("- none: 0")

  console.log("")
  console.log("Top files:")
  for (const item of summary.topFiles) {
    console.log(`- ${item.owner} ${item.file}: ${item.count}`)
  }
  if (summary.topFiles.length === 0) console.log("- none")

  const outOfScope = errors.filter((error) => error.owner !== "target-app")
  if (outOfScope.length > 0) {
    console.log("")
    console.log("First out-of-scope errors:")
    for (const error of outOfScope.slice(0, 10)) {
      console.log(`- ${error.owner} ${error.file}:${error.line}:${error.column} ${error.code} ${error.message}`)
    }
  }
}

try {
  main()
}
catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
