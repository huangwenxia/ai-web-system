#!/usr/bin/env node
/**
 * validate-asset-compatibility.mjs
 *
 * 作用：校验组件/页面的依赖是否与目标项目兼容
 *
 * 使用方法：
 *   node validate-asset-compatibility.mjs --manifest=path/to/manifest.json
 *   node validate-asset-compatibility.mjs --manifest=example-card.manifest.json
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
  const manifestPath = args.manifest;

  if (!manifestPath) {
    logger.error('Usage: node validate-asset-compatibility.mjs --manifest=path/to/manifest.json');
    logger.info('Example: node validate-asset-compatibility.mjs --manifest=components/manifests/example-card.manifest.json');
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

  // 获取目标项目的 package.json
  // 默认从 manifest.sync.targetProject 获取项目名
  const targetProject = manifest.sync?.targetProject || 'project-mamba';

  // 在项目根目录查找 package.json
  // 策略：先查找项目根目录，再查找 ../project-mamba 等常见位置
  const possibleProjectRoots = [
    getRoot(), // ai-web-system 根目录
    path.join(getRoot(), '..'), // 父目录
  ];

  let projectPkg = null;
  let projectRoot = null;

  for (const root of possibleProjectRoots) {
    const pkgPath = path.join(root, targetProject, 'package.json');
    try {
      const content = await fs.readFile(pkgPath, 'utf-8');
      projectPkg = JSON.parse(content);
      projectRoot = path.join(root, targetProject);
      break;
    } catch {
      // 尝试直接读取 root/package.json
      const directPkgPath = path.join(root, 'package.json');
      try {
        const content = await fs.readFile(directPkgPath, 'utf-8');
        const pkg = JSON.parse(content);
        // 检查是否是目标项目
        if (pkg.name === targetProject) {
          projectPkg = pkg;
          projectRoot = root;
          break;
        }
      } catch {
        // 继续尝试下一个位置
      }
    }
  }

  if (!projectPkg) {
    logger.warn(`Project "${targetProject}" not found. Skipping dependency validation.`);
    logger.info(`Searched in: ${possibleProjectRoots.join(', ')}`);
    logger.info('Please ensure the target project exists or set correct targetProject in manifest.');
    process.exit(0);
  }

  logger.info(`Found project: ${projectPkg.name} at ${projectRoot}`);

  // 构建允许的依赖列表
  const allowedDeps = new Set([
    ...Object.keys(projectPkg.dependencies ?? {}),
    ...Object.keys(projectPkg.devDependencies ?? {}),
  ]);

  // 检查 manifest 中声明的依赖
  const deps = manifest.compatibility?.dependencies ?? [];
  const invalidDeps = deps.filter((dep) => !allowedDeps.has(dep));

  if (invalidDeps.length > 0) {
    logger.error('Compatibility check failed. Invalid dependencies found:');
    invalidDeps.forEach((dep) => console.log(`  - ${dep}`));
    console.log(`\nAllowed dependencies in "${projectPkg.name}":`);
    [...allowedDeps].sort().forEach((dep) => console.log(`  - ${dep}`));
    process.exit(2);
  }

  logger.success('Compatibility check passed.');
  logger.info(`Validated ${deps.length} dependency(ies) against ${allowedDeps.size} project dependencies`);
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
