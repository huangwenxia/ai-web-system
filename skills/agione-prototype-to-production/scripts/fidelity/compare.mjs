// Prototype-vs-production fidelity comparator.
//
// It measures configured evidence. It never claims that a page is visually approved:
//   - side-by-side PNG: unmasked visual review
//   - diff PNG: pixel differences after symmetric dynamic-data masks
//   - probe deltas: exact computed style, geometry and SVG signature differences
//   - JSON + Markdown reports: machine-readable and human-readable evidence
//
// Usage:
//   node compare.mjs
//   node compare.mjs page-name
//   node compare.mjs page-name --gate
//   node compare.mjs --config targets.fixture.pass.json --gate

import { chromium } from "playwright"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, "report")
const SHOTS = path.join(OUT, "shots")

const DEFAULT_PROBE_FIELDS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "whiteSpace",
  "color",
  "backgroundColor",
  "backgroundImage",
  "backgroundSize",
  "backgroundPosition",
  "backgroundRepeat",
  "opacity",
  "filter",
  "backdropFilter",
  "boxShadow",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "borderRadius",
  "padding",
  "margin",
  "gap",
  "rowGap",
  "columnGap",
  "display",
  "position",
  "alignItems",
  "justifyContent",
  "flexDirection",
  "gridTemplateColumns",
  "overflow",
  "transform",
  "transitionProperty",
  "transitionDuration",
  "transitionDelay",
  "transitionTimingFunction",
  "animationName",
  "animationDuration",
  "animationDelay",
  "animationTimingFunction",
  "animationIterationCount",
  "animationDirection",
  "animationFillMode",
  "left",
  "top",
  "width",
  "height",
  "svgViewBox",
  "svgSignature",
  "stroke",
  "strokeWidth",
  "fill",
]

const ALL_PROBE_FIELDS = new Set([...DEFAULT_PROBE_FIELDS, "text"])

function usage() {
  console.log("node compare.mjs [page-name] [--gate] [--config <file>]")
}

