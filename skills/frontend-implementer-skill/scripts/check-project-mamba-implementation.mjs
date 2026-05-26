#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VUE_LINE_LIMIT = 250;
const FUNCTION_WARN_LIMIT = 70;
const FUNCTION_ERROR_LIMIT = 100;

const scriptPath = fileURLToPath(import.meta.url);

function usage() {
  console.log(`Usage:
  node ${path.relative(process.cwd(), scriptPath)} [options] [files...]

Options:
  --base=<ref>            Git base used for changed files. Default: HEAD
  --strict-vue-lines      Enforce the 250-line limit for all checked .vue files
  --help                  Show this help

When no files are provided, the script checks added/modified/untracked git files.`);
}

function parseArgs(argv) {
  const options = {
    base: 'HEAD',
    strictVueLines: false,
    files: [],
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--base=')) {
      options.base = arg.slice('--base='.length);
    } else if (arg === '--strict-vue-lines') {
      options.strictVueLines = true;
    } else {
      options.files.push(arg);
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

function normalizeGitPath(file) {
  return file.replace(/\\/g, '/');
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getChangedFiles(base) {
  const unstaged = runGit(['diff', '--name-only', '--diff-filter=ACMR', base]).split(/\r?\n/);
  const staged = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR', base]).split(/\r?\n/);
  const status = runGit(['status', '--porcelain', '--untracked-files=all'])
    .split(/\r?\n/)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);

  return unique([...unstaged, ...staged, ...status]);
}

function getStatusMap() {
  const map = new Map();
  const lines = runGit(['status', '--porcelain', '--untracked-files=all']).split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;

    const code = line.slice(0, 2);
    let file = line.slice(3).trim();
    const renameMarker = ' -> ';
    if (file.includes(renameMarker)) {
      file = file.slice(file.indexOf(renameMarker) + renameMarker.length);
    }
    map.set(normalizeGitPath(file), code);
  }

  return map;
}

function isAddedOrUntracked(statusCode) {
  if (!statusCode) return false;
  return statusCode === '??' || statusCode.includes('A');
}

function isVueLineLimitExcluded(file) {
  const normalized = normalizeGitPath(file).toLowerCase();
  const parts = normalized.split('/');
  const base = path.basename(normalized);

  return (
    parts.includes('locale') ||
    parts.includes('locales') ||
    parts.includes('i18n') ||
    parts.includes('schema') ||
    parts.includes('schemas') ||
    /(^|[-_.])(schema|config|columns|constant|constants|options)([-_.]|$)/.test(base)
  );
}

function getVueScriptBlocks(content) {
  const blocks = [];
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(content))) {
    const before = content.slice(0, match.index);
    const startLine = before.split(/\r?\n/).length;
    blocks.push({
      attrs: match[0].slice(0, match[0].indexOf('>') + 1),
      code: match[1],
      startLine,
    });
  }

  return blocks;
}

function stripRegexLiterals(line) {
  return line.replace(/\/(?:\\.|[^/\\\r\n])+\/[dgimsuvy]*/g, 'REGEX');
}

function braceDelta(rawLine) {
  const line = stripRegexLiterals(stripLineComment(rawLine));
  let delta = 0;
  let quote = null;
  let escaped = false;

  for (const char of line) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (quote) {
      if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') delta += 1;
    if (char === '}') delta -= 1;
  }

  return delta;
}

function stripLineComment(line) {
  const index = line.indexOf('//');
  return index >= 0 ? line.slice(0, index) : line;
}

