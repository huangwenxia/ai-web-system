import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const REPORT = path.join(ROOT, "report/fidelity-report.json")

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function run(config, expectedStatus, inspect, env = process.env) {
  const result = spawnSync(process.execPath, ["compare.mjs", "--config", config, "--gate"], {
    cwd: ROOT,
    encoding: "utf8",
    env,
  })
  const status = result.status ?? 2
  if (status !== expectedStatus) {
    console.error(result.stdout)
    console.error(result.stderr)
    throw new Error(`${config}: expected exit ${expectedStatus}, got ${status}`)
  }
  inspect?.(result)
  console.log(`${config}: exit ${status} as expected`)
}

function row() {
  const report = JSON.parse(fs.readFileSync(REPORT, "utf8"))
  assert(report.disclaimer.includes("Mechanical probe/image evidence only"), "report disclaimer is missing")
  assert(report.rows.length === 1, `expected one report row, got ${report.rows.length}`)
  return report.rows[0]
}

run("targets.fixture.pass.json", 0, () => {
  const result = row()
  assert(result.status === "REVIEW_REQUIRED", `pass fixture status is ${result.status}`)
  assert(result.mismatchPct === 0, `pass fixture mismatch is ${result.mismatchPct}`)
  assert(result.requiredMatched === result.requiredTotal && result.requiredTotal === 5, "pass fixture probe coverage is incomplete")
  assert(result.fieldDeltaCount === 0 && result.gateIssues.length === 0, "pass fixture contains mechanical differences")
})

run("targets.fixture.fail.json", 1, () => {
  const result = row()
  assert(result.status === "MECHANICAL_FAIL", `negative fixture status is ${result.status}`)
  assert(result.mismatchPct > 0 && result.fieldDeltaCount > 0, "negative fixture did not detect pixel and style differences")
  assert(result.probes.find((probe) => probe.key === "cards")?.deltas.some((delta) => delta.startsWith("element count:")), "negative fixture did not detect repeated-element count drift")
  assert(result.probes.find((probe) => probe.key === "icons")?.deltas.some((delta) => delta.includes("svgSignature")), "negative fixture did not detect SVG geometry/style drift")
})

run("targets.fixture.error.json", 2, () => {
  const result = row()
  assert(result.status === "ERROR" && result.error.includes("missing-required-marker"), "selector preparation error was not preserved in the report")
})

run("targets.fixture.config-error.json", 2, (result) => {
  assert(result.stderr.includes("missing a stable impl.waitFor selector"), "invalid waitFor configuration was not rejected before capture")
})

run(
  "targets.fixture.pass.json",
  2,
  (result) => assert(result.stderr.includes("Browser preparation error"), "browser launch failure did not use preparation exit semantics"),
  { ...process.env, PLAYWRIGHT_BROWSERS_PATH: path.join(ROOT, "fixtures/__missing_playwright_browsers__") },
)
console.log("fidelity fixture tests passed")
