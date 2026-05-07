import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { fileURLToPath, pathToFileURL } from "node:url"

const execFileAsync = promisify(execFile)

export const workspaceDir = path.join(os.homedir(), ".tmp", "playwright-capture")
export const capturesRootDir = path.join(workspaceDir, "captures")
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

export function buildDefaultOutputDir(url) {
  const stamp = new Date().toISOString().replace(/[.:]/g, "-")
  return path.join(capturesRootDir, `${stamp}-${slugify(url)}`)
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

export function resolveOutputDir(url, explicitOutputDir) {
  return explicitOutputDir ? path.resolve(String(explicitOutputDir)) : buildDefaultOutputDir(url)
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

export function getPlaywrightCliPath(baseDir = workspaceDir) {
  return path.join(baseDir, "node_modules", ".bin", process.platform === "win32" ? "playwright.cmd" : "playwright")
}

export async function ensurePlaywright(baseDir = workspaceDir) {
  await ensureDirectory(path.dirname(baseDir))
  await ensureDirectory(baseDir)

  const playwrightPackagePath = path.join(baseDir, "node_modules", "playwright", "package.json")
  const playwrightInstalled = await fileExists(playwrightPackagePath)
  if (!playwrightInstalled) {
    await execFileAsync("npm", ["install", "playwright", "--prefix", baseDir], { shell: process.platform === "win32" })
  }

  const browserCacheDir = process.platform === "win32"
    ? path.join(process.env.LOCALAPPDATA || "", "ms-playwright")
    : path.join(os.homedir(), ".cache", "ms-playwright")

  const hasChromium = await directoryHasPrefix(browserCacheDir, "chromium-")
  if (!hasChromium) {
    const cliPath = getPlaywrightCliPath(baseDir)
    await execFileAsync(cliPath, ["install", "chromium"])
  }

  return {
    workspaceDir: baseDir,
    browserCacheDir,
    playwrightCliPath: getPlaywrightCliPath(baseDir),
  }
}

export async function loadPlaywright(baseDir = workspaceDir) {
  await ensurePlaywright(baseDir)
  const moduleFile = path.join(baseDir, "node_modules", "playwright", "index.mjs")
  return import(pathToFileURL(moduleFile).href)
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
