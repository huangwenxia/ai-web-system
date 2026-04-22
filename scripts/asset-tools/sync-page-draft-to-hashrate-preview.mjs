import fs from 'node:fs';
import path from 'node:path';

import { parseArgs, resolvePath } from './utils.mjs';

const DEFAULT_TARGET_PROJECT_ROOT = '../project-mamba';
const DEFAULT_TARGET_SUBDIR = path.join('apps', 'hashrate', 'src', '__preview__', 'pages');

function resolveTargetProjectRoot(args) {
  return String(
    args.targetProject
      ?? args['target-project']
      ?? args.projectRoot
      ?? args['project-root']
      ?? DEFAULT_TARGET_PROJECT_ROOT
  );
}

function ensureVueFilename(name) {
  return name.endsWith('.vue') ? name : `${name}.vue`;
}

const args = parseArgs(process.argv.slice(2));
const source = String(args.source ?? '');
const name = String(args.name ?? '');

if (!source || !name) {
  console.error(
    'Usage: node scripts/asset-tools/sync-page-draft-to-hashrate-preview.mjs --source=assets/pages/drafts/example-page.vue --name=PreviewDraftPage.vue [--target-project=../project-mamba]'
  );
  process.exit(1);
}

const sourcePath = resolvePath(source);
const targetProjectRoot = resolvePath(resolveTargetProjectRoot(args));
const targetPath = path.join(targetProjectRoot, DEFAULT_TARGET_SUBDIR, ensureVueFilename(name));

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);

console.log(`Page draft synced to hashrate preview: ${targetPath}`);
