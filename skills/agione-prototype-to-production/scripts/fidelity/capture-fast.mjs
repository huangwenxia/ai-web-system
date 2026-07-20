// Non-interactive auth capture through a development fast-login card/button.
//
//   node capture-fast.mjs "<visible account or role text>" [login-path]
//
// Environment:
//   IMPL_URL=http://localhost:8030
//   FAST_LOGIN_SELECTOR='button, [class*="role"], [class*="card"]'
//   AUTH_READY_STORAGE_KEY=TOKEN   # set empty to skip storage readiness
//   AUTH_READY_SELECTOR=.page-marker
//   AUTH_FILE=auth.json

import { chromium } from "playwright"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const MATCH = process.argv[2]
const LOGIN_PATH = process.argv[3] || "/user/login"
const BASE = process.env.IMPL_URL || "http://localhost:8030"
const SELECTOR = process.env.FAST_LOGIN_SELECTOR || 'button, [class*="role"], [class*="card"], .el-button, li, a'
const READY_KEY = process.env.AUTH_READY_STORAGE_KEY === "" ? "" : process.env.AUTH_READY_STORAGE_KEY || "TOKEN"
const READY_SELECTOR = process.env.AUTH_READY_SELECTOR
const AUTH_FILE = process.env.AUTH_FILE || "auth.json"

if (!MATCH) {
  console.error('Usage: node capture-fast.mjs "<visible account or role text>" [login-path]')
  process.exit(2)
}

const browser = await chromium.launch()
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  const response = await page.goto(`${BASE}${LOGIN_PATH}`, { waitUntil: "domcontentloaded", timeout: 30000 })
  if (response && response.status() >= 400) throw new Error(`login page returned HTTP ${response.status()}`)

  const clicked = await page.evaluate(
    ({ selector, match }) => {
      const candidates = [...document.querySelectorAll(selector)]
        .filter((element) => element.getClientRects().length && (element.textContent || "").includes(match))
        .sort((a, b) => (a.textContent || "").trim().length - (b.textContent || "").trim().length)
      const element = candidates[0]
      if (!element) return false
      element.click()
      return true
    },
    { selector: SELECTOR, match: MATCH },
  )
  if (!clicked) throw new Error(`fast-login entry containing "${MATCH}" was not found with selector "${SELECTOR}"`)

  if (READY_KEY) await page.waitForFunction((key) => !!localStorage.getItem(key), READY_KEY, { timeout: 20000 })
  if (READY_SELECTOR) await page.locator(READY_SELECTOR).first().waitFor({ state: "visible", timeout: 20000 })
  await page.waitForTimeout(800)
  await context.storageState({ path: path.join(ROOT, AUTH_FILE) })
  console.log(`saved ${AUTH_FILE} after matching "${MATCH}" · final URL: ${page.url()}`)
} catch (error) {
  console.error(`auth capture failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
}
