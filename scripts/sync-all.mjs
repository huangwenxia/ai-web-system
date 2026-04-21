#!/usr/bin/env node
/**
 * 维护约束：
 * - 修改终端支持矩阵前，必须先查对应终端最新官方文档。
 * - 修改 commands / skills / rules 的目标路径前，必须先查对应终端最新官方文档。
 */

import { parseCliArgs, printSupportedMatrix, printUsage, syncTerminalAssets } from './sync-terminal-assets-lib.mjs';

const SCRIPT_NAME = 'sync-all.mjs';
const DEFAULT_ASSETS = ['commands', 'skills', 'rules'];

async function main() {
  const options = parseCliArgs(process.argv.slice(2), {
    scriptName: SCRIPT_NAME,
    defaultAssets: DEFAULT_ASSETS,
  });

  if (options.help) {
    printUsage({
      scriptName: SCRIPT_NAME,
      description: 'Sync commands, skills, and rules to selected terminals.',
      examples: [
        'node scripts/sync-all.mjs',
        'node scripts/sync-all.mjs --terminal=cursor,trae-cn --asset=rules --target-project=E:\\work\\project-mamba',
        'node scripts/sync-all.mjs --terminal=claude-code --asset=skills --target-project=E:\\work\\project-mamba',
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
