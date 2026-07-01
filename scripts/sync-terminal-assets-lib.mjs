import { promises as fs } from 'fs';
import { homedir } from 'os';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * Maintenance guardrails:
 * - Check the latest official terminal docs before changing terminal support mappings.
 * - Check the latest official terminal docs before changing skills / rules target paths.
 * - Do not infer support from legacy scripts, folder leftovers, or local habits alone.
 * - Keep repo-internal references repo-relative or derived from the repo root.
 * - This repository stores source rules only. Project-rule sync must target an
 *   explicitly selected project root; do not create repo-local .cursor/.trae projections.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPO_ROOT = join(__dirname, '..');

const USER_HOME = homedir();
const VALID_ASSET_TYPES = ['skills', 'rules', 'user-memory'];
const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

const TERMINAL_ALIASES = new Map([
  ['claude', 'claude-code'],
  ['claude-code', 'claude-code'],
  ['codex', 'codex'],
  ['cursor', 'cursor'],
  ['roo', 'roo-code'],
  ['roo-code', 'roo-code'],
  ['trae', 'trae-cn'],
  ['trae-cn', 'trae-cn'],
  ['cline', 'cline'],
]);

const ASSET_ALIASES = new Map([
  ['skill', 'skills'],
  ['skills', 'skills'],
  ['rule', 'rules'],
  ['rules', 'rules'],
  ['project-rule', 'rules'],
  ['project-rules', 'rules'],
  ['memory', 'user-memory'],
  ['user-memory', 'user-memory'],
  ['user-rule', 'user-memory'],
  ['user-rules', 'user-memory'],
  ['terminal-memory', 'user-memory'],
]);

export const TERMINAL_DEFINITIONS = {
  'claude-code': {
    label: 'Claude Code',
    legacyCommandTarget: join(USER_HOME, '.claude', 'commands'),
    userMemory: true,
    assets: {
      skills: {
        sourceDir: join(REPO_ROOT, 'skills'),
        userTarget: join(USER_HOME, '.claude', 'skills'),
      },
    },
  },
  codex: {
    label: 'Codex',
    userMemory: true,
    assets: {
      skills: {
        sourceDir: join(REPO_ROOT, 'skills'),
        userTarget: join(USER_HOME, '.agents', 'skills'),
      },
    },
  },
  cursor: {
    label: 'Cursor',
    legacyCommandTarget: join(USER_HOME, '.cursor', 'commands'),
    assets: {
      skills: {
        sourceDir: join(REPO_ROOT, 'skills'),
        userTarget: join(USER_HOME, '.cursor', 'skills'),
      },
      rules: {
        sourceDir: join(REPO_ROOT, 'rules'),
        targetProjectSubdir: ['.cursor', 'rules'],
      },
    },
  },
  'roo-code': {
    label: 'Roo Code',
    legacyCommandTarget: join(USER_HOME, '.roo', 'commands'),
    assets: {},
  },
  'trae-cn': {
    label: 'Trae-CN',
    legacyCommandTarget: join(USER_HOME, '.trae', 'commands'),
    assets: {
      skills: {
        sourceDir: join(REPO_ROOT, 'skills'),
        userTarget: join(USER_HOME, '.trae', 'skills'),
      },
      rules: {
        sourceDir: join(REPO_ROOT, 'rules'),
        targetProjectSubdir: ['.trae', 'rules'],
      },
    },
  },
  cline: {
    label: 'Cline',
    legacyCommandTarget: join(USER_HOME, '.cline', 'commands'),
    assets: {},
  },
};

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeTerminal(input) {
  const key = TERMINAL_ALIASES.get(String(input || '').trim().toLowerCase());
  if (!key) {
    throw new Error(`Unsupported terminal: ${input}`);
  }
  return key;
}

function normalizeAsset(input) {
  const key = ASSET_ALIASES.get(String(input || '').trim().toLowerCase());
  if (!key) {
    throw new Error(`Unsupported asset type: ${input}`);
  }
  return key;
}