function parseArgs(argv) {
  const result = { only: undefined, gate: false, config: "targets.json" }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--gate") result.gate = true
    else if (arg === "--config") {
      result.config = argv[i + 1]
      i += 1
      if (!result.config) throw new Error("--config requires a file path")
    } else if (arg === "--help" || arg === "-h") {
      usage()
      process.exit(0)
    } else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`)
    else if (!result.only) result.only = arg
    else throw new Error(`Unexpected positional argument: ${arg}`)
  }
  return result
}

function mergeState(base = {}, override = {}) {
  return {
    ...base,
    ...override,
    localStorage: { ...(base.localStorage || {}), ...(override.localStorage || {}) },
    sessionStorage: { ...(base.sessionStorage || {}), ...(override.sessionStorage || {}) },
    htmlClasses: override.htmlClasses ?? base.htmlClasses,
    removeHtmlClasses: override.removeHtmlClasses ?? base.removeHtmlClasses,
  }
}

function mergeSide(base = {}, override = {}) {
  return {
    ...base,
    ...override,
    state: mergeState(base.state, override.state),
    setup: [...(base.setup || []), ...(override.setup || [])],
    mask: [...(base.mask || []), ...(override.mask || [])],
  }
}

function expandTargets(rawTargets) {
  return rawTargets.flatMap((target) => {
    if (!target.states?.length) return [{ ...target, baseName: target.name }]
    return target.states.map((state) => {
      if (!state.name) throw new Error(`Target "${target.name}" has a state without a name`)
      return {
        ...target,
        ...state,
        name: `${target.name}--${state.name}`,
        baseName: target.name,
        proto: mergeSide(target.proto, state.proto),
        impl: mergeSide(target.impl, state.impl),
        mask: [...(target.mask || []), ...(state.mask || [])],
        probe: { ...(target.probe || {}), ...(state.probe || {}) },
        states: undefined,
      }
    })
  })
}

function validateTargets(targets) {
  if (!Array.isArray(targets) || targets.length === 0) throw new Error("targets config must be a non-empty JSON array")
  const names = new Set()
  for (const target of targets) {
    if (!target.name || !/^[a-zA-Z0-9._-]+$/.test(target.name)) throw new Error(`Invalid target name: ${target.name || "<empty>"}`)
    if (names.has(target.name)) throw new Error(`Duplicate target name: ${target.name}`)
    names.add(target.name)
    for (const side of ["proto", "impl"]) {
      if (!target[side]?.url) throw new Error(`Target "${target.name}" is missing ${side}.url`)
      if (typeof target[side].waitFor !== "string" || !target[side].waitFor.trim()) {
        throw new Error(`Target "${target.name}" is missing a stable ${side}.waitFor selector`)
      }
    }
    for (const [key, rawProbe] of Object.entries(target.probe || {})) normalizeProbe(key, rawProbe)
  }
}

function normalizeProbe(key, rawProbe) {
  const probe = typeof rawProbe === "string" ? { selector: rawProbe } : rawProbe
  if (!probe || typeof probe !== "object") throw new Error(`Probe "${key}" must be a selector string or object`)
  if (!probe.selector && !probe.proto && !probe.impl) throw new Error(`Probe "${key}" is missing selector/proto/impl`)
  if (probe.fields !== undefined && !Array.isArray(probe.fields)) throw new Error(`Probe "${key}" fields must be an array`)
  const fields = [...(probe.fields || DEFAULT_PROBE_FIELDS)]
  if (probe.compareText && !fields.includes("text")) fields.push("text")
  for (const field of fields) {
    if (!ALL_PROBE_FIELDS.has(field)) throw new Error(`Probe "${key}" uses unsupported field "${field}"`)
  }
  return {
    selector: probe.selector,
    proto: probe.proto,
    impl: probe.impl,
    fields,
    all: probe.all ?? false,
    required: probe.required ?? true,
    visibleOnly: probe.visibleOnly ?? true,
  }
}

function selectorFor(probe, side) {
  if (probe[side]) return probe[side]
  if (typeof probe.selector === "string") return probe.selector
  if (probe.selector?.[side]) return probe.selector[side]
  throw new Error(`Probe has no selector for ${side}`)
}

function resolveConfigPath(file) {
  return path.isAbsolute(file) ? file : path.resolve(ROOT, file)
}

function resolvePageUrl(url) {
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url)) return url
  return pathToFileURL(path.resolve(ROOT, url)).href
}

function resolveStorageState(conf, side) {
  if (conf.storageState === false) return undefined
  const configured = typeof conf.storageState === "string" ? resolveConfigPath(conf.storageState) : undefined
  const fallback = side === "impl" ? path.join(ROOT, "auth.json") : undefined
  const candidate = configured || (fallback && fs.existsSync(fallback) ? fallback : undefined)
  if (candidate && !fs.existsSync(candidate)) throw new Error(`storageState not found: ${candidate}`)
  if (conf.requiresAuth && !candidate) throw new Error("requiresAuth=true but no storageState/auth.json is available")
  return candidate
}

async function addInitialState(context, state = {}) {
  if (!Object.keys(state).length) return
  await context.addInitScript((initialState) => {
    const put = (storage, entries) => {
      try {
        for (const [key, value] of Object.entries(entries || {})) {
          if (value === null) storage.removeItem(key)
          else storage.setItem(key, typeof value === "string" ? value : JSON.stringify(value))
        }
      } catch {
        // about:blank and opaque origins may deny storage; the script runs again on the target origin.
      }
    }
    try {
      put(window.localStorage, initialState.localStorage)
      put(window.sessionStorage, initialState.sessionStorage)
    } catch {
      // The target-origin invocation will retry after an opaque initial document.
    }
    const applyClasses = () => {
      if (!document.documentElement) return
      for (const name of initialState.removeHtmlClasses || []) document.documentElement.classList.remove(name)
      for (const name of initialState.htmlClasses || []) document.documentElement.classList.add(name)
    }
    applyClasses()
    document.addEventListener("DOMContentLoaded", applyClasses, { once: true })
  }, state)
}

async function runAction(page, rawAction, side) {
  const action = typeof rawAction === "string" ? { type: "click", selector: rawAction } : rawAction
  if (!action?.selector) throw new Error(`${side} setup action is missing selector`)
  const locator = page.locator(action.selector).first()
  const timeout = action.timeout ?? 10000
  try {
    if (action.type === "click" || !action.type) await locator.click({ timeout })
    else if (action.type === "hover") await locator.hover({ timeout })
    else if (action.type === "focus") await locator.focus({ timeout })
    else if (action.type === "waitFor") await locator.waitFor({ state: action.state || "visible", timeout })
    else throw new Error(`unsupported setup action type "${action.type}"`)
  } catch (error) {
    if (action.optional) return
    throw new Error(`${side} setup ${action.type || "click"} "${action.selector}" failed: ${error.message}`)
  }
  if (action.settleMs) await page.waitForTimeout(action.settleMs)
}

async function collectProbe(page, selector, probe) {
  return page.$$eval(
    selector,
    (allElements, options) => {
      const visible = (el) => !options.visibleOnly || !!(el.getClientRects().length && getComputedStyle(el).visibility !== "hidden")
      const elements = allElements.filter(visible)
      const selected = options.all ? elements : elements.slice(0, 1)
      const svgShapeAttributes = ["d", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "points"]
      return selected.map((el) => {
        const c = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        const svg = el.matches("svg") ? el : null
        const svgStyle = svg ? getComputedStyle(svg) : undefined
        const svgSignature = svg
          ? [...svg.querySelectorAll("path,circle,line,polyline,polygon,rect,ellipse")]
              .map((shape) => {
                const attrs = svgShapeAttributes
                  .filter((name) => shape.hasAttribute(name))
                  .map((name) => `${name}=${shape.getAttribute(name)}`)
                  .join(",")
                const style = getComputedStyle(shape)
                return `${shape.tagName.toLowerCase()}(${attrs}){stroke=${style.stroke},strokeWidth=${style.strokeWidth},fill=${style.fill}}`
              })
              .join("|")
          : ""
        return {
          text: (el.textContent || "").trim().replace(/\s+/g, " "),
          fontFamily: c.fontFamily,
          fontSize: c.fontSize,
          fontWeight: c.fontWeight,
          lineHeight: c.lineHeight,
          letterSpacing: c.letterSpacing,
          textTransform: c.textTransform,
          whiteSpace: c.whiteSpace,
          color: c.color,
          backgroundColor: c.backgroundColor,
          backgroundImage: c.backgroundImage,
          backgroundSize: c.backgroundSize,
          backgroundPosition: c.backgroundPosition,
          backgroundRepeat: c.backgroundRepeat,
          opacity: c.opacity,
          filter: c.filter,
          backdropFilter: c.backdropFilter,
          boxShadow: c.boxShadow,
          borderTop: c.borderTop,
          borderRight: c.borderRight,
          borderBottom: c.borderBottom,
          borderLeft: c.borderLeft,
          borderRadius: c.borderRadius,
          padding: c.padding,
          margin: c.margin,
          gap: c.gap,
          rowGap: c.rowGap,
          columnGap: c.columnGap,
          display: c.display,
          position: c.position,
          alignItems: c.alignItems,
          justifyContent: c.justifyContent,
          flexDirection: c.flexDirection,
          gridTemplateColumns: c.gridTemplateColumns,
          overflow: c.overflow,
          transform: c.transform,
          transitionProperty: c.transitionProperty,
          transitionDuration: c.transitionDuration,
          transitionDelay: c.transitionDelay,
          transitionTimingFunction: c.transitionTimingFunction,
          animationName: c.animationName,
          animationDuration: c.animationDuration,
          animationDelay: c.animationDelay,
          animationTimingFunction: c.animationTimingFunction,
          animationIterationCount: c.animationIterationCount,
          animationDirection: c.animationDirection,
          animationFillMode: c.animationFillMode,
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
          left: Math.round(r.left * 100) / 100,
          top: Math.round(r.top * 100) / 100,
          svgViewBox: svg?.getAttribute("viewBox") || "",
          svgSignature,
          stroke: svgStyle?.stroke || "",
          strokeWidth: svgStyle?.strokeWidth || "",
          fill: svgStyle?.fill || "",
        }
      })
    },
    { all: probe.all, visibleOnly: probe.visibleOnly },
  )
}

async function shoot(browser, target, side) {
  const conf = target[side]
  const storageState = resolveStorageState(conf, side)
  const context = await browser.newContext({
    deviceScaleFactor: target.deviceScaleFactor ?? 1,
    viewport: target.viewport || { width: 1440, height: 900 },
    reducedMotion: conf.reducedMotion || target.reducedMotion || "reduce",
    ...(storageState ? { storageState } : {}),
  })
  await addInitialState(context, conf.state)
  const page = await context.newPage()
  const consoleErrors = []
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`))
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`console.error: ${message.text()}`)
  })

  try {
    const url = resolvePageUrl(conf.url)
    const response = await page.goto(url, { waitUntil: conf.waitUntil || "domcontentloaded", timeout: conf.gotoTimeout ?? 30000 })
    if (response && response.status() >= 400) throw new Error(`${side} navigation returned HTTP ${response.status()} for ${url}`)

    for (const action of conf.setup || []) await runAction(page, action, side)
    if (conf.click) await runAction(page, { type: "click", selector: conf.click, timeout: 15000 }, side)
    if (conf.hover) await runAction(page, { type: "hover", selector: conf.hover, timeout: 15000 }, side)
    if (conf.focus) await runAction(page, { type: "focus", selector: conf.focus, timeout: 15000 }, side)
    if (conf.waitFor) await page.locator(conf.waitFor).first().waitFor({ state: "visible", timeout: conf.waitForTimeout ?? 15000 })
    if (conf.waitForGone) await page.locator(conf.waitForGone).first().waitFor({ state: "hidden", timeout: conf.waitForGoneTimeout ?? 15000 })
    await page.waitForTimeout(target.settleMs ?? 1000)

    const probes = {}
    for (const [key, rawProbe] of Object.entries(target.probe || {})) {
      const probe = normalizeProbe(key, rawProbe)
      const selector = selectorFor(probe, side)
      probes[key] = { ...probe, selector, items: await collectProbe(page, selector, probe) }
    }

    const screenshotOptions = {
      fullPage: target.fullPage ?? true,
      animations: target.animations || "disabled",
      caret: "hide",
    }
    const plain = await page.screenshot(screenshotOptions)
    const masks = [...(target.mask || []), ...(conf.mask || [])].map((selector) => page.locator(selector))
    const masked = await page.screenshot({ ...screenshotOptions, mask: masks, maskColor: "#FF00FF" })
    fs.writeFileSync(path.join(SHOTS, `${target.name}-${side}.png`), plain)
    return { plain, masked, probes, consoleErrors, finalUrl: page.url() }
  } finally {
    await context.close()
  }
}

