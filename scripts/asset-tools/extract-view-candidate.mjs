#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'

import {
  analyzeVueSource,
  buildDefaultAssetName,
  inferAdapterRequired,
  inferCompatibilityDependencies,
  inferPortabilityLevel,
  inferSharedPackages,
  toKebabCase,
  toPosix,
} from './source-analysis.mjs'
import { writeWorkbenchRegistry } from './build-workbench-registry.mjs'
import { createRuntimeProfile } from './runtime-profile.mjs'
import { getAssetsRoot, logger, parseArgs, resolvePath, writeJson } from './utils.mjs'

const DEFAULT_SOURCE_ROOT = '../project-mamba/apps'
const VALID_TYPES = ['component', 'page']
const VALID_STATUSES = ['draft', 'raw-candidate', 'candidate', 'cleaned-candidate']

function inferAssetType(sourceType, explicitType) {
  if (explicitType) {
    return explicitType
  }
  if (sourceType === 'page-shell') {
    return 'page'
  }
  if (sourceType === 'shared-view-component' || sourceType === 'page-block-component') {
    return 'component'
  }
  return null
}

async function pathExists(filePath) {
  return Boolean(await fs.stat(filePath).catch(() => null))
}

async function resolveSourceFile(inputPath, sourceRoot) {
  if (path.isAbsolute(inputPath)) {
    return inputPath
  }

  const sourceRootCandidate = path.join(sourceRoot, inputPath)
  if (await pathExists(sourceRootCandidate)) {
    return sourceRootCandidate
  }

  const repoCandidate = resolvePath(inputPath)
  if (await pathExists(repoCandidate)) {
    return repoCandidate
  }

  return sourceRootCandidate
}

function splitSourceLocation(sourceFile, sourceRoot) {
  const relativeToRoot = toPosix(path.relative(sourceRoot, sourceFile))
  const [project, ...rest] = relativeToRoot.split('/')

  if (!project || rest.length === 0) {
    return null
  }

  return {
    project,
    relativePath: rest.join('/'),
    projectRoot: path.join(sourceRoot, project),
  }
}

function buildTargetPaths(type, name) {
  const assetsRoot = getAssetsRoot()

  if (type === 'component') {
    return {
      assetPath: path.join(assetsRoot, 'components', 'candidates', `${name}.vue`),
      manifestPath: path.join(assetsRoot, 'components', 'manifests', `${name}.manifest.json`),
    }
  }

  return {
    assetPath: path.join(assetsRoot, 'pages', 'drafts', `${name}.vue`),
    manifestPath: path.join(assetsRoot, 'pages', 'manifests', `${name}.manifest.json`),
  }
}

function inferTags({ project, type, sourceType, relativePath }) {
  const tags = new Set([project, type, sourceType])
  const segments = toPosix(relativePath)
    .split('/')
    .map((segment) => segment.replace(/\.(vue|jsx|tsx)$/, ''))
    .filter(Boolean)
    .filter((segment) => !['src', 'components', 'views', 'layout'].includes(segment.toLowerCase()))
    .slice(-2)

  for (const segment of segments) {
    tags.add(toKebabCase(segment))
  }

  return Array.from(tags)
}

function buildReview(type, portabilityLevel) {
  if (type === 'component') {
    return {
      reusability: portabilityLevel,
      apiStability: 'low',
      visualQuality: '',
      boundaryCompleteness: 'low',
      notes: '初始抽取产物，尚未完成解耦清洗与独立预览接入',
    }
  }

  return {
    reusability: portabilityLevel,
    structureQuality: 'low',
    completeness: 'low',
    notes: '初始抽取页面草稿，尚未完成上下文裁剪与适配',
  }
}

function buildManifest({
  analysis,
  assetName,
  assetType,
  contextType,
  createdAt,
  createdFrom,
  project,
  relativePath,
  sourceCode,
  sourceFile,
  sourceKind,
  sourcePagePath,
  sourceRoot,
  status,
  task,
}) {
  const adapterRequired = inferAdapterRequired(analysis)
  const portabilityLevel = inferPortabilityLevel(analysis)
  const sourceAppPath = `apps/${project}/${relativePath}`

  const manifest = {
    name: assetName,
    type: assetType,
    status,
    version: '1.0.0',
    source: {
      task,
      createdFrom,
      createdAt,
    },
    runtimeProfile: createRuntimeProfile(project, {
      sharedPackages: inferSharedPackages(sourceCode),
    }),
    sourceAppPath,
    sourceKind,
    compatibility: {
      projects: ['project-mamba', project],
      dependencies: inferCompatibilityDependencies(sourceCode),
      forbidden: [],
    },
    cleaning: {
      adapterRequired,
      mockRequired: analysis.usesRequest,
      removedCouplings: [],
      portabilityLevel,
    },
    sync: {
      allowed: false,
      targetProject: 'project-mamba',
      targetPath: '',
      lastSyncedAt: '',
    },
    review: buildReview(assetType, portabilityLevel),
    tags: inferTags({
      project,
      type: assetType,
      sourceType: sourceKind,
      relativePath,
    }),
    preview: {
      workbenchEntry: true,
      integrationPreview: false,
    },
    analysis: {
      sourceFile: toPosix(path.relative(sourceRoot, sourceFile)),
      importCount: analysis.importCount,
      localDependencyCount: analysis.localDependencyCount,
      candidateScore: analysis.candidateScore,
      usesRouter: analysis.usesRouter,
      usesStore: analysis.usesStore,
      usesRequest: analysis.usesRequest,
      usesI18n: analysis.usesI18n,
      usesPermission: analysis.usesPermission,
    },
    promotionHistory: [],
  }

  if (sourcePagePath || contextType) {
    manifest.extractedFrom = {
      pagePath: sourcePagePath || '',
      contextType: contextType || '',
    }
  }

  return manifest
}

