import { directRun, ensurePlaywright, parseCliArgs, printEnsurePreflight, resolvePlaywrightRuntime } from "./shared.ts"

export async function runEnsure(options = {}) {
  const runtime = resolvePlaywrightRuntime("ensure", options)
  printEnsurePreflight("ensure", runtime)
  const result = await ensurePlaywright(runtime)
  console.log(`Workspace ready: ${result.workspaceDir}`)
  console.log(`Browser cache: ${result.browserCacheDir}`)
  console.log(`CLI: ${result.playwrightCliPath}`)
  return result
}

if (directRun(import.meta.url)) {
  const options = parseCliArgs()
  await runEnsure(options)
}