function unique(values) {
  return Array.from(new Set(values));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wildcardToRegExp(pattern) {
  const parts = String(pattern).split('*').map(escapeRegExp);
  return new RegExp(`^${parts.join('.*')}$`);
}

function normalizeTerminalList(values) {
  if (!values.length) {
    return Object.keys(TERMINAL_DEFINITIONS);
  }
  return unique(values.flatMap(splitCsv).map(normalizeTerminal));
}

function normalizeAssetList(values, defaults) {
  if (!values.length) {
    return defaults;
  }
  return unique(values.flatMap(splitCsv).map(normalizeAsset));
}

function normalizeItemNameList(values) {
  return unique(values.flatMap(splitCsv));
}

function parseArgValue(rawArgs, index) {
  const token = rawArgs[index];
  const [, value = ''] = token.split(/=(.*)/s);
  if (value) {
    return { value, nextIndex: index };
  }
  const next = rawArgs[index + 1];
  if (!next || next.startsWith('--')) {
    throw new Error(`Missing value for ${token}`);
  }
  return { value: next, nextIndex: index + 1 };
}

export function parseCliArgs(rawArgs, defaults = {}) {
  const defaultAssets = defaults.defaultAssets || ['skills'];
  const scriptName = defaults.scriptName || 'sync-script.mjs';
  const terminalArgs = [];
  const assetArgs = [];
  const nameArgs = [];
  let targetProjectRoot = null;

  let dryRun = false;
  let help = false;
  let list = false;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];

    if (token === '--help' || token === '-h') {
      help = true;
      continue;
    }

    if (token === '--list') {
      list = true;
      continue;
    }

    if (token === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (token.startsWith('--terminal')) {
      const parsed = parseArgValue(rawArgs, index);
      terminalArgs.push(parsed.value);
      index = parsed.nextIndex;
      continue;
    }

    if (token.startsWith('--asset') || token.startsWith('--plugin')) {
      const parsed = parseArgValue(rawArgs, index);
      assetArgs.push(parsed.value);
      index = parsed.nextIndex;
      continue;
    }

    if (token.startsWith('--name') || token.startsWith('--item')) {
      const parsed = parseArgValue(rawArgs, index);
      nameArgs.push(parsed.value);
      index = parsed.nextIndex;
      continue;
    }

    if (token.startsWith('--target-project') || token.startsWith('--target')) {
      const parsed = parseArgValue(rawArgs, index);
      targetProjectRoot = resolve(parsed.value);
      index = parsed.nextIndex;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return {
    scriptName,
    defaultAssets,
    help,
    list,
    dryRun,
    targetProjectRoot,
    terminals: normalizeTerminalList(terminalArgs),
    assetTypes: normalizeAssetList(assetArgs, defaultAssets),
    itemNames: normalizeItemNameList(nameArgs),
  };
}

export function printUsage(options = {}) {
  const scriptName = options.scriptName || 'sync-script.mjs';
  const description = options.description || 'Sync terminal assets.';
  const examples = options.examples || [];

  console.log(description);
  console.log('');
  console.log(`Usage: node scripts/${scriptName} [options]`);
  console.log('');
  console.log('Options:');
  console.log('  --terminal=claude-code,cursor   Filter target terminals');
  console.log('  --asset=skills,rules,user-memory Filter asset types');
  console.log('  --target-project=path           Required when syncing project rules');
  console.log('  --plugin=skill                  Alias of --asset');
  console.log('  --name=existing-project-feature-skill Filter individual skill/rule names');
  console.log('  --name=agione-*                  Filter by wildcard pattern');
  console.log('  --dry-run                       Show planned writes without touching files');
  console.log('  --list                          Print supported terminals and asset types');
  console.log('  --help                          Show this help');
  console.log('');
  console.log('Asset aliases:');
  console.log('  skills   = skill');
  console.log('  rules    = rule, project-rule');
  console.log('  user-memory = memory, user-rule, user-rules, terminal-memory');
  console.log('');
  console.log('Default target behavior:');
  console.log('  skills -> sync to user terminal directories');
  console.log('  rules  -> sync rules/*.mdc to an explicit target project only');
  console.log('  user-memory -> sync rules/user-rule.md to terminal long-term memory targets');
  console.log('');

  if (examples.length) {
    console.log('Examples:');
    for (const example of examples) {
      console.log(`  ${example}`);
    }
    console.log('');
  }
}

export function printSupportedMatrix() {
  console.log('Supported terminals and assets:');
  for (const [terminalKey, terminal] of Object.entries(TERMINAL_DEFINITIONS)) {
    const assets = VALID_ASSET_TYPES.filter((assetType) =>
      assetType === 'user-memory' ? terminal.userMemory : terminal.assets[assetType],
    );
    console.log(`  ${terminalKey} -> ${assets.join(', ') || 'none'}`);
  }
}

async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}

async function pathExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function readDirRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await readDirRecursive(fullPath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readSubdirsRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const dirs = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) {
      continue;
    }
    const fullPath = join(dir, entry.name);
    dirs.push(...(await readSubdirsRecursive(fullPath)));
    dirs.push(fullPath);
  }

  return dirs;
}

