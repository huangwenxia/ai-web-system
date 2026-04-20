#!/usr/bin/env node
/**
 * build-workbench-registry.mjs
 *
 * Reads manifest entries from assets, normalizes runtime metadata, and writes:
 * - the workbench registry consumed by the app
 * - generated Tailwind @source directives
 * - generated runtime side-effect imports for base scss/iconfont assets
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getManifestRuntimeProfile } from './runtime-profile.mjs'
import { analyzeAssetSource, toPosix } from './source-analysis.mjs'
import { getAssetsRoot, logger, resolvePath, writeJson } from './utils.mjs'

const DEFAULT_OUTPUT_TS = 'apps/ai-front-workbench/src/registry/generated/asset-registry.generated.ts'
const DEFAULT_OUTPUT_RUNTIME_IMPORTS_TS = 'apps/ai-front-workbench/src/runtime-imports.generated.ts'
const DEFAULT_OUTPUT_TAILWIND_SOURCES_CSS = 'apps/ai-front-workbench/src/tailwind-sources.generated.css'
const PROJECT_MAMBA_ROOT = resolvePath('../project-mamba')
const WORKBENCH_SRC_ROOT = resolvePath('apps/ai-front-workbench/src')
const LOCAL_TAILWIND_SOURCES = [
 './pages',
 './components',
 './previews',
 '../../../../assets/components',
 '../../../../assets/pages',
]

const KNOWN_PREVIEW_ROUTES = {
 'component:example-card': {
  demoRoute: '/components/example-card',
  integrationHost: 'hashrate',
  integrationRoute: '/__preview__/components/example-card',
 },
 'component:wanmore-list-tab-box': {
  demoRoute: '/components/wanmore-list-tab-box',
  integrationHost: null,
  integrationRoute: null,
 },
 'page:example-overview-page': {
  demoRoute: '/pages/example-overview',
  integrationHost: 'hashrate',
  integrationRoute: '/__preview__/pages/overview-draft',
 },
}
const VALID_IMPLEMENTATION_STRATEGIES = new Set([
 'project-component',
 'asset-composed',
 'mixed',
 'native-fallback',
 'pattern-primitive',
])

function uniqueStrings(values) {
 return [...new Set(values.filter(Boolean))]
}

async function collectManifests(dir) {
 const entries = await fs.readdir(dir, { withFileTypes: true })
 const manifests = []

 for (const entry of entries) {
  if (!entry.isFile()) {
   continue
  }
  if (!entry.name.endsWith('.manifest.json') || entry.name.includes('.template.')) {
   continue
  }

  const fullPath = path.join(dir, entry.name)
  const manifest = JSON.parse(await fs.readFile(fullPath, 'utf-8'))
  manifests.push(manifest)
 }

 return manifests
}

async function findSourcePath(type, name) {
 const assetsRoot = getAssetsRoot()

 if (type === 'component') {
  const candidate = path.join(assetsRoot, 'components', 'candidates', `${name}.vue`)
  const official = path.join(assetsRoot, 'components', 'official', `${name}.vue`)
  if (await fs.stat(candidate).catch(() => null)) {
   return toPosix(path.relative(resolvePath('.'), candidate))
  }
  if (await fs.stat(official).catch(() => null)) {
   return toPosix(path.relative(resolvePath('.'), official))
  }
 }

 if (type === 'page') {
  const draft = path.join(assetsRoot, 'pages', 'drafts', `${name}.vue`)
  const reusable = path.join(assetsRoot, 'pages', 'reusable', `${name}.vue`)
  if (await fs.stat(draft).catch(() => null)) {
   return toPosix(path.relative(resolvePath('.'), draft))
  }
  if (await fs.stat(reusable).catch(() => null)) {
   return toPosix(path.relative(resolvePath('.'), reusable))
  }
 }

 return null
}

function normalizeSourceTrace(manifest, type, runtimeProfile) {
 return {
  sourceProject: runtimeProfile.sourceProject ?? null,
  sourcePath: manifest.sourceAppPath ?? null,
  sourceKind: manifest.sourceKind ?? (type === 'component' ? 'shared-view-component' : 'page-shell'),
  extractedFromPage: manifest.extractedFrom?.pagePath ?? null,
  contextType: manifest.extractedFrom?.contextType ?? null,
  portabilityLevel: manifest.cleaning?.portabilityLevel ?? null,
  adapterRequired: manifest.cleaning?.adapterRequired ?? [],
  removedCouplings: manifest.cleaning?.removedCouplings ?? [],
  mockRequired: manifest.cleaning?.mockRequired ?? false,
 }
}

function normalizeStringArray(value) {
 if (!Array.isArray(value)) {
  return []
 }

 return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
}

function normalizeCompositionLink(entry) {
 if (typeof entry === 'string' && entry.trim()) {
  return {
   assetId: entry.trim(),
   role: 'composed-asset',
   required: true,
  }
 }

 if (!entry || typeof entry !== 'object') {
  return null
 }

 const assetId = typeof entry.assetId === 'string' && entry.assetId.trim() ? entry.assetId.trim() : null
 if (!assetId) {
  return null
 }

 return {
  assetId,
  role: typeof entry.role === 'string' && entry.role.trim() ? entry.role.trim() : 'composed-asset',
  required: entry.required !== false,
 }
}

function normalizeComposition(manifest) {
 return {
  composedOf: Array.isArray(manifest.composition?.composedOf)
   ? manifest.composition.composedOf.map(normalizeCompositionLink).filter(Boolean)
   : [],
  missingCapabilities: normalizeStringArray(manifest.composition?.missingCapabilities),
  notes: typeof manifest.composition?.notes === 'string' ? manifest.composition.notes : '',
 }
}

function mergeCompositionLinks(manualLinks, autoLinks) {
 const merged = new Map()

 for (const item of [...autoLinks, ...manualLinks]) {
  if (!item?.assetId) {
   continue
  }

  const existing = merged.get(item.assetId)
  if (!existing) {
   merged.set(item.assetId, item)
   continue
  }

  merged.set(item.assetId, {
   assetId: item.assetId,
   role: existing.role !== 'composed-asset' ? existing.role : item.role,
   required: existing.required && item.required,
  })
 }

 return Array.from(merged.values())
}

function mergeComposition(manifestComposition, autoAnalysis) {
 return {
  composedOf: mergeCompositionLinks(manifestComposition.composedOf, autoAnalysis.composedOf),
  missingCapabilities: manifestComposition.missingCapabilities,
  notes: manifestComposition.notes,
 }
}

function deriveImplementationStrategy(type, realComponentRefs, composition, fallbackHtmlBlocks, manifest) {
 const strategy = manifest.implementation?.strategy
 if (typeof strategy === 'string' && VALID_IMPLEMENTATION_STRATEGIES.has(strategy)) {
  return strategy
 }

 if (type === 'pattern') {
  return 'pattern-primitive'
 }

 if (composition.composedOf.length && fallbackHtmlBlocks.length) {
  return 'mixed'
 }

 if (composition.composedOf.length) {
  return 'asset-composed'
 }

 if (realComponentRefs) {
  return 'project-component'
 }

 return 'native-fallback'
}

function normalizeImplementation(manifest, type, composition, autoAnalysis) {
 const manualFallbackHtmlBlocks = normalizeStringArray(manifest.implementation?.fallbackHtmlBlocks)
 const fallbackHtmlBlocks = uniqueStrings([...autoAnalysis.fallbackHtmlBlocks, ...manualFallbackHtmlBlocks])
 const realComponentRefs =
  typeof manifest.implementation?.realComponentRefs === 'boolean'
   ? manifest.implementation.realComponentRefs
   : autoAnalysis.realComponentRefs

 return {
  strategy: deriveImplementationStrategy(type, realComponentRefs, composition, fallbackHtmlBlocks, manifest),
  realComponentRefs,
  fallbackHtmlBlocks,
  notes: typeof manifest.implementation?.notes === 'string' ? manifest.implementation.notes : '',
 }
}

function toWorkbenchSrcImportPath(projectMambaRelativePath) {
 const absolutePath = path.join(PROJECT_MAMBA_ROOT, projectMambaRelativePath)
 return toPosix(path.relative(WORKBENCH_SRC_ROOT, absolutePath))
}

function buildTailwindSourcesFile(entries) {
 const manifestTailwindSources = entries.flatMap((entry) =>
  entry.runtimeProfile.tailwindSources.map((source) => toWorkbenchSrcImportPath(source))
 )
 const sources = uniqueStrings([...LOCAL_TAILWIND_SOURCES, ...manifestTailwindSources])

 return `${sources.map((source) => `@source "${source}";`).join('\n')}\n`
}

function buildRuntimeImportsModule(entries) {
 const runtimeImports = uniqueStrings(
  entries.flatMap((entry) => [entry.runtimeProfile.baseScss, entry.runtimeProfile.iconfont].filter(Boolean))
 )
 const importLines = runtimeImports.map((runtimeImport) => `import '${toWorkbenchSrcImportPath(runtimeImport)}'`)

 return `${importLines.join('\n')}${importLines.length ? '\n\n' : ''}export const generatedRuntimeImports = ${JSON.stringify(runtimeImports, null, 2)}\n`
}

function toTsModule(entries) {
 return `import type { WorkbenchAssetEntry } from '../types'\n\nexport const generatedAssetRegistry: WorkbenchAssetEntry[] = ${JSON.stringify(entries, null, 2)}\n`
}

async function writeWorkbenchRuntimeArtifacts(entries) {
 const runtimeImportsPath = resolvePath(DEFAULT_OUTPUT_RUNTIME_IMPORTS_TS)
 const tailwindSourcesPath = resolvePath(DEFAULT_OUTPUT_TAILWIND_SOURCES_CSS)

 await fs.mkdir(path.dirname(runtimeImportsPath), { recursive: true })
 await fs.mkdir(path.dirname(tailwindSourcesPath), { recursive: true })
 await fs.writeFile(runtimeImportsPath, buildRuntimeImportsModule(entries), 'utf-8')
 await fs.writeFile(tailwindSourcesPath, buildTailwindSourcesFile(entries), 'utf-8')

 logger.success(`Runtime imports written: ${runtimeImportsPath}`)
 logger.success(`Tailwind sources written: ${tailwindSourcesPath}`)
}

async function collectManifestRecords() {
 const assetsRoot = getAssetsRoot()
 const manifestDirs = [
  path.join(assetsRoot, 'components', 'manifests'),
  path.join(assetsRoot, 'pages', 'manifests'),
  path.join(assetsRoot, 'patterns', 'manifests'),
 ]

 const manifests = (await Promise.all(manifestDirs.map((dir) => collectManifests(dir)))).flat()

 return Promise.all(
  manifests.map(async (manifest) => {
   const sourcePath = await findSourcePath(manifest.type, manifest.name)
   const sourceAbsolutePath = sourcePath ? resolvePath(sourcePath) : null

   return {
    manifest,
    type: manifest.type,
    id: `${manifest.type}:${manifest.name}`,
    sourcePath,
    sourceAbsolutePath,
   }
  })
 )
}

export async function buildRegistryEntries() {
 const manifestRecords = await collectManifestRecords()
 const sourcePathByAbsolutePath = new Map()
 const assetIdBySourcePath = new Map()
 const assetNameById = new Map()

 for (const record of manifestRecords) {
  assetNameById.set(record.id, record.manifest.name)

  if (record.sourcePath) {
   assetIdBySourcePath.set(record.sourcePath, record.id)
  }

  if (record.sourceAbsolutePath) {
   sourcePathByAbsolutePath.set(toPosix(record.sourceAbsolutePath), record.sourcePath)
  }
 }

 const entries = []

 for (const record of manifestRecords) {
  const { manifest, type, id } = record
  const previewConfig = KNOWN_PREVIEW_ROUTES[id] ?? {
   demoRoute: null,
   integrationHost: null,
   integrationRoute: null,
  }
  const runtimeProfile = getManifestRuntimeProfile(manifest)
  const sourceTrace = normalizeSourceTrace(manifest, type, runtimeProfile)
  const manualComposition = normalizeComposition(manifest)
  const autoAnalysis = record.sourceAbsolutePath
   ? await analyzeAssetSource({
      type,
      filePath: record.sourceAbsolutePath,
      sourcePathByAbsolutePath,
      assetIdBySourcePath,
      assetNameById,
     }).read(fs.readFile.bind(fs))
   : {
      realComponentRefs: false,
      fallbackHtmlBlocks: [],
      composedOf: [],
      implementationStrategy: type === 'pattern' ? 'pattern-primitive' : 'native-fallback',
     }
  const composition = mergeComposition(manualComposition, autoAnalysis)
  const implementation = normalizeImplementation(manifest, type, composition, autoAnalysis)

  entries.push({
   id,
   name: manifest.name,
   type,
   status: manifest.status,
   version: manifest.version,
   sourceCreatedAt: manifest.source?.createdAt ?? null,
   sourceCreatedFrom: manifest.source?.createdFrom ?? null,
   sourceTask: manifest.source?.task ?? null,
   tags: manifest.tags ?? [],
   compatibility: {
    projects: manifest.compatibility?.projects ?? [],
    dependencies: manifest.compatibility?.dependencies ?? [],
    forbidden: manifest.compatibility?.forbidden ?? [],
   },
   runtimeProfile,
   sync: {
    allowed: Boolean(manifest.sync?.allowed),
    targetProject: manifest.sync?.targetProject || null,
    targetPath: manifest.sync?.targetPath || null,
    lastSyncedAt: manifest.sync?.lastSyncedAt || null,
   },
   review: {
    ...manifest.review,
    notes: manifest.review?.notes ?? '',
   },
   implementation,
   composition,
   preview: {
    catalogRoute: `/assets/${type}/${manifest.name}`,
    demoRoute: previewConfig.demoRoute,
    integrationHost: previewConfig.integrationHost,
    integrationRoute: previewConfig.integrationRoute,
   },
   sourceTrace: {
    ...sourceTrace,
    sourcePath: record.sourcePath ?? sourceTrace.sourcePath,
   },
  })
 }

 return entries.sort((left, right) => left.type.localeCompare(right.type) || left.name.localeCompare(right.name))
}

export async function writeWorkbenchRegistry() {
 const entries = await buildRegistryEntries()
 const outputTsPath = resolvePath(DEFAULT_OUTPUT_TS)

 await fs.mkdir(path.dirname(outputTsPath), { recursive: true })
 await fs.writeFile(outputTsPath, toTsModule(entries), 'utf-8')
 await writeJson('apps/ai-front-workbench/src/registry/generated/asset-registry.generated.json', entries)
 await writeWorkbenchRuntimeArtifacts(entries)

 logger.success(`Registry written: ${outputTsPath}`)
 return entries
}

async function main() {
 const entries = await writeWorkbenchRegistry()
 logger.success(`Workbench registry entries: ${entries.length}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 main().catch((error) => {
  logger.error(error.message)
  process.exit(1)
 })
}