function isFunctionStart(line) {
  const text = stripLineComment(line).trim();
  if (!text || text.startsWith('*') || text.startsWith('//')) return false;
  if (/^(if|for|while|switch|catch|function\s*\*)\b/.test(text)) return false;

  return (
    /\bfunction\s+[$A-Z_a-z][$\w]*\s*\([^)]*\)[^{]*\{/.test(text) ||
    /\b(?:const|let|var)\s+[$A-Z_a-z][$\w]*\s*=\s*(?:async\s*)?(?:\([^)]*\)|[$A-Z_a-z][$\w]*)\s*(?::[^=]+)?=>\s*\{/.test(text) ||
    /^(?:async\s+)?[$A-Z_a-z][$\w]*\s*\([^)]*\)\s*(?::[^{]+)?\{/.test(text)
  );
}

function functionName(line) {
  const text = stripLineComment(line).trim();
  const declaration = text.match(/\bfunction\s+([$A-Z_a-z][$\w]*)/);
  if (declaration) return declaration[1];

  const assignment = text.match(/\b(?:const|let|var)\s+([$A-Z_a-z][$\w]*)\s*=/);
  if (assignment) return assignment[1];

  const method = text.match(/^(?:async\s+)?([$A-Z_a-z][$\w]*)\s*\(/);
  if (method) return method[1];

  return '<anonymous>';
}

function findFunctionLengths(source, lineOffset = 0) {
  const lines = source.split(/\r?\n/);
  const functions = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!isFunctionStart(lines[index])) continue;

    let depth = 0;
    let end = index;

    for (let cursor = index; cursor < lines.length; cursor += 1) {
      depth += braceDelta(lines[cursor]);
      end = cursor;
      if (depth <= 0 && (cursor > index || lines[cursor].includes('{'))) break;
    }

    const length = end - index + 1;
    functions.push({
      name: functionName(lines[index]),
      start: lineOffset + index + 1,
      end: lineOffset + end + 1,
      length,
    });
  }

  return functions;
}

function lineNumberAt(source, index, lineOffset = 0) {
  return lineOffset + source.slice(0, index).split(/\r?\n/).length;
}

function findObjectLiteralAfter(source, startIndex) {
  const braceStart = source.indexOf('{', startIndex);
  if (braceStart < 0) return null;

  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      return {
        text: source.slice(braceStart, index + 1),
        start: braceStart,
      };
    }
  }

  return null;
}

function findDefinePropsBlocks(source) {
  const blocks = [];
  let cursor = 0;

  while (cursor < source.length) {
    const callIndex = source.indexOf('defineProps', cursor);
    if (callIndex < 0) break;

    const parenIndex = source.indexOf('(', callIndex);
    const objectBlock = findObjectLiteralAfter(source, parenIndex);
    if (objectBlock) blocks.push(objectBlock);
    cursor = callIndex + 'defineProps'.length;
  }

  return blocks;
}

function checkPropConventions(source, lineOffset = 0) {
  const errors = [];
  const warnings = [];
  const badImportRegex = /(^|\n)\s*import\s*\{[^}]*\bPropType\b[^}]*\}\s*from\s*['"]vue['"]/g;
  let match;

  while ((match = badImportRegex.exec(source))) {
    errors.push(`PropType import at line ${lineNumberAt(source, match.index, lineOffset)} must use import type`);
  }

  for (const block of findDefinePropsBlocks(source)) {
    const lineBase = lineNumberAt(source, block.start, lineOffset) - 1;
    const literalDefaultRegex = /default\s*:\s*(\[\s*\]|\{\s*\})/g;
    const requiredFalseRegex = /required\s*:\s*false\b/g;
    const looseArrayObjectRegex = /type\s*:\s*(Array|Object)\b(?!\s+as\s+PropType)/g;

    while ((match = literalDefaultRegex.exec(block.text))) {
      errors.push(`prop default at line ${lineNumberAt(block.text, match.index, lineBase)} must use a factory function`);
    }

    while ((match = requiredFalseRegex.exec(block.text))) {
      warnings.push(`required: false at line ${lineNumberAt(block.text, match.index, lineBase)} is usually redundant`);
    }

    while ((match = looseArrayObjectRegex.exec(block.text))) {
      warnings.push(`Array/Object prop type at line ${lineNumberAt(block.text, match.index, lineBase)} should use PropType for complex values`);
    }
  }

  return { errors, warnings };
}

