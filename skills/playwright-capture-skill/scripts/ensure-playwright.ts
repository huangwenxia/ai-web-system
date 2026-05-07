import { directRun, ensurePlaywright, parseCliArgs } from "./shared.ts"

export async function runEnsure(options = {}) {
  const baseDir = options.workspaceDir ? String(options.workspaceDir) : undefined
  const result = await ensurePlaywright(baseDir)
  console.log(`Workspace ready: ${result.workspaceDir}`)
  console.log(`Browser cache: ${result.browserCacheDir}`)
  console.log(`CLI: ${result.playwrightCliPath}`)
  return result
}

if (directRun(import.meta.url)) {
  const options = parseCliArgs()
  await runEnsure(options)
}
