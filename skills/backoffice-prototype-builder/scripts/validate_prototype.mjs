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
  const notes = html.match(/<!--AI-NOTES([\s\S]*?)AI-NOTES-->/i)?.[1] ?? '';
  for (const key of [
    'evidence-status',
    'evidence-used',
    'assumptions',
    'blocking-questions',
    'ia-readiness',
    'strong-expression-decision',
    'selected-design-system',
    'design-profile',
    'product-identity',
    'page-subject',
    'api-responsibilities',
    'data-assumptions',
  ]) {
    if (notes.includes(key)) {
      add('pass', `AI-NOTES includes ${key}.`);
    } else {
      add('fail', `AI-NOTES must include ${key}.`);
    }
  }
} else {
  add('fail', 'Missing AI-NOTES block.');
}

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
