#!/usr/bin/env node
/**
 * Maintenance guardrails:
 * - Check the latest official terminal docs before changing project rule support.
 * - Check the latest official terminal docs before changing rules target paths.
 * - Keep repository portability based on repo-relative paths or explicit CLI args,
 *   not terminal-private config such as `.claude/config.yaml`.
 */

import { parseCliArgs, printSupportedMatrix, printUsage, syncTerminalAssets } from './sync-terminal-assets-lib.mjs';

const SCRIPT_NAME = 'sync-project-rules.mjs';
const DEFAULT_ASSETS = ['rules'];

async function main() {
  const options = parseCliArgs(process.argv.slice(2), {
    scriptName: SCRIPT_NAME,
    defaultAssets: DEFAULT_ASSETS,
  });

  if (options.help) {
    printUsage({
      scriptName: SCRIPT_NAME,
      description: 'Sync project rules to selected terminals.',
      examples: [
        'node scripts/sync-project-rules.mjs',
        'node scripts/sync-project-rules.mjs --terminal=cursor --target-project=<target-project-root>',
        'node scripts/sync-project-rules.mjs --terminal=trae-cn --name=00-project-mamba-kb-binding --target-project=<target-project-root>',
      ],
    });
    return;
  }

  if (options.list) {
    printSupportedMatrix();
    return;
  }

  await syncTerminalAssets(options);
}

main().catch((error) => {
  console.error(`Sync failed: ${error.message}`);
  process.exit(1);
});