function crop(png, width, height) {
  const output = new PNG({ width, height })
  for (let y = 0; y < height; y += 1) png.data.copy(output.data, y * width * 4, y * png.width * 4, y * png.width * 4 + width * 4)
  return output
}

function compose(images, gap = 24) {
  const height = Math.max(...images.map((item) => item.height))
  const width = images.reduce((sum, item) => sum + item.width, 0) + gap * (images.length - 1)
  const output = new PNG({ width, height })
  for (let i = 0; i < output.data.length; i += 4) {
    output.data[i] = 17
    output.data[i + 1] = 18
    output.data[i + 2] = 28
    output.data[i + 3] = 255
  }
  let x = 0
  for (const image of images) {
    PNG.bitblt(image, output, 0, 0, image.width, image.height, x, 0)
    x += image.width + gap
  }
  return output
}

function compareProbes(target, proto, impl) {
  const results = []
  let requiredTotal = 0
  let requiredMatched = 0
  let fieldDeltaCount = 0

  for (const key of Object.keys(target.probe || {})) {
    const a = proto.probes[key]
    const b = impl.probes[key]
    if (a.required) requiredTotal += 1
    const deltas = []
    if (a.required && (!a.items.length || !b.items.length)) {
      deltas.push(`required element missing (proto=${a.items.length}, impl=${b.items.length})`)
    } else if (a.items.length !== b.items.length) {
      deltas.push(`element count: proto=${a.items.length} impl=${b.items.length}`)
    }
    if (a.required && a.items.length && b.items.length) requiredMatched += 1

    const count = Math.min(a.items.length, b.items.length)
    for (let index = 0; index < count; index += 1) {
      for (const field of a.fields) {
        if (String(a.items[index][field]) !== String(b.items[index][field])) {
          deltas.push(`[${index}] ${field}: proto=${JSON.stringify(a.items[index][field])} impl=${JSON.stringify(b.items[index][field])}`)
          fieldDeltaCount += 1
        }
      }
    }
    results.push({ key, required: a.required, protoCount: a.items.length, implCount: b.items.length, deltas })
  }
  return { results, requiredTotal, requiredMatched, fieldDeltaCount }
}

