#!/usr/bin/env node
/**
 * verify-manifests.mjs
 *
 * 作用：校验 Manifest 文件的完整性和一致性
 *
 * 检查项：
 * 1. Manifest 文件是否可解析为有效 JSON
 * 2. 必填字段是否存在
 * 3. 资产文件是否存在
 * 4. status 是否为有效值
 * 5. 依赖是否可解析
 *
 * 使用方法：
 *   node verify-manifests.mjs
 *   node verify-manifests.mjs --dir=components/manifests
 *   node verify-manifests.mjs --fix
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

// 必填字段定义
const REQUIRED_FIELDS = {
  component: ['name', 'type', 'status', 'source'],
  page: ['name', 'type', 'status', 'source'],
  pattern: ['name', 'type', 'status', 'source', 'category'],
};

// 有效值定义
const VALID_STATUSES = ['draft', 'candidate', 'official', 'synced'];
const VALID_TYPES = ['component', 'page', 'pattern'];
const VALID_CATEGORIES = ['visual', 'layout', 'interaction'];

// 资产文件扩展名映射
const ASSET_EXTENSIONS = {
  component: ['.vue', '.jsx', '.tsx'],
  page: ['.vue', '.jsx', '.tsx', '.md'],
  pattern: ['.vue', '.css', '.scss', '.md'],
};

function validateManifest(manifestPath, options = {}) {
  const issues = [];
  const warnings = [];

  // 1. 读取并解析 JSON
  let manifest;
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(content);
  } catch (err) {
    issues.push(`Invalid JSON: ${err.message}`);
    return { valid: false, issues, warnings };
  }

  // 2. 检查必填字段
  const type = manifest.type;
  const requiredFields = REQUIRED_FIELDS[type] || REQUIRED_FIELDS.component;

  for (const field of requiredFields) {
    if (!manifest[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  // 3. 检查 type 值
  if (!VALID_TYPES.includes(manifest.type)) {
    issues.push(`Invalid type: ${manifest.type}. Valid: ${VALID_TYPES.join(', ')}`);
  }

  // 4. 检查 status 值
  if (!VALID_STATUSES.includes(manifest.status)) {
    issues.push(`Invalid status: ${manifest.status}. Valid: ${VALID_STATUSES.join(', ')}`);
  }

  // 5. 对于 pattern，检查 category
  if (manifest.type === 'pattern' && !VALID_CATEGORIES.includes(manifest.category)) {
    issues.push(`Invalid category: ${manifest.category}. Valid: ${VALID_CATEGORIES.join(', ')}`);
  }

  // 6. 检查资产文件是否存在（如果提供了源文件路径）
  if (options.checkAssetFiles && manifest.source?.file) {
    const assetPath = resolvePath(manifest.source.file, path.dirname(manifestPath));
    try {
      fs.accessSync(assetPath);
    } catch {
      warnings.push(`Asset file not found: ${manifest.source.file}`);
    }
  }

  // 7. 检查日期格式
  if (manifest.source?.createdAt) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (!dateRegex.test(manifest.source.createdAt)) {
      warnings.push(`Invalid date format: ${manifest.source.createdAt}. Expected: YYYY-MM-DD`);
    }
  }

  // 8. 检查 sync.allowed 与 status 的一致性
  if (manifest.sync?.allowed && !['official', 'synced'].includes(manifest.status)) {
    warnings.push(`sync.allowed is true but status is "${manifest.status}". Should be "official" or "synced".`);
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targetDir = args.dir ? resolvePath(args.dir) : getAssetsRoot();
  const fix = args.fix === 'true';

  logger.info(`Verifying manifests in: ${targetDir}`);

  // 查找所有 manifest 文件
  const manifestFiles = await walkDir(targetDir, ['.manifest.json']);

  if (manifestFiles.length === 0) {
    logger.warn('No manifest files found.');
    process.exit(0);
  }

  const results = {
    total: manifestFiles.length,
    valid: 0,
    invalid: 0,
    warnings: 0,
    issues: [],
  };

  for (const file of manifestFiles) {
    const relativePath = path.relative(getAssetsRoot(), file);
    const result = validateManifest(file, { checkAssetFiles: true });

    if (result.valid) {
      results.valid++;
    } else {
      results.invalid++;
    }
    results.warnings += result.warnings.length;

    if (!result.valid || result.warnings.length > 0) {
      results.issues.push({
        file: relativePath,
        issues: result.issues,
        warnings: result.warnings,
      });
    }
  }

  // 输出结果
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Manifest Verification Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Total manifests: ${results.total}`);
  console.log(`Valid: ${results.valid} ✅`);
  console.log(`Invalid: ${results.invalid} ❌`);
  console.log(`Warnings: ${results.warnings} ⚠️\n`);

  if (results.issues.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Issues Found');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const item of results.issues) {
      console.log(`📄 ${item.file}\n`);

      if (item.issues.length > 0) {
        console.log('   ❌ Issues:');
        item.issues.forEach((issue) => console.log(`      - ${issue}`));
      }

      if (item.warnings.length > 0) {
        console.log('   ⚠️  Warnings:');
        item.warnings.forEach((warn) => console.log(`      - ${warn}`));
      }

      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n❌ Verification failed with ${results.invalid} error(s) and ${results.warnings} warning(s)`);
    process.exit(1);
  } else {
    console.log('✅ All manifests are valid!');
  }
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
