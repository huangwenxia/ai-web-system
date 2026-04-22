import { promises as fs } from 'fs';
import { homedir } from 'os';
import { basename, dirname, extname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * Maintenance guardrails:
 * - Check the latest official terminal docs before changing terminal support mappings.
 * - Check the latest official terminal docs before changing commands / skills / rules target paths.
 * - Do not infer support from legacy scripts, folder leftovers, or local habits alone.
 * - Keep repo-internal references repo-relative or derived from the repo root.
 * - For external target projects, prefer CLI args or sibling-repo defaults instead of terminal-private config.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPO_ROOT = join(__dirname, '..');

const USER_HOME = homedir();
const VALID_ASSET_TYPES = ['commands', 'skills', 'rules'];

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
  ['command', 'commands'],
  ['commands', 'commands'],
  ['slash-command', 'commands'],
  ['slash-commands', 'commands'],
  ['skill', 'skills'],
  ['skills', 'skills'],
  ['rule', 'rules'],
  ['rules', 'rules'],
  ['project-rule', 'rules'],
  ['project-rules', 'rules'],
]);

export const TERMINAL_DEFINITIONS = {
  'claude-code': {
    label: 'Claude Code',
    assets: {
      commands: {
        sourceDir: join(REPO_ROOT, 'commands'),
        userTarget: join(USER_HOME, '.claude', 'commands'),
        projectSubdir: ['.claude', 'commands'],
      },
      skills: {
        sourceDir: join(REPO_ROOT, 'skills'),
        userTarget: join(USER_HOME, '.claude', 'skills'),
        projectSubdir: ['.claude', 'skills'],
      },
    },
  },
  codex: {
    label: 'Codex',
    assets: {
      skills: {
        sourceDir: join(REPO_ROOT, 'skills'),
        userTarget: join(USER_HOME, '.codex', 'skills'),
        projectSubdir: ['.codex', 'skills'],
      },
    },
  },
  cursor: {
    label: 'Cursor',
    assets: {
      commands: {
        sourceDir: join(REPO_ROOT, 'commands'),
        userTarget: join(USER_HOME, '.cursor', 'commands'),
        projectSubdir: ['.cursor', 'commands'],
      },
      skills: {
        sourceDir: join(REPO_ROOT, 'skills'),
        userTarget: join(USER_HOME, '.cursor', 'skills'),
        projectSubdir: ['.cursor', 'skills'],
      },
      rules: {
        sourceDir: join(REPO_ROOT, 'rules'),
        projectSubdir: ['.cursor', 'rules'],
        projectOnly: true,
      },
    },
  },
  'roo-code': {
    label: 'Roo Code',
    assets: {
      commands: {
        sourceDir: join(REPO_ROOT, 'commands'),
        userTarget: join(USER_HOME, '.roo', 'commands'),
        projectSubdir: ['.roo', 'commands'],
      },
    },
  },
  'trae-cn': {
    label: 'Trae-CN',
    assets: {
      commands: {
        sourceDir: join(REPO_ROOT, 'commands'),
        userTarget: join(USER_HOME, '.trae', 'commands'),
        projectSubdir: ['.trae', 'commands'],
      },
      skills: {
        sourceDir: join(REPO_ROOT, 'skills'),
        userTarget: join(USER_HOME, '.trae', 'skills'),
        projectSubdir: ['.trae', 'skills'],
      },
      rules: {
        sourceDir: join(REPO_ROOT, 'rules'),
        projectSubdir: ['.trae', 'rules'],
        projectOnly: true,
      },
    },
  },
  cline: {
    label: 'Cline',
    assets: {
      commands: {
        sourceDir: join(REPO_ROOT, 'commands'),
        userTarget: join(USER_HOME, '.cline', 'commands'),
        projectSubdir: ['.cline', 'commands'],
      },
    },
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
  const defaultAssets = defaults.defaultAssets || ['commands', 'skills'];
  const scriptName = defaults.scriptName || 'sync-script.mjs';
  const terminalArgs = [];
  const assetArgs = [];
  const nameArgs = [];

  let targetProject = null;
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
      targetProject = resolve(parsed.value);
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
    targetProject,
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
  console.log('  --asset=commands,skills         Filter asset types');
  console.log('  --plugin=skill                  Alias of --asset');
  console.log('  --name=frontend-implementer     Filter individual command/skill/rule names');
  console.log('  --target-project=<target-project-root>');
  console.log('                                  Sync into a project root instead of user home');
  console.log('  --dry-run                       Show planned writes without touching files');
  console.log('  --list                          Print supported terminals and asset types');
  console.log('  --help                          Show this help');
  console.log('');
  console.log('Asset aliases:');
  console.log('  commands = command, slash-command, slash-commands');
  console.log('  skills   = skill');
  console.log('  rules    = rule, project-rule');
  console.log('');
  console.log('Default target behavior:');
  console.log('  commands/skills without --target-project -> sync to user terminal directories');
  console.log('  rules without --target-project           -> sync to this repository project dirs');
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
    const assets = VALID_ASSET_TYPES.filter((assetType) => terminal.assets[assetType]);
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

async function collectCommandItems(sourceDir) {
  if (!(await pathExists(sourceDir))) {
    return [];
  }

  const files = await readDirRecursive(sourceDir);
  return files
    .filter((file) => file.endsWith('.md') && basename(file).toLowerCase() !== 'readme.md')
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
  if (assetType === 'commands') {
    return collectCommandItems(join(REPO_ROOT, 'commands'));
  }
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

  const accepted = new Set(itemNames.map((item) => item.trim()).filter(Boolean));
  return items.filter((item) => item.matchingKeys.some((key) => accepted.has(key)));
}

function resolveTargetBase(terminalKey, assetType, options) {
  const assetConfig = TERMINAL_DEFINITIONS[terminalKey]?.assets?.[assetType];
  if (!assetConfig) {
    return null;
  }

  if (options.targetProject || assetConfig.projectOnly) {
    const projectRoot = resolve(options.targetProject || REPO_ROOT);
    return join(projectRoot, ...assetConfig.projectSubdir);
  }

  return assetConfig.userTarget;
}

async function copyFileIfChanged(sourcePath, targetPath, dryRun) {
  const sourceBuffer = await fs.readFile(sourcePath);
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

async function syncItemToTarget(item, targetBase, dryRun) {
  if (item.type === 'file') {
    const targetPath = join(targetBase, item.relativeTargetPath);
    const status = await copyFileIfChanged(item.sourcePath, targetPath, dryRun);
    return [{ status, sourcePath: item.sourcePath, targetPath }];
  }

  const sourceFiles = await readDirRecursive(item.sourcePath);
  const results = [];
  for (const sourceFile of sourceFiles) {
    const relPath = relative(item.sourcePath, sourceFile);
    const targetPath = join(targetBase, item.relativeTargetPath, relPath);
    const status = await copyFileIfChanged(sourceFile, targetPath, dryRun);
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
  console.log(`Target project: ${options.targetProject || '(user-home defaults / repo rules defaults)'}`);
  console.log(`Dry run: ${options.dryRun ? 'yes' : 'no'}`);
  if (options.itemNames.length) {
    console.log(`Name filter: ${options.itemNames.join(', ')}`);
  }
  console.log('');
}

export async function syncTerminalAssets(options) {
  const targetProject = options.targetProject ? resolve(options.targetProject) : null;
  if (targetProject && !(await pathExists(targetProject))) {
    throw new Error(`Target project does not exist: ${targetProject}`);
  }

  printHeader({ ...options, targetProject });

  const itemCache = new Map();
  const summary = {
    synced: 0,
    skipped: 0,
    planned: 0,
    unsupported: 0,
    terminals: 0,
    assets: 0,
  };

  for (const terminalKey of options.terminals) {
    const terminal = TERMINAL_DEFINITIONS[terminalKey];
    console.log(`[terminal] ${terminalKey} (${terminal.label})`);
    summary.terminals += 1;

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
      const targetBase = resolveTargetBase(terminalKey, assetType, { targetProject });

      console.log(`  [asset] ${assetType} -> ${targetBase}`);
      summary.assets += 1;

      if (!selectedItems.length) {
        console.log(`    [warn] no source items selected for ${assetType}`);
        continue;
      }

      if (!options.dryRun) {
        await ensureDir(targetBase);
      }

      for (const item of selectedItems) {
        const results = await syncItemToTarget(item, targetBase, options.dryRun);
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
  console.log(`  unsupported selections: ${summary.unsupported}`);

  return summary;
}
