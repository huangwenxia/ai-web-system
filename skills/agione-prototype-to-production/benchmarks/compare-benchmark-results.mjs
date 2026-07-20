import fs from "node:fs"

const [baselineFile, currentFile] = process.argv.slice(2)
const ALLOWED_STATUSES = new Set(["PASS", "FAIL", "NOT_RUN"])
if (!baselineFile || !currentFile) {
  console.error("Usage: node compare-benchmark-results.mjs <baseline.json> <current.json>")
  process.exit(2)
}

function load(file) {
  const value = JSON.parse(fs.readFileSync(file, "utf8"))
  if (value.schemaVersion !== 1 || !Array.isArray(value.cases)) throw new Error(`${file}: invalid benchmark result schema`)
  const cases = new Map()
  for (const item of value.cases) {
    if (typeof item.id !== "string" || !item.id.trim() || cases.has(item.id)) throw new Error(`${file}: invalid or duplicate case id ${JSON.stringify(item.id)}`)
    if (!ALLOWED_STATUSES.has(item.status)) throw new Error(`${file}: ${item.id} has invalid status ${JSON.stringify(item.status)}`)
    if (!Array.isArray(item.findings) || !Array.isArray(item.evidence)) throw new Error(`${file}: ${item.id} findings/evidence must be arrays`)
    const findingIds = new Set()
    for (const finding of item.findings) {
      if (typeof finding?.id !== "string" || !finding.id.trim() || findingIds.has(finding.id)) throw new Error(`${file}: ${item.id} has an invalid or duplicate finding id`)
      findingIds.add(finding.id)
    }
    if (item.evidence.some((evidence) => typeof evidence !== "string" || !evidence.trim())) throw new Error(`${file}: ${item.id} has invalid evidence`)
    if (item.status === "PASS" && !item.evidence.length) throw new Error(`${file}: ${item.id} PASS has no evidence`)
    if (item.status === "FAIL" && !item.findings.length) throw new Error(`${file}: ${item.id} FAIL has no findings`)
    cases.set(item.id, item)
  }
  return cases
}

let baseline
let current
try {
  baseline = load(baselineFile)
  current = load(currentFile)
} catch (error) {
  console.error(`benchmark result error: ${error.message}`)
  process.exit(2)
}
const regressions = []
const improvements = []

for (const [id, before] of baseline) {
  const after = current.get(id)
  if (!after) {
    regressions.push(`${id}: missing current result`)
    continue
  }
  if (before.status === "PASS" && after.status !== "PASS") regressions.push(`${id}: status ${before.status} -> ${after.status}`)
  if (before.status === "FAIL" && after.status === "NOT_RUN") regressions.push(`${id}: status ${before.status} -> ${after.status}`)
  const beforeFindings = new Set((before.findings || []).map((finding) => finding.id))
  const afterFindings = new Set((after.findings || []).map((finding) => finding.id))
  for (const finding of afterFindings) if (!beforeFindings.has(finding)) regressions.push(`${id}: new finding ${finding}`)
  for (const finding of beforeFindings) if (!afterFindings.has(finding)) improvements.push(`${id}: resolved ${finding}`)
}

for (const id of current.keys()) if (!baseline.has(id)) regressions.push(`${id}: no baseline result`)
for (const item of improvements) console.log(`IMPROVEMENT ${item}`)
for (const item of regressions) console.error(`REGRESSION ${item}`)
if (regressions.length) process.exit(1)
console.log("benchmark baseline diff passed")
