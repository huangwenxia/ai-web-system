import fs from "node:fs/promises"
import path from "node:path"
import {
  directRun,
  downloadToFile,
  ensureDirectory,
  normalizeUrl,
  parseCliArgs,
  printDownloadPreflight,
  resolveAssetOutputDir,
} from "./shared.ts"

const assetPattern = /(?:src|href)=["']([^"']+)["']/gi

export async function downloadAssets(options = {}) {
  const url = String(options.url || "")
  const htmlPath = options.html ? path.resolve(String(options.html)) : ""

  let html = ""
  let baseUrl = url

  if (!baseUrl) {
    throw new Error("When using --html, also provide --url so relative assets can be resolved")
  }

  const outputDir = resolveAssetOutputDir("download-assets", baseUrl, htmlPath, options)
  printDownloadPreflight("download-assets", outputDir, baseUrl, htmlPath, options)

  if (htmlPath) {
    html = await fs.readFile(htmlPath, "utf8")
  } else if (url) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }
    html = await response.text()
  } else {
    throw new Error("Provide either --url or --html")
  }

  await ensureDirectory(outputDir)

  const candidates = new Set()
  let match
  while ((match = assetPattern.exec(html)) !== null) {
    const raw = match[1]
    if (!raw) continue
    const resolved = normalizeUrl(raw, baseUrl)
    if (!resolved) continue
    if (!/\.(?:js|css|png|svg|jpg|jpeg|webp|gif)(?:\?|#|$)/i.test(resolved)) continue
    candidates.add(resolved)
  }

  const downloads = []
  for (const assetUrl of candidates) {
    const fileName = path.basename(new URL(assetUrl).pathname)
    const targetPath = path.join(outputDir, fileName)
    await downloadToFile(assetUrl, targetPath)
    downloads.push(targetPath)
  }

  console.log(`Asset count: ${downloads.length}`)
  for (const filePath of downloads) {
    console.log(filePath)
  }

  return { outputDir, files: downloads }
}

if (directRun(import.meta.url)) {
  const options = parseCliArgs()
  await downloadAssets(options)
}
