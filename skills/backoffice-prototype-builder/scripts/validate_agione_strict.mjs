#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';

const target = process.argv[2];

if (!target) {
  console.error('Usage: node validate_agione_strict.mjs <target.html>');
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

const requiredAnchors = [
  'AGIONE_EDIT_TITLE_START',
  'AGIONE_EDIT_TITLE_END',
  'AGIONE_EDIT_I18N_START',
  'AGIONE_EDIT_I18N_END',
  'AGIONE_EDIT_SIDEBAR_START',
  'AGIONE_EDIT_SIDEBAR_END',
  'AGIONE_EDIT_MAIN_START',
  'AGIONE_EDIT_MAIN_END',
  'AGIONE_EDIT_SETUP_DATA_START',
  'AGIONE_EDIT_SETUP_DATA_END',
  'AGIONE_EDIT_SETUP_RETURN_START',
  'AGIONE_EDIT_SETUP_RETURN_END',
];

for (const anchor of requiredAnchors) {
  if (html.includes(anchor)) add('pass', `Anchor present: ${anchor}`);
  else add('fail', `Missing strict AGIOne anchor: ${anchor}`);
}

if (html.includes('AGIONE_LOGO_DANGER_START') && html.includes('AGIONE_LOGO_DANGER_END')) {
  add('pass', 'Logo danger region markers are present.');
} else {
  add('fail', 'Missing AGIONE_LOGO_DANGER markers.');
}

for (const name of ['LOGO_DARK', 'LOGO_LIGHT']) {
  const match = html.match(new RegExp(`const\\s+${name}\\s*=\\s*['"]([^'"]+)['"]`));
  if (!match) {
    add('fail', `Missing ${name} constant.`);
  } else if (match[1].length < 20000) {
    add('fail', `${name} appears truncated: ${match[1].length} chars.`);
  } else {
    add('pass', `${name} length ok: ${match[1].length} chars.`);
  }
}

if (has(/PrototypeComponents\s*=/)) add('pass', 'PrototypeComponents runtime is present.');
else add('fail', 'Missing PrototypeComponents runtime.');

if (has(/const\s+darkVars\s*=/) && has(/const\s+lightVars\s*=/)) {
  add('pass', 'Theme token objects are present.');
} else {
  add('fail', 'Missing darkVars/lightVars theme token objects.');
}

const chipCount = (html.match(/demo-mode-chip/g) || []).length;
const bannerCount = (html.match(/demo-banner/g) || []).length;
if (chipCount >= 5 && bannerCount >= 3) {
  add('pass', `Scenario switcher baseline present: chip=${chipCount}, banner=${bannerCount}.`);
} else {
  add('fail', `Scenario switcher baseline incomplete: chip=${chipCount}, banner=${bannerCount}.`);
}

const zhCount = (html.match(/zh:\s*\{/g) || []).length;
const enCount = (html.match(/en:\s*\{/g) || []).length;
if (zhCount >= 1 && enCount >= 1) {
  add('pass', `i18n zh/en blocks present: zh=${zhCount}, en=${enCount}.`);
} else {
  add('fail', `Missing i18n zh/en blocks: zh=${zhCount}, en=${enCount}.`);
}

if (has(/<main\b[\s\S]*<\/main>/i)) add('pass', '<main> region is present.');
else add('fail', 'Missing <main> region.');

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

const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
const mainHex = main.match(/(style=["'][^"']*|fill=["']|stroke=["'])#[0-9a-fA-F]{3,8}/g) || [];
if (mainHex.length === 0) add('pass', 'No hard-coded hex colors in <main> inline styles/SVG attrs.');
else add('fail', `Hard-coded hex color(s) found in <main>: ${mainHex.slice(0, 3).join(', ')}`);

if (has(/className=|<>\s*$|<\/>/m)) add('fail', 'React/JSX remnants found.');
else add('pass', 'No obvious React/JSX remnants.');

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

const order = { fail: 0, warn: 1, pass: 2 };
results.sort((a, b) => order[a.level] - order[b.level]);

for (const result of results) {
  console.log(`[${result.level}] ${result.message}`);
}

const failCount = results.filter((result) => result.level === 'fail').length;
const warnCount = results.filter((result) => result.level === 'warn').length;

if (failCount > 0) {
  console.error(`\nAGIOne strict validation failed with ${failCount} failure(s) and ${warnCount} warning(s).`);
  process.exit(1);
}

console.log(`\nAGIOne strict validation passed with ${warnCount} warning(s).`);
