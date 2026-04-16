#!/usr/bin/env node
/**
 * collect-writeback-items.mjs
 *
 * 作用：汇总所有触发了回写动作的资产
 *
 * 使用方法：
 *   node collect-writeback-items.mjs
 *   node collect-writeback-items.mjs --dir=components/manifests
 *   node collect-writeback-items.mjs --format=summary
 *
 * 输出格式：
 *   - summary (默认): 简洁汇总
 *   - detail: 详细列表
 *   - json: 完整 JSON
 *
 * 终端支持：
 *   本地脚本，无需终端适配
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'url';
import { getAssetsRoot, resolvePath, parseArgs, logger, walkDir } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targetDir = args.dir ? resolvePath(args.dir) : getAssetsRoot();
  const format = args.format || 'summary';

  // 查找所有 manifest 文件
  const manifestFiles = await walkDir(targetDir, ['.manifest.json']);

  if (manifestFiles.length === 0) {
    logger.warn('No manifest files found.');
    process.exit(0);
  }

  logger.info(`Found ${manifestFiles.length} manifest file(s) in ${targetDir}`);

  const results = [];

  for (const file of manifestFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const manifest = JSON.parse(content);

      // 检查是否有回写记录
      const writeback = manifest.writeback || {};
      const hasWriteback =
        (writeback.docs && writeback.docs.length > 0) ||
        (writeback.standards && writeback.standards.length > 0) ||
        (writeback.examples && writeback.examples.length > 0) ||
        (writeback.agents && writeback.agents.length > 0);

      if (hasWriteback) {
        results.push({
          name: manifest.name,
          type: manifest.type,
          status: manifest.status,
          writeback: {
            docs: writeback.docs || [],
            standards: writeback.standards || [],
            examples: writeback.examples || [],
            agents: writeback.agents || [],
          },
          manifestPath: path.relative(getAssetsRoot(), file),
        });
      }
    } catch (err) {
      logger.warn(`Failed to parse ${file}: ${err.message}`);
    }
  }

  if (results.length === 0) {
    logger.info('No assets with writeback records found.');
    process.exit(0);
  }

  // 根据格式输出
  switch (format) {
    case 'json':
      console.log(JSON.stringify(results, null, 2));
      break;

    case 'detail':
      console.log('\n📋 Assets with Writeback Records:\n');
      for (const item of results) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`  Name: ${item.name}`);
        console.log(`  Type: ${item.type}`);
        console.log(`  Status: ${item.status}`);
        console.log(`  Manifest: ${item.manifestPath}`);

        const wb = item.writeback;
        if (wb.docs.length > 0) {
          console.log(`\n  📄 Docs:`);
          wb.docs.forEach((d) => console.log(`     - ${d}`));
        }
        if (wb.standards.length > 0) {
          console.log(`\n  📐 Standards:`);
          wb.standards.forEach((s) => console.log(`     - ${s}`));
        }
        if (wb.examples.length > 0) {
          console.log(`\n  💡 Examples:`);
          wb.examples.forEach((e) => console.log(`     - ${e}`));
        }
        if (wb.agents.length > 0) {
          console.log(`\n  🤖 Agents:`);
          wb.agents.forEach((a) => console.log(`     - ${a}`));
        }
        console.log('');
      }
      break;

    case 'summary':
    default:
      console.log('\n📋 Assets with Writeback Records:\n');
      console.log(
        'Name'.padEnd(30) +
        'Type'.padEnd(12) +
        'Status'.padEnd(12) +
        'Writebacks'
      );
      console.log('─'.repeat(80));

      for (const item of results) {
        const wb = item.writeback;
        const totalWritebacks =
          wb.docs.length +
          wb.standards.length +
          wb.examples.length +
          wb.agents.length;

        console.log(
          item.name.padEnd(30) +
            item.type.padEnd(12) +
            item.status.padEnd(12) +
            `+${totalWritebacks}`
        );
      }
      console.log(`\nTotal: ${results.length} asset(s) with writeback records.`);
      break;
  }
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
