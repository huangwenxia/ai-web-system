import {
  assertConfirmedCleanup,
  describePrunePlan,
  directRun,
  formatIgnoreUpdate,
  formatRemovalSummary,
  maybeEnsureIgnoreRules,
  parseCliArgs,
  printPrunePreflight,
  pruneManagedCaptures,
  resolvePruneKeep,
  resolveVerifiedManagedProjectRoots,
} from "./shared.ts"

export async function pruneManaged(options = {}) {
  const roots = await resolveVerifiedManagedProjectRoots(options)
  const keep = resolvePruneKeep(options)
  assertConfirmedCleanup("prune", options)

  printPrunePreflight("prune", roots, keep)
  const ignoreUpdate = await maybeEnsureIgnoreRules(roots, options)
  if (ignoreUpdate) {
    for (const line of formatIgnoreUpdate(ignoreUpdate)) {
      console.log(line)
    }
  }

  const plan = await describePrunePlan(roots, keep)
  for (const line of plan.lines) {
    console.log(line)
  }

  const result = await pruneManagedCaptures(roots, keep)
  console.log(`Found capture directories: ${result.found}`)
  console.log(`Removed capture directories: ${result.removedCount}`)
  for (const line of formatRemovalSummary("Removed directories", result.removedDirectories)) {
    console.log(line)
  }

  return {
    roots,
    keep,
    ...result,
    ignoreUpdate,
  }
}

if (directRun(import.meta.url)) {
  const options = parseCliArgs()
  await pruneManaged(options)
}
