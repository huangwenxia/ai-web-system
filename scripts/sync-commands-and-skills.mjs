#!/usr/bin/env node
/**
 * sync-commands-and-skills.mjs
 *
 * 作用：同步 Commands 和 Skills 到各 AI 终端
 *
 * 终端支持检测（基于各终端最新官方文档）：
 * - Claude Code: ✅ Commands | ❌ Skills | ❌ Rules
 * - Codex: ❌ Commands | ✅ Skills | ❌ Rules
 * - Cursor: ✅ Commands | ✅ Skills | ✅ Rules
 * - Roo Code: ✅ Commands | ❌ Skills | ❌ Rules
 * - Trae-CN: ✅ Commands | ✅ Skills | ✅ Rules
 *
 * 使用方法：
 * node scripts/sync-commands-and-skills.mjs
 *
 * 文档参考：
 * - docs/02-资产与同步/终端适配矩阵.md
 * - scripts/README.md
 */

import { promises as fs } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const userHome = process.env.HOME || process.env.USERPROFILE;

// ============================================
// 终端支持检测 - 基于各终端最新官方文档
// ============================================

const TERMINAL_SUPPORT = {
  // Claude Code - https://docs.anthropic.com/en/docs/claude-code
  'claude-code': {
    commands: true,
    skills: false,    // Claude Code 不支持本地 skills
    rules: false,
    paths: {
      commands: join(userHome, '.claude', 'commands'),
      skills: null,
      rules: null
    },
    docs: 'https://docs.anthropic.com/en/docs/claude-code'
  },

  // Codex - https://docs.codex.org
  'codex': {
    commands: false,  // Codex 不支持独立的 commands
    skills: true,
    rules: false,
    paths: {
      commands: null,
      skills: join(userHome, '.codex', 'skills'),
      rules: null
    },
    docs: 'https://docs.codex.org'
  },

  // Cursor - https://cursor.com/docs/rules
  'cursor': {
    commands: true,
    skills: true,
    rules: true,
    paths: {
      commands: join(userHome, '.cursor', 'commands'),
      skills: join(userHome, '.cursor', 'skills'),
      rules: join(ROOT, '.cursor', 'rules')
    },
    docs: 'https://cursor.com/docs/rules'
  },

  // Roo Code - https://roocode.com/docs
  'roo-code': {
    commands: true,
    skills: false,    // Roo Code 不支持 skills
    rules: false,
    paths: {
      commands: join(userHome, '.roo', 'commands'),
      skills: null,
      rules: null
    },
    docs: 'https://roocode.com/docs'
  },

  // Trae-CN - https://trae.ai
  'trae-cn': {
    commands: true,
    skills: true,
    rules: true,      // 兼容 Cursor 格式
    paths: {
      commands: join(userHome, '.trae', 'commands'),
      skills: join(userHome, '.trae', 'skills'),
      rules: join(ROOT, '.trae', 'rules')
    },
    docs: 'https://trae.ai'
  },

  // Cline - https://github.com/cline/cline
  'cline': {
    commands: true,
    skills: false,    // 不明确
    rules: false,
    paths: {
      commands: join(userHome, '.cline', 'commands'),
      skills: null,
      rules: null
    },
    docs: 'https://github.com/cline/cline'
  }
};

// ============================================
// 工具函数
// ============================================

function log(type, terminal, message) {
  const icons = {
    skip: '⏭️ ',
    sync: '✅',
    error: '❌',
    info: 'ℹ️ ',
    warn: '⚠️ ',
    terminal: '🔍'
  };
  console.log(`${icons[type] || ''} [${terminal}] ${message}`);
}

