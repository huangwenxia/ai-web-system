import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { fileURLToPath, pathToFileURL } from "node:url"

const execFileAsync = promisify(execFile)

export const legacyWorkspaceDir = path.join(os.homedir(), ".tmp", "playwright-capture")
export const legacyBrowserCacheDir = process.platform === "win32"
  ? path.join(process.env.LOCALAPPDATA || "", "ms-playwright")
  : path.join(os.homedir(), ".cache", "ms-playwright")

export const defaultViewportWidth = 1600
export const defaultViewportHeight = 900
export const defaultWaitMs = 3000
export const defaultTimeoutMs = 120000

export function parseCliArgs(argv = process.argv.slice(2)) {
  const options = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith("--")) {
      options._.push(token)
      continue
    }
    const key = token.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) {
      options[key] = true
      continue
    }
    options[key] = next
    index += 1
  }
  return options
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "capture"
}

export function resolvePathOption(value) {
  if (value === undefined || value === null || value === "") return ""
  return path.resolve(String(value))
}

export function buildCaptureDirectoryName(url) {
  const stamp = new Date().toISOString().replace(/[.:]/g, "-")
  return `${stamp}-${slugify(url)}`
}

export function buildProjectRuntimeRoot(projectDir) {
  return path.join(projectDir, ".playwright-capture")
}

export function buildProjectWorkspaceDir(projectDir) {
  return path.join(buildProjectRuntimeRoot(projectDir), "runtime")
}

export function buildProjectBrowserCacheDir(projectDir) {
  return path.join(buildProjectRuntimeRoot(projectDir), "ms-playwright")
}

export function buildProjectCaptureRoot(projectDir) {
  return path.join(projectDir, "capture", "playwright")
}

export function buildProjectOutputDir(projectDir, url) {
  return path.join(buildProjectCaptureRoot(projectDir), buildCaptureDirectoryName(url))
}

export function resolveManagedProjectRoots(options = {}) {
  const projectDir = resolveProjectDir(options)
  if (!projectDir) {
    throw new Error("This command requires --projectDir so cleanup stays inside the managed project directories.")
  }

  return {
    projectDir,
    runtimeRootDir: buildProjectRuntimeRoot(projectDir),
    workspaceDir: buildProjectWorkspaceDir(projectDir),
    browserCacheDir: buildProjectBrowserCacheDir(projectDir),
    captureRootDir: buildProjectCaptureRoot(projectDir),
  }
}

export async function directoryEntries(dirPath) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return []
    }
    throw error
  }
}

export async function removeDirectoryIfPresent(dirPath) {
  const exists = await fileExists(dirPath)
  if (!exists) {
    return false
  }

  await fs.rm(dirPath, { recursive: true, force: true })
  return true
}

export async function removeDirectoryChildren(dirPath) {
  const entries = await directoryEntries(dirPath)
  for (const entry of entries) {
    await fs.rm(path.join(dirPath, entry.name), { recursive: true, force: true })
  }
  return entries.length
}

export async function listCaptureDirectories(captureRootDir) {
  const entries = await directoryEntries(captureRootDir)
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(captureRootDir, entry.name))
    .sort()
}

export function clampPruneKeep(value, fallback = 3) {
  const parsed = numberOption(value, fallback)
  return parsed < 0 ? 0 : Math.floor(parsed)
}

// Standard preflight block so the operator can see exactly which managed paths a command will touch.
export function buildPreflightLines(commandName, details = {}) {
  const lines = [`Preflight summary (${commandName})`]

  if (details.projectDir) lines.push(`- Project directory: ${details.projectDir}`)
  if (details.outputDir) lines.push(`- Artifact directory: ${details.outputDir}`)
  if (details.captureRootDir) lines.push(`- Capture root: ${details.captureRootDir}`)
  if (details.runtimeRootDir) lines.push(`- Runtime root: ${details.runtimeRootDir}`)
  if (details.workspaceDir) lines.push(`- Workspace directory: ${details.workspaceDir}`)
  if (details.browserCacheDir) lines.push(`- Browser cache directory: ${details.browserCacheDir}`)
  if (details.htmlPath) lines.push(`- HTML source: ${details.htmlPath}`)
  if (details.url) lines.push(`- Target URL: ${details.url}`)
  if (details.scope) lines.push(`- Scope: ${details.scope}`)
  if (details.keep !== undefined) lines.push(`- Keep newest capture directories: ${details.keep}`)

  return lines
}

