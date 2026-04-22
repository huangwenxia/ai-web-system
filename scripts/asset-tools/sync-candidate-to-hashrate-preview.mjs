import fs from 'node:fs';
import path from 'node:path';

import { parseArgs, resolvePath } from './utils.mjs';

const DEFAULT_TARGET_PROJECT_ROOT = '../project-mamba';
const DEFAULT_TARGET_SUBDIR = path.join('apps', 'hashrate', 'src', '__preview__', 'components');

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
    'Usage: node scripts/asset-tools/sync-candidate-to-hashrate-preview.mjs --source=assets/components/candidates/example-card.vue --name=ExampleCardPreview [--target-project=../project-mamba]'
  );
  process.exit(1);
}

const sourcePath = resolvePath(source);
const targetProjectRoot = resolvePath(resolveTargetProjectRoot(args));
const targetPath = path.join(targetProjectRoot, DEFAULT_TARGET_SUBDIR, ensureVueFilename(name));

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);

console.log(`Candidate synced to hashrate preview: ${targetPath}`);
