import { directRun, parseCliArgs } from "./shared.ts"
import { runEnsure } from "./ensure-playwright.ts"
import { capturePage } from "./capture-page.ts"
import { downloadAssets } from "./download-assets.ts"
import { compareLocal } from "./compare-local.ts"
import { cleanManaged } from "./clean-managed.ts"
import { pruneManaged } from "./prune-managed.ts"

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
    case "clean":
      return cleanManaged(options)
    case "prune":
      return pruneManaged(options)
    default:
      console.log("Usage:")
      console.log("  node scripts/run-skill.ts ensure --projectDir <dir>")
      console.log("  node scripts/run-skill.ts ensure --workspaceDir <dir> [--browserCacheDir <dir>]")
      console.log("  node scripts/run-skill.ts capture --url <url> --projectDir <dir> [--waitMs 3000]")
      console.log("  node scripts/run-skill.ts capture --url <url> --outputDir <dir> --workspaceDir <dir> [--browserCacheDir <dir>] [--waitMs 3000]")
      console.log("  node scripts/run-skill.ts download-assets --url <url> --html <page.html> [--outputDir <dir> | --projectDir <dir>]")
      console.log("  node scripts/run-skill.ts compare-local --url <local-url> --projectDir <dir> [--waitMs 3000]")
      console.log("  node scripts/run-skill.ts compare-local --url <local-url> --outputDir <dir> --workspaceDir <dir> [--browserCacheDir <dir>] [--waitMs 3000]")
      console.log("  node scripts/run-skill.ts clean --projectDir <dir> --confirm true [--scope all|captures|runtime] [--updateGitignore true]")
      console.log("  node scripts/run-skill.ts prune --projectDir <dir> --confirm true [--keep 3] [--updateGitignore true]")
      return null
  }
}

if (directRun(import.meta.url)) {
  const options = parseCliArgs()
  await runSkill(options)
}
