#!/usr/bin/env node
/**
 * Maintenance guardrails:
 * - Check the latest official terminal docs before changing repository rule support.
 * - Check the latest official terminal docs before changing rules target paths.
 * - ai-web-system keeps rules/ as the source only; do not maintain .cursor/.trae projections here.
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
      description: 'Sync rules/*.mdc from this repository to an explicit target project.',
      examples: [
        'node scripts/sync-project-rules.mjs --terminal=cursor --target-project=E:\\work\\project-mamba',
        'node scripts/sync-project-rules.mjs --terminal=trae-cn --target-project=E:\\work\\project-mamba --name=10-existing-project-frontend-guardrails',
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