async function collectSkillItems(sourceDir) {
  if (!(await pathExists(sourceDir))) {
    return [];
  }

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const items = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) {
      continue;
    }
    const sourcePath = join(sourceDir, entry.name);
    const skillFile = join(sourcePath, 'SKILL.md');
    if (!(await pathExists(skillFile))) {
      continue;
    }
    items.push({
      type: 'directory',
      name: entry.name,
      sourcePath,
      relativeTargetPath: entry.name,
      matchingKeys: [entry.name],
    });
  }

  return items;
}

async function collectRuleItems(sourceDir) {
  if (!(await pathExists(sourceDir))) {
    return [];
  }

  const files = await readDirRecursive(sourceDir);
  return files
    .filter((file) => file.endsWith('.mdc'))
    .map((file) => {
      const relativePath = relative(sourceDir, file);
      return {
        type: 'file',
        name: basename(file, extname(file)),
        sourcePath: file,
        relativeTargetPath: relativePath,
        matchingKeys: [basename(file, extname(file)), relativePath, relativePath.slice(0, -extname(relativePath).length)],
      };
    });
}

async function collectItemsForAsset(assetType) {
  if (assetType === 'skills') {
    return collectSkillItems(join(REPO_ROOT, 'skills'));
  }
  if (assetType === 'rules') {
    return collectRuleItems(join(REPO_ROOT, 'rules'));
  }
  return [];
}

function filterItems(items, itemNames) {
  if (!itemNames.length) {
    return items;
  }

  const filters = itemNames.map((item) => item.trim()).filter(Boolean);
  const accepted = new Set(filters.filter((item) => !item.includes('*')));
  const wildcardPatterns = filters.filter((item) => item.includes('*')).map(wildcardToRegExp);
  return items.filter((item) =>
    item.matchingKeys.some((key) => accepted.has(key) || wildcardPatterns.some((pattern) => pattern.test(key))),
  );
}

function resolveTargetBase(terminalKey, assetType, options) {
  const assetConfig = TERMINAL_DEFINITIONS[terminalKey]?.assets?.[assetType];
  if (!assetConfig) {
    return null;
  }

  if (assetConfig.targetProjectSubdir) {
    if (!options.targetProjectRoot) {
      throw new Error(
        `Project rules are no longer maintained inside ai-web-system. Pass --target-project=<project root> to sync ${assetType} for ${terminalKey}.`,
      );
    }

    const targetRoot = resolve(options.targetProjectRoot);
    if (resolve(targetRoot) === resolve(REPO_ROOT)) {
      throw new Error('Refusing to sync project rules back into ai-web-system; edit rules/ as the source instead.');
    }

    return join(targetRoot, ...assetConfig.targetProjectSubdir);
  }

  return assetConfig.userTarget;
}

