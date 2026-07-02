#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';

const target = process.argv[2];

if (!target) {
  console.error('Usage: node validate_prototype.mjs <target.html>');
  process.exit(2);
}

let html;
try {
  html = fs.readFileSync(target, 'utf8');
} catch (error) {
  console.error(`[fail] Cannot read file: ${target}`);
  console.error(error.message);
  process.exit(2);
}

const results = [];
const add = (level, message) => results.push({ level, message });

const has = (pattern) => pattern.test(html);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function extractNotes() {
  return html.match(/<!--AI-NOTES([\s\S]*?)AI-NOTES-->/i)?.[1] ?? '';
}

function noteFieldExists(notes, key) {
  const lines = notes.split(/\r?\n/);
  const keyPattern = new RegExp(`^(\\s*)${escapeRegExp(key)}\\s*:\\s*(.*)$`, 'i');

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(keyPattern);
    if (!match) continue;

    if (match[2].trim()) return true;

    const baseIndent = match[1].length;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      const trimmed = line.trim();
      if (!trimmed) continue;

      const indent = line.match(/^\s*/)?.[0].length ?? 0;
      if (indent <= baseIndent && /^[A-Za-z0-9_-]+\s*:/.test(trimmed)) return false;
      if (indent > baseIndent || trimmed.startsWith('-')) return true;
    }

    return false;
  }

  return false;
}

function extractVisibleMainText() {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
  return main
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function addIaGateChecks(notes) {
  if (/^\s*ia-gate\s*:\s*pass\s*$/im.test(notes)) {
    add('pass', 'IA-GATE is marked pass.');
  } else {
    add('fail', 'AI-NOTES must include `ia-gate: pass` before prototype delivery.');
  }

  const requiredFields = [
    'ia-gate',
    'evidence-status',
    'evidence-used',
    'assumptions',
    'blocking-questions',
    'ia-readiness',
    'target-user',
    'page-subject',
    'page-task',
    'business-flow',
    'current-state',
    'next-action',
    'action-result',
    'page-type',
    'first-visit-path',
    'content-pruning',
    'content-to-keep',
    'content-to-delete-or-collapse',
    'visible-assumptions',
    'strong-expression-decision',
    'selected-design-system',
    'design-profile',
    'product-identity',
    'api-responsibilities',
    'data-assumptions',
  ];

  for (const key of requiredFields) {
    if (noteFieldExists(notes, key)) {
      add('pass', `AI-NOTES includes ${key}.`);
    } else {
      add('fail', `AI-NOTES must include IA-GATE field: ${key}.`);
    }
  }
}

function addVisibleTextLeakChecks() {
  const visibleText = extractVisibleMainText();
  const forbiddenVisiblePatterns = [
    { pattern: /\bAI-NOTES\b/i, label: 'AI-NOTES' },
    { pattern: /\bdata-source\b/i, label: 'data-source' },
    { pattern: /\bmock\b/i, label: 'mock' },
    { pattern: /\bApi\.[A-Za-z0-9_.]+/i, label: 'source API client name' },
    { pattern: /\b(result\.[A-Za-z_$][\w$]*|currentStep|has[A-Z][A-Za-z0-9_]*)\b/, label: 'code/state expression' },
    { pattern: /\b(router\.|route\.|src\/views|@\/|@[A-Za-z0-9_-]+\/)/, label: 'frontend route/source path' },
    { pattern: /(数据来源|状态判断来源|根据规则推导|原型说明|设计备注|mock\s*说明)/i, label: 'internal evidence label' },
  ];

  for (const item of forbiddenVisiblePatterns) {
    if (item.pattern.test(visibleText)) {
      add('fail', `Visible UI text contains internal/prototype evidence: ${item.label}.`);
    }
  }
}

if (has(/data-prototype=["']backoffice["']/i)) {
  add('pass', 'Backoffice prototype marker is present.');
} else {
  add('fail', 'Missing data-prototype="backoffice" marker.');
}

if (has(/data-design-system=["'][^"']+["']/i)) {
  add('pass', 'Design-system marker is present.');
} else {
  add('fail', 'Missing data-design-system marker.');
}

if (has(/data-design-profile=["'][^"']+["']/i)) {
  add('pass', 'Design-profile marker is present.');
} else {
  add('fail', 'Missing data-design-profile marker.');
}

if (has(/data-product-identity=["'][^"']+["']/i)) {
  add('pass', 'Product-identity marker is present.');
} else {
  add('fail', 'Missing data-product-identity marker.');
}

if (has(/data-page-type=["'][^"']+["']/i)) {
  add('pass', 'Page type marker is present.');
} else {
  add('fail', 'Missing data-page-type marker on the main page surface.');
}

if (has(/<!--AI-NOTES[\s\S]*AI-NOTES-->/i)) {
  add('pass', 'AI-NOTES block is present.');
  addIaGateChecks(extractNotes());
} else {
  add('fail', 'Missing AI-NOTES block.');
}

addVisibleTextLeakChecks();

const forbiddenProductMarkers = [
  /agione-console/i,
  /AGIONE_EDIT/i,
  /AGIONE_LOGO_DANGER/i,
  /LOGO_DARK/,
  /LOGO_LIGHT/,
];
for (const pattern of forbiddenProductMarkers) {
  if (has(pattern)) {
    add('fail', `Found product-specific marker: ${pattern}`);
  }
}

if (has(/lorem ipsum/i)) {
  add('warn', 'Found lorem ipsum placeholder text.');
}

const metricTags = [...html.matchAll(/<[^>]+class=["'][^"']*(?:metric-value|kpi-value|stat-value)[^"']*["'][^>]*>/gi)];
if (metricTags.length === 0) {
  add('warn', 'No metric/kpi/stat value elements found. This is fine for non-metric pages.');
} else {
  const missing = metricTags.filter((match) => !/\sdata-source=["'][^"']+["']/i.test(match[0]));
  if (missing.length === 0) {
    add('pass', 'All metric/kpi/stat values include data-source.');
  } else {
    add('fail', `${missing.length} metric/kpi/stat value element(s) are missing data-source.`);
  }
}

const dataSourceCount = (html.match(/\sdata-source=["'][^"']+["']/gi) || []).length;
if (dataSourceCount >= 3) {
  add('pass', `Found ${dataSourceCount} data-source markers.`);
} else {
  add('warn', `Only found ${dataSourceCount} data-source marker(s). Add sources to fields, modules, and derived displays.`);
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
for (const [index, match] of inlineScripts.entries()) {
  const code = match[1].trim();
  if (!code) continue;
  try {
    new vm.Script(code, { filename: `${target}#inline-script-${index + 1}` });
    add('pass', `Inline script ${index + 1} parses.`);
  } catch (error) {
    add('fail', `Inline script ${index + 1} has syntax error: ${error.message}`);
  }
}

if (has(/#[0-9a-fA-F]{3,8}\b/) && !has(/:root\s*{[\s\S]*--ui-/i)) {
  add('warn', 'Hex colors found without obvious token root. Prefer tokenized colors.');
}

const order = { fail: 0, warn: 1, pass: 2 };
results.sort((a, b) => order[a.level] - order[b.level]);

for (const result of results) {
  console.log(`[${result.level}] ${result.message}`);
}

const failCount = results.filter((result) => result.level === 'fail').length;
const warnCount = results.filter((result) => result.level === 'warn').length;

if (failCount > 0) {
  console.error(`\nPrototype validation failed with ${failCount} failure(s) and ${warnCount} warning(s).`);
  process.exit(1);
}

console.log(`\nPrototype validation passed with ${warnCount} warning(s).`);
