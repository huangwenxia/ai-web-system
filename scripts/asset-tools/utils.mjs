/**
 * asset-tools 共享工具模块
 *
 * 提供路径解析、日志、错误处理等公共功能
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

// 获取项目根目录（assets 的上级目录）
export function getRoot() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // scripts/asset-tools/utils.mjs -> scripts/ -> 项目根目录
  return path.resolve(__dirname, '..', '..');
}

// 获取 assets 目录
export function getAssetsRoot() {
  return path.join(getRoot(), 'assets');
}

// 路径解析：支持绝对路径和相对路径
// 相对路径默认基于项目根目录
export function resolvePath(inputPath, relativeTo = getRoot()) {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  return path.resolve(relativeTo, inputPath);
}

// 读取 JSON 文件
export async function readJson(filePath) {
  const content = await fs.readFile(resolvePath(filePath), 'utf-8');
  return JSON.parse(content);
}

// 写入 JSON 文件
export async function writeJson(filePath, data) {
  const resolvedPath = resolvePath(filePath);
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

// 日志输出
export const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  sync: (src, dest) => console.log(`📤 ${src} -> ${dest}`),
  skip: (msg) => console.log(`⏭️  ${msg}`),
};

// 解析命令行参数
// 示例: --name=value -> { name: 'value' }
// 示例: --flag -> { flag: true }
export function parseArgs(args) {
  return Object.fromEntries(
    args.map((arg) => {
      const [key, value] = arg.replace(/^--/, '').split('=');
      return [key, value ?? true];
    })
  );
}

// 遍历目录
export async function walkDir(dir, extensions = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await walkDir(fullPath, extensions);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      if (extensions.length === 0 || extensions.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  return files;
}