export function printPreflight(commandName, details = {}) {
  for (const line of buildPreflightLines(commandName, details)) {
    console.log(line)
  }
}

export function printEnsurePreflight(commandName, runtime) {
  printPreflight(commandName, {
    projectDir: runtime.projectDir,
    workspaceDir: runtime.workspaceDir,
    browserCacheDir: runtime.browserCacheDir,
  })
}

export function printCapturePreflight(commandName, runtime, outputDir, url) {
  printPreflight(commandName, {
    projectDir: runtime.projectDir,
    outputDir,
    workspaceDir: runtime.workspaceDir,
    browserCacheDir: runtime.browserCacheDir,
    url,
  })
}

export function printComparePreflight(commandName, runtime, outputDir, url) {
  printCapturePreflight(commandName, runtime, outputDir, url)
}

export function printDownloadPreflight(commandName, outputDir, url, htmlPath, options = {}) {
  printPreflight(commandName, {
    projectDir: resolveProjectDir(options),
    outputDir,
    htmlPath,
    url,
  })
}

export function printCleanPreflight(commandName, roots, scope) {
  printPreflight(commandName, {
    projectDir: roots.projectDir,
    captureRootDir: roots.captureRootDir,
    runtimeRootDir: roots.runtimeRootDir,
    workspaceDir: roots.workspaceDir,
    browserCacheDir: roots.browserCacheDir,
    scope,
  })
}

export function printPrunePreflight(commandName, roots, keep) {
  printPreflight(commandName, {
    projectDir: roots.projectDir,
    captureRootDir: roots.captureRootDir,
    runtimeRootDir: roots.runtimeRootDir,
    workspaceDir: roots.workspaceDir,
    browserCacheDir: roots.browserCacheDir,
    keep,
  })
}

export function resolveCleanScope(options = {}) {
  const scope = String(options.scope || "all").trim().toLowerCase()
  if (!["all", "captures", "runtime"].includes(scope)) {
    throw new Error("Invalid --scope. Use one of: all, captures, runtime.")
  }
  return scope
}

export function resolvePruneKeep(options = {}) {
  return clampPruneKeep(options.keep, 3)
}

export async function removeCaptureDirectories(pathsToRemove) {
  for (const dirPath of pathsToRemove) {
    await fs.rm(dirPath, { recursive: true, force: true })
  }
  return pathsToRemove.length
}

export async function captureRootExists(captureRootDir) {
  return fileExists(captureRootDir)
}

export async function runtimeRootExists(runtimeRootDir) {
  return fileExists(runtimeRootDir)
}

export async function projectRootExists(projectDir) {
  return fileExists(projectDir)
}

export async function ensureProjectRootExists(projectDir) {
  const exists = await projectRootExists(projectDir)
  if (!exists) {
    throw new Error(`Project directory does not exist: ${projectDir}`)
  }
  return projectDir
}

export async function resolveVerifiedManagedProjectRoots(options = {}) {
  const roots = resolveManagedProjectRoots(options)
  await ensureProjectRootExists(roots.projectDir)
  return roots
}

export async function describePrunePlan(roots, keep) {
  const directories = await listCaptureDirectories(roots.captureRootDir)
  const removable = directories.slice(0, Math.max(0, directories.length - keep))
  return {
    keep,
    directories,
    removable,
    lines: [
      `Found capture directories: ${directories.length}`,
      `Directories to remove: ${removable.length}`,
    ],
  }
}

export async function describeCleanPlan(roots, scope) {
  const captures = await captureRootExists(roots.captureRootDir)
  const runtime = await runtimeRootExists(roots.runtimeRootDir)
  return {
    scope,
    captures,
    runtime,
    lines: [
      `Capture root present: ${captures}`,
      `Runtime root present: ${runtime}`,
    ],
  }
}

export async function cleanManagedProjectRoots(roots, scope) {
  const removed = {
    captureEntries: 0,
    runtimeRemoved: false,
  }

  if (scope === "all" || scope === "captures") {
    removed.captureEntries = await removeDirectoryChildren(roots.captureRootDir)
  }

  if (scope === "all" || scope === "runtime") {
    removed.runtimeRemoved = await removeDirectoryIfPresent(roots.runtimeRootDir)
  }

  return removed
}

