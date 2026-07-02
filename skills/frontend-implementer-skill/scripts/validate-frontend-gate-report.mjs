#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const REQUIRED_GATES = [
  'PRE-FLIGHT-GATE',
  'CONTEXT-GATE',
  'REUSE-GATE',
  'IMPLEMENTATION-GATE',
  'VALIDATION-GATE',
];

const ALLOWED_STATUS = new Set(['pass', 'blocked', 'delegated', 'not-applicable']);

function usage() {
  console.log(`Usage:
  node scripts/validate-frontend-gate-report.mjs [--allow-blocked] <report.md>

Validates that a frontend-implementer handoff / implementation report contains concrete FRONTEND-GATE statuses.
Use --allow-blocked only when the report is intentionally a blocked handoff instead of a completed implementation.`);
}

function parseArgs(argv) {
  const options = {
    allowBlocked: false,
    file: '',
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--allow-blocked') {
      options.allowBlocked = true;
    } else if (!options.file) {
      options.file = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return options;
}

function parseGateRows(text) {
  const rows = new Map();
  const rowRegex = /^\|\s*(PRE-FLIGHT-GATE|CONTEXT-GATE|REUSE-GATE|IMPLEMENTATION-GATE|VALIDATION-GATE)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/gm;
  let match;

  while ((match = rowRegex.exec(text))) {
    rows.set(match[1], {
      status: match[2].trim(),
      evidence: match[3].trim(),
      blockers: match[4].trim(),
    });
  }

  return rows;
}

function hasUnresolvedChoice(value) {
  return /\s\/\s/.test(value) || value.includes('pass / blocked') || value.includes('是 / 否');
}

function validateReport(text, options) {
  const errors = [];

  if (!/##\s*FRONTEND-GATE\s*硬闸门状态/.test(text)) {
    errors.push('Missing "## FRONTEND-GATE 硬闸门状态" section.');
  }

  const rows = parseGateRows(text);

  for (const gate of REQUIRED_GATES) {
    const row = rows.get(gate);
    if (!row) {
      errors.push(`Missing gate row: ${gate}.`);
      continue;
    }

    if (!ALLOWED_STATUS.has(row.status)) {
      errors.push(`${gate} has invalid or unresolved status "${row.status}". Use one of: ${Array.from(ALLOWED_STATUS).join(', ')}.`);
    }

    if (!row.evidence || hasUnresolvedChoice(row.evidence)) {
      errors.push(`${gate} must include concrete evidence / conclusion, not template placeholders.`);
    }

    if (row.status === 'blocked' && !row.blockers) {
      errors.push(`${gate} is blocked but does not explain the blocker.`);
    }

    if (row.status === 'not-applicable' && !row.blockers) {
      errors.push(`${gate} is not-applicable but does not explain why.`);
    }
  }

  const blockedGates = Array.from(rows.entries())
    .filter(([, row]) => row.status === 'blocked')
    .map(([gate]) => gate);

  if (blockedGates.length > 0 && !options.allowBlocked) {
    errors.push(`Blocked gates require --allow-blocked for a handoff report: ${blockedGates.join(', ')}.`);
  }

  const editDecision = text.match(/-\s*是否允许编辑文件：\s*(.+)/);
  if (!editDecision) {
    errors.push('Missing file-edit decision line: "- 是否允许编辑文件：".');
  } else if (hasUnresolvedChoice(editDecision[1])) {
    errors.push('File-edit decision is still unresolved; choose 是 or 否.');
  }

  return errors;
}

function main() {
  let options;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    usage();
    process.exitCode = 2;
    return;
  }

  if (options.help || !options.file) {
    usage();
    process.exitCode = options.help ? 0 : 2;
    return;
  }

  const reportPath = path.resolve(process.cwd(), options.file);
  if (!existsSync(reportPath)) {
    console.error(`Error: report not found: ${reportPath}`);
    process.exitCode = 2;
    return;
  }

  const text = readFileSync(reportPath, 'utf8');
  const errors = validateReport(text, options);

  if (errors.length > 0) {
    console.error('FRONTEND-GATE report validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('FRONTEND-GATE report validation passed.');
}

main();
