const DEFAULT_BASE_SCSS = 'apps/hashrate/src/assets/scss/main.scss'
const DEFAULT_SHARED_TAILWIND_SOURCES = ['apps/common/src', 'packages/mamba-ui/src', 'packages/ui/dist']

function sanitizeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function sanitizeStringArray(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return [...new Set(values.map((value) => sanitizeString(value)).filter(Boolean))]
}

function buildDefaultTailwindSources(sourceProject) {
  return sourceProject
    ? [...DEFAULT_SHARED_TAILWIND_SOURCES, `apps/${sourceProject}/src`]
    : [...DEFAULT_SHARED_TAILWIND_SOURCES]
}

function buildDefaultPublicRoots(sourceProject) {
  return sourceProject ? ['apps/common/public', `apps/${sourceProject}/public`] : ['apps/common/public']
}

function buildDefaultSharedPackages(sourceProject) {
  if (sourceProject === 'wanmore') {
    return ['@common']
  }

  return []
}

function buildDefaultIconfont(sourceProject) {
  if (sourceProject === 'wanmore') {
    return 'apps/wanmore/public/static/fonts/iconfont.css'
  }

  return null
}

export function createEmptyRuntimeProfile(sourceProject = null) {
  return {
    sourceProject: sanitizeString(sourceProject),
    tailwindSources: [],
    publicRoots: [],
    baseScss: null,
    iconfont: null,
    sharedPackages: [],
  }
}

export function normalizeRuntimeProfile(runtimeProfile = {}, fallbackSourceProject = null) {
  const sourceProject = sanitizeString(runtimeProfile.sourceProject) ?? sanitizeString(fallbackSourceProject)

  return {
    sourceProject,
    tailwindSources: sanitizeStringArray(runtimeProfile.tailwindSources),
    publicRoots: sanitizeStringArray(runtimeProfile.publicRoots),
    baseScss: sanitizeString(runtimeProfile.baseScss),
    iconfont: sanitizeString(runtimeProfile.iconfont),
    sharedPackages: sanitizeStringArray(runtimeProfile.sharedPackages),
  }
}

export function createRuntimeProfile(sourceProject, overrides = {}) {
  return normalizeRuntimeProfile(
    {
      sourceProject,
      tailwindSources: [...buildDefaultTailwindSources(sourceProject), ...(overrides.tailwindSources ?? [])],
      publicRoots: [...buildDefaultPublicRoots(sourceProject), ...(overrides.publicRoots ?? [])],
      baseScss: overrides.baseScss ?? DEFAULT_BASE_SCSS,
      iconfont: overrides.iconfont ?? buildDefaultIconfont(sourceProject),
      sharedPackages: [...buildDefaultSharedPackages(sourceProject), ...(overrides.sharedPackages ?? [])],
    },
    sourceProject
  )
}

export function getManifestRuntimeProfile(manifest) {
  return normalizeRuntimeProfile(manifest.runtimeProfile, manifest.sourceProject ?? null)
}