function writeReports(rows, configName, gateMode) {
  const json = {
    generatedAt: new Date().toISOString(),
    config: configName,
    gateMode,
    disclaimer: "Mechanical probe/image evidence only. Unmasked visual review and production runtime acceptance remain required.",
    rows,
  }
  fs.writeFileSync(path.join(OUT, "fidelity-report.json"), `${JSON.stringify(json, null, 2)}\n`)

  let markdown = "# Prototype Fidelity Report\n\n"
  markdown += "> This report is mechanical evidence, not automatic visual approval. A page still needs unmasked side-by-side review and production runtime acceptance.\n\n"
  markdown += `Config: \`${configName}\` · gate mode: \`${gateMode}\`\n\n`
  markdown += "| Page | Mechanical status | Mismatch | Height | Required probes | Field deltas |\n|---|---|---:|---|---:|---:|\n"
  for (const row of rows) {
    markdown += `| ${row.name} | **${row.status}** | ${row.mismatchPct === null ? "-" : `${row.mismatchPct}%`} | ${row.heightNote || "match"} | ${row.requiredMatched}/${row.requiredTotal} | ${row.fieldDeltaCount} |\n`
  }

  for (const row of rows) {
    markdown += `\n## ${row.name}\n\n`
    if (row.status === "ERROR") {
      markdown += `- ERROR: ${row.error}\n`
      continue
    }
    markdown += `- Final URLs: proto=\`${row.finalUrls.proto}\` · impl=\`${row.finalUrls.impl}\`\n`
    markdown += `- Visual review: \`report/shots/${row.name}-sidebyside.png\`\n`
    markdown += `- Masked diff: \`report/shots/${row.name}-diff.png\`\n`
    markdown += `- Mechanical gate issues: ${row.gateIssues.length ? row.gateIssues.join("; ") : "none"}\n`
    if (row.consoleErrors.length) markdown += `- Console errors: ${row.consoleErrors.map((item) => `\`${item}\``).join("; ")}\n`
    markdown += "\n### Probe coverage and deltas\n\n"
    if (!row.probes.length) markdown += "- No probes configured. Mechanical style coverage is zero; visual approval is impossible from this report alone.\n"
    for (const probe of row.probes) {
      if (!probe.deltas.length) markdown += `- \`${probe.key}\`: ${probe.protoCount}/${probe.implCount} elements, configured fields match\n`
      else markdown += `- \`${probe.key}\`: ${probe.deltas.join("; ")}\n`
    }
  }
  fs.writeFileSync(path.join(OUT, "fidelity-report.md"), markdown)
}

