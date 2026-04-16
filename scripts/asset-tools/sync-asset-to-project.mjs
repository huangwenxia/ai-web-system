#!/usr/bin/env node
/**
 * sync-asset-to-project.mjs
 *
 * 作用：将知识库资产同步到真实项目
 *
 * 使用方法：
 *   node sync-asset-to-project.mjs --source=path/to/asset.vue --manifest=path/to/manifest.json --target=components/MyComponent.vue
 *
 * 前提条件：
 *   - manifest.sync.allowed 必须为 true
 *   - manifest.status 必须为 official 或 synced
 *
 * 终端支持：
 *   本地脚本，无需终端适配
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'url';
import { getRoot, resolvePath, parseArgs, logger } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.source;
  const manifestPath = args.manifest;
  const target = args.target;

  if (!source || !manifestPath || !target) {
    logger.error('Usage: node sync-asset-to-project.mjs --source=path --manifest=path --target=path');
    logger.info('Example: node sync-asset-to-project.mjs --source=components/candidates/MyCard.vue --manifest=components/manifests/MyCard.manifest.json --target=components/MyCard.vue');
    process.exit(1);
  }

  // 解析路径
  const resolvedSource = resolvePath(source);
  const resolvedManifestPath = resolvePath(manifestPath);

  // 读取 manifest
  let manifest;
  try {
    const content = await fs.readFile(resolvedManifestPath, 'utf-8');
    manifest = JSON.parse(content);
  } catch (err) {
    logger.error(`Failed to read manifest: ${err.message}`);
    process.exit(1);
  }

  // 前置检查
  if (!manifest.sync?.allowed) {
    logger.error('Sync rejected: manifest.sync.allowed is false');
    logger.info('Use promote-asset.mjs to change status and set sync.allowed=true first.');
    process.exit(2);
  }

  const validStatuses = ['official', 'synced'];
  if (!validStatuses.includes(manifest.status)) {
    logger.error(`Sync rejected: manifest.status is "${manifest.status}". Must be one of: ${validStatuses.join(', ')}`);
    logger.info('Use promote-asset.mjs to promote asset to "official" first.');
    process.exit(2);
  }

  // 确定目标项目根目录
  const targetProject = manifest.sync?.targetProject || 'project-mamba';
  const possibleProjectRoots = [
    path.join(getRoot(), targetProject),
    path.join(getRoot(), '..', targetProject),
  ];

  let projectRoot = null;
  for (const root of possibleProjectRoots) {
    try {
      await fs.access(path.join(root, 'package.json'));
      projectRoot = root;
      break;
    } catch {
      // 继续尝试
    }
  }

  if (!projectRoot) {
    logger.error(`Target project "${targetProject}" not found.`);
    logger.info(`Searched in: ${possibleProjectRoots.join(', ')}`);
    process.exit(1);
  }

  const resolvedTarget = path.join(projectRoot, target);

  // 检查源文件是否存在
  try {
    await fs.access(resolvedSource);
  } catch {
    logger.error(`Source file not found: ${resolvedSource}`);
    process.exit(1);
  }

  // 确保目标目录存在
  const targetDir = path.dirname(resolvedTarget);
  await fs.mkdir(targetDir, { recursive: true });

  // 复制文件
  try {
    await fs.copyFile(resolvedSource, resolvedTarget);
  } catch (err) {
    logger.error(`Failed to copy file: ${err.message}`);
    process.exit(1);
  }

  // 更新 manifest
  manifest.sync = {
    ...manifest.sync,
    targetPath: target,
    targetProject: targetProject,
    lastSyncedAt: new Date().toISOString(),
  };
  manifest.status = 'synced';

  await fs.writeFile(resolvedManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');

  logger.success(`Asset synced successfully`);
  logger.info(`  Source: ${resolvedSource}`);
  logger.info(`  Target: ${resolvedTarget}`);
  logger.info(`  Project: ${targetProject}`);
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
