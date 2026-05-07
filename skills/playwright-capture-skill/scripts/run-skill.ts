import { directRun, parseCliArgs } from "./shared.ts"
import { runEnsure } from "./ensure-playwright.ts"
import { capturePage } from "./capture-page.ts"
import { downloadAssets } from "./download-assets.ts"
import { compareLocal } from "./compare-local.ts"

export async function runSkill(options = parseCliArgs()) {
  const [command] = options._

  switch (command) {
    case "ensure":
      return runEnsure(options)
    case "capture":
      return capturePage(options)
    case "download-assets":
      return downloadAssets(options)
    case "compare-local":
      return compareLocal(options)
    default:
      console.log("Usage:")
      console.log("  node scripts/run-skill.ts ensure")
      console.log("  node scripts/run-skill.ts capture --url <url> [--outputDir <dir>] [--waitMs 3000]")
      console.log("  node scripts/run-skill.ts download-assets --url <url> [--html <page.html>] [--outputDir <dir>]")
      console.log("  node scripts/run-skill.ts compare-local --url <local-url> [--outputDir <dir>] [--waitMs 3000]")
      return null
  }
}

if (directRun(import.meta.url)) {
  const options = parseCliArgs()
  await runSkill(options)
}
