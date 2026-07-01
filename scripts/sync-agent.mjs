#!/usr/bin/env node
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(join(__dirname, '..'));
const SOURCE_FILE = join(REPO_ROOT, 'agents', 'agent.md');
const CODEX_HOME = process.env.CODEX_HOME || join(homedir(), '.codex');
const TARGETS = [
  join(CODEX_HOME, 'agent.md'),
  join(CODEX_HOME, 'AGENTS.md'),
];

async function pathExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
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

function printUsage() {
  console.log('Sync terminal user-level agent instructions.');
  console.log('');
  console.log('Usage: node scripts/sync-agent.mjs [--dry-run] [--help]');
  console.log('');
  console.log('Source: agents/agent.md');
  console.log('Targets:');
  for (const target of TARGETS) {
    console.log(`  ${target}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const unknown = args.filter((arg) => arg !== '--dry-run');
  if (unknown.length) {
    throw new Error(`Unknown argument: ${unknown.join(', ')}`);
  }

  const sourceBuffer = await fs.readFile(SOURCE_FILE);
  console.log('Script: sync-agent.mjs');
  console.log(`Source: ${SOURCE_FILE}`);
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`);
  console.log('');

  const counts = { synced: 0, skipped: 0, planned: 0 };
  for (const target of TARGETS) {
    const status = await writeIfChanged(target, sourceBuffer, dryRun);
    counts[status] += 1;
    const label = status === 'synced' ? 'SYNC' : status === 'planned' ? 'PLAN' : 'SKIP';
    console.log(`[${label}] ${target}`);
  }

  console.log('');
  console.log('Summary:');
  console.log(`  synced: ${counts.synced}`);
  console.log(`  skipped: ${counts.skipped}`);
  console.log(`  planned: ${counts.planned}`);
}

main().catch((error) => {
  console.error(`Sync failed: ${error.message}`);
  process.exit(1);
});
