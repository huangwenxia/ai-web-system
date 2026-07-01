#!/usr/bin/env node
/**
 * Maintenance guardrails:
 * - Check the latest official terminal docs before changing terminal support mappings.
 * - Check the latest official terminal docs before changing skills / rules target paths.
 */

import { parseCliArgs, printSupportedMatrix, printUsage, syncTerminalAssets } from './sync-terminal-assets-lib.mjs';
import { syncUserMemory } from './sync-user-memory.mjs';

const SCRIPT_NAME = 'sync-all.mjs';
const DEFAULT_ASSETS = ['skills', 'user-memory'];

async function main() {
  const options = parseCliArgs(process.argv.slice(2), {
    scriptName: SCRIPT_NAME,
    defaultAssets: DEFAULT_ASSETS,
  });

  if (options.help) {
    printUsage({
      scriptName: SCRIPT_NAME,
      description: 'Sync skills and rules to selected terminals.',
      examples: [
        'node scripts/sync-all.mjs',
        'node scripts/sync-all.mjs --terminal=claude-code,codex --asset=skills',
        'node scripts/sync-all.mjs --terminal=claude-code,codex --asset=user-memory',
        'node scripts/sync-all.mjs --terminal=cursor,trae-cn --asset=rules --target-project=E:\\work\\project-mamba',
      ],
    });
    return;
  }

  if (options.list) {
    printSupportedMatrix();
    return;
  }

  const terminalAssetTypes = options.assetTypes.filter((assetType) => assetType !== 'user-memory');
  if (terminalAssetTypes.length) {
    await syncTerminalAssets({ ...options, assetTypes: terminalAssetTypes });
  }

  if (options.assetTypes.includes('user-memory')) {
    await syncUserMemory({
      terminals: options.terminals,
      dryRun: options.dryRun,
    });
  }
}

main().catch((error) => {
  console.error(`Sync failed: ${error.message}`);
  process.exit(1);
});
