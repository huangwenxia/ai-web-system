// Prototype-fidelity comparator (vision-agent friendly).
// For each target it screenshots BOTH the static prototype and the running impl, then emits:
//   - <name>-sidebyside.png : proto | impl, UNMASKED (real UI)  → open this and compare by eye
//   - <name>-diff.png       : pixel diff on MASKED shots (dynamic data blacked out) → where it differs
//   - <name>-proto/impl.png : full-res singles for fine detail
//   - style deltas in fidelity-report.md : exact computed-style/geometry targets to set
//
//   node compare.mjs                # all targets
//   node compare.mjs eu-overview    # one target (faster while iterating)
//
// Prereqs (see GOAL-MODE.md): prototypes on :8088, impl dev server on :8030, auth.json captured.

import { chromium } from "playwright"
import pixelmatch from "pixelmatch"
import { PNG } from "pngjs"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, "report")
const SHOTS = path.join(OUT, "shots")
fs.mkdirSync(SHOTS, { recursive: true })

const only = process.argv[2]
let targets = JSON.parse(fs.readFileSync(path.join(ROOT, "targets.json"), "utf8"))
if (only) targets = targets.filter((t) => t.name === only)
if (!targets.length) {
  console.error(`No targets${only ? ` matching "${only}"` : ""} in targets.json`)
  process.exit(1)
}

const authPath = path.join(ROOT, "auth.json")
const storageState = fs.existsSync(authPath) ? authPath : undefined
if (!storageState) console.warn("⚠  no auth.json — impl pages behind login will render the login screen. Run: node capture-auth.mjs")

// copy the top-left w×h region into a fresh same-stride buffer (pixelmatch needs equal dims)
const crop = (png, w, h) => {
  const out = new PNG({ width: w, height: h })
  for (let y = 0; y < h; y++) png.data.copy(out.data, y * w * 4, y * png.width * 4, y * png.width * 4 + w * 4)
  return out
}

// stitch images left-to-right on a dark backdrop
const compose = (imgs, gap = 24) => {
  const h = Math.max(...imgs.map((i) => i.height))
  const w = imgs.reduce((s, i) => s + i.width, 0) + gap * (imgs.length - 1)
  const out = new PNG({ width: w, height: h })
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 17
    out.data[i + 1] = 18
    out.data[i + 2] = 28
    out.data[i + 3] = 255
  }
  let x = 0
  for (const im of imgs) {
    PNG.bitblt(im, out, 0, 0, im.width, im.height, x, 0)
    x += im.width + gap
  }
  return out
}

async function shoot(context, t, side) {
  const conf = t[side]
  const page = await context.newPage()
  await page.setViewportSize(t.viewport || { width: 1440, height: 900 })
  try {
    await page.goto(conf.url, { waitUntil: "domcontentloaded", timeout: 30000 })
  } catch (e) {
    console.warn(`  goto ${side} (${conf.url}) failed: ${e.message}`)
  }
  for (const sel of conf.setup || []) {
    await page.locator(sel).first().click({ timeout: 10000 }).catch(() => console.warn(`  ${side}: setup "${sel}" failed`))
    await page.waitForTimeout(450)
  }
  if (conf.click) {
    await page.locator(conf.click).first().click({ timeout: 15000 }).catch(() => console.warn(`  ${side}: click "${conf.click}" failed`))
  }
  if (conf.waitFor) await page.waitForSelector(conf.waitFor, { timeout: 15000 }).catch(() => console.warn(`  ${side}: waitFor "${conf.waitFor}" not found`))
  if (conf.waitForGone) {
    await page.waitForSelector(conf.waitForGone, { state: "attached", timeout: 2000 }).catch(() => {})
    await page.waitForSelector(conf.waitForGone, { state: "hidden", timeout: 15000 }).catch(() => console.warn(`  ${side}: waitForGone "${conf.waitForGone}" still visible`))
  }
  await page.waitForTimeout(t.settleMs ?? 1000)

  const probe = {}
  for (const [key, sel] of Object.entries(t.probe || {})) {
    probe[key] = await page
      .$eval(sel, (el) => {
        const c = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        return {
          text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 48),
          fontSize: c.fontSize,
          fontWeight: c.fontWeight,
          color: c.color,
          bg: c.backgroundColor,
          padding: c.padding,
          borderRadius: c.borderRadius,
          w: Math.round(r.width),
          h: Math.round(r.height),
        }
      })
      .catch(() => null)
  }

  const opts = { fullPage: t.fullPage ?? true, animations: "disabled" }
  const plain = await page.screenshot(opts)
  const masks = (t.mask || []).concat(conf.mask || []).map((s) => page.locator(s))
  const masked = await page.screenshot({ ...opts, mask: masks, maskColor: "#FF00FF" })
  fs.writeFileSync(path.join(SHOTS, `${t.name}-${side}.png`), plain)
  await page.close()
  return { plain, masked, probe }
}

