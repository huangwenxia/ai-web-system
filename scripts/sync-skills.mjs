#!/usr/bin/env node
/**
 * Maintenance guardrails:
 * - Check the latest official terminal docs before changing skill support mappings.
 * - Check the latest official terminal docs before changing skills target paths.
 */

import { parseCliArgs, printSupportedMatrix, printUsage, syncTerminalAssets } from './sync-terminal-assets-lib.mjs';

const SCRIPT_NAME = 'sync-skills.mjs';
const DEFAULT_ASSETS = ['skills'];

async function main() {
  const options = parseCliArgs(process.argv.slice(2), {
    scriptName: SCRIPT_NAME,
    defaultAssets: DEFAULT_ASSETS,
  });

  if (options.help) {
    printUsage({
      scriptName: SCRIPT_NAME,
      description: 'Sync skills to selected terminals.',
      examples: [
        'node scripts/sync-skills.mjs',
        'node scripts/sync-skills.mjs --terminal=claude-code,codex',
        'node scripts/sync-skills.mjs --terminal=cursor --name=existing-project-feature-skill',
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
