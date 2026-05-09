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
  printCapturePreflight,
  resolveArtifactOutputDir,
  resolvePlaywrightRuntime,
  writeJson,
  writeText,
} from "./shared.ts"

export async function capturePage(options = {}) {
  const url = String(options.url || "")
  if (!url) {
    throw new Error("Missing required --url")
  }

  const outputDir = resolveArtifactOutputDir("capture", url, options)
  const runtime = resolvePlaywrightRuntime("capture", options)
  await ensureDirectory(outputDir)

  printCapturePreflight("capture", runtime, outputDir, url)

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

    const screenshotPath = path.join(outputDir, "page.png")
    await page.screenshot({ path: screenshotPath, fullPage: true })

    const capture = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("body *"))
      const visibleText = nodes
        .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .filter((value, index, list) => list.indexOf(value) === index)
        .slice(0, 1000)

      const images = Array.from(document.images).map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      }))

      const svgs = Array.from(document.querySelectorAll("svg")).map((svg, index) => ({
        index,
        outerHTML: svg.outerHTML,
      }))

      const backgrounds = nodes
        .map((node) => {
          const style = getComputedStyle(node)
          if (!style.backgroundImage || style.backgroundImage === "none") return null
          return {
            tag: node.tagName,
            className: node.className,
            backgroundImage: style.backgroundImage,
          }
        })
        .filter(Boolean)

      const blocks = nodes
        .map((node) => {
          const rect = node.getBoundingClientRect()
          const style = getComputedStyle(node)
          const text = (node.textContent || "").replace(/\s+/g, " ").trim()
          const hasGraphic = node.tagName === "IMG" || node.tagName === "SVG" || style.backgroundImage !== "none"
          if (rect.width < 20 || rect.height < 20) return null
          if (!text && !hasGraphic) return null
          return {
            tag: node.tagName,
            className: node.className,
            text: text.slice(0, 1000),
            rect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
            style: {
              color: style.color,
              background: style.background,
              backgroundImage: style.backgroundImage,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight,
              borderRadius: style.borderRadius,
              border: style.border,
              boxShadow: style.boxShadow,
              display: style.display,
              justifyContent: style.justifyContent,
              alignItems: style.alignItems,
              gap: style.gap,
              padding: style.padding,
              margin: style.margin,
              opacity: style.opacity,
            },
          }
        })
        .filter(Boolean)
        .slice(0, 1200)

      return {
        title: document.title,
        url: location.href,
        visibleText,
        images,
        svgs,
        backgrounds,
        blocks,
        body: {
          width: document.body.scrollWidth,
          height: document.body.scrollHeight,
        },
      }
    })

    const html = await page.content()
    const htmlPath = path.join(outputDir, "page.html")
    const jsonPath = path.join(outputDir, "capture.json")

    // Keep the full DOM snapshot in page.html so capture.json stays much smaller.
    await writeJson(jsonPath, capture)
    await writeText(htmlPath, html)

    console.log(`Captured URL: ${url}`)
    console.log(`Output directory: ${outputDir}`)
    console.log(`Screenshot: ${screenshotPath}`)
    console.log(`HTML: ${htmlPath}`)
    console.log(`JSON: ${jsonPath}`)

    return {
      outputDir,
      screenshotPath,
      htmlPath,
      jsonPath,
      capture,
    }
  } finally {
    await page.close()
    await browser.close()
  }
}

if (directRun(import.meta.url)) {
  const options = parseCliArgs()
  await capturePage(options)
}
