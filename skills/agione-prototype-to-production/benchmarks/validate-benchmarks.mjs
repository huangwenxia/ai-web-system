import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"))

if (manifest.workflow !== "semi-automatic") throw new Error("benchmark workflow must explicitly remain semi-automatic")
if (!Array.isArray(manifest.cases) || !manifest.cases.length) throw new Error("benchmark manifest has no cases")

const ids = new Set()
const coverage = new Set()
for (const item of manifest.cases) {
  if (!item.id || ids.has(item.id)) throw new Error(`invalid or duplicate benchmark id: ${item.id}`)
  ids.add(item.id)
  const prompt = path.resolve(ROOT, item.prompt)
  if (!fs.existsSync(prompt)) throw new Error(`missing prompt for ${item.id}: ${item.prompt}`)
  if (!item.assertions?.length) throw new Error(`${item.id} has no assertions`)
  for (const name of item.coverage || []) coverage.add(name)
}

const missingCoverage = (manifest.requiredCoverage || []).filter((name) => !coverage.has(name))
if (missingCoverage.length) throw new Error(`missing benchmark coverage: ${missingCoverage.join(", ")}`)
console.log(`${manifest.cases.length} benchmark cases cover ${coverage.size} required dimensions`)