const browser = await chromium.launch()
const protoCtx = await browser.newContext({ deviceScaleFactor: 1 })
const implCtx = await browser.newContext({ deviceScaleFactor: 1, storageState })

const rows = []
for (const t of targets) {
  console.log(`▶ ${t.name}`)
  const [proto, impl] = await Promise.all([shoot(protoCtx, t, "proto"), shoot(implCtx, t, "impl")])

  // visual composite from the real (unmasked) UI — this is what the AI agent eyeballs
  const pp = PNG.sync.read(proto.plain)
  const pi = PNG.sync.read(impl.plain)
  fs.writeFileSync(path.join(SHOTS, `${t.name}-sidebyside.png`), PNG.sync.write(compose([pp, pi])))
  const heightNote = pp.height !== pi.height ? `proto=${pp.height}px impl=${pi.height}px` : ""

  // pixel diff on masked shots — dynamic data neutralized, so % measures layout/style
  const m1 = PNG.sync.read(proto.masked)
  const m2 = PNG.sync.read(impl.masked)
  const w = Math.min(m1.width, m2.width)
  const h = Math.min(m1.height, m2.height)
  const diff = new PNG({ width: w, height: h })
  const bad = pixelmatch(crop(m1, w, h).data, crop(m2, w, h).data, diff.data, w, h, { threshold: 0.12, includeAA: false })
  const pct = +((bad / (w * h)) * 100).toFixed(2)
  fs.writeFileSync(path.join(SHOTS, `${t.name}-diff.png`), PNG.sync.write(diff))

  const deltas = []
  for (const key of Object.keys(t.probe || {})) {
    const a = proto.probe[key]
    const b = impl.probe[key]
    if (!a || !b) {
      deltas.push(`- \`${key}\`: element NOT FOUND on ${!a ? "PROTO" : "IMPL"} (selector \`${t.probe[key]}\`)`)
      continue
    }
    const fields = ["fontSize", "fontWeight", "color", "bg", "padding", "borderRadius", "w", "h"]
    const d = fields.filter((f) => String(a[f]) !== String(b[f])).map((f) => `${f}: proto=\`${a[f]}\` impl=\`${b[f]}\``)
    if (d.length) deltas.push(`- \`${key}\`: ${d.join("; ")}`)
  }
  rows.push({ name: t.name, pct, heightNote, deltas })
}
await browser.close()

let md = "# Prototype Fidelity Report\n\n"
md += "_Generated by `tools/fidelity/compare.mjs`._\n\n"
md += "**How to use this (vision agent):** open `report/shots/<page>-sidebyside.png` (proto ｜ impl) and compare by eye; "
md += "use the **style deltas** below for exact target values; `-diff.png` highlights where masked shots differ "
md += "(🟣 magenta = masked dynamic data → ignore). Open `-proto.png` / `-impl.png` for full-res detail.\n\n"
md += "| Page | Mismatch % | Height | # Style deltas |\n|---|---|---|---|\n"
for (const r of rows) md += `| ${r.name} | **${r.pct}%** | ${r.heightNote || "match"} | ${r.deltas.length} |\n`
md += "\n---\n"
for (const r of rows) {
  md += `\n## ${r.name} — ${r.pct}% mismatch\n`
  md += `- 👁 visual: \`report/shots/${r.name}-sidebyside.png\`  ·  diff: \`report/shots/${r.name}-diff.png\`  ·  full-res: \`${r.name}-proto.png\` / \`${r.name}-impl.png\`\n`
  if (r.heightNote) md += `- ⚠ full-page height differs (${r.heightNote}) — a section is missing, extra, or mis-sized.\n`
  md += `\n### Style deltas (exact targets — set impl to the proto value)\n${r.deltas.length ? r.deltas.join("\n") : "- none — mapped elements match the prototype ✅"}\n`
}
fs.writeFileSync(path.join(OUT, "fidelity-report.md"), md)
console.log("\n✅ report → tools/fidelity/report/fidelity-report.md")
for (const r of rows) console.log(`   ${r.name}: ${r.pct}%  (${r.deltas.length} style deltas)  → shots/${r.name}-sidebyside.png`)
