#!/usr/bin/env node
/**
 * 维护约束：
 * - 修改项目规则支持终端前，必须先查对应终端最新官方文档。
 * - 修改 rules 的目标路径前，必须先查对应终端最新官方文档。
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
        'node scripts/sync-project-rules.mjs --terminal=cursor --target-project=E:\\work\\project-mamba',
        'node scripts/sync-project-rules.mjs --terminal=trae-cn --name=00-project-mamba-kb-binding --target-project=E:\\work\\project-mamba',
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
