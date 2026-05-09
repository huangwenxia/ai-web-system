import path from "node:path"
import {
  defaultTimeoutMs,
  defaultViewportHeight,
  defaultViewportWidth,
  defaultWaitMs,
  directRun,
  ensureDirectory,
  loadPlaywright,
  numberOption,
  parseCliArgs,
  printComparePreflight,
  resolveArtifactOutputDir,
  resolvePlaywrightRuntime,
} from "./shared.ts"

export async function compareLocal(options = {}) {
  const url = String(options.url || "")
  if (!url) {
    throw new Error("Missing required --url")
  }

  const outputDir = resolveArtifactOutputDir("compare-local", url, options)
  const runtime = resolvePlaywrightRuntime("compare-local", options)
  await ensureDirectory(outputDir)

  printComparePreflight("compare-local", runtime, outputDir, url)

  const timeout = numberOption(options.timeoutMs, defaultTimeoutMs)
  const waitMs = numberOption(options.waitMs, defaultWaitMs)
  const viewportWidth = numberOption(options.viewportWidth, defaultViewportWidth)
  const viewportHeight = numberOption(options.viewportHeight, defaultViewportHeight)

  const { playwright } = await loadPlaywright(runtime)
  const browser = await playwright.chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: viewportWidth, height: viewportHeight }, deviceScaleFactor: 1 })

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout })
    if (waitMs > 0) {
      await page.waitForTimeout(waitMs)
    }

    const screenshotPath = path.join(outputDir, "local-page.png")
    await page.screenshot({ path: screenshotPath, fullPage: true })

    console.log(`Verified local URL: ${url}`)
    console.log(`Local screenshot: ${screenshotPath}`)
    console.log(`Page title: ${await page.title()}`)

    return { outputDir, screenshotPath }
  } finally {
    await page.close()
    await browser.close()
  }
}

if (directRun(import.meta.url)) {
  const options = parseCliArgs()
  await compareLocal(options)
}