async function checkPathExists(path) {
  if (!path) return false;
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  if (!dir) return false;
  try {
    await fs.mkdir(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

async function readDirRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await readDirRecursive(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function copyFileSafe(source, target) {
  const content = await fs.readFile(source, 'utf-8');
  await ensureDir(dirname(target));
  await fs.writeFile(target, content, 'utf-8');
}

async function copyDirSafe(source, target) {
  await ensureDir(target);
  const files = await readDirRecursive(source);
  for (const file of files) {
    const relPath = relative(source, file);
    const targetPath = join(target, relPath);
    await copyFileSafe(file, targetPath);
  }
}

function getFileName(filePath) {
  return filePath.split(/[/\\]/).pop();
}

// ============================================
// 同步模块
// ============================================

async function syncCommands(sourceDir, terminals) {
  const sourceFiles = await readDirRecursive(sourceDir);
  const mdFiles = sourceFiles.filter(f => f.endsWith('.md') && !f.endsWith('README.md'));

  if (mdFiles.length === 0) {
    log('warn', 'commands', 'No command files found');
    return;
  }

  console.log(`\n📁 Commands: Found ${mdFiles.length} file(s)`);

  for (const [terminalName, support] of Object.entries(terminals)) {
    if (!support.commands) {
      log('skip', terminalName, 'Commands not supported by this terminal');
      continue;
    }

    const targetPath = support.paths.commands;
    if (!targetPath) {
      log('skip', terminalName, 'Path not configured');
      continue;
    }

    const parentDir = dirname(targetPath);
    const pathExists = await checkPathExists(parentDir);
    if (!pathExists) {
      log('skip', terminalName, `Target directory not accessible: ${parentDir}`);
      continue;
    }

    await ensureDir(targetPath);
    log('info', terminalName, `Syncing to ${targetPath}`);

    for (const sourceFile of mdFiles) {
      const fileName = getFileName(sourceFile);
      const targetFile = join(targetPath, fileName);

      try {
        await copyFileSafe(sourceFile, targetFile);
        log('sync', terminalName, fileName);
      } catch (err) {
        log('error', terminalName, `${fileName}: ${err.message}`);
      }
    }
  }
}

async function syncSkills(sourceDir, terminals) {
  let entries;
  try {
    entries = await fs.readdir(sourceDir, { withFileTypes: true });
  } catch {
    log('warn', 'skills', 'Skills directory not found');
    return;
  }

  const skillDirs = entries.filter(e => e.isDirectory() && e.name.endsWith('-skill'));

  if (skillDirs.length === 0) {
    log('warn', 'skills', 'No skill directories found');
    return;
  }

  console.log(`\n📁 Skills: Found ${skillDirs.length} skill(s)`);

  for (const [terminalName, support] of Object.entries(terminals)) {
    if (!support.skills) {
      log('skip', terminalName, 'Skills not supported by this terminal');
      continue;
    }

    const targetPath = support.paths.skills;
    if (!targetPath) {
      log('skip', terminalName, 'Path not configured');
      continue;
    }

    const parentDir = dirname(targetPath);
    const pathExists = await checkPathExists(parentDir);
    if (!pathExists) {
      log('skip', terminalName, `Target directory not accessible: ${parentDir}`);
      continue;
    }

    await ensureDir(targetPath);
    log('info', terminalName, `Syncing to ${targetPath}`);

    for (const skill of skillDirs) {
      const sourceSkillDir = join(sourceDir, skill.name);
      const targetSkillDir = join(targetPath, skill.name);

      try {
        await copyDirSafe(sourceSkillDir, targetSkillDir);
        log('sync', terminalName, skill.name);
      } catch (err) {
        log('error', terminalName, `${skill.name}: ${err.message}`);
      }
    }
  }
}

// ============================================
// 终端检测报告
// ============================================

function printTerminalSupport() {
  console.log('\n🔍 Terminal Support Check (based on official docs):\n');

  for (const [name, support] of Object.entries(TERMINAL_SUPPORT)) {
    const cmd = support.commands ? '✅' : '❌';
    const skl = support.skills ? '✅' : '❌';
    const rls = support.rules ? '✅' : '❌';
    console.log(`   ${name}: Commands ${cmd} | Skills ${skl} | Rules ${rls}`);
  }
}

// ============================================
// 主入口
// ============================================

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   Sync Commands & Skills to AI Terminals');
  console.log('═══════════════════════════════════════════════\n');

  printTerminalSupport();

  // 确定哪些终端实际可用
  const availableTerminals = {};
  console.log('\n⚠️  Checking available terminals...\n');

  for (const [name, support] of Object.entries(TERMINAL_SUPPORT)) {
    const hasAnySupport = support.commands || support.skills;
    if (!hasAnySupport) continue;

    // 检查至少有一个路径可用
    let hasAccessiblePath = false;

    if (support.commands && support.paths.commands) {
      const parentDir = dirname(support.paths.commands);
      if (await checkPathExists(parentDir)) {
        hasAccessiblePath = true;
      }
    }

    if (support.skills && support.paths.skills) {
      const parentDir = dirname(support.paths.skills);
      if (await checkPathExists(parentDir)) {
        hasAccessiblePath = true;
      }
    }

    if (hasAccessiblePath) {
      availableTerminals[name] = support;
      log('info', name, 'Available');
    } else {
      log('skip', name, 'Terminal not installed or not accessible');
    }
  }

  if (Object.keys(availableTerminals).length === 0) {
    console.log('\n❌ No target terminals available. Please install at least one AI coding tool:');
    console.log('   - Claude Code: https://claude.ai/code');
    console.log('   - Cursor: https://cursor.com');
    console.log('   - Codex: https://codex.org');
    console.log('   - Roo Code: https://roo.money');
    console.log('   - Trae-CN: https://trae.ai');
    process.exit(1);
  }

  console.log('\n✅ Available terminals:', Object.keys(availableTerminals).join(', '));

  // 同步资源
  const commandsSource = join(ROOT, 'commands');
  const skillsSource = join(ROOT, 'skills');

  await syncCommands(commandsSource, availableTerminals);
  await syncSkills(skillsSource, availableTerminals);

  console.log('\n═══════════════════════════════════════════════');
  console.log('   Sync Complete!');
  console.log('═══════════════════════════════════════════════');
  console.log('\n📚 文档参考:');
  console.log('   - docs/02-资产与同步/终端适配矩阵.md');
  console.log('   - scripts/README.md');
}

main().catch(err => {
  console.error('\n❌ Sync failed:', err.message);
  process.exit(1);
});
