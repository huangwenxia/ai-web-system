// Non-interactive auth capture via dev fast-login (VITE_LOGIN_DEMO=1 role cards).
// Saves the logged-in storage state to auth.json for compare.mjs.
//
//   node capture-fast.mjs 创作者     # provider_onepro
//   node capture-fast.mjs 运营       # operator
//   node capture-fast.mjs 普通用户   # enduser_onepro
//   node capture-fast.mjs 管理员     # admin
//
// Requires the dev login page to expose fast-login role cards (apps/<app>/.env.development
// VITE_FAST_LOGIN_USERS + VITE_LOGIN_DEMO=1).

import { chromium } from "playwright"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const ROLE = process.argv[2] || "创作者"
const BASE = process.env.IMPL_URL || "http://localhost:8030"

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
await page.goto(`${BASE}/user/login`, { waitUntil: "domcontentloaded", timeout: 30000 })
await page.waitForTimeout(1500)

const clicked = await page.evaluate((role) => {
  const el = [...document.querySelectorAll('button, [class*="role"], [class*="card"], .el-button, div, li, a')]
    .filter((e) => e.offsetParent !== null)
    .find((e) => (e.textContent || "").includes(role) && (e.textContent || "").trim().length < 40)
  if (el) {
    el.click()
    return true
  }
  return false
}, ROLE)

if (!clicked) {
  console.error(`✗ role "${ROLE}" not found on /user/login (is VITE_LOGIN_DEMO=1?)`)
  await browser.close()
  process.exit(1)
}

await page.waitForFunction(() => !!localStorage.getItem("TOKEN"), { timeout: 20000 }).catch(() => {})
await page.waitForTimeout(2500)
await ctx.storageState({ path: path.join(ROOT, "auth.json") })
const user = await page.evaluate(() => {
  try {
    return JSON.parse(localStorage.getItem("USERINFO")).value.username
  } catch {
    return "?"
  }
})
console.log(`✅ saved auth.json (logged in as ${user})`)
await browser.close()
process.exit(0)