export async function pruneManagedCaptures(roots, keep) {
  const directories = await listCaptureDirectories(roots.captureRootDir)
  const removable = directories.slice(0, Math.max(0, directories.length - keep))
  const removedCount = await removeCaptureDirectories(removable)
  return {
    keep,
    found: directories.length,
    removedCount,
    removedDirectories: removable,
  }
}

export async function appendUniqueLine(filePath, line) {
  const exists = await fileExists(filePath)
  const current = exists ? await fs.readFile(filePath, "utf8") : ""
  const normalizedLine = line.trim()
  const lines = current.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  if (lines.includes(normalizedLine)) {
    return false
  }
  const next = current && !current.endsWith("\n") ? `${current}\n${normalizedLine}\n` : `${current}${normalizedLine}\n`
  await fs.writeFile(filePath, next, "utf8")
  return true
}

export async function ensureProjectIgnoreRules(projectDir) {
  const ignorePath = path.join(projectDir, ".gitignore")
  const addedPlaywrightCapture = await appendUniqueLine(ignorePath, ".playwright-capture/")
  const addedCaptureArtifacts = await appendUniqueLine(ignorePath, "capture/playwright/")
  return {
    ignorePath,
    addedPlaywrightCapture,
    addedCaptureArtifacts,
  }
}

export function formatIgnoreUpdate(result) {
  return [
    `Ignore file: ${result.ignorePath}`,
    `.playwright-capture/ added: ${result.addedPlaywrightCapture}`,
    `capture/playwright/ added: ${result.addedCaptureArtifacts}`,
  ]
}

export function resolveConfirmFlag(options = {}) {
  return options.confirm === true || String(options.confirm || "").toLowerCase() === "true"
}

export function assertConfirmedCleanup(commandName, options = {}) {
  if (!resolveConfirmFlag(options)) {
    throw new Error(`${commandName} requires --confirm true because it deletes managed project artifacts.`)
  }
}

export function resolveBooleanOption(value) {
  if (value === true) return true
  const normalized = String(value || "").trim().toLowerCase()
  return normalized === "true"
}

export function resolveIgnoreUpdateFlag(options = {}) {
  return resolveBooleanOption(options.updateGitignore)
}

export async function maybeEnsureIgnoreRules(roots, options = {}) {
  if (!resolveIgnoreUpdateFlag(options)) {
    return null
  }
  return ensureProjectIgnoreRules(roots.projectDir)
}

export function formatRemovalSummary(prefix, removedDirectories) {
  if (!removedDirectories.length) {
    return [`${prefix}: none`]
  }
  return [`${prefix}: ${removedDirectories.length}`, ...removedDirectories]
}

function isPathInside(parentDir, candidateDir) {
  const relative = path.relative(path.resolve(parentDir), path.resolve(candidateDir))
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
}

export function assertManagedPath(label, dirPath) {
  const resolvedDir = path.resolve(dirPath)

  // Reject the historical user-profile paths so the skill cannot silently grow C: again.
  if (isPathInside(legacyWorkspaceDir, resolvedDir) || isPathInside(legacyBrowserCacheDir, resolvedDir)) {
    throw new Error(`${label} cannot point inside ${legacyWorkspaceDir} or ${legacyBrowserCacheDir}. Use --projectDir or an explicit non-legacy path instead.`)
  }

  return resolvedDir
}

export function resolveProjectDir(options = {}) {
  const projectDir = resolvePathOption(options.projectDir)
  return projectDir ? assertManagedPath("--projectDir", projectDir) : ""
}

export function resolveArtifactOutputDir(commandName, url, options = {}) {
  // Fail fast here so artifact writes never fall back into the historical user-profile cache.
  const explicitOutputDir = resolvePathOption(options.outputDir)
  if (explicitOutputDir) {
    return assertManagedPath("--outputDir", explicitOutputDir)
  }

  const projectDir = resolveProjectDir(options)
  if (!projectDir) {
    throw new Error(`${commandName} requires --outputDir or --projectDir so capture artifacts stay out of the user profile.`)
  }

  return assertManagedPath("derived project output", buildProjectOutputDir(projectDir, url))
}

export function resolveAssetOutputDir(commandName, baseUrl, htmlPath, options = {}) {
  const explicitOutputDir = resolvePathOption(options.outputDir)
  if (explicitOutputDir) {
    return assertManagedPath("--outputDir", explicitOutputDir)
  }

  if (htmlPath) {
    // Reuse the existing capture folder so HTML and downloaded assets stay together.
    return assertManagedPath("derived asset output", path.join(path.dirname(htmlPath), "assets"))
  }

  const projectDir = resolveProjectDir(options)
  if (!projectDir) {
    throw new Error(`${commandName} requires --outputDir, --html, or --projectDir so asset downloads stay out of the user profile.`)
  }

  return assertManagedPath("derived project asset output", path.join(buildProjectOutputDir(projectDir, baseUrl), "assets"))
}

