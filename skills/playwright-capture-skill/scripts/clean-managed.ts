import {
  assertConfirmedCleanup,
  cleanManagedProjectRoots,
  describeCleanPlan,
  directRun,
  formatIgnoreUpdate,
  maybeEnsureIgnoreRules,
  parseCliArgs,
  printCleanPreflight,
  resolveCleanScope,
  resolveVerifiedManagedProjectRoots,
} from "./shared.ts"

export async function cleanManaged(options = {}) {
  const roots = await resolveVerifiedManagedProjectRoots(options)
  const scope = resolveCleanScope(options)
  assertConfirmedCleanup("clean", options)

  printCleanPreflight("clean", roots, scope)
  const ignoreUpdate = await maybeEnsureIgnoreRules(roots, options)
  if (ignoreUpdate) {
    for (const line of formatIgnoreUpdate(ignoreUpdate)) {
      console.log(line)
    }
  }

  const plan = await describeCleanPlan(roots, scope)
  for (const line of plan.lines) {
    console.log(line)
  }

  const removed = await cleanManagedProjectRoots(roots, scope)
  console.log(`Removed capture entries: ${removed.captureEntries}`)
  console.log(`Removed runtime root: ${removed.runtimeRemoved}`)

  return {
    roots,
    scope,
    removed,
    ignoreUpdate,
  }
}

if (directRun(import.meta.url)) {
  const options = parseCliArgs()
  await cleanManaged(options)
}
