#!/usr/bin/env node
/**
 * Maintenance guardrails:
 * - Check the latest official terminal docs before changing repository rule support.
 * - Check the latest official terminal docs before changing rules target paths.
 * - Keep repository portability based on repo-relative paths, not terminal-private config.
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
      description: 'Sync this repository\'s rule projections to selected terminals.',
      examples: [
        'node scripts/sync-project-rules.mjs',
        'node scripts/sync-project-rules.mjs --terminal=cursor',
        'node scripts/sync-project-rules.mjs --terminal=trae-cn --name=10-existing-frontend-dev',
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
