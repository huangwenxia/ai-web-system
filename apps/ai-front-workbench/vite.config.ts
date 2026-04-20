import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'

interface GeneratedRuntimeProfile {
 publicRoots?: string[]
}

interface GeneratedAssetRegistryEntry {
 preview?: {
  catalogRoute?: string
  demoRoute?: string | null
  integrationRoute?: string | null
 }
 runtimeProfile?: GeneratedRuntimeProfile
}

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const workbenchAppRoot = fileURLToPath(new URL('.', import.meta.url))
const projectMambaRoot = path.resolve(repoRoot, '../project-mamba')
const generatedAssetRegistryPath = path.join(workbenchAppRoot, 'src', 'registry', 'generated', 'asset-registry.generated.json')
const require = createRequire(import.meta.url)
const elementPlusEntry = require.resolve('element-plus')
const elementPlusIconsEntry = require.resolve('@element-plus/icons-vue')

function toPosix(filePath: string) {
 return filePath.split(path.sep).join('/')
}

function uniqueStrings(values: Array<string | null | undefined>) {
 return [...new Set(values.filter(Boolean))] as string[]
}

function normalizeRoutePath(routePath: string) {
 const pathname = routePath.split(/[?#]/)[0] ?? '/'
 if (pathname === '/') {
  return pathname
 }

 return pathname.replace(/\/+$/, '')
}

function loadGeneratedAssetRegistry() {
 if (!existsSync(generatedAssetRegistryPath)) {
  return [] as GeneratedAssetRegistryEntry[]
 }

 try {
  return JSON.parse(readFileSync(generatedAssetRegistryPath, 'utf-8')) as GeneratedAssetRegistryEntry[]
 } catch {
  return [] as GeneratedAssetRegistryEntry[]
 }
}

const generatedAssetRegistry = loadGeneratedAssetRegistry()
const fallbackPublicRoots = uniqueStrings([
 'apps/common/public',
 ...generatedAssetRegistry.flatMap((entry) => entry.runtimeProfile?.publicRoots ?? []),
])

function buildRouteRuntimeProfileMap(entries: GeneratedAssetRegistryEntry[]) {
 const routeRuntimeProfileMap = new Map<string, GeneratedRuntimeProfile>()

 for (const entry of entries) {
  const routes = [
   entry.preview?.catalogRoute,
   entry.preview?.demoRoute ?? null,
   entry.preview?.integrationRoute ?? null,
  ]

  for (const route of routes) {
   if (!route) {
    continue
   }

   routeRuntimeProfileMap.set(normalizeRoutePath(route), entry.runtimeProfile ?? {})
  }
 }

 return routeRuntimeProfileMap
}

const routeRuntimeProfileMap = buildRouteRuntimeProfileMap(generatedAssetRegistry)

function inferRuntimeProfile(referer?: string) {
 if (!referer) {
  return null
 }

 try {
  return routeRuntimeProfileMap.get(normalizeRoutePath(new URL(referer).pathname)) ?? null
 } catch {
  return null
 }
}

function resolveProjectStaticAsset(urlPath: string, referer?: string) {
 const preferredRoots = uniqueStrings([...(inferRuntimeProfile(referer)?.publicRoots ?? []), ...fallbackPublicRoots])

 for (const publicRoot of preferredRoots) {
  const candidate = path.join(projectMambaRoot, publicRoot, urlPath.slice(1))
  if (existsSync(candidate)) {
   return candidate
  }
 }

 return null
}

function projectMambaStaticBridge() {
 const rewriteToFsPath = (requestUrl: string | undefined, referer: string | undefined) => {
  const pathname = requestUrl?.split('?')[0] ?? ''
  if (!pathname.startsWith('/static/')) {
   return null
  }

  const filePath = resolveProjectStaticAsset(pathname, referer)
  return filePath ? `/@fs/${toPosix(filePath)}` : null
 }

 const attachMiddleware = (server: { middlewares: { use: (handler: (req: { url?: string, headers: { referer?: string } }, res: unknown, next: () => void) => void) => void } }) => {
  server.middlewares.use((req, _res, next) => {
   const rewrittenUrl = rewriteToFsPath(req.url, req.headers.referer)
   if (rewrittenUrl) {
    req.url = rewrittenUrl
   }
   next()
  })
 }

 return {
  name: 'project-mamba-static-bridge',
  configureServer(server: { middlewares: { use: (handler: (req: { url?: string, headers: { referer?: string } }, res: unknown, next: () => void) => void) => void } }) {
   attachMiddleware(server)
  },
  configurePreviewServer(server: { middlewares: { use: (handler: (req: { url?: string, headers: { referer?: string } }, res: unknown, next: () => void) => void) => void } }) {
   attachMiddleware(server)
  },
 }
}

function projectMambaScopedAlias() {
 const root = toPosix(projectMambaRoot)

 return {
  name: 'project-mamba-scoped-alias',
  enforce: 'pre' as const,
  async resolveId(source: string, importer?: string) {
   if (!importer || !source.startsWith('@/')) {
    return null
   }

   const normalizedImporter = toPosix(importer)
   if (!normalizedImporter.startsWith(root)) {
    return null
   }

   const relativeImporter = normalizedImporter.slice(root.length + 1)
   let baseDir: string | null = null

   const appMatch = relativeImporter.match(/^apps\/([^/]+)\/src\//)
   if (appMatch) {
    baseDir = path.join(projectMambaRoot, 'apps', appMatch[1], 'src')
   }

   const packageMatch = relativeImporter.match(/^packages\/([^/]+)\/src\//)
   if (packageMatch) {
    baseDir = path.join(projectMambaRoot, 'packages', packageMatch[1], 'src')
   }

   if (!baseDir) {
    return null
   }

   return this.resolve(path.join(baseDir, source.slice(2)), importer, { skipSelf: true })
  },
 }
}

function manualChunks(id: string) {
 const normalizedId = toPosix(id)

 if (normalizedId.includes('/node_modules/@element-plus/icons-vue/')) {
  return 'vendor-element-plus-icons'
 }
 if (normalizedId.includes('/node_modules/vue-router/')) {
  return 'vendor-vue-router'
 }
 if (normalizedId.includes('/project-mamba/packages/')) {
  return 'project-mamba-packages'
 }

 return undefined
}

export default defineConfig({
 plugins: [
  projectMambaStaticBridge(),
  projectMambaScopedAlias(),
  vue(),
  tailwindcss(),
  AutoImport({
   imports: ['vue', 'vue-router'],
   dts: 'src/types/auto-imports.d.ts',
  }),
 ],
 resolve: {
  alias: {
   '@common': path.join(projectMambaRoot, 'apps', 'common', 'src'),
   '@hashrate': path.join(projectMambaRoot, 'apps', 'hashrate', 'src'),
   '@wanmore': path.join(projectMambaRoot, 'apps', 'wanmore', 'src'),
   '@project-mamba': projectMambaRoot,
   '@element-plus/icons-vue': elementPlusIconsEntry,
   '@repo/api': path.join(projectMambaRoot, 'packages', 'api', 'index.ts'),
   '@repo/hooks': path.join(projectMambaRoot, 'packages', 'hooks', 'src', 'index.ts'),
   '@repo/mamba-ui': path.join(projectMambaRoot, 'packages', 'mamba-ui', 'src', 'index.ts'),
   '@repo/mamba-utils-wasm': path.join(projectMambaRoot, 'packages', 'mamba-utils-wasm', 'mamba_utils_wasm.js'),
   '@repo/request': path.join(projectMambaRoot, 'packages', 'request', 'src', 'index.ts'),
   '@repo/ui': path.join(projectMambaRoot, 'packages', 'ui', 'dist', 'ui.js'),
   '@repo/utils': path.join(workbenchAppRoot, 'src', 'shims', 'project-mamba-utils.ts'),
   'element-plus': elementPlusEntry,
   vue: 'vue/dist/vue.esm-bundler.js',
  },
  dedupe: ['vue', 'vue-router'],
  extensions: ['.tsx', '.ts', '.js', '.vue', '.json', '.mjs'],
 },
 build: {
  rollupOptions: {
   output: {
    manualChunks,
   },
  },
 },
 server: {
  fs: {
   allow: [repoRoot, projectMambaRoot],
  },
  host: '0.0.0.0',
  port: 5176,
  open: false,
 },
})
