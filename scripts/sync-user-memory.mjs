#!/usr/bin/env node
/**
 * Maintenance guardrails:
 * - Check the latest official terminal docs before changing user-memory targets.
 * - `rules/user-rule.md` is the repository source for user-level long-term rules.
 * - Terminal filenames such as AGENTS.md or CLAUDE.md are sync targets, not repo source layers.
 */

import { promises as fs } from 'fs';
import { homedir } from 'os';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(join(__dirname, '..'));
const USER_HOME = homedir();
const SOURCE_FILE = join(REPO_ROOT, 'rules', 'user-rule.md');
const CODEX_HOME = process.env.CODEX_HOME || join(USER_HOME, '.codex');

const TERMINAL_ALIASES = new Map([
  ['claude', 'claude-code'],
  ['claude-code', 'claude-code'],
  ['codex', 'codex'],
]);

export const USER_MEMORY_TARGETS = {
  'claude-code': {
    label: 'Claude Code',
    targets: [join(USER_HOME, '.claude', 'CLAUDE.md')],
  },
  codex: {
    label: 'Codex',
    targets: [join(CODEX_HOME, 'AGENTS.md')],
  },
};

async function pathExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values));
}

function normalizeTerminal(input) {
  const key = TERMINAL_ALIASES.get(String(input || '').trim().toLowerCase());
  if (!key) {
    throw new Error(`Unsupported user-memory terminal: ${input}`);
  }
  return key;
}

function normalizeTerminalList(values) {
  if (!values.length) {
    return Object.keys(USER_MEMORY_TARGETS);
  }
  return unique(values.flatMap(splitCsv).map(normalizeTerminal));
}

function parseArgValue(rawArgs, index) {
  const token = rawArgs[index];
  const [, value = ''] = token.split(/=(.*)/s);
  if (value) {
    return { value, nextIndex: index };
  }
  const next = rawArgs[index + 1];
  if (!next || next.startsWith('--')) {
    throw new Error(`Missing value for ${token}`);
  }
  return { value: next, nextIndex: index + 1 };
}

export function parseUserMemoryArgs(rawArgs) {
  const terminalArgs = [];
  let dryRun = false;
  let help = false;
  let list = false;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];

    if (token === '--help' || token === '-h') {
      help = true;
      continue;
    }

    if (token === '--list') {
      list = true;
      continue;
    }

    if (token === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (token.startsWith('--terminal')) {
      const parsed = parseArgValue(rawArgs, index);
      terminalArgs.push(parsed.value);
      index = parsed.nextIndex;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return {
    help,
    list,
    dryRun,
    terminals: normalizeTerminalList(terminalArgs),
  };
}

export function printUserMemoryUsage() {
  console.log('Sync user-level long-term rules to terminal memory targets.');
  console.log('');
  console.log('Usage: node scripts/sync-user-memory.mjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --terminal=claude-code,codex   Filter target terminals');
  console.log('  --dry-run                      Show planned writes without touching files');
  console.log('  --list                         Print supported user-memory targets');
  console.log('  --help                         Show this help');
  console.log('');
  console.log('Source: rules/user-rule.md');
}

export function printUserMemoryTargets() {
  console.log('Supported user-memory targets:');
  for (const [terminalKey, terminal] of Object.entries(USER_MEMORY_TARGETS)) {
    console.log(`  ${terminalKey} (${terminal.label})`);
    for (const target of terminal.targets) {
      console.log(`    ${target}`);
    }
  }
}

async function writeIfChanged(targetPath, sourceBuffer, dryRun) {
  if (await pathExists(targetPath)) {
    const current = await fs.readFile(targetPath);
    if (current.equals(sourceBuffer)) {
      return 'skipped';
    }
  }

  if (dryRun) {
    return 'planned';
  }

  await fs.mkdir(dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, sourceBuffer);
  return 'synced';
}

function formatAction(status) {
  if (status === 'planned') return 'PLAN';
  if (status === 'synced') return 'SYNC';
  return 'SKIP';
}

export async function syncUserMemory(options) {
  const sourceBuffer = await fs.readFile(SOURCE_FILE);
  const summary = { synced: 0, skipped: 0, planned: 0, terminals: 0, targets: 0 };

  console.log('Script: sync-user-memory.mjs');
  console.log(`Source: ${SOURCE_FILE}`);
  console.log(`Terminals: ${options.terminals.join(', ')}`);
  console.log(`Dry run: ${options.dryRun ? 'yes' : 'no'}`);
  console.log('');

  for (const terminalKey of options.terminals) {
    const terminal = USER_MEMORY_TARGETS[terminalKey];
    if (!terminal) {
      console.log(`[skip] ${terminalKey}: no maintained user-memory target`);
      console.log('');
      continue;
    }

    summary.terminals += 1;
    console.log(`[terminal] ${terminalKey} (${terminal.label})`);

    for (const targetPath of terminal.targets) {
      const status = await writeIfChanged(targetPath, sourceBuffer, options.dryRun);
      summary[status] += 1;
      summary.targets += 1;
      console.log(`  [${formatAction(status)}] ${targetPath}`);
    }

    console.log('');
  }

  console.log('Summary:');
  console.log(`  synced: ${summary.synced}`);
  console.log(`  skipped: ${summary.skipped}`);
  console.log(`  planned: ${summary.planned}`);
  console.log(`  terminals: ${summary.terminals}`);
  console.log(`  targets: ${summary.targets}`);

  return summary;
}

async function main() {
  const options = parseUserMemoryArgs(process.argv.slice(2));

  if (options.help) {
    printUserMemoryUsage();
    return;
  }

  if (options.list) {
    printUserMemoryTargets();
    return;
  }

  await syncUserMemory(options);
}

if (resolve(process.argv[1] || '') === __filename) {
  main().catch((error) => {
    console.error(`Sync failed: ${error.message}`);
    process.exit(1);
  });
}
