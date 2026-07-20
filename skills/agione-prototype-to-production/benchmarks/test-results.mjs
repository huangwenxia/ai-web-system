import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const script = path.join(ROOT, "compare-benchmark-results.mjs")
const baseline = path.join(ROOT, "fixtures/baseline.json")
const regression = path.join(ROOT, "fixtures/regression.json")
const invalid = path.join(ROOT, "fixtures/invalid.json")

function expect(current, expected) {
  const result = spawnSync(process.execPath, [script, baseline, current], { encoding: "utf8" })
  if (result.status !== expected) throw new Error(`expected ${expected}, got ${result.status}\n${result.stdout}\n${result.stderr}`)
}

expect(baseline, 0)
expect(regression, 1)
expect(invalid, 2)
console.log("benchmark result diff tests passed")
