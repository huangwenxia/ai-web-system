#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const FLAT_COMPONENT_WARN_LIMIT = 8;
const SAME_PREFIX_FLAT_WARN_LIMIT = 3;
const SIDECAR_NAMES = new Set(['types.ts', 'type.ts', 'constants.ts', 'constant.ts', 'helpers.ts', 'helper.ts', 'events.ts', 'bus.ts']);
const COMPONENT_SUFFIX_TOKENS = new Set([
  'Actions',
  'Action',
  'Badge',
  'Badges',
  'Body',
  'Card',
  'Cards',
  'Dialog',
  'Drawer',
  'Empty',
  'Error',
  'Filter',
  'Filters',
  'Form',
  'Header',
  'Item',
  'List',
  'Loading',
  'Modal',
  'Panel',
  'Row',
  'Section',
  'Selector',
  'Status',
  'Summary',
  'Table',
  'Tag',
  'Tags',
  'Toolbar',
]);
const MAX_RECURSIVE_VUE_FILES = 200;
const SKIPPED_RECURSIVE_DIRS = new Set(['.git', '.nuxt', '.output', 'build', 'coverage', 'dist', 'node_modules']);
const UTILITY_CLASS_PREFIXES = [
  'absolute',
  'bg-',
  'block',
  'border',
  'bottom-',
  'box-',
  'cursor-',
  'duration-',
  'ease-',
  'fixed',
  'flex',
  'font-',
  'gap-',
  'grid',
  'h-',
  'hidden',
  'inline',
  'inset-',
  'items-',
  'justify-',
  'leading-',
  'left-',
  'm-',
  'max-',
  'mb-',
  'min-',
  'ml-',
  'mr-',
  'mt-',
  'mx-',
  'my-',
  'opacity-',
  'overflow-',
  'p-',
  'pb-',
  'pl-',
  'pr-',
  'pt-',
  'px-',
  'py-',
  'relative',
  'right-',
  'rounded',
  'shadow',
  'shrink',
  'space-',
  'text-',
  'top-',
  'transition',
  'w-',
  'z-',
];
const BOUNDARY_SIGNAL_PATTERNS = [
  { name: 'v-model/defineModel', pattern: /\bv-model(?::[\w-]+)?\s*=|defineModel\s*(?:<|\()/ },
  { name: 'options/config input', pattern: /:?options\s*=|\b[A-Za-z0-9_]*Options\b/ },
  { name: 'title/count/aria input', pattern: /:?(?:title|count)\s*=|\baria-[\w-]+\s*=/ },
  { name: 'local event handlers', pattern: /@(click|change|select|command|input|clear|retry|update:modelValue)\s*=/ },
  { name: 'state branches', pattern: /\bv-if\s*=|\bv-else-if\b|\bv-show\s*=/ },
  { name: 'scroll/segmented widget', pattern: /<el-(scrollbar|segmented)\b/ },
  { name: 'popover/dropdown/select widget', pattern: /<el-(popover|dropdown|select|radio-group|tabs)\b/ },
  { name: 'icon composition', pattern: /<(?:[A-Z][A-Za-z0-9]*Icon|Cloud|Rocket|Route|Info|Search|Check|Close|Plus|Edit|Delete|Upload|Download)\b/ },
];

function usage() {
  console.log(`Usage:
  node ${path.relative(process.cwd(), scriptPath)} [options] [paths...]

Options:
  --base=<ref>       Git base used for changed paths. Default: HEAD
  --strict           Treat warnings as errors
  --allow-empty      Allow an empty target set. Use only when no component directory is in scope
  --help             Show this help

When no paths are provided, the script checks directories related to added/modified git files.
The script also scans checked .vue files for component-boundary signals that may deserve extraction.`);
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

function displayPath(absolute) {
  const relative = normalize(path.relative(process.cwd(), absolute));
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) return relative;
  return normalize(absolute);
}

function collectVueFilesFromDir(absoluteDir, files) {
  if (files.length >= MAX_RECURSIVE_VUE_FILES) return;

  for (const entry of directEntries(absoluteDir)) {
    if (files.length >= MAX_RECURSIVE_VUE_FILES) return;
    const absoluteEntry = path.join(absoluteDir, entry.name);

    if (entry.isDirectory()) {
      if (SKIPPED_RECURSIVE_DIRS.has(entry.name)) continue;
      collectVueFilesFromDir(absoluteEntry, files);
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(displayPath(absoluteEntry));
    }
  }
}

function collectVueFiles(inputs) {
  const files = [];

  for (const input of inputs) {
    const normalized = normalize(input);
    const absolute = path.resolve(process.cwd(), normalized);

    if (isFile(absolute) && normalized.endsWith('.vue')) {
      files.push(displayPath(absolute));
    } else if (isDirectory(absolute)) {
      collectVueFilesFromDir(absolute, files);
    }
  }

  return unique(files);
}

function directEntries(dir) {
  const absolute = path.resolve(process.cwd(), dir);
  try {
    return readdirSync(absolute, { withFileTypes: true });
  } catch {
    return [];
  }
}

function hasEntryFile(dir) {
  return ['index.vue', 'index.ts'].some((name) => existsSync(path.resolve(process.cwd(), dir, name)));
}

function hasIndexVueEntry(dir) {
  return existsSync(path.resolve(process.cwd(), dir, 'index.vue'));
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

function hasDirectIndexVue(dir) {
  return existsSync(path.resolve(process.cwd(), dir, 'index.vue'));
}

function isSidecarFile(name) {
  return SIDECAR_NAMES.has(name) || /^use[A-Z].+\.(ts|tsx|js|jsx)$/.test(name);
}

function componentNameTokens(fileName) {
  const baseName = fileName.replace(/\.vue$/, '');
  return baseName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s._-]+/)
    .filter(Boolean);
}

