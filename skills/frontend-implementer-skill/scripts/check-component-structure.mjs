#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const FLAT_COMPONENT_WARN_LIMIT = 8;
const SIDECAR_NAMES = new Set(['types.ts', 'constants.ts', 'constant.ts', 'helpers.ts', 'helper.ts', 'events.ts', 'bus.ts']);

function usage() {
  console.log(`Usage:
  node ${path.relative(process.cwd(), scriptPath)} [options] [paths...]

Options:
  --base=<ref>       Git base used for changed paths. Default: HEAD
  --strict           Treat warnings as errors
  --allow-empty      Allow an empty target set. Use only when no component directory is in scope
  --help             Show this help

When no paths are provided, the script checks directories related to added/modified git files.`);
}

function parseArgs(argv) {
  const options = {
    base: 'HEAD',
    strict: false,
    allowEmpty: false,
    paths: [],
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--allow-empty') {
      options.allowEmpty = true;
    } else if (arg.startsWith('--base=')) {
      options.base = arg.slice('--base='.length);
    } else {
      options.paths.push(arg);
    }
  }

  return options;
}

function runGit(args) {
  try {
    return execFileSync('git', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function normalize(file) {
  return file.replace(/\\/g, '/');
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function changedFiles(base) {
  const unstaged = runGit(['diff', '--name-only', '--diff-filter=ACMR', base]).split(/\r?\n/);
  const staged = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR', base]).split(/\r?\n/);
  const status = runGit(['status', '--porcelain', '--untracked-files=all'])
    .split(/\r?\n/)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);

  return unique([...unstaged, ...staged, ...status]).map(normalize);
}

function isDirectory(target) {
  try {
    return statSync(target).isDirectory();
  } catch {
    return false;
  }
}

function isFile(target) {
  try {
    return statSync(target).isFile();
  } catch {
    return false;
  }
}

function pathParts(target) {
  return normalize(target).split('/');
}

function nearestInterestingDirs(file) {
  const dirs = [];
  const parts = pathParts(file);

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    if (['components', 'utils', 'hooks'].includes(parts[index])) {
      dirs.push(parts.slice(0, index + 1).join('/'));
      if (index + 1 < parts.length - 1) dirs.push(parts.slice(0, index + 2).join('/'));
      break;
    }
  }

  if (parts.length > 1) dirs.push(parts.slice(0, -1).join('/'));
  return dirs;
}

function collectDirs(inputs) {
  const dirs = [];

  for (const input of inputs) {
    const normalized = normalize(input);
    const absolute = path.resolve(process.cwd(), normalized);
    if (isDirectory(absolute)) {
      dirs.push(normalized);
    } else if (isFile(absolute)) {
      dirs.push(...nearestInterestingDirs(normalized));
    }
  }

  return unique(dirs).filter((dir) => existsSync(path.resolve(process.cwd(), dir)));
}

function directEntries(dir) {
  const absolute = path.resolve(process.cwd(), dir);
  try {
    return readdirSync(absolute, { withFileTypes: true });
  } catch {
    return [];
  }
}

function hasVueEntry(dir, componentName) {
  const candidates = [
    path.join(dir, 'index.vue'),
    path.join(dir, `${componentName}.vue`),
  ];

  return candidates.some((candidate) => existsSync(path.resolve(process.cwd(), candidate)));
}

function isComponentsRoot(dir) {
  return path.basename(dir).toLowerCase() === 'components';
}

function isUtilsRoot(dir) {
  return path.basename(dir).toLowerCase() === 'utils';
}

function isHooksRoot(dir) {
  return path.basename(dir).toLowerCase() === 'hooks';
}

function isCapsuleDir(dir) {
  const parent = path.basename(path.dirname(dir)).toLowerCase();
  return parent === 'components';
}

function isSidecarFile(name) {
  return SIDECAR_NAMES.has(name) || /^use[A-Z].+\.(ts|tsx|js|jsx)$/.test(name);
}

function checkComponentsRoot(dir) {
  const warnings = [];
  const entries = directEntries(dir);
  const directVue = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.vue')).map((entry) => entry.name);
  const sidecars = entries.filter((entry) => entry.isFile() && isSidecarFile(entry.name)).map((entry) => entry.name);

  if (directVue.length > FLAT_COMPONENT_WARN_LIMIT) {
    warnings.push(`components root has ${directVue.length} direct .vue files; group thick/repeated components into capsule directories`);
  }

  if (sidecars.length) {
    warnings.push(`component-private sidecar files found in components root: ${sidecars.join(', ')}; move them into the matching component capsule if private`);
  }

  return warnings;
}

function checkCapsuleDir(dir) {
  const warnings = [];
  const componentName = path.basename(dir);
  const entries = directEntries(dir);
  const hasSidecars = entries.some((entry) => entry.isFile() && isSidecarFile(entry.name));
  const privateVueCount = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.vue')).length;
  const hasPrivateComponentsDir = entries.some((entry) => entry.isDirectory() && entry.name === 'components');

  if ((hasSidecars || hasPrivateComponentsDir || privateVueCount > 1) && !hasVueEntry(dir, componentName)) {
    warnings.push(`component capsule ${normalize(dir)} has sidecars/private children but no index.vue or ${componentName}.vue entry`);
  }

  return warnings;
}

function checkUtilsRoot(dir) {
  const warnings = [];
  const entries = directEntries(dir);
  const names = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const misplacedHooks = names.filter((name) => /^use[A-Z].+\.(ts|tsx|js|jsx)$/.test(name));
  const misplacedTypes = names.filter((name) => ['types.ts', 'type.ts'].includes(name));
  const busFiles = names.filter((name) => /^bus\.(ts|js)$/.test(name));

  if (misplacedHooks.length) {
    warnings.push(`utils contains composables (${misplacedHooks.join(', ')}); prefer hooks/ or a component capsule`);
  }
  if (misplacedTypes.length) {
    warnings.push(`utils contains type files (${misplacedTypes.join(', ')}); prefer page/module types.ts or a component capsule`);
  }
  if (busFiles.length) {
    warnings.push(`utils contains bus files (${busFiles.join(', ')}); prefer events.ts with explicit module semantics`);
  }

  return warnings;
}

function checkHooksRoot(dir) {
  const warnings = [];
  const entries = directEntries(dir);
  const oddNames = entries
    .filter((entry) => entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name))
    .map((entry) => entry.name)
    .filter((name) => !/^use[A-Z]/.test(name));

  if (oddNames.length) {
    warnings.push(`hooks contains non-useXxx files (${oddNames.join(', ')}); move constants/types/helpers closer to their owner`);
  }

  return warnings;
}

function checkDir(dir) {
  const warnings = [];

  if (isComponentsRoot(dir)) warnings.push(...checkComponentsRoot(dir));
  if (isCapsuleDir(dir)) warnings.push(...checkCapsuleDir(dir));
  if (isUtilsRoot(dir)) warnings.push(...checkUtilsRoot(dir));
  if (isHooksRoot(dir)) warnings.push(...checkHooksRoot(dir));

  return { dir: normalize(dir), warnings };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const inputs = options.paths.length ? options.paths : changedFiles(options.base);
  const missingExplicitPaths = options.paths
    .map(normalize)
    .filter((input) => !existsSync(path.resolve(process.cwd(), input)));

  if (missingExplicitPaths.length) {
    console.error(`Component structure check: explicit path(s) not found: ${missingExplicitPaths.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const dirs = collectDirs(inputs);

  if (dirs.length === 0) {
    console.log('Component structure check: no relevant directories to inspect.');
    if (!options.allowEmpty) {
      console.error('error: empty structure check is not allowed; pass explicit component paths or use --allow-empty with a reason in the final checklist');
      process.exitCode = 1;
    }
    return;
  }

  const results = dirs.map(checkDir).filter((result) => result.warnings.length > 0);
  const warningCount = results.reduce((sum, result) => sum + result.warnings.length, 0);

  console.log('Component structure check');
  console.log(`Checked directories: ${dirs.length}`);

  for (const result of results) {
    console.log(`\n${result.dir}`);
    for (const warning of result.warnings) console.log(`  warn: ${warning}`);
  }

  console.log(`\nSummary: ${warningCount} warning(s)`);
  if (options.strict && warningCount > 0) process.exitCode = 1;
}

main();
