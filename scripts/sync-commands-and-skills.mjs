#!/usr/bin/env node
/**
 * 维护约束：
 * - 修改 Claude / Codex / Cursor / Roo / Trae / Cline 的适配前，必须先查各自最新官方文档。
 * - 修改 commands 或 skills 的同步目标路径前，必须先查对应终端最新官方文档。
 */

import { parseCliArgs, printSupportedMatrix, printUsage, syncTerminalAssets } from './sync-terminal-assets-lib.mjs';

const SCRIPT_NAME = 'sync-commands-and-skills.mjs';
const DEFAULT_ASSETS = ['commands', 'skills'];

async function main() {
  const options = parseCliArgs(process.argv.slice(2), {
    scriptName: SCRIPT_NAME,
    defaultAssets: DEFAULT_ASSETS,
  });

  if (options.help) {
    printUsage({
      scriptName: SCRIPT_NAME,
      description: 'Sync slash commands and skills to selected terminals.',
      examples: [
        'node scripts/sync-commands-and-skills.mjs',
        'node scripts/sync-commands-and-skills.mjs --terminal=claude-code --asset=skills --target-project=<target-project-root>',
        'node scripts/sync-commands-and-skills.mjs --terminal=claude --asset=slash-command --target-project=<target-project-root>',
        'node scripts/sync-commands-and-skills.mjs --terminal=claude-code --asset=skills --name=agione-ui-skill --target-project=<target-project-root>',
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
