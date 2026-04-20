#!/usr/bin/env node
/**
 * create-manifest.mjs
 *
 * 作用：为组件或页面创建 Manifest 元数据文件
 *
 * 使用方法：
 *   node create-manifest.mjs --type=component --name=MyComponent
 *   node create-manifest.mjs --type=page --name=MyPage
 *   node create-manifest.mjs --type=pattern --name=MyPattern
 *
 * 终端支持：
 *   本地脚本，无需终端适配
 */

import path from 'node:path';
import { fileURLToPath } from 'url';
import { getAssetsRoot, parseArgs, writeJson, logger } from './utils.mjs';
import { createEmptyRuntimeProfile } from './runtime-profile.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES = {
  component: {
    name: '',
    type: 'component',
    status: 'draft',
    version: '1.0.0',
    source: {
      task: '',
      createdFrom: '',
      createdAt: new Date().toISOString().split('T')[0],
    },
    runtimeProfile: createEmptyRuntimeProfile(),
    compatibility: {
      projects: [],
      dependencies: [],
      forbidden: [],
    },
    sync: {
      allowed: false,
      targetProject: '',
      targetPath: '',
      lastSyncedAt: '',
    },
    review: {
      reusability: '',
      apiStability: '',
      visualQuality: '',
      boundaryCompleteness: '',
      notes: '',
    },
    tags: [],
  },
  page: {
    name: '',
    type: 'page',
    status: 'draft',
    version: '1.0.0',
    source: {
      task: '',
      createdFrom: '',
      createdAt: new Date().toISOString().split('T')[0],
    },
    runtimeProfile: createEmptyRuntimeProfile(),
    compatibility: {
      projects: [],
      dependencies: [],
      forbidden: [],
    },
    sync: {
      allowed: false,
      targetProject: '',
      targetPath: '',
      lastSyncedAt: '',
    },
    review: {
      reusability: '',
      structureQuality: '',
      completeness: '',
      notes: '',
    },
    tags: [],
  },
  pattern: {
    name: '',
    type: 'pattern',
    status: 'draft',
    version: '1.0.0',
    category: 'visual', // visual | layout | interaction
    source: {
      task: '',
      createdFrom: '',
      createdAt: new Date().toISOString().split('T')[0],
    },
    runtimeProfile: createEmptyRuntimeProfile(),
    compatibility: {
      projects: [],
      dependencies: [],
      forbidden: [],
    },
    sync: {
      allowed: false,
      targetProject: '',
      targetPath: '',
      lastSyncedAt: '',
    },
    review: {
      reusability: '',
      quality: '',
      notes: '',
    },
    tags: [],
  },
};

function getTemplate(type) {
  const template = TEMPLATES[type];
  if (!template) {
    logger.error(`Unknown type: ${type}. Valid types: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }
  return JSON.parse(JSON.stringify(template));
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const type = args.type;
  const name = args.name;

  if (!type || !name) {
    logger.error('Usage: node create-manifest.mjs --type=component|page|pattern --name=AssetName');
    logger.info('Example: node create-manifest.mjs --type=component --name=MyCard');
    process.exit(1);
  }

  if (!TEMPLATES[type]) {
    logger.error(`Invalid type: ${type}. Valid types: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  const template = getTemplate(type);
  template.name = name;

  // 生成文件名
  const manifestDir = path.join(getAssetsRoot(), `${type}s`, 'manifests');
  const manifestFile = path.join(manifestDir, `${name}.manifest.json`);

  writeJson(manifestFile, template)
    .then(() => {
      logger.success(`Manifest created: ${manifestFile}`);
    })
    .catch((err) => {
      logger.error(`Failed to create manifest: ${err.message}`);
      process.exit(1);
    });
}

main();
