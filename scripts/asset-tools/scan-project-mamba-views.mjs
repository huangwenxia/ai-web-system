#!/usr/bin/env node
/**
 * scan-project-mamba-views.mjs
 *
 * Purpose:
 * - scan Vue sources across project-mamba apps
 * - emit a compact source inventory for ai-front-workbench
 * - turn raw candidates into an extraction backlog for reusable component families
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

import { analyzeVueSource, inferAdapterRequired, toPosix } from './source-analysis.mjs'
import { logger, parseArgs, resolvePath, writeJson } from './utils.mjs'

const DEFAULT_SOURCE_ROOT = 'E:/work/project-mamba/apps'
const DEFAULT_OUTPUT = 'apps/ai-front-workbench/src/registry/generated/source-inventory.generated.json'
const DEFAULT_SAMPLE_LIMIT = 40
const DEFAULT_FAMILY_LIMIT = 24
const DEFAULT_BACKLOG_LIMIT = 12

const ELIGIBLE_SOURCE_TYPES = new Set(['shared-view-component', 'page-block-component'])
const GENERIC_FAMILY_NAMES = new Set(['index', 'indexview', 'index-view'])

async function discoverProjects(sourceRoot) {
 const entries = await fs.readdir(sourceRoot, { withFileTypes: true }).catch(() => [])

 return entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right))
}

async function walkVueFiles(dir) {
 const entries = await fs.readdir(dir, { withFileTypes: true })
 const files = []

 for (const entry of entries) {
  const fullPath = path.join(dir, entry.name)
  if (entry.isDirectory()) {
   files.push(...(await walkVueFiles(fullPath)))
   continue
  }
  if (entry.isFile() && entry.name.endsWith('.vue')) {
   files.push(fullPath)
  }
 }

 return files
}

function stripViewExtension(value) {
 return value.replace(/\.(vue|jsx|tsx)$/i, '')
}

function normalizeFamilyName(value) {
 return stripViewExtension(value).replace(/[^a-zA-Z0-9]+/g, '').toLowerCase()
}

function isGenericFamilyName(value) {
 const normalized = normalizeFamilyName(value)
 return !normalized || GENERIC_FAMILY_NAMES.has(normalized)
}

function deriveFamilyName(relativePath) {
 const segments = toPosix(relativePath)
  .split('/')
  .filter(Boolean)
  .map(stripViewExtension)
 const componentIndex = segments.lastIndexOf('components')

 if (componentIndex === -1) {
  return ''
 }

 const relevantSegments = segments.slice(componentIndex + 1).filter(Boolean).filter((segment) => segment.toLowerCase() !== 'src')
 if (relevantSegments.length === 0) {
  return ''
 }

 const fileStem = relevantSegments[relevantSegments.length - 1] ?? ''
 if (!isGenericFamilyName(fileStem)) {
  return fileStem
 }

 const fallbackSegment = [...relevantSegments.slice(0, -1)].reverse().find((segment) => !isGenericFamilyName(segment))
 return fallbackSegment ?? fileStem
}

function toDetailedEntry(entry) {
 return {
  ...entry,
  adapters: inferAdapterRequired(entry),
 }
}

function getAverage(entries, field) {
 if (entries.length === 0) {
  return 0
 }

 const total = entries.reduce((sum, entry) => sum + Number(entry[field] ?? 0), 0)
 return Math.round((total / entries.length) * 10) / 10
}

function pickRepresentativeEntry(entries) {
 return [...entries].sort((left, right) => {
  if (left.project !== right.project) {
   if (left.project === 'common') {
    return -1
   }
   if (right.project === 'common') {
    return 1
   }
  }

  if (left.sourceType !== right.sourceType) {
   if (left.sourceType === 'shared-view-component') {
    return -1
   }
   if (right.sourceType === 'shared-view-component') {
    return 1
   }
  }

  return (
   right.candidateScore - left.candidateScore ||
   left.localDependencyCount - right.localDependencyCount ||
   left.importCount - right.importCount ||
   left.relativePath.localeCompare(right.relativePath)
  )
 })[0]
}

function summarizeAdapterCounts(entries) {
 const counts = {
  router: 0,
  store: 0,
  request: 0,
  i18n: 0,
  permission: 0,
 }

 for (const entry of entries) {
  for (const adapter of entry.adapters) {
   counts[adapter] = (counts[adapter] ?? 0) + 1
  }
 }

 return counts
}

function summarizeSourceTypes(entries) {
 return {
  'shared-view-component': entries.filter((entry) => entry.sourceType === 'shared-view-component').length,
  'page-block-component': entries.filter((entry) => entry.sourceType === 'page-block-component').length,
 }
}

function buildRecommendation(family) {
 if (family.inCommon && family.projectCount >= 3) {
  return 'Use the common version as the baseline and merge cross-project variants.'
 }

 if (family.inCommon) {
  return 'Start from the common implementation and align other project variants against it.'
 }

 if (family.sharedViewCount >= family.pageBlockCount) {
  return 'Extract this as a reusable visual component before assembling more pages around it.'
 }

 return 'Split the reusable visual unit out of page-level blocks, then wrap it as a shared component.'
}

function buildReasons(family) {
 const reasons = []

 reasons.push(`Repeated in ${family.projectCount} projects: ${family.projects.join(', ')}`)

 if (family.inCommon) {
  reasons.push('Already exists in common, which gives a better baseline for convergence.')
 }

 if (family.sharedViewCount > 0) {
  reasons.push(`${family.sharedViewCount} shared-view implementations reduce extraction risk.`)
 } else {
  reasons.push('Only page-block implementations were found, so this should follow after first-tier shared components.')
 }

 if (family.cleanEntryCount === family.entryCount) {
  reasons.push('No router/store/request/permission coupling detected in the repeated implementations.')
 } else {
  const coupledAdapters = Object.entries(family.adapterCounts)
   .filter(([, count]) => count > 0)
   .map(([name, count]) => `${name} x${count}`)

  if (coupledAdapters.length > 0) {
   reasons.push(`Coupling to clean during extraction: ${coupledAdapters.join(', ')}`)
  }
 }

 if (family.averageLocalDependencyCount <= 1.5) {
  reasons.push('Local dependency count is low enough for a relatively cheap first extraction.')
 } else {
  reasons.push(`Local dependencies average ${family.averageLocalDependencyCount}, so split carefully.`)
 }

 return reasons
}

function computeFamilyScore(family) {
 let score = 0

 score += family.projectCount * 24
 score += family.sharedViewCount * 10
 score += family.pageBlockCount * 4
 score += Math.round(family.averageCandidateScore * 8)
 score += family.cleanEntryCount * 6

 if (family.inCommon) {
  score += 14
 }

 if (family.sharedViewCount === 0) {
  score -= 24
 }

 if (family.sharedViewCount === 0 && /(page|view)$/i.test(family.familyName)) {
  score -= 12
 }

 if (family.adapterCounts.router === 0) {
  score += 4
 } else {
  score -= family.adapterCounts.router * 2
 }

 if (family.adapterCounts.store === 0) {
  score += 4
 } else {
  score -= family.adapterCounts.store * 5
 }

 if (family.adapterCounts.request === 0) {
  score += 6
 } else {
  score -= family.adapterCounts.request * 7
 }

 if (family.adapterCounts.permission === 0) {
  score += 3
 } else {
  score -= family.adapterCounts.permission * 4
 }

 score -= Math.max(0, Math.round((family.averageLocalDependencyCount - 2) * 4))
 score -= Math.max(0, Math.round((family.averageImportCount - 6) * 2))

 return Math.max(score, 0)
}

function buildExtractionBacklog(entries, familyLimit, backlogLimit) {
 const groupedFamilies = new Map()
 const ignoredFamilies = new Map()

 for (const rawEntry of entries) {
  if (!ELIGIBLE_SOURCE_TYPES.has(rawEntry.sourceType) || rawEntry.candidateScore < 2) {
   continue
  }

  const familyName = deriveFamilyName(rawEntry.relativePath)
  if (!familyName) {
   continue
  }

  if (isGenericFamilyName(familyName)) {
   const normalizedName = normalizeFamilyName(familyName)
   const ignored = ignoredFamilies.get(normalizedName) ?? {
    familyName,
    occurrenceCount: 0,
    samplePaths: [],
   }
   ignored.occurrenceCount += 1
   if (ignored.samplePaths.length < 3) {
    ignored.samplePaths.push(`${rawEntry.project}: ${rawEntry.relativePath}`)
   }
   ignoredFamilies.set(normalizedName, ignored)
   continue
  }

  const normalizedName = normalizeFamilyName(familyName)
  const familyEntries = groupedFamilies.get(normalizedName) ?? []
  familyEntries.push({
   ...toDetailedEntry(rawEntry),
   familyName,
  })
  groupedFamilies.set(normalizedName, familyEntries)
 }

 const duplicateFamilies = []

 for (const [normalizedName, familyEntries] of groupedFamilies.entries()) {
  const projectSet = new Set(familyEntries.map((entry) => entry.project))
  if (projectSet.size < 2) {
   continue
  }

  const representativeEntry = pickRepresentativeEntry(familyEntries)
  const projects = Array.from(projectSet).sort((left, right) => left.localeCompare(right))
  const sourceTypes = summarizeSourceTypes(familyEntries)
  const adapterCounts = summarizeAdapterCounts(familyEntries)
  const sampleEntries = [...familyEntries]
   .sort(
    (left, right) =>
     right.candidateScore - left.candidateScore ||
     left.localDependencyCount - right.localDependencyCount ||
     left.relativePath.localeCompare(right.relativePath)
   )
   .slice(0, 4)
   .map((entry) => ({
    id: entry.id,
    project: entry.project,
    relativePath: entry.relativePath,
    sourceType: entry.sourceType,
    candidateScore: entry.candidateScore,
    importCount: entry.importCount,
    localDependencyCount: entry.localDependencyCount,
    adapters: entry.adapters,
   }))

  const family = {
   familyName: representativeEntry.familyName,
   normalizedName,
   score: 0,
   projectCount: projects.length,
   projects,
   entryCount: familyEntries.length,
   sharedViewCount: sourceTypes['shared-view-component'],
   pageBlockCount: sourceTypes['page-block-component'],
   averageCandidateScore: getAverage(familyEntries, 'candidateScore'),
   averageImportCount: getAverage(familyEntries, 'importCount'),
   averageLocalDependencyCount: getAverage(familyEntries, 'localDependencyCount'),
   cleanEntryCount: familyEntries.filter((entry) => entry.adapters.length === 0).length,
   inCommon: projects.includes('common'),
   adapterCounts,
   sourceTypes,
   representativeEntryId: representativeEntry.id,
   representativePath: `${representativeEntry.project}: ${representativeEntry.relativePath}`,
   sampleEntries,
   recommendation: '',
   reasons: [],
  }

  family.recommendation = buildRecommendation(family)
  family.reasons = buildReasons(family)
  family.score = computeFamilyScore(family)
  duplicateFamilies.push(family)
 }

 duplicateFamilies.sort(
  (left, right) =>
   right.score - left.score ||
   right.projectCount - left.projectCount ||
   right.sharedViewCount - left.sharedViewCount ||
   left.familyName.localeCompare(right.familyName)
 )

 const priorityBacklog = duplicateFamilies.slice(0, backlogLimit).map((family, index) => ({
  rank: index + 1,
  ...family,
 }))

 return {
  duplicateComponentFamilyCount: duplicateFamilies.length,
  duplicateComponentFamilies: duplicateFamilies.slice(0, familyLimit),
  priorityBacklog,
  ignoredFamilies: Array.from(ignoredFamilies.values()).sort(
   (left, right) => right.occurrenceCount - left.occurrenceCount || left.familyName.localeCompare(right.familyName)
  ),
 }
}

async function scanProject(sourceRoot, project) {
 const projectRoot = path.join(sourceRoot, project)
 const stat = await fs.stat(projectRoot).catch(() => null)

 if (!stat?.isDirectory()) {
  logger.warn(`Skip missing project: ${projectRoot}`)
  return null
 }

 const files = await walkVueFiles(projectRoot)
 const entries = []
 const sourceTypes = {
  'page-shell': 0,
  'page-block-component': 0,
  'shared-view-component': 0,
  'not-eligible': 0,
 }

 for (const filePath of files) {
  const content = await fs.readFile(filePath, 'utf-8')
  const entry = analyzeVueSource({ project, projectRoot, filePath, content })
  entries.push(entry)
  sourceTypes[entry.sourceType] += 1
 }

 const likelyCandidates = entries.filter(
  (entry) => ELIGIBLE_SOURCE_TYPES.has(entry.sourceType) && entry.candidateScore >= 2
 ).length

 return {
  summary: {
   name: project,
   totalVueFiles: files.length,
   likelyCandidates,
   sourceTypes,
  },
  entries,
 }
}

async function main() {
 const args = parseArgs(process.argv.slice(2))
 const sourceRoot = resolvePath(String(args.sourceRoot ?? DEFAULT_SOURCE_ROOT))
 const outputPath = String(args.output ?? DEFAULT_OUTPUT)
 const sampleLimit = Number(args.sampleLimit ?? DEFAULT_SAMPLE_LIMIT)
 const familyLimit = Number(args.familyLimit ?? DEFAULT_FAMILY_LIMIT)
 const backlogLimit = Number(args.backlogLimit ?? DEFAULT_BACKLOG_LIMIT)
 const projects = args.projects
  ? String(args.projects)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  : await discoverProjects(sourceRoot)

 logger.info(`Scanning source root: ${sourceRoot}`)
 logger.info(`Projects: ${projects.join(', ')}`)

 const projectResults = []

 for (const project of projects) {
  const result = await scanProject(sourceRoot, project)
  if (result) {
   projectResults.push(result)
   logger.success(`Scanned ${project}: ${result.summary.totalVueFiles} vue files`)
  }
 }

 const allEntries = projectResults.flatMap((item) => item.entries)
 const sampleCandidates = allEntries
  .filter((entry) => ELIGIBLE_SOURCE_TYPES.has(entry.sourceType) && entry.candidateScore >= 2)
  .sort((left, right) => right.candidateScore - left.candidateScore || left.relativePath.localeCompare(right.relativePath))
  .slice(0, sampleLimit)
 const extractionBacklog = buildExtractionBacklog(allEntries, familyLimit, backlogLimit)

 const summary = {
  generatedAt: new Date().toISOString(),
  sourceRoot: toPosix(sourceRoot),
  totalProjects: projectResults.length,
  totalVueFiles: projectResults.reduce((sum, item) => sum + item.summary.totalVueFiles, 0),
  likelyCandidates: projectResults.reduce((sum, item) => sum + item.summary.likelyCandidates, 0),
  projects: projectResults.map((item) => item.summary),
  sampleCandidates,
  duplicateComponentFamilyCount: extractionBacklog.duplicateComponentFamilyCount,
  duplicateComponentFamilies: extractionBacklog.duplicateComponentFamilies,
  priorityBacklog: extractionBacklog.priorityBacklog,
  ignoredFamilies: extractionBacklog.ignoredFamilies,
 }

 await writeJson(outputPath, summary)
 logger.success(`Source inventory written: ${resolvePath(outputPath)}`)
}

main().catch((error) => {
 logger.error(error.message)
 process.exit(1)
})
