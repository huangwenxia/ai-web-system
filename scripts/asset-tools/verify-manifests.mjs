#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'

import { getAssetsRoot, logger, parseArgs, resolvePath } from './utils.mjs'

const REQUIRED_FIELDS = {
  component: ['name', 'type', 'status', 'source', 'runtimeProfile'],
  page: ['name', 'type', 'status', 'source', 'runtimeProfile'],
  pattern: ['name', 'type', 'status', 'source', 'runtimeProfile', 'category'],
}

const VALID_TYPES = ['component', 'page', 'pattern']
const VALID_STATUSES = ['draft', 'raw-candidate', 'candidate', 'cleaned-candidate', 'official', 'integration-approved', 'synced']
const VALID_CATEGORIES = ['visual', 'layout', 'interaction']
const VALID_IMPLEMENTATION_STRATEGIES = ['project-component', 'asset-composed', 'mixed', 'native-fallback', 'pattern-primitive']
const RUNTIME_PROFILE_ARRAY_FIELDS = ['tailwindSources', 'publicRoots', 'sharedPackages']
const RUNTIME_PROFILE_SCALAR_FIELDS = ['baseScss', 'iconfont']

async function collectManifestFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectManifestFiles(fullPath)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.manifest.json') && !entry.name.includes('.template.')) {
      files.push(fullPath)
    }
  }

  return files
}

function getAssetCandidates(manifest) {
  const assetsRoot = getAssetsRoot()

  if (manifest.type === 'component') {
    return [
      path.join(assetsRoot, 'components', 'candidates', `${manifest.name}.vue`),
      path.join(assetsRoot, 'components', 'official', `${manifest.name}.vue`),
    ]
  }

  if (manifest.type === 'page') {
    return [
      path.join(assetsRoot, 'pages', 'drafts', `${manifest.name}.vue`),
      path.join(assetsRoot, 'pages', 'reusable', `${manifest.name}.vue`),
    ]
  }

  if (manifest.type === 'pattern') {
    const category = manifest.category || 'visual'
    return [
      path.join(assetsRoot, 'patterns', category, `${manifest.name}.vue`),
      path.join(assetsRoot, 'patterns', category, `${manifest.name}.css`),
      path.join(assetsRoot, 'patterns', category, `${manifest.name}.scss`),
      path.join(assetsRoot, 'patterns', category, `${manifest.name}.md`),
    ]
  }

  return []
}

