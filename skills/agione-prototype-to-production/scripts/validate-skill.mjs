import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const WITH_BROWSER = process.argv.includes("--with-browser")

const required = [
  "SKILL.md",
  "agents/openai.yaml",
  "references/project-mamba-adaptation.md",
  "references/vue-porting-patterns.md",
  "references/target-config.md",
  "references/comparison-method.md",
  "references/troubleshooting.md",
  "references/landmark-page-issues.md",
  "scripts/compare-elements.js",
  "scripts/fidelity/compare.mjs",
  "scripts/fidelity/GOAL-MODE.md",
  "scripts/fidelity/targets.example.json",
  "scripts/fidelity/pnpm-lock.yaml",
  "benchmarks/manifest.json",
  "benchmarks/benchmark-protocol.md",
]

for (const relative of required) {
  if (!fs.existsSync(path.join(ROOT, relative))) throw new Error(`missing required skill resource: ${relative}`)
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.name === "node_modules" || entry.name === "report") return []
    return entry.isDirectory() ? walk(full) : [full]
  })
}

const files = walk(ROOT)
for (const file of files.filter((item) => /\.(mjs|js)$/.test(item))) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" })
  if (result.status !== 0) throw new Error(`${path.relative(ROOT, file)} failed node --check\n${result.stderr}`)
}

for (const file of files.filter((item) => /\.json$/.test(item))) JSON.parse(fs.readFileSync(file, "utf8"))

const benchmark = spawnSync(process.execPath, [path.join(ROOT, "benchmarks/validate-benchmarks.mjs")], { encoding: "utf8" })
if (benchmark.status !== 0) throw new Error(benchmark.stderr || benchmark.stdout)
process.stdout.write(benchmark.stdout)
const benchmarkResults = spawnSync(process.execPath, [path.join(ROOT, "benchmarks/test-results.mjs")], { encoding: "utf8" })
if (benchmarkResults.status !== 0) throw new Error(benchmarkResults.stderr || benchmarkResults.stdout)
process.stdout.write(benchmarkResults.stdout)

if (WITH_BROWSER) {
  const fidelity = path.join(ROOT, "scripts/fidelity")
  const result = spawnSync("pnpm", ["test"], { cwd: fidelity, encoding: "utf8" })
  if (result.status !== 0) throw new Error(`fidelity fixture tests failed\n${result.stdout}\n${result.stderr}`)
  process.stdout.write(result.stdout)
}

console.log(`${files.length} skill files validated${WITH_BROWSER ? " with browser fixtures" : ""}`)
