#!/usr/bin/env node
/**
 * promote-asset.mjs
 *
 * 作用：晋升资产状态（draft -> candidate -> official -> synced）
 *
 * 使用方法：
 *   node promote-asset.mjs --manifest=path/to/manifest.json --status=official
 *
 * 状态流转：
 *   draft -> candidate -> official -> synced
 *
 * 终端支持：
 *   本地脚本，无需终端适配
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'url';
import { resolvePath, parseArgs, logger } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 有效的状态列表
const VALID_STATUSES = ['draft', 'candidate', 'official', 'synced'];

// 状态流转规则
const STATUS_FLOW = {
  draft: ['candidate'],
  candidate: ['draft', 'official'],
  official: ['candidate', 'synced'],
  synced: ['official'],
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = args.manifest;
  const newStatus = args.status;

  if (!manifestPath || !newStatus) {
    logger.error('Usage: node promote-asset.mjs --manifest=path --status=draft|candidate|official|synced');
    logger.info('Example: node promote-asset.mjs --manifest=example-card.manifest.json --status=official');
    console.log(`\nValid statuses: ${VALID_STATUSES.join(', ')}`);
    process.exit(1);
  }

  // 验证状态值
  if (!VALID_STATUSES.includes(newStatus)) {
    logger.error(`Invalid status: ${newStatus}. Valid statuses: ${VALID_STATUSES.join(', ')}`);
    process.exit(1);
  }

  // 解析 manifest 路径
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

  const currentStatus = manifest.status;

  // 验证状态流转是否合法
  if (currentStatus === newStatus) {
    logger.warn(`Status is already "${newStatus}". No change needed.`);
    process.exit(0);
  }

  const allowedTransitions = STATUS_FLOW[currentStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    logger.error(`Invalid status transition: ${currentStatus} -> ${newStatus}`);
    logger.info(`Allowed transitions from "${currentStatus}": ${allowedTransitions.join(', ') || 'none'}`);
    process.exit(1);
  }

  // 更新状态
  manifest.status = newStatus;
  manifest.updatedAt = new Date().toISOString();

  // 添加晋升记录
  if (!manifest.promotionHistory) {
    manifest.promotionHistory = [];
  }
  manifest.promotionHistory.push({
    from: currentStatus,
    to: newStatus,
    promotedAt: new Date().toISOString(),
  });

  // 写入更新后的 manifest
  try {
    await fs.writeFile(resolvedManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  } catch (err) {
    logger.error(`Failed to write manifest: ${err.message}`);
    process.exit(1);
  }

  logger.success(`Asset promoted: ${manifest.name}`);
  logger.info(`  ${currentStatus} -> ${newStatus}`);

  // 如果晋升到 synced，同时更新 sync 信息
  if (newStatus === 'synced' && manifest.sync) {
    manifest.sync.lastSyncedAt = new Date().toISOString();
    await fs.writeFile(resolvedManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  }
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