function isPathInside(rootPath, candidatePath) {
  const relativePath = relative(resolve(rootPath), resolve(candidatePath));
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

function isMarkdownLikeFile(filePath) {
  const extension = extname(filePath).toLowerCase();
  return extension === '.md' || extension === '.mdc';
}

function detectNewline(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function isHiddenName(name) {
  return String(name || '').startsWith('.');
}

function buildSourceMetadataBlock(sourcePath, newline) {
  const repoRoot = resolve(REPO_ROOT);
  return [
    '<!-- ai-web-system-sync-metadata',
    `AI_WEB_SYSTEM_REPO_ROOT=${repoRoot}`,
    'Repo-internal refs like rules/ and skills/ resolve from AI_WEB_SYSTEM_REPO_ROOT.',
    '-->',
    '',
  ].join(newline);
}

function injectSourceMetadata(content, sourcePath) {
  const newline = detectNewline(content);
  const metadataBlock = buildSourceMetadataBlock(sourcePath, newline);
  const frontmatterMatch = content.match(FRONTMATTER_PATTERN);
  if (!frontmatterMatch) {
    return `${metadataBlock}${content}`;
  }
  return `${frontmatterMatch[0]}${metadataBlock}${content.slice(frontmatterMatch[0].length)}`;
}

async function buildTargetBuffer(sourcePath, targetPath, assetType) {
  const sourceBuffer = await fs.readFile(sourcePath);
  if (assetType === 'rules') {
    return sourceBuffer;
  }

  if (!isMarkdownLikeFile(sourcePath)) {
    return sourceBuffer;
  }

  // Source assets stay repo-relative and portable. Only external skill targets
  // receive machine-local source metadata.
  if (isPathInside(REPO_ROOT, targetPath)) {
    return sourceBuffer;
  }

  const transformedContent = injectSourceMetadata(sourceBuffer.toString('utf8'), sourcePath);
  return Buffer.from(transformedContent, 'utf8');
}

async function collectExpectedTargetFiles(selectedItems, targetBase) {
  const expectedFiles = new Set();

  for (const item of selectedItems) {
    if (item.type === 'file') {
      expectedFiles.add(resolve(join(targetBase, item.relativeTargetPath)));
      continue;
    }

    const sourceFiles = await readDirRecursive(item.sourcePath);
    for (const sourceFile of sourceFiles) {
      const relPath = relative(item.sourcePath, sourceFile);
      expectedFiles.add(resolve(join(targetBase, item.relativeTargetPath, relPath)));
    }
  }

  return expectedFiles;
}

async function collectStaleTargetFiles(targetBase, selectedItems, isFilteredSync) {
  if (!(await pathExists(targetBase))) {
    return [];
  }

  const staleFiles = new Set();
  const expectedFiles = await collectExpectedTargetFiles(selectedItems, targetBase);

  if (!isFilteredSync) {
    const entries = await fs.readdir(targetBase, { withFileTypes: true });

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (isHiddenName(entry.name)) {
        continue;
      }

      const entryPath = join(targetBase, entry.name);
      if (entry.isDirectory()) {
        const files = await readDirRecursive(entryPath);
        for (const filePath of files) {
          const resolvedFilePath = resolve(filePath);
          if (!expectedFiles.has(resolvedFilePath)) {
            staleFiles.add(resolvedFilePath);
          }
        }
        continue;
      }

      if (entry.isFile()) {
        const resolvedFilePath = resolve(entryPath);
        if (!expectedFiles.has(resolvedFilePath)) {
          staleFiles.add(resolvedFilePath);
        }
      }
    }

    return Array.from(staleFiles).sort((left, right) => left.localeCompare(right));
  }

  for (const item of selectedItems) {
    if (item.type !== 'directory') {
      continue;
    }

    const targetItemPath = join(targetBase, item.relativeTargetPath);
    if (!(await pathExists(targetItemPath))) {
      continue;
    }

    const files = await readDirRecursive(targetItemPath);
    for (const filePath of files) {
      const resolvedFilePath = resolve(filePath);
      if (!expectedFiles.has(resolvedFilePath)) {
        staleFiles.add(resolvedFilePath);
      }
    }
  }

  return Array.from(staleFiles).sort((left, right) => left.localeCompare(right));
}

async function removeEmptyDirectories(rootDir, dryRun) {
  if (!(await pathExists(rootDir))) {
    return [];
  }

  const deletedDirs = [];
  const directories = await readSubdirsRecursive(rootDir);

  for (const dirPath of directories) {
    if (dirname(dirPath) === rootDir && isHiddenName(basename(dirPath))) {
      continue;
    }

    const entries = await fs.readdir(dirPath);
    if (entries.length > 0) {
      continue;
    }

    if (dryRun) {
      deletedDirs.push(resolve(dirPath));
      continue;
    }

    await fs.rmdir(dirPath);
    deletedDirs.push(resolve(dirPath));
  }

  return deletedDirs;
}

async function pruneTargetBase(targetBase, selectedItems, dryRun, isFilteredSync) {
  const staleFiles = await collectStaleTargetFiles(targetBase, selectedItems, isFilteredSync);
  const deletedFiles = [];

  for (const filePath of staleFiles) {
    if (!isPathInside(targetBase, filePath)) {
      throw new Error(`Refusing to delete outside target base: ${filePath}`);
    }

    if (dryRun) {
      deletedFiles.push(filePath);
      continue;
    }

    await fs.rm(filePath, { force: true });
    deletedFiles.push(filePath);
  }

  const deletedDirs = await removeEmptyDirectories(targetBase, dryRun);
  return { deletedFiles, deletedDirs };
}

async function pruneLegacyCommandTarget(terminal, dryRun) {
  if (!terminal.legacyCommandTarget) {
    return { deletedFiles: [], deletedDirs: [] };
  }
  return pruneTargetBase(terminal.legacyCommandTarget, [], dryRun, false);
}

async function copyFileIfChanged(sourcePath, targetPath, dryRun, assetType) {
  const sourceBuffer = await buildTargetBuffer(sourcePath, targetPath, assetType);
  const targetExists = await pathExists(targetPath);

  if (targetExists) {
    const targetBuffer = await fs.readFile(targetPath);
    if (sourceBuffer.equals(targetBuffer)) {
      return 'skipped';
    }
  }

  if (dryRun) {
    return 'planned';
  }

  await ensureDir(dirname(targetPath));
  await fs.writeFile(targetPath, sourceBuffer);
  return 'synced';
}

async function syncItemToTarget(item, targetBase, dryRun, assetType) {
  if (item.type === 'file') {
    const targetPath = join(targetBase, item.relativeTargetPath);
    const status = await copyFileIfChanged(item.sourcePath, targetPath, dryRun, assetType);
    return [{ status, sourcePath: item.sourcePath, targetPath }];
  }

  const sourceFiles = await readDirRecursive(item.sourcePath);
  const results = [];
  for (const sourceFile of sourceFiles) {
    const relPath = relative(item.sourcePath, sourceFile);
    const targetPath = join(targetBase, item.relativeTargetPath, relPath);
    const status = await copyFileIfChanged(sourceFile, targetPath, dryRun, assetType);
    results.push({ status, sourcePath: sourceFile, targetPath });
  }
  return results;
}

function formatAction(status) {
  if (status === 'planned') return 'PLAN';
  if (status === 'synced') return 'SYNC';
  return 'SKIP';
}

function printHeader(options) {
  console.log(`Script: ${options.scriptName}`);
  console.log(`Terminals: ${options.terminals.join(', ')}`);
  console.log(`Assets: ${options.assetTypes.join(', ')}`);
  console.log('Target mode: user-home skills + explicit target-project rules');
  if (options.targetProjectRoot) {
    console.log(`Target project: ${options.targetProjectRoot}`);
  }
  console.log(`Dry run: ${options.dryRun ? 'yes' : 'no'}`);
  if (options.itemNames.length) {
    console.log(`Name filter: ${options.itemNames.join(', ')}`);
  }
  console.log('');
}

export async function syncTerminalAssets(options) {
  printHeader(options);

  const itemCache = new Map();
  const summary = {
    synced: 0,
    skipped: 0,
    planned: 0,
    deletedFiles: 0,
    deletedDirs: 0,
    unsupported: 0,
    terminals: 0,
    assets: 0,
  };

  for (const terminalKey of options.terminals) {
    const terminal = TERMINAL_DEFINITIONS[terminalKey];
    console.log(`[terminal] ${terminalKey} (${terminal.label})`);
    summary.terminals += 1;

    const legacyPruneResult = await pruneLegacyCommandTarget(terminal, options.dryRun);
    if (legacyPruneResult.deletedFiles.length || legacyPruneResult.deletedDirs.length) {
      const action = options.dryRun ? 'PLAN-DEL' : 'DEL';
      console.log(
        `  [${action}] legacy commands -> files: ${legacyPruneResult.deletedFiles.length}, dirs: ${legacyPruneResult.deletedDirs.length}`,
      );
    }
    summary.deletedFiles += legacyPruneResult.deletedFiles.length;
    summary.deletedDirs += legacyPruneResult.deletedDirs.length;

    if (!VALID_ASSET_TYPES.some((assetType) => terminal.assets[assetType])) {
      console.log('  [skip] no maintained assets');
      console.log('');
      continue;
    }

    for (const assetType of options.assetTypes) {
      const assetConfig = terminal.assets[assetType];
      if (!assetConfig) {
        console.log(`  [skip] ${assetType}: unsupported by ${terminalKey}`);
        summary.unsupported += 1;
        continue;
      }

      if (!itemCache.has(assetType)) {
        itemCache.set(assetType, await collectItemsForAsset(assetType));
      }

      const selectedItems = filterItems(itemCache.get(assetType), options.itemNames);
      const targetBase = resolveTargetBase(terminalKey, assetType, options);

      console.log(`  [asset] ${assetType} -> ${targetBase}`);
      summary.assets += 1;

      if (!selectedItems.length) {
        console.log(`    [warn] no source items selected for ${assetType}`);
        continue;
      }

      const pruneResult = await pruneTargetBase(targetBase, selectedItems, options.dryRun, options.itemNames.length > 0);
      if (pruneResult.deletedFiles.length || pruneResult.deletedDirs.length) {
        const action = options.dryRun ? 'PLAN-DEL' : 'DEL';
        console.log(
          `    [${action}] stale files: ${pruneResult.deletedFiles.length}, stale dirs: ${pruneResult.deletedDirs.length}`,
        );
      }
      summary.deletedFiles += pruneResult.deletedFiles.length;
      summary.deletedDirs += pruneResult.deletedDirs.length;

      if (!options.dryRun) {
        await ensureDir(targetBase);
      }

      for (const item of selectedItems) {
        const results = await syncItemToTarget(item, targetBase, options.dryRun, assetType);
        const itemCounts = { synced: 0, skipped: 0, planned: 0 };

        for (const result of results) {
          itemCounts[result.status] += 1;
          summary[result.status] += 1;
        }

        const primaryStatus = itemCounts.synced ? 'synced' : itemCounts.planned ? 'planned' : 'skipped';
        const label = formatAction(primaryStatus);
        console.log(`    [${label}] ${item.name} (${results.length} file${results.length === 1 ? '' : 's'})`);
      }
    }

    console.log('');
  }

  console.log('Summary:');
  console.log(`  synced: ${summary.synced}`);
  console.log(`  skipped: ${summary.skipped}`);
  console.log(`  planned: ${summary.planned}`);
  console.log(`  deleted files: ${summary.deletedFiles}`);
  console.log(`  deleted dirs: ${summary.deletedDirs}`);
  console.log(`  unsupported selections: ${summary.unsupported}`);

  return summary;
}