async function refreshWorkbenchRegistry() {
  await writeWorkbenchRegistry()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourceRoot = resolvePath(String(args.sourceRoot ?? DEFAULT_SOURCE_ROOT))
  const source = String(args.source ?? '')
  const explicitType = args.type ? String(args.type) : null
  const refreshRegistry = String(args.refreshRegistry ?? 'true') !== 'false'
  const dryRun = String(args.dryRun ?? 'false') === 'true'
  const force = String(args.force ?? 'false') === 'true'
  const status = String(args.status ?? 'raw-candidate')
  const createdFrom = String(args.createdFrom ?? 'extract-view-candidate')
  const createdAt = new Date().toISOString().slice(0, 10)

  if (!source) {
    logger.error('Usage: node scripts/asset-tools/extract-view-candidate.mjs --source=wanmore/src/components/ListTabBox/src/ListTabBox.vue')
    logger.info('Optional: --name=wanmore-list-tab-box --type=component --task=Phase1 --refreshRegistry=false --dryRun=true')
    process.exit(1)
  }

  if (explicitType && !VALID_TYPES.includes(explicitType)) {
    logger.error(`Invalid type: ${explicitType}. Valid types: ${VALID_TYPES.join(', ')}`)
    process.exit(1)
  }

  if (!VALID_STATUSES.includes(status)) {
    logger.error(`Invalid status: ${status}. Valid statuses: ${VALID_STATUSES.join(', ')}`)
    process.exit(1)
  }

  const sourceFile = await resolveSourceFile(source, sourceRoot)
  const fileStat = await fs.stat(sourceFile).catch(() => null)

  if (!fileStat?.isFile()) {
    logger.error(`Source file not found: ${sourceFile}`)
    process.exit(1)
  }

  if (!sourceFile.endsWith('.vue')) {
    logger.error(`Only .vue source files are supported in Phase 1: ${sourceFile}`)
    process.exit(1)
  }

  const sourceLocation = splitSourceLocation(sourceFile, sourceRoot)
  if (!sourceLocation) {
    logger.error(`Unable to infer source project from: ${sourceFile}`)
    logger.info(`Expected sourceRoot layout: ${sourceRoot}/<project>/...`)
    process.exit(1)
  }

  const { project, projectRoot, relativePath } = sourceLocation
  const sourceCode = await fs.readFile(sourceFile, 'utf-8')
  const analysis = analyzeVueSource({
    project,
    projectRoot,
    filePath: sourceFile,
    content: sourceCode,
  })

  const assetType = inferAssetType(analysis.sourceType, explicitType)
  if (!assetType) {
    logger.error(`Source type "${analysis.sourceType}" is not eligible for automatic extraction. Use --type to override if needed.`)
    process.exit(1)
  }

  const assetName = toKebabCase(String(args.name ?? buildDefaultAssetName(project, relativePath)))
  const task = String(args.task ?? `Phase 1 extract ${project}:${relativePath}`)
  const sourcePagePath = args.pagePath ? String(args.pagePath) : ''
  const contextType = args.contextType ? String(args.contextType) : ''
  const { assetPath, manifestPath } = buildTargetPaths(assetType, assetName)

  if (!force) {
    if (await pathExists(assetPath)) {
      logger.error(`Asset already exists: ${assetPath}`)
      logger.info('Use --force=true to overwrite.')
      process.exit(1)
    }
    if (await pathExists(manifestPath)) {
      logger.error(`Manifest already exists: ${manifestPath}`)
      logger.info('Use --force=true to overwrite.')
      process.exit(1)
    }
  }

  const manifest = buildManifest({
    analysis,
    assetName,
    assetType,
    contextType,
    createdAt,
    createdFrom,
    project,
    relativePath,
    sourceCode,
    sourceFile,
    sourceKind: analysis.sourceType,
    sourcePagePath,
    sourceRoot,
    status,
    task,
  })

  logger.info(`Extract source: ${toPosix(sourceFile)}`)
  logger.info(`Asset type: ${assetType}`)
  logger.info(`Asset name: ${assetName}`)
  logger.info(`Target asset: ${toPosix(assetPath)}`)
  logger.info(`Target manifest: ${toPosix(manifestPath)}`)

  if (dryRun) {
    logger.warn('Dry run enabled. No files were written.')
    return
  }

  await fs.mkdir(path.dirname(assetPath), { recursive: true })
  await fs.writeFile(assetPath, sourceCode, 'utf-8')
  await writeJson(manifestPath, manifest)

  logger.success(`Candidate asset written: ${toPosix(assetPath)}`)
  logger.success(`Candidate manifest written: ${toPosix(manifestPath)}`)

  if (refreshRegistry) {
    await refreshWorkbenchRegistry()
    logger.success('Workbench registry refreshed')
  }
}

main().catch((error) => {
  logger.error(error.message)
  process.exit(1)
})
