import path from 'node:path'

const GENERIC_SEGMENTS = new Set(['src', 'components', 'views', 'layout', 'index'])
const HTML_TAGS = new Set([
 'a',
 'abbr',
 'address',
 'area',
 'article',
 'aside',
 'audio',
 'b',
 'base',
 'bdi',
 'bdo',
 'blockquote',
 'body',
 'br',
 'button',
 'canvas',
 'caption',
 'cite',
 'code',
 'col',
 'colgroup',
 'data',
 'datalist',
 'dd',
 'del',
 'details',
 'dfn',
 'dialog',
 'div',
 'dl',
 'dt',
 'em',
 'embed',
 'fieldset',
 'figcaption',
 'figure',
 'footer',
 'form',
 'h1',
 'h2',
 'h3',
 'h4',
 'h5',
 'h6',
 'head',
 'header',
 'hgroup',
 'hr',
 'html',
 'i',
 'iframe',
 'img',
 'input',
 'ins',
 'kbd',
 'label',
 'legend',
 'li',
 'link',
 'main',
 'map',
 'mark',
 'menu',
 'meta',
 'meter',
 'nav',
 'noscript',
 'object',
 'ol',
 'optgroup',
 'option',
 'output',
 'p',
 'picture',
 'pre',
 'progress',
 'q',
 'rp',
 'rt',
 'ruby',
 's',
 'samp',
 'script',
 'search',
 'section',
 'select',
 'slot',
 'small',
 'source',
 'span',
 'strong',
 'style',
 'sub',
 'summary',
 'sup',
 'svg',
 'table',
 'tbody',
 'td',
 'template',
 'textarea',
 'tfoot',
 'th',
 'thead',
 'time',
 'title',
 'tr',
 'track',
 'u',
 'ul',
 'var',
 'video',
])
const BUILTIN_COMPONENT_TAGS = new Set(['component', 'transition', 'transition-group', 'keep-alive', 'teleport', 'suspense'])
const STRUCTURAL_TAGS = new Set(['main', 'section', 'header', 'article', 'aside', 'nav', 'footer', 'div', 'form'])
const NON_BLOCK_SUFFIXES = new Set([
 'title',
 'description',
 'label',
 'value',
 'state',
 'icon',
 'text',
 'note',
 'item',
 'row',
 'col',
 'content',
 'body',
 'subtitle',
 ])
const SHELL_SUFFIXES = new Set(['shell', 'wrapper', 'container', 'layout', 'root'])
const PAGE_SUFFIXES = new Set(['header', 'hero', 'toolbar'])
const SECTION_SUFFIXES = new Set([
 'metrics',
 'summary',
 'filters',
 'table',
 'list',
 'grid',
 'sidebar',
 'panel',
 'actions',
 'form',
 'tabs',
 'content',
])

export function toPosix(filePath) {
 return filePath.split(path.sep).join('/')
}

export function countMatches(source, pattern) {
 const matches = source.match(pattern)
 return matches ? matches.length : 0
}

export function classifySource(relativePath) {
 const normalized = `/${toPosix(relativePath)}`

 if (normalized.includes('/src/views/') && normalized.includes('/components/')) {
  return 'page-block-component'
 }
 if (normalized.includes('/src/components/') || normalized.includes('/src/layout/components/')) {
  return 'shared-view-component'
 }
 if (normalized.includes('/src/views/')) {
  return 'page-shell'
 }
 return 'not-eligible'
}