function checkFile(file, statusCode, options) {
  const messages = [];
  const errors = [];
  const warnings = [];
  const absolute = path.resolve(process.cwd(), file);

  if (!existsSync(absolute)) {
    return {
      file,
      errors: [`File does not exist: ${file}`],
      warnings,
      messages,
    };
  }

  const content = readFileSync(absolute, 'utf8');
  const extension = path.extname(file).toLowerCase();
  const normalized = normalizeGitPath(file);

  if (extension === '.vue') {
    const lineCount = content.split(/\r?\n/).length;
    const excluded = isVueLineLimitExcluded(normalized);
    const enforceLineLimit = options.strictVueLines || isAddedOrUntracked(statusCode);

    if (excluded) {
      messages.push(`line limit excluded (${lineCount} lines): locale/schema/config-like file`);
    } else if (lineCount > VUE_LINE_LIMIT && enforceLineLimit) {
      errors.push(`.vue line limit exceeded: ${lineCount}/${VUE_LINE_LIMIT} lines`);
    } else if (lineCount > VUE_LINE_LIMIT) {
      warnings.push(`existing .vue exceeds ${VUE_LINE_LIMIT} lines (${lineCount}); optimize when this file is in scope`);
    } else {
      messages.push(`.vue line count ok: ${lineCount}/${VUE_LINE_LIMIT}`);
    }

    const scriptBlocks = getVueScriptBlocks(content);
    if (scriptBlocks.length === 0) {
      warnings.push('no <script> block found; verify this SFC is intentionally template-only');
    } else {
      for (const block of scriptBlocks) {
        if (!/\bsetup\b/i.test(block.attrs)) {
          errors.push(`Vue SFC script block at line ${block.startLine} is not <script setup>`);
        }
      }
    }

    for (const block of scriptBlocks) {
      const propConvention = checkPropConventions(block.code, block.startLine);
      errors.push(...propConvention.errors);
      warnings.push(...propConvention.warnings);

      for (const fn of findFunctionLengths(block.code, block.startLine)) {
        if (fn.length > FUNCTION_ERROR_LIMIT) {
          errors.push(`function ${fn.name} lines ${fn.start}-${fn.end} is ${fn.length} lines; limit is ${FUNCTION_ERROR_LIMIT}`);
        } else if (fn.length > FUNCTION_WARN_LIMIT) {
          warnings.push(`function ${fn.name} lines ${fn.start}-${fn.end} is ${fn.length} lines; prefer <= ${FUNCTION_WARN_LIMIT}`);
        }
      }
    }
  } else if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(extension)) {
    for (const fn of findFunctionLengths(content, 0)) {
      if (fn.length > FUNCTION_ERROR_LIMIT) {
        errors.push(`function ${fn.name} lines ${fn.start}-${fn.end} is ${fn.length} lines; limit is ${FUNCTION_ERROR_LIMIT}`);
      } else if (fn.length > FUNCTION_WARN_LIMIT) {
        warnings.push(`function ${fn.name} lines ${fn.start}-${fn.end} is ${fn.length} lines; prefer <= ${FUNCTION_WARN_LIMIT}`);
      }
    }
  }

  return { file: normalized, errors, warnings, messages };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const statusMap = getStatusMap();
  const files = unique(options.files.length > 0 ? options.files : getChangedFiles(options.base))
    .map(normalizeGitPath)
    .filter((file) => /\.(vue|ts|tsx|js|jsx|mjs|cjs)$/i.test(file));

  if (files.length === 0) {
    console.log('Project Mamba implementation check: no Vue/TS/JS files to inspect.');
    return;
  }

  const results = files.map((file) => checkFile(file, statusMap.get(file), options));
  const errorCount = results.reduce((sum, result) => sum + result.errors.length, 0);
  const warningCount = results.reduce((sum, result) => sum + result.warnings.length, 0);

  console.log('Project Mamba implementation check');
  console.log(`Checked files: ${results.length}`);

  for (const result of results) {
    console.log(`\n${result.file}`);
    for (const message of result.messages) console.log(`  ok: ${message}`);
    for (const warning of result.warnings) console.log(`  warn: ${warning}`);
    for (const error of result.errors) console.log(`  error: ${error}`);
  }

  console.log(`\nSummary: ${errorCount} error(s), ${warningCount} warning(s)`);
  if (errorCount > 0) process.exitCode = 1;
}

main();
