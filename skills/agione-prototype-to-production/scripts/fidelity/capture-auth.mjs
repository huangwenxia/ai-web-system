// One-time auth capture. Opens a real browser; you log in manually; it saves the
// logged-in storage state (localStorage TOKEN + cookies) to auth.json, which
// compare.mjs reuses so the impl pages render instead of redirecting to login.
//
//   node capture-auth.mjs
//
// Re-run whenever the token expires.

import { chromium } from "playwright"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const START = process.env.IMPL_URL || "http://localhost:8030/"

const browser = await chromium.launch({ headless: false })
const ctx = await browser.newContext()
const page = await ctx.newPage()
await page.goto(START).catch(() => {})

console.log("\n👉 Log in in the opened browser and navigate until you can SEE the account page.")
console.log("   Then come back to THIS terminal and press ENTER to save auth.json ...\n")
await new Promise((resolve) => process.stdin.once("data", resolve))

await ctx.storageState({ path: path.join(ROOT, "auth.json") })
console.log("✅ saved tools/fidelity/auth.json")
await browser.close()
process.exit(0)