export function analyzeVueSource({ project, projectRoot, filePath, content }) {
 const relativePath = toPosix(path.relative(projectRoot, filePath))
 const sourceType = classifySource(relativePath)
 const importCount = countMatches(content, /^\s*import\s.+$/gm)
 const localDependencyCount = countMatches(content, /from\s+['"]\.{1,2}\//g)
 const usesRouter = /useRouter|router-link|router\./.test(content)
 const usesStore = /storeToRefs|defineStore|pinia|use[A-Z]\w*Store/.test(content)
 const usesRequest = /@repo\/request|axios|request[A-Z]|\brequest\(/.test(content)
 const usesI18n = /\$t\(|useI18n|i18n\.global/.test(content)
 const usesPermission = /permission|v-permission|hasPermission/.test(content)

 let candidateScore = 0

 if (sourceType === 'shared-view-component') {
  candidateScore += 3
 } else if (sourceType === 'page-block-component') {
  candidateScore += 2
 }

 if (importCount <= 8) {
  candidateScore += 1
 }
 if (localDependencyCount <= 4) {
  candidateScore += 1
 }
 if (usesI18n) {
  candidateScore -= 1
 }
 if (usesRouter) {
  candidateScore -= 1
 }
 if (usesStore) {
  candidateScore -= 2
 }
 if (usesRequest) {
  candidateScore -= 3
 }
 if (usesPermission) {
  candidateScore -= 2
 }

 return {
  id: `${project}:${relativePath}`,
  project,
  relativePath,
  fileName: path.basename(filePath),
  sourceType,
  importCount,
  localDependencyCount,
  usesRouter,
  usesStore,
  usesRequest,
  usesI18n,
  usesPermission,
  candidateScore,
 }
}

export function inferAdapterRequired(entry) {
 const adapters = []

 if (entry.usesRouter) {
  adapters.push('router')
 }
 if (entry.usesStore) {
  adapters.push('store')
 }
 if (entry.usesI18n) {
  adapters.push('i18n')
 }
 if (entry.usesPermission) {
  adapters.push('permission')
 }
 if (entry.usesRequest) {
  adapters.push('request')
 }

 return adapters
}

export function inferPortabilityLevel(entry) {
 if (entry.usesRequest || entry.usesStore) {
  return 'low'
 }
 if (entry.usesRouter || entry.usesI18n || entry.usesPermission) {
  return 'medium'
 }
 if (entry.localDependencyCount > 4) {
  return 'medium'
 }
 if (entry.candidateScore >= 4) {
  return 'high'
 }
 return 'medium'
}

export function inferCompatibilityDependencies(content) {
 const dependencies = new Set(['vue'])
 const matcher = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g

 for (const match of content.matchAll(matcher)) {
  const specifier = match[1]
  if (!specifier) {
   continue
  }
  if (
   specifier.startsWith('.') ||
   specifier.startsWith('/') ||
   specifier.startsWith('@/') ||
   specifier.startsWith('~/') ||
   specifier.startsWith('#')
  ) {
   continue
  }

  if (specifier.startsWith('@')) {
   const parts = specifier.split('/')
   if (parts.length >= 2) {
    dependencies.add(`${parts[0]}/${parts[1]}`)
    continue
   }
  }

  dependencies.add(specifier.split('/')[0])
 }

 return Array.from(dependencies)
}

export function inferSharedPackages(content) {
 const sharedPackages = new Set()
 const matcher = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g

 for (const match of content.matchAll(matcher)) {
  const specifier = match[1]
  if (!specifier) {
   continue
  }

  if (specifier.startsWith('@repo/')) {
   const parts = specifier.split('/')
   if (parts.length >= 2) {
    sharedPackages.add(`${parts[0]}/${parts[1]}`)
   }
   continue
  }

  if (specifier.startsWith('@common/')) {
   sharedPackages.add('@common')
   continue
  }

  if (specifier.startsWith('@hashrate/')) {
   sharedPackages.add('@hashrate')
   continue
  }

  if (specifier.startsWith('@wanmore/')) {
   sharedPackages.add('@wanmore')
  }
 }

 return Array.from(sharedPackages)
}

export function buildDefaultAssetName(project, relativePath) {
 const normalized = toPosix(relativePath)
 const segments = normalized
  .split('/')
  .map((segment) => segment.replace(/\.(vue|jsx|tsx)$/, ''))
  .filter(Boolean)
  .filter((segment) => !GENERIC_SEGMENTS.has(segment.toLowerCase()))
 const dedupedSegments = segments.filter(
  (segment, index) => index === 0 || segment.toLowerCase() !== segments[index - 1].toLowerCase()
 )

 const tail = dedupedSegments.slice(-2)
 const parts = [project, ...(tail.length > 0 ? tail : [path.posix.basename(normalized, path.posix.extname(normalized))])]

 return toKebabCase(parts.join('-'))
}

export function toKebabCase(value) {
 return value
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-{2,}/g, '-')
  .toLowerCase()
}

export function extractVueSfcBlocks(content) {
 const templateMatch = content.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i)
 const template = templateMatch ? templateMatch[1] : ''
 const scripts = Array.from(content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)).map((match) => match[1])

 return {
  template,
  script: scripts.join('\n'),
 }
}

function extractIdentifiersFromImportClause(clause) {
 const normalized = clause.replace(/\btype\b/g, '').trim()

 if (!normalized) {
  return []
 }

 const identifiers = []
 const defaultMatch = normalized.match(/^([A-Za-z_$][\w$]*)\s*(?:,|$)/)
 if (defaultMatch && defaultMatch[1] !== '{' && defaultMatch[1] !== '*') {
  identifiers.push(defaultMatch[1])
 }

 const namespaceMatch = normalized.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/)
 if (namespaceMatch) {
  identifiers.push(namespaceMatch[1])
 }

 const namedMatch = normalized.match(/\{([^}]+)\}/)
 if (namedMatch) {
  for (const item of namedMatch[1].split(',')) {
   const trimmed = item.trim()
   if (!trimmed) {
    continue
   }

   const aliasMatch = trimmed.match(/(?:[A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/)
   if (aliasMatch) {
    identifiers.push(aliasMatch[1])
    continue
   }

   const directMatch = trimmed.match(/^([A-Za-z_$][\w$]*)$/)
   if (directMatch) {
    identifiers.push(directMatch[1])
   }
  }
 }

 return Array.from(new Set(identifiers))
}

export function parseImportEntries(scriptContent) {
 const imports = []
 const importMatcher = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g

 for (const match of scriptContent.matchAll(importMatcher)) {
  const clause = match[1]?.trim() ?? ''
  const specifier = match[2]?.trim() ?? ''
  if (!specifier) {
   continue
  }

  imports.push({
   specifier,
   localIdentifiers: extractIdentifiersFromImportClause(clause),
  })
 }

  const sideEffectMatcher = /import\s+['"]([^'"]+)['"]/g
 for (const match of scriptContent.matchAll(sideEffectMatcher)) {
  const specifier = match[1]?.trim() ?? ''
  if (!specifier || imports.some((entry) => entry.specifier === specifier)) {
   continue
  }

  imports.push({
   specifier,
   localIdentifiers: [],
  })
 }

 return imports
}

function extractClassNames(attrs) {
 const classNames = []
 const classMatcher = /\bclass\s*=\s*["']([^"']+)["']/g

 for (const match of attrs.matchAll(classMatcher)) {
  classNames.push(...match[1].split(/\s+/).map((item) => item.trim()).filter(Boolean))
 }

 return classNames
}

export function extractTemplateTags(templateContent) {
 const tags = []
 const tagMatcher = /<([A-Za-z][\w-]*)\b([^>]*)>/g

 for (const match of templateContent.matchAll(tagMatcher)) {
  const tag = match[1]
  const attrs = match[2] ?? ''

  if (!tag || match[0].startsWith('</')) {
   continue
  }

  tags.push({
   tag,
   attrs,
   classNames: extractClassNames(attrs),
  })
 }

 return tags
}

function isCustomTag(tag) {
 const normalized = tag.toLowerCase()
 if (HTML_TAGS.has(normalized) || BUILTIN_COMPONENT_TAGS.has(normalized)) {
  return false
 }

 return true
}

function normalizeResolvedCandidate(candidatePath) {
 const candidates = []
 const ext = path.extname(candidatePath)

 if (ext) {
  candidates.push(candidatePath)
 } else {
  candidates.push(candidatePath)
  candidates.push(`${candidatePath}.vue`)
  candidates.push(`${candidatePath}.ts`)
  candidates.push(`${candidatePath}.js`)
  candidates.push(path.join(candidatePath, 'index.vue'))
  candidates.push(path.join(candidatePath, 'index.ts'))
  candidates.push(path.join(candidatePath, 'index.js'))
 }

 return Array.from(new Set(candidates))
}

function resolveImportSourcePath(filePath, specifier, sourcePathByAbsolutePath) {
 if (!specifier.startsWith('.')) {
  return null
 }

 for (const candidate of normalizeResolvedCandidate(path.resolve(path.dirname(filePath), specifier))) {
  const normalizedCandidate = toPosix(candidate)
  const matchedSourcePath = sourcePathByAbsolutePath.get(normalizedCandidate)
  if (matchedSourcePath) {
   return matchedSourcePath
  }
 }

 return null
}

function templateUsesIdentifier(tags, identifier) {
 const kebabIdentifier = toKebabCase(identifier)

 return tags.some(({ tag }) => {
  const normalizedTag = tag.trim()
  return normalizedTag === identifier || normalizedTag === kebabIdentifier
 })
}

function inferCompositionRole(localIdentifiers, fallbackAssetName) {
 const primaryName = localIdentifiers[0] ?? fallbackAssetName
 return toKebabCase(primaryName || 'composed-asset')
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

function extractBemSuffix(className) {
 if (className.includes('__')) {
  return className.split('__').pop() ?? ''
 }

 const tokens = className.split('-').filter(Boolean)
 return tokens.length > 1 ? tokens[tokens.length - 1] : className
}

function normalizeFallbackBlockName(tag, classNames, index, type) {
 const shellPrefix = type === 'component' ? 'component' : 'page'

 if (tag === 'main') {
  return `${shellPrefix}-shell`
 }

 if (tag === 'header') {
  return `${shellPrefix}-header`
 }

  const preferredSuffix = classNames
  .map(extractBemSuffix)
  .map((item) => toKebabCase(item))
  .find((item) => item && !NON_BLOCK_SUFFIXES.has(item))

 if (preferredSuffix) {
  if (SHELL_SUFFIXES.has(preferredSuffix)) {
   return `${shellPrefix}-shell`
  }

  if (PAGE_SUFFIXES.has(preferredSuffix)) {
   return `${shellPrefix}-${preferredSuffix}`
  }

  if (SECTION_SUFFIXES.has(preferredSuffix)) {
   return `${preferredSuffix}-section`
  }

  if (type === 'component' && index === 0) {
   return `${preferredSuffix}-shell`
  }

  return preferredSuffix
 }

 if (tag === 'section' || tag === 'article' || tag === 'aside' || tag === 'nav' || tag === 'footer') {
  return `${tag}-section`
 }

 if (tag === 'div' && index === 0) {
  return `${shellPrefix}-shell`
 }

 return ''
}

function detectFallbackHtmlBlocks(tags, type, realComponentRefs, composedOfCount) {
 if (type === 'pattern') {
  return []
 }

 if (type === 'component' && realComponentRefs) {
  return []
 }

 const blocks = []

 for (const [index, tagEntry] of tags.entries()) {
  const normalizedTag = tagEntry.tag.toLowerCase()
  if (!STRUCTURAL_TAGS.has(normalizedTag)) {
   continue
  }

  const blockName = normalizeFallbackBlockName(normalizedTag, tagEntry.classNames, index, type)
  if (blockName) {
   blocks.push(blockName)
  }
 }

 if (type === 'page' && composedOfCount > 0) {
  return Array.from(new Set(blocks.filter((item) => item !== 'page-shell' || blocks.length === 1 || realComponentRefs)))
 }

 return Array.from(new Set(blocks))
}

function deriveImplementationStrategy(type, realComponentRefs, composedOfCount, fallbackHtmlBlocks) {
 if (type === 'pattern') {
  return 'pattern-primitive'
 }

 if (composedOfCount > 0 && fallbackHtmlBlocks.length > 0) {
  return 'mixed'
 }

 if (composedOfCount > 0) {
  return 'asset-composed'
 }

 if (realComponentRefs) {
  return 'project-component'
 }

 return 'native-fallback'
}

export function analyzeAssetSource({
 type,
 filePath,
 sourcePathByAbsolutePath,
 assetIdBySourcePath,
 assetNameById,
}) {
 if (!filePath) {
  return {
   realComponentRefs: false,
   fallbackHtmlBlocks: [],
   composedOf: [],
   implementationStrategy: type === 'pattern' ? 'pattern-primitive' : 'native-fallback',
   detectedTags: [],
  }
 }

 return {
  read: async (readFile) => {
   const content = await readFile(filePath, 'utf-8')
   const { template, script } = extractVueSfcBlocks(content)
   const imports = parseImportEntries(script)
   const tags = extractTemplateTags(template)
   const customTags = Array.from(new Set(tags.map((item) => item.tag).filter(isCustomTag)))

   const composedOfAuto = []

   for (const entry of imports) {
    const sourcePath = resolveImportSourcePath(filePath, entry.specifier, sourcePathByAbsolutePath)
    if (!sourcePath) {
     continue
    }

    const assetId = assetIdBySourcePath.get(sourcePath)
    if (!assetId) {
     continue
    }

    const usedInTemplate =
     entry.localIdentifiers.length === 0 || entry.localIdentifiers.some((identifier) => templateUsesIdentifier(tags, identifier))
    if (!usedInTemplate) {
     continue
    }

    composedOfAuto.push({
     assetId,
     role: inferCompositionRole(entry.localIdentifiers, assetNameById.get(assetId) ?? assetId),
     required: true,
    })
   }

   const composedOf = mergeCompositionLinks([], composedOfAuto)
   const realComponentRefs = customTags.length > 0
   const fallbackHtmlBlocks = detectFallbackHtmlBlocks(tags, type, realComponentRefs, composedOf.length)

   return {
    realComponentRefs,
    fallbackHtmlBlocks,
    composedOf,
    implementationStrategy: deriveImplementationStrategy(type, realComponentRefs, composedOf.length, fallbackHtmlBlocks),
    detectedTags: customTags,
   }
  },
 }
}