function flatFeatureKey(fileName) {
  const tokens = componentNameTokens(fileName);
  if (tokens.length <= 1) return '';

  const withoutSuffix = [...tokens];
  while (withoutSuffix.length > 1 && COMPONENT_SUFFIX_TOKENS.has(withoutSuffix.at(-1))) {
    withoutSuffix.pop();
  }

  if (withoutSuffix.length !== tokens.length) return withoutSuffix.join('');
  return tokens[0];
}

function checkComponentsRoot(dir) {
  const warnings = [];
  const entries = directEntries(dir);
  const directVue = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.vue')).map((entry) => entry.name);
  const sidecars = entries.filter((entry) => entry.isFile() && isSidecarFile(entry.name)).map((entry) => entry.name);

  if (directVue.length > FLAT_COMPONENT_WARN_LIMIT) {
    warnings.push(`components root has ${directVue.length} direct .vue files; group thick/repeated components into capsule directories`);
  }

  const groups = new Map();
  for (const fileName of directVue) {
    const key = flatFeatureKey(fileName);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) || []), fileName]);
  }

  for (const [key, files] of groups) {
    if (files.length >= SAME_PREFIX_FLAT_WARN_LIMIT) {
      warnings.push(`components root has ${files.length} direct .vue files with feature prefix "${key}" (${files.join(', ')}); move the feature into a capsule directory with index.vue`);
    }
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
  const hasSameNameVue = entries.some((entry) => entry.isFile() && entry.name === `${componentName}.vue`);

  if (hasSameNameVue) {
    warnings.push(`component capsule ${normalize(dir)} must use index.vue as the Vue entry; rename ${componentName}.vue to index.vue`);
  }

  if ((hasSidecars || hasPrivateComponentsDir || privateVueCount > 0) && !hasIndexVueEntry(dir)) {
    warnings.push(`component capsule ${normalize(dir)} has Vue/private support files but no index.vue entry`);
  } else if (!hasEntryFile(dir)) {
    warnings.push(`capsule directory ${normalize(dir)} must expose a clear index.vue or index.ts entry`);
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

function checkModuleRoot(dir) {
  const warnings = [];
  if (!hasDirectIndexVue(dir) || isCapsuleDir(dir)) return warnings;

  const entries = directEntries(dir);
  const sidecars = entries.filter((entry) => entry.isFile() && isSidecarFile(entry.name)).map((entry) => entry.name);
  if (sidecars.length) {
    warnings.push(`module root ${normalize(dir)} has index.vue plus direct hook/type/constants files (${sidecars.join(', ')}); move detail UI state into same-named capsule directories and keep page root orchestration-only`);
  }

  return warnings;
}

function checkDir(dir) {
  const warnings = [];

  if (isComponentsRoot(dir)) warnings.push(...checkComponentsRoot(dir));
  if (isCapsuleDir(dir)) warnings.push(...checkCapsuleDir(dir));
  if (isUtilsRoot(dir)) warnings.push(...checkUtilsRoot(dir));
  if (isHooksRoot(dir)) warnings.push(...checkHooksRoot(dir));
  if (!isComponentsRoot(dir) && !isCapsuleDir(dir) && !isUtilsRoot(dir) && !isHooksRoot(dir)) warnings.push(...checkModuleRoot(dir));

  return { dir: normalize(dir), warnings };
}

function readText(file) {
  try {
    return readFileSync(path.resolve(process.cwd(), file), 'utf8');
  } catch {
    return '';
  }
}

function extractTemplate(content) {
  const match = content.match(/<template[\s\S]*?<\/template>/);
  return match ? match[0] : content;
}

function isUtilityClassName(name) {
  if (!name || name.includes(':') || name.includes('[') || name.startsWith('el-') || name.startsWith('is-')) return true;
  return UTILITY_CLASS_PREFIXES.some((prefix) => name === prefix || name.startsWith(prefix));
}

function collectClassNames(content) {
  const names = [];
  const classNamePattern = /[A-Za-z][A-Za-z0-9_-]*(?:__[A-Za-z0-9_-]+)?(?:--[A-Za-z0-9_-]+)?/g;
  const classAttrPattern = /\b(?:class|:class)\s*=\s*(?:"([^"]+)"|'([^']+)')/g;
  const styleClassPattern = /\.([A-Za-z][A-Za-z0-9_-]*(?:__[A-Za-z0-9_-]+)?(?:--[A-Za-z0-9_-]+)?)/g;

  for (const match of content.matchAll(classAttrPattern)) {
    const value = match[1] || match[2] || '';
    names.push(...(value.match(classNamePattern) || []));
  }

  for (const match of content.matchAll(styleClassPattern)) names.push(match[1]);

  return names;
}

function classFamilyRoot(name) {
  if (isUtilityClassName(name)) return '';

  const baseName = name.split('__')[0].split('--')[0];
  const parts = baseName.split('-').filter(Boolean);
  if (parts.length >= 3) return parts.slice(0, 3).join('-');
  if (parts.length >= 2) return parts.join('-');
  return '';
}

function semanticClassFamilies(content) {
  const groups = new Map();

  for (const className of collectClassNames(content)) {
    const root = classFamilyRoot(className);
    if (!root) continue;
    const group = groups.get(root) || { root, classes: new Set(), occurrences: 0 };
    group.classes.add(className);
    group.occurrences += 1;
    groups.set(root, group);
  }

  return Array.from(groups.values())
    .filter((group) => group.classes.size >= 3 && group.occurrences >= 4)
    .sort((a, b) => b.occurrences - a.occurrences);
}

function boundarySignals(content) {
  return BOUNDARY_SIGNAL_PATTERNS.filter(({ pattern }) => pattern.test(content)).map(({ name }) => name);
}

function isLikelyPageOrMainVue(file) {
  const normalized = normalize(file);
  return normalized.endsWith('/index.vue') || /\/src\/views\/.+\.vue$/.test(normalized);
}

function checkVueFile(file) {
  const content = readText(file);
  const warnings = [];
  if (!content) return { file: normalize(file), warnings };

  const template = extractTemplate(content);
  const families = semanticClassFamilies(content);
  const signals = boundarySignals(template);
  const familyText = families
    .slice(0, 3)
    .map((family) => `${family.root} (${family.classes.size} classes)`)
    .join(', ');
  const signalText = signals.slice(0, 6).join(', ');

  if (families.length > 0 && signals.length >= 3) {
    warnings.push(
      `component boundary candidate: semantic class family ${familyText} with UI boundary signals (${signalText}); review whether this block should be a page-local component even if it is used once`,
    );
  } else if (isLikelyPageOrMainVue(file) && signals.length >= 5) {
    warnings.push(
      `component boundary candidate: page/main Vue file has multiple UI boundary signals (${signalText}); review stable UI blocks for extraction or document why they stay inline`,
    );
  }

  return { file: normalize(file), warnings };
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
  const vueFiles = collectVueFiles(inputs);

  if (dirs.length === 0 && vueFiles.length === 0) {
    console.log('Component structure check: no relevant directories or Vue files to inspect.');
    if (!options.allowEmpty) {
      console.error('error: empty structure check is not allowed; pass explicit component paths or use --allow-empty with a reason in the final checklist');
      process.exitCode = 1;
    }
    return;
  }

  const dirResults = dirs.map(checkDir).filter((result) => result.warnings.length > 0);
  const vueResults = vueFiles.map(checkVueFile).filter((result) => result.warnings.length > 0);
  const dirWarningCount = dirResults.reduce((sum, result) => sum + result.warnings.length, 0);
  const vueWarningCount = vueResults.reduce((sum, result) => sum + result.warnings.length, 0);
  const warningCount = dirWarningCount + vueWarningCount;

  console.log('Component structure check');
  console.log(`Checked directories: ${dirs.length}`);
  console.log(`Checked Vue files: ${vueFiles.length}`);
  if (vueFiles.length >= MAX_RECURSIVE_VUE_FILES) {
    console.log(`Vue file scan capped at ${MAX_RECURSIVE_VUE_FILES} files; pass narrower paths for precise validation`);
  }

  for (const result of dirResults) {
    console.log(`\n${result.dir}`);
    for (const warning of result.warnings) console.log(`  warn: ${warning}`);
  }

  for (const result of vueResults) {
    console.log(`\n${result.file}`);
    for (const warning of result.warnings) console.log(`  warn: ${warning}`);
  }

  console.log(`\nSummary: ${warningCount} warning(s)`);
  if (options.strict && warningCount > 0) process.exitCode = 1;
}

main();