let args
try {
  args = parseArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  usage()
  process.exit(2)
}

try {
  fs.mkdirSync(SHOTS, { recursive: true })
} catch (error) {
  console.error(`Report preparation error: ${error.message}`)
  process.exit(2)
}

let targets
try {
  const configPath = resolveConfigPath(args.config)
  const rawTargets = JSON.parse(fs.readFileSync(configPath, "utf8"))
  targets = expandTargets(rawTargets)
  validateTargets(targets)
  if (args.only) targets = targets.filter((target) => target.name === args.only || target.baseName === args.only)
  if (!targets.length) throw new Error(`No targets${args.only ? ` matching "${args.only}"` : ""} in ${args.config}`)
} catch (error) {
  console.error(`Configuration error: ${error.message}`)
  process.exit(2)
}

let browser
try {
  browser = await chromium.launch()
} catch (error) {
  console.error(`Browser preparation error: ${error.message}`)
  process.exit(2)
}
const rows = []
let hasFatalError = false

try {
  for (const target of targets) {
    console.log(`▶ ${target.name}`)
    try {
      const [proto, impl] = await Promise.all([shoot(browser, target, "proto"), shoot(browser, target, "impl")])
      const protoPlain = PNG.sync.read(proto.plain)
      const implPlain = PNG.sync.read(impl.plain)
      fs.writeFileSync(path.join(SHOTS, `${target.name}-sidebyside.png`), PNG.sync.write(compose([protoPlain, implPlain])))

      const protoMasked = PNG.sync.read(proto.masked)
      const implMasked = PNG.sync.read(impl.masked)
      const width = Math.min(protoMasked.width, implMasked.width)
      const height = Math.min(protoMasked.height, implMasked.height)
      const diff = new PNG({ width, height })
      const badPixels = pixelmatch(crop(protoMasked, width, height).data, crop(implMasked, width, height).data, diff.data, width, height, {
        threshold: target.pixelmatch?.threshold ?? 0.12,
        includeAA: target.pixelmatch?.includeAA ?? false,
      })
      const mismatchPct = +((badPixels / (width * height)) * 100).toFixed(2)
      fs.writeFileSync(path.join(SHOTS, `${target.name}-diff.png`), PNG.sync.write(diff))

      const probes = compareProbes(target, proto, impl)
      const heightNote = protoPlain.height === implPlain.height ? "" : `proto=${protoPlain.height}px impl=${implPlain.height}px`
      const gateIssues = []
      if (probes.requiredTotal === 0) gateIssues.push("no required probes configured")
      for (const probe of probes.results) {
        if (probe.deltas.length) gateIssues.push(`probe ${probe.key} has ${probe.deltas.length} difference(s)`)
      }
      if ((target.fullPage ?? true) && heightNote) gateIssues.push(`full-page height differs (${heightNote})`)
      if (typeof target.gate?.maxMismatchPct === "number" && mismatchPct > target.gate.maxMismatchPct) {
        gateIssues.push(`mismatch ${mismatchPct}% exceeds configured ${target.gate.maxMismatchPct}%`)
      }
      const consoleErrors = [...proto.consoleErrors.map((item) => `proto ${item}`), ...impl.consoleErrors.map((item) => `impl ${item}`)]
      if (target.gate?.failOnConsoleError && consoleErrors.length) gateIssues.push(`${consoleErrors.length} console error(s)`)

      rows.push({
        name: target.name,
        status: gateIssues.length ? "MECHANICAL_FAIL" : "REVIEW_REQUIRED",
        mismatchPct,
        heightNote,
        requiredMatched: probes.requiredMatched,
        requiredTotal: probes.requiredTotal,
        fieldDeltaCount: probes.fieldDeltaCount,
        gateIssues,
        probes: probes.results,
        consoleErrors,
        finalUrls: { proto: proto.finalUrl, impl: impl.finalUrl },
      })
    } catch (error) {
      hasFatalError = true
      rows.push({
        name: target.name,
        status: "ERROR",
        mismatchPct: null,
        heightNote: "",
        requiredMatched: 0,
        requiredTotal: Object.keys(target.probe || {}).length,
        fieldDeltaCount: 0,
        gateIssues: [error.message],
        probes: [],
        consoleErrors: [],
        finalUrls: {},
        error: error.message,
      })
      console.error(`  ERROR: ${error.message}`)
    }
  }
} finally {
  await browser.close().catch(() => {})
}

try {
  writeReports(rows, args.config, args.gate)
} catch (error) {
  console.error(`Report write error: ${error.message}`)
  process.exit(2)
}
console.log(`\nReport: ${path.join(OUT, "fidelity-report.md")}`)
for (const row of rows) console.log(`  ${row.name}: ${row.status}${row.mismatchPct === null ? "" : ` · ${row.mismatchPct}% · ${row.fieldDeltaCount} field delta(s)`}`)

if (hasFatalError) process.exitCode = 2
else if (args.gate && rows.some((row) => row.gateIssues.length)) process.exitCode = 1
