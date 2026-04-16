#!/usr/bin/env node
/**
 * sync-all.mjs
 *
 * 统一同步入口 - 同步 commands、skills、rules 到各 AI 终端
 *
 * ============================================
 * 终端支持情况（基于各终端最新官方文档）
 * ============================================
 *
 * 支持情况：
 *   终端       | Commands | Skills | Rules
 *   ----------|----------|--------|-------
 *   Claude Code |    ✅    |   ❌   |   ❌
 *   Codex     |    ❌    |   ✅   |   ❌
 *   Cursor    |    ✅    |   ✅   |   ✅
 *   Roo Code  |    ✅    |   ❌   |   ❌
 *   Trae-CN  |    ✅    |   ✅   |   ✅
 *   Cline    |    ✅    |   ❌   |   ❌
 *
 * ============================================
 * 同步目标
 * ============================================
 *
 *   commands/  --> ~/.claude/commands/   (Claude Code)
 *              --> ~/.cursor/commands/   (Cursor)
 *              --> ~/.roo/commands/     (Roo Code)
 *
 *   skills/    --> ~/.codex/skills/     (Codex)
 *              --> ~/.cursor/skills/     (Cursor)
 *
 *   rules/     --> .cursor/rules/       (Cursor)
 *              --> .trae/rules/         (Trae-CN)
 *
 * ============================================
 * 使用方法
 * ============================================
 *
 *   node scripts/sync-all.mjs
 *
 * ============================================
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
    skills: false,   // Claude Code 不支持本地 skills
    rules: false,     // Claude Code 不支持 .mdc rules
    paths: {
      commands: join(userHome, '.claude', 'commands'),
      skills: null,
      rules: null
    }
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
    }
  },

  // Cursor - https://cursor.com/docs/rules
  'cursor': {
    commands: true,
    skills: true,
    rules: true,      // Project Rules (.mdc)
    paths: {
      commands: join(userHome, '.cursor', 'commands'),
      skills: join(userHome, '.cursor', 'skills'),
      rules: join(ROOT, '.cursor', 'rules')
    }
  },

  // Roo Code - https://roocode.com/docs
  'roo-code': {
    commands: true,
    skills: false,   // Roo Code 不支持 skills
    rules: false,
    paths: {
      commands: join(userHome, '.roo', 'commands'),
      skills: null,
      rules: null
    }
  },

  // Trae-CN - https://trae.ai (兼容 Cursor 格式)
  'trae-cn': {
    commands: true,
    skills: true,
    rules: true,
    paths: {
      commands: join(userHome, '.trae', 'commands'),
      skills: join(userHome, '.trae', 'skills'),
      rules: join(ROOT, '.trae', 'rules')
    }
  },

  // Cline - https://github.com/cline/cline
  'cline': {
    commands: true,   // 支持 custom commands
    skills: false,    // 不明确
    rules: false,
    paths: {
      commands: join(userHome, '.cline', 'commands'),
      skills: null,
      rules: null
    }
  }
};

// ============================================
// 工具函数
// ============================================

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

function log(type, terminal, message) {
  const icons = {
    skip: '⏭️ ',
    sync: '✅',
    error: '❌',
    info: 'ℹ️ ',
    warn: '⚠️ '
  };
  console.log(`${icons[type] || ''} [${terminal}] ${message}`);
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
      log('skip', terminalName, 'Commands not supported');
      continue;
    }

    const targetPath = support.paths.commands;
    if (!targetPath) {
      log('skip', terminalName, 'Path not configured');
      continue;
    }

    const pathExists = await checkPathExists(dirname(targetPath));
    if (!pathExists) {
      log('skip', terminalName, `Target directory not accessible: ${dirname(targetPath)}`);
      continue;
    }

    log('info', terminalName, `Syncing to ${targetPath}`);

    for (const sourceFile of mdFiles) {
      const fileName = sourceFile.split(/[/\\]/).pop();
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
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const skillDirs = entries.filter(e => e.isDirectory() && e.name.endsWith('-skill'));

  if (skillDirs.length === 0) {
    log('warn', 'skills', 'No skill directories found');
    return;
  }

  console.log(`\n📁 Skills: Found ${skillDirs.length} skill(s)`);

  for (const [terminalName, support] of Object.entries(terminals)) {
    if (!support.skills) {
      log('skip', terminalName, 'Skills not supported');
      continue;
    }

    const targetPath = support.paths.skills;
    if (!targetPath) {
      log('skip', terminalName, 'Path not configured');
      continue;
    }

    const pathExists = await checkPathExists(dirname(targetPath));
    if (!pathExists) {
      log('skip', terminalName, `Target directory not accessible: ${dirname(targetPath)}`);
      continue;
    }

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

async function syncRules(sourceDir, terminals) {
  const sourceFiles = await readDirRecursive(sourceDir);
  const mdcFiles = sourceFiles.filter(f => f.endsWith('.mdc'));

  if (mdcFiles.length === 0) {
    log('warn', 'rules', 'No .mdc rule files found');
    return;
  }

  console.log(`\n📁 Rules: Found ${mdcFiles.length} file(s)`);

  for (const [terminalName, support] of Object.entries(terminals)) {
    if (!support.rules) {
      log('skip', terminalName, 'Project Rules not supported');
      continue;
    }

    const targetPath = support.paths.rules;
    if (!targetPath) {
      log('skip', terminalName, 'Path not configured');
      continue;
    }

    // 对于 Cursor/Trae-CN，目标是项目内目录
    if (terminalName === 'cursor' || terminalName === 'trae-cn') {
      const projectTarget = join(ROOT, terminalName === 'cursor' ? '.cursor/rules' : '.trae/rules');
      log('info', terminalName, `Syncing to ${projectTarget}`);

      for (const sourceFile of mdcFiles) {
        const relPath = relative(sourceDir, sourceFile);
        const targetFile = join(projectTarget, relPath);

        try {
          await copyFileSafe(sourceFile, targetFile);
          log('sync', terminalName, relPath);
        } catch (err) {
          log('error', terminalName, `${relPath}: ${err.message}`);
        }
      }
    }
  }
}

// ============================================
// 主入口
// ============================================

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   AI Web System - 统一同步入口');
  console.log('═══════════════════════════════════════════════');
  console.log('\n⚠️  同步前检查目标终端是否官方支持...\n');

  // 检查目标终端是否可用
  const availableTerminals = {};
  for (const [name, support] of Object.entries(TERMINAL_SUPPORT)) {
    const hasAnySupport = support.commands || support.skills || support.rules;
    const hasCommandSupport = support.commands && await checkPathExists(dirname(support.paths.commands));
    const hasSkillSupport = support.skills && await checkPathExists(dirname(support.paths.skills));

    if (hasAnySupport && (hasCommandSupport || hasSkillSupport)) {
      availableTerminals[name] = support;
    }
  }

  if (Object.keys(availableTerminals).length === 0) {
    console.log('❌ No target terminals available. Please install at least one AI coding tool:');
    console.log('   - Claude Code: https://claude.ai/code');
    console.log('   - Cursor: https://cursor.com');
    console.log('   - Codex: https://codex.org');
    console.log('   - Roo Code: https://roo.money');
    console.log('   - Trae-CN: https://trae.ai');
    process.exit(1);
  }

  console.log('✅ 可用终端:', Object.keys(availableTerminals).join(', '));

  // 同步各类资源
  const commandsSource = join(ROOT, 'commands');
  const skillsSource = join(ROOT, 'skills');
  const rulesSource = join(ROOT, 'rules');

  await syncCommands(commandsSource, availableTerminals);
  await syncSkills(skillsSource, availableTerminals);
  await syncRules(rulesSource, availableTerminals);

  console.log('\n═══════════════════════════════════════════════');
  console.log('   同步完成！');
  console.log('═══════════════════════════════════════════════');
  console.log('\n文档参考:');
  console.log('  - docs/02-资产与同步/终端适配矩阵.md');
  console.log('  - scripts/README.md');
}

main().catch(err => {
  console.error('❌ 同步失败:', err.message);
  process.exit(1);
});
