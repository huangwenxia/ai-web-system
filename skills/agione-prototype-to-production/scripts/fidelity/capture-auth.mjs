// Manual one-time auth capture.
//
//   IMPL_URL=http://localhost:8030/ AUTH_FILE=auth.json node capture-auth.mjs
//
// Log in in the opened browser, navigate to a page that proves the intended role is active,
// then return to the terminal and press ENTER. Re-run when the session expires.

import { chromium } from "playwright"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const START = process.env.IMPL_URL || "http://localhost:8030/"
const AUTH_FILE = process.env.AUTH_FILE || "auth.json"
const READY_SELECTOR = process.env.AUTH_READY_SELECTOR

const browser = await chromium.launch({ headless: false })
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  const response = await page.goto(START, { waitUntil: "domcontentloaded", timeout: 30000 })
  if (response && response.status() >= 400) throw new Error(`login start URL returned HTTP ${response.status()}`)

  console.log("Log in with the required role and navigate to the target app.")
  console.log("Return to this terminal and press ENTER only after the expected page is visible.")
  await new Promise((resolve) => process.stdin.once("data", resolve))
  if (READY_SELECTOR) await page.locator(READY_SELECTOR).first().waitFor({ state: "visible", timeout: 10000 })

  await context.storageState({ path: path.join(ROOT, AUTH_FILE) })
  console.log(`saved ${AUTH_FILE} · final URL: ${page.url()}`)
} catch (error) {
  console.error(`auth capture failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
}