export function resolvePlaywrightRuntime(commandName, options = {}) {
  const projectDir = resolveProjectDir(options)
  const explicitWorkspaceDir = resolvePathOption(options.workspaceDir)
  const explicitBrowserCacheDir = resolvePathOption(options.browserCacheDir)

  const workspaceDir = explicitWorkspaceDir || (projectDir ? buildProjectWorkspaceDir(projectDir) : "")
  if (!workspaceDir) {
    throw new Error(`${commandName} requires --workspaceDir or --projectDir so Playwright does not fall back to the user profile.`)
  }

  const resolvedWorkspaceDir = assertManagedPath("--workspaceDir", workspaceDir)

  // Keep browser binaries beside the explicit workspace unless the caller overrides them.
  const browserCacheDir = explicitBrowserCacheDir
    || (projectDir ? buildProjectBrowserCacheDir(projectDir) : path.join(path.dirname(resolvedWorkspaceDir), "ms-playwright"))

  return {
    projectDir,
    workspaceDir: resolvedWorkspaceDir,
    browserCacheDir: assertManagedPath("--browserCacheDir", browserCacheDir),
  }
}

export async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
  return dirPath
}

export function numberOption(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function directoryHasPrefix(dirPath, prefix) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries.some((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
  } catch {
    return false
  }
}

export function getPlaywrightCliPath(baseDir) {
  return path.join(baseDir, "node_modules", ".bin", process.platform === "win32" ? "playwright.cmd" : "playwright")
}

export async function ensurePlaywright(runtime) {
  const workspaceDir = assertManagedPath("workspaceDir", runtime.workspaceDir)
  const browserCacheDir = assertManagedPath("browserCacheDir", runtime.browserCacheDir)

  await ensureDirectory(path.dirname(workspaceDir))
  await ensureDirectory(workspaceDir)
  await ensureDirectory(browserCacheDir)

  const playwrightPackagePath = path.join(workspaceDir, "node_modules", "playwright", "package.json")
  const playwrightInstalled = await fileExists(playwrightPackagePath)
  if (!playwrightInstalled) {
    await execFileAsync("npm", ["install", "playwright", "--prefix", workspaceDir], {
      shell: process.platform === "win32",
    })
  }

  const browserEnv = {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: browserCacheDir,
  }

  const hasChromium = await directoryHasPrefix(browserCacheDir, "chromium-")
  if (!hasChromium) {
    const cliPath = getPlaywrightCliPath(workspaceDir)
    await execFileAsync(cliPath, ["install", "chromium"], {
      env: browserEnv,
      shell: process.platform === "win32",
    })
  }

  return {
    workspaceDir,
    browserCacheDir,
    playwrightCliPath: getPlaywrightCliPath(workspaceDir),
  }
}

export async function loadPlaywright(runtime) {
  const resolvedRuntime = await ensurePlaywright(runtime)
  process.env.PLAYWRIGHT_BROWSERS_PATH = resolvedRuntime.browserCacheDir
  const moduleFile = path.join(resolvedRuntime.workspaceDir, "node_modules", "playwright", "index.mjs")
  const playwright = await import(pathToFileURL(moduleFile).href)
  return {
    playwright,
    runtime: resolvedRuntime,
  }
}

export function normalizeUrl(rawUrl, baseUrl) {
  if (!rawUrl) return ""
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl
  if (rawUrl.startsWith("//")) return `https:${rawUrl}`
  return new URL(rawUrl, baseUrl).toString()
}

export async function downloadToFile(url, outputPath) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  await ensureDirectory(path.dirname(outputPath))
  await fs.writeFile(outputPath, buffer)
  return outputPath
}

export function directRun(importMetaUrl) {
  const currentFile = fileURLToPath(importMetaUrl)
  return path.resolve(process.argv[1] || "") === path.resolve(currentFile)
}

export async function writeJson(filePath, value) {
  await ensureDirectory(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8")
}

export async function writeText(filePath, value) {
  await ensureDirectory(path.dirname(filePath))
  await fs.writeFile(filePath, value, "utf8")
}