async function validateManifest(manifestPath, options = {}) {
  const issues = []
  const warnings = []

  let manifest
  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    manifest = JSON.parse(content)
  } catch (error) {
    issues.push(`Invalid JSON: ${error.message}`)
    return { valid: false, issues, warnings }
  }

  const type = manifest.type
  const requiredFields = REQUIRED_FIELDS[type] || REQUIRED_FIELDS.component

  for (const field of requiredFields) {
    if (!manifest[field]) {
      issues.push(`Missing required field: ${field}`)
    }
  }

  if (!VALID_TYPES.includes(type)) {
    issues.push(`Invalid type: ${type}. Valid: ${VALID_TYPES.join(', ')}`)
  }

  if (!VALID_STATUSES.includes(manifest.status)) {
    issues.push(`Invalid status: ${manifest.status}. Valid: ${VALID_STATUSES.join(', ')}`)
  }

  if (type === 'pattern' && !VALID_CATEGORIES.includes(manifest.category)) {
    issues.push(`Invalid category: ${manifest.category}. Valid: ${VALID_CATEGORIES.join(', ')}`)
  }

  if (manifest.source?.createdAt && !/^\d{4}-\d{2}-\d{2}/.test(manifest.source.createdAt)) {
    warnings.push(`Invalid source.createdAt format: ${manifest.source.createdAt}. Expected YYYY-MM-DD`)
  }

  if (manifest.sync?.allowed && !['official', 'integration-approved', 'synced'].includes(manifest.status)) {
    warnings.push(`sync.allowed is true but status is "${manifest.status}". Expected official, integration-approved, or synced.`)
  }

  if (manifest.runtimeProfile) {
    const { runtimeProfile } = manifest

    if (runtimeProfile.sourceProject !== undefined && runtimeProfile.sourceProject !== null && typeof runtimeProfile.sourceProject !== 'string') {
      issues.push('runtimeProfile.sourceProject must be a string or null')
    }

    for (const field of RUNTIME_PROFILE_ARRAY_FIELDS) {
      if (!Array.isArray(runtimeProfile[field])) {
        issues.push(`runtimeProfile.${field} must be an array`)
        continue
      }

      const invalidItem = runtimeProfile[field].find((item) => typeof item !== 'string' || item.trim() === '')
      if (invalidItem !== undefined) {
        issues.push(`runtimeProfile.${field} must only contain non-empty strings`)
      }
    }

    for (const field of RUNTIME_PROFILE_SCALAR_FIELDS) {
      const value = runtimeProfile[field]
      if (value !== undefined && value !== null && typeof value !== 'string') {
        issues.push(`runtimeProfile.${field} must be a string or null`)
      }
    }
  }

  if (manifest.implementation) {
    const { implementation } = manifest

    if (implementation.strategy !== undefined && !VALID_IMPLEMENTATION_STRATEGIES.includes(implementation.strategy)) {
      issues.push(`implementation.strategy is invalid. Valid: ${VALID_IMPLEMENTATION_STRATEGIES.join(', ')}`)
    }

    if (implementation.realComponentRefs !== undefined && typeof implementation.realComponentRefs !== 'boolean') {
      issues.push('implementation.realComponentRefs must be a boolean')
    }

    if (implementation.fallbackHtmlBlocks !== undefined) {
      if (!Array.isArray(implementation.fallbackHtmlBlocks)) {
        issues.push('implementation.fallbackHtmlBlocks must be an array')
      } else if (implementation.fallbackHtmlBlocks.some((item) => typeof item !== 'string' || item.trim() === '')) {
        issues.push('implementation.fallbackHtmlBlocks must only contain non-empty strings')
      }
    }

    if (implementation.notes !== undefined && typeof implementation.notes !== 'string') {
      issues.push('implementation.notes must be a string')
    }
  }

  if (manifest.composition) {
    const { composition } = manifest

    if (composition.composedOf !== undefined) {
      if (!Array.isArray(composition.composedOf)) {
        issues.push('composition.composedOf must be an array')
      } else {
        for (const item of composition.composedOf) {
          if (typeof item === 'string') {
            continue
          }

          if (!item || typeof item !== 'object') {
            issues.push('composition.composedOf entries must be strings or objects')
            continue
          }

          if (typeof item.assetId !== 'string' || item.assetId.trim() === '') {
            issues.push('composition.composedOf.assetId must be a non-empty string')
          }

          if (item.role !== undefined && (typeof item.role !== 'string' || item.role.trim() === '')) {
            issues.push('composition.composedOf.role must be a non-empty string when provided')
          }

          if (item.required !== undefined && typeof item.required !== 'boolean') {
            issues.push('composition.composedOf.required must be a boolean when provided')
          }
        }
      }
    }

    if (composition.missingCapabilities !== undefined) {
      if (!Array.isArray(composition.missingCapabilities)) {
        issues.push('composition.missingCapabilities must be an array')
      } else if (composition.missingCapabilities.some((item) => typeof item !== 'string' || item.trim() === '')) {
        issues.push('composition.missingCapabilities must only contain non-empty strings')
      }
    }

    if (composition.notes !== undefined && typeof composition.notes !== 'string') {
      issues.push('composition.notes must be a string')
    }
  }

  if (options.checkAssetFiles) {
    const assetCandidates = getAssetCandidates(manifest)
    const found = await Promise.all(assetCandidates.map(async (candidate) => Boolean(await fs.stat(candidate).catch(() => null))))

    if (assetCandidates.length > 0 && !found.some(Boolean)) {
      warnings.push(`Asset file not found for manifest "${manifest.name}"`)
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const targetDir = args.dir ? resolvePath(String(args.dir)) : getAssetsRoot()

  logger.info(`Verifying manifests in: ${targetDir}`)

  const manifestFiles = await collectManifestFiles(targetDir)

  if (manifestFiles.length === 0) {
    logger.warn('No manifest files found.')
    process.exit(0)
  }

  const report = {
    total: manifestFiles.length,
    valid: 0,
    invalid: 0,
    warnings: 0,
    details: [],
  }

  for (const filePath of manifestFiles) {
    const result = await validateManifest(filePath, { checkAssetFiles: true })

    if (result.valid) {
      report.valid += 1
    } else {
      report.invalid += 1
    }

    report.warnings += result.warnings.length

    if (!result.valid || result.warnings.length > 0) {
      report.details.push({
        file: path.relative(getAssetsRoot(), filePath),
        issues: result.issues,
        warnings: result.warnings,
      })
    }
  }

  console.log(`Total manifests: ${report.total}`)
  console.log(`Valid: ${report.valid}`)
  console.log(`Invalid: ${report.invalid}`)
  console.log(`Warnings: ${report.warnings}`)

  if (report.details.length > 0) {
    console.log('')
    console.log('Details:')

    for (const detail of report.details) {
      console.log(`- ${detail.file}`)
      for (const issue of detail.issues) {
        console.log(`  issue: ${issue}`)
      }
      for (const warning of detail.warnings) {
        console.log(`  warning: ${warning}`)
      }
    }
  }

  if (report.invalid > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  logger.error(`Unexpected error: ${error.message}`)
  process.exit(1)
})
