#!/usr/bin/env node
/**
 * sync-rules-to-cursor.mjs
 *
 * 作用：将 rules/ 目录下的规则文件同步到 .cursor/rules/
 *
 * 单一来源原则：
 * - rules/ 是通用维护源
 * - .cursor/rules/ 是 Cursor 项目规则投影
 * - 只在 rules/ 编辑，脚本负责同步到 .cursor/rules/
 *
 * 终端支持：
 * - Cursor: ✅ 支持 Project Rules (.mdc)
 * - Trae-CN: ✅ 支持（兼容 Cursor 格式）
 * - 其他终端: ❌ 不支持 Project Rules
 *
 * 使用方法：
 * node scripts/sync-rules-to-cursor.mjs
 *
 * 文档参考：
 * - docs/02-资产与同步/终端适配矩阵.md
 */

import { promises as fs } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const RULES_SOURCE = join(ROOT, 'rules');
const CURSOR_RULES_TARGET = join(ROOT, '.cursor', 'rules');
const TRAE_RULES_TARGET = join(ROOT, '.trae', 'rules');

// ============================================
// 终端支持检测
// ============================================

const SUPPORTED_TERMINALS = {
  cursor: {
    supported: true,
    path: CURSOR_RULES_TARGET,
    docs: 'https://cursor.com/docs/rules'
  },
  'trae-cn': {
    supported: true,
    path: TRAE_RULES_TARGET,
    docs: 'https://trae.ai (兼容 Cursor 格式)'
  },
  'claude-code': {
    supported: false,
    path: null,
    docs: 'https://docs.anthropic.com/en/docs/claude-code (不支持 Project Rules)'
  },
  codex: {
    supported: false,
    path: null,
    docs: 'https://docs.codex.org (不支持 Project Rules)'
  },
  'roo-code': {
    supported: false,
    path: null,
    docs: 'https://roocode.com/docs (不支持 Project Rules)'
  },
  cline: {
    supported: false,
    path: null,
    docs: 'https://github.com/cline/cline (不支持 Project Rules)'
  }
};

// ============================================
// 工具函数
// ============================================

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

async function readDirRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await readDirRecursive(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function syncFile(sourcePath, targetPath) {
  try {
    const sourceContent = await fs.readFile(sourcePath, 'utf-8');
    await ensureDir(dirname(targetPath));

    let needsWrite = true;
    try {
      const targetContent = await fs.readFile(targetPath, 'utf-8');
      if (sourceContent === targetContent) {
        needsWrite = false;
        console.log(`    ⏭️  [SKIP] ${sourcePath.split(/[/\\]/).pop()} (identical)`);
      }
    } catch {
      // Target doesn't exist
    }

    if (needsWrite) {
      await fs.writeFile(targetPath, sourceContent, 'utf-8');
      console.log(`    ✅ [SYNC] ${sourcePath.split(/[/\\]/).pop()}`);
      return 1;
    }
    return 0;
  } catch (err) {
    console.error(`    ❌ [ERROR] ${err.message}`);
    return 0;
  }
}

// ============================================
// 主逻辑
// ============================================

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   Sync Rules to Cursor/Trae-CN');
  console.log('═══════════════════════════════════════════════\n');

  // 检查源目录
  try {
    await fs.access(RULES_SOURCE);
  } catch {
    console.error('❌ Source directory does not exist:', RULES_SOURCE);
    process.exit(1);
  }

  // 获取所有 .mdc 文件
  const sourceFiles = await readDirRecursive(RULES_SOURCE);
  const mdcFiles = sourceFiles.filter(f => f.endsWith('.mdc'));

  if (mdcFiles.length === 0) {
    console.log('⏭️  No .mdc files found in rules/');
    process.exit(0);
  }

  console.log(`📁 Found ${mdcFiles.length} rule file(s) in rules/\n`);

  // 显示支持的终端
  console.log('🔍 Supported terminals for Project Rules:');
  for (const [name, info] of Object.entries(SUPPORTED_TERMINALS)) {
    const status = info.supported ? '✅' : '❌';
    console.log(`   ${status} ${name}: ${info.docs}`);
  }
  console.log('');

  let totalSynced = 0;

  // 同步到 Cursor
  console.log('📤 Syncing to Cursor (.cursor/rules/)...');
  await ensureDir(CURSOR_RULES_TARGET);

  for (const sourceFile of mdcFiles) {
    const relPath = relative(RULES_SOURCE, sourceFile);
    const targetFile = join(CURSOR_RULES_TARGET, relPath);
    const count = await syncFile(sourceFile, targetFile);
    totalSynced += count;
  }

  // 同步到 Trae-CN
  console.log('\n📤 Syncing to Trae-CN (.trae/rules/)...');
  await ensureDir(TRAE_RULES_TARGET);

  for (const sourceFile of mdcFiles) {
    const relPath = relative(RULES_SOURCE, sourceFile);
    const targetFile = join(TRAE_RULES_TARGET, relPath);
    const count = await syncFile(sourceFile, targetFile);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`   Done! ${totalSynced} file(s) synced.`);
  console.log('═══════════════════════════════════════════════');
  console.log('\n📚 文档参考:');
  console.log('   - docs/02-资产与同步/终端适配矩阵.md');
  console.log('   - scripts/README.md');
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
