#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VUE_LINE_LIMIT = 250;
const FUNCTION_WARN_LIMIT = 70;
const FUNCTION_ERROR_LIMIT = 100;
const SCRIPT_EXTENSIONS = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const STYLE_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less', '.pcss', '.postcss']);

const scriptPath = fileURLToPath(import.meta.url);

function usage() {
  console.log(`Usage:
  node ${path.relative(process.cwd(), scriptPath)} [options] [files...]

Options:
  --base=<ref>            Git base used for changed files. Default: HEAD
  --strict-vue-lines      Enforce the 250-line limit for all checked .vue files
  --allow-empty           Allow an empty target set. Use only for explicit non-code checks
  --help                  Show this help

When no files are provided, the script checks added/modified/untracked git files.
Component/page implementation code must use Tailwind utilities or component-local <style scoped>; external style files/imports are rejected.
Repeated visual/interaction blocks should be extracted into child components, and component-local hooks/types/utils must live in a same-named component folder.`);
}

function parseArgs(argv) {
  const options = {
    base: 'HEAD',
    strictVueLines: false,
    allowEmpty: false,
    files: [],
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--base=')) {
      options.base = arg.slice('--base='.length);
    } else if (arg === '--strict-vue-lines') {
      options.strictVueLines = true;
    } else if (arg === '--allow-empty') {
      options.allowEmpty = true;
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
    }).replace(/[\r\n]+$/, '');
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

function isImplementationStyleScope(file) {
  const normalized = normalizeGitPath(file).toLowerCase();
  return (
    /^apps\/[^/]+\/src\/(?:views|components|commons)\//.test(normalized) ||
    /^apps\/common\/src\/(?:views|components|commons)\//.test(normalized) ||
    /^packages\/(?:mamba-ui|ui)\/src\/(?:views|components)\//.test(normalized)
  );
}

function isStyleExtension(extension) {
  return STYLE_EXTENSIONS.has(extension);
}

function isScriptExtension(extension) {
  return SCRIPT_EXTENSIONS.has(extension);
}

function findExternalStyleReferences(source, lineOffset = 0) {
  const errors = [];
  const styleImportRegex = /(^|\n)\s*import\s+(?:[^'"]*?\s+from\s+)?['"][^'"]+\.(?:css|scss|sass|less|pcss|postcss)(?:\?[^'"]*)?['"]/gi;
  const vueStyleSrcRegex = /<style\b[^>]*\bsrc\s*=\s*['"][^'"]+['"][^>]*>/gi;
  const styleAtImportRegex = /(^|\n)\s*@(import|use|forward)\s+['"][^'"]+\.(?:css|scss|sass|less|pcss|postcss)(?:\?[^'"]*)?['"]/gi;
  let match;

  while ((match = styleImportRegex.exec(source))) {
    errors.push(`external style import at line ${lineNumberAt(source, match.index, lineOffset)} is not allowed; use Tailwind utilities or component-local <style scoped>`);
  }

  while ((match = vueStyleSrcRegex.exec(source))) {
    errors.push(`<style src> at line ${lineNumberAt(source, match.index, lineOffset)} is not allowed; keep component styles in scoped style blocks`);
  }

  while ((match = styleAtImportRegex.exec(source))) {
    errors.push(`style @${match[2]} at line ${lineNumberAt(source, match.index, lineOffset)} is not allowed in component/page implementation code`);
  }

  return errors;
}

function findScrollbarPolicyViolations(source, lineOffset = 0) {
  const errors = [];
  const customScrollbarRegexes = [
    /::-(?:webkit-)?scrollbar[\w-]*/gi,
    /\bscrollbar-(?:width|color)\s*:/gi,
    /\b-ms-overflow-style\s*:/gi,
  ];
  const nativeOverflowRegex = /\boverflow(?:-[xy])?\s*:\s*(?:auto|scroll)\b/gi;
  let match;

  for (const regex of customScrollbarRegexes) {
    while ((match = regex.exec(source))) {
      errors.push(`custom scrollbar styling at line ${lineNumberAt(source, match.index, lineOffset)} is not allowed; use el-scrollbar`);
    }
  }

  while ((match = nativeOverflowRegex.exec(source))) {
    errors.push(`native overflow scrollbar at line ${lineNumberAt(source, match.index, lineOffset)} is not allowed; use el-scrollbar`);
  }

  return errors;
}

function findScrollbarClassViolations(source, lineOffset = 0) {
  const errors = [];
  const scrollUtilities = new Set(['overflow-auto', 'overflow-scroll', 'overflow-x-auto', 'overflow-x-scroll', 'overflow-y-auto', 'overflow-y-scroll']);
  const classRegex = /\bclass\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = classRegex.exec(source))) {
    const tokens = match[1].split(/\s+/).filter(Boolean);
    const badToken = tokens.find((token) => {
      const utility = token.split(':').pop();
      return scrollUtilities.has(utility) || utility === 'no-scrollbar' || /^scrollbar(?:-|$)/.test(utility);
    });

    if (badToken) {
      errors.push(`scrollbar utility class "${badToken}" at line ${lineNumberAt(source, match.index, lineOffset)} is not allowed; use el-scrollbar`);
    }
  }

  return errors;
}

function findScrollbarViolations(source, lineOffset = 0) {
  return [
    ...findScrollbarPolicyViolations(source, lineOffset),
    ...findScrollbarClassViolations(source, lineOffset),
  ];
}

function getAttrValue(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? match[1] : '';
}

function normalizeClassValue(classValue) {
  return classValue
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .sort()
    .join(' ');
}

function isInteractiveClassValue(classValue) {
  return (
    /\bcursor-pointer\b/.test(classValue) ||
    /\btransition/.test(classValue) ||
    /\bhover:/.test(classValue) ||
    /\bfocus:/.test(classValue) ||
    /\bactive:/.test(classValue)
  );
}

function countBy(items) {
  const map = new Map();
  for (const item of items) {
    if (!item) continue;
    map.set(item, (map.get(item) || 0) + 1);
  }
  return map;
}

function checkRepeatedVisualInteractionBlocks(source) {
  const errors = [];
  const popoverKeys = [];
  const popoverRegex = /<el-popover\b([^>]*)>[\s\S]*?<template\s+#reference>[\s\S]*?<button\b([^>]*)>/gi;
  let match;

  while ((match = popoverRegex.exec(source))) {
    const popoverAttrs = match[1];
    const buttonAttrs = match[2];
    const buttonClass = normalizeClassValue(getAttrValue(buttonAttrs, 'class'));
    if (!buttonClass || !isInteractiveClassValue(buttonClass)) continue;

    const key = [
      getAttrValue(popoverAttrs, 'placement') || 'default-placement',
      getAttrValue(popoverAttrs, 'trigger') || 'default-trigger',
      getAttrValue(popoverAttrs, 'popper-class') || 'default-popper',
      buttonClass,
    ].join('|');
    popoverKeys.push(key);
  }

  for (const [, count] of countBy(popoverKeys)) {
    if (count >= 3) {
      errors.push(`repeated el-popover trigger shell appears ${count} times; extract the shared visual/interaction shell into a child component`);
    }
  }

  const classValues = [];
  const classRegex = /\bclass\s*=\s*["']([^"']+)["']/gi;
  while ((match = classRegex.exec(source))) {
    const value = normalizeClassValue(match[1]);
    if (value.split(/\s+/).length < 6 || !isInteractiveClassValue(value)) continue;
    classValues.push(value);
  }

  for (const [classValue, count] of countBy(classValues)) {
    if (count >= 3) {
      errors.push(`repeated interactive class block appears ${count} times; extract it into a child component instead of duplicating the visual/interaction code (${classValue.slice(0, 120)}...)`);
    }
  }

  return unique(errors);
}

function getComponentsPathInfo(file) {
  const normalized = normalizeGitPath(file);
  const parts = normalized.split('/');
  const componentIndex = parts.lastIndexOf('components');
  if (componentIndex < 0) return null;

  const after = parts.slice(componentIndex + 1);
  if (after.length === 0) return null;

  return {
    after,
    componentRoot: parts.slice(0, componentIndex + 1).join('/'),
    directChild: after.length === 1,
    folderName: after.length > 1 ? after[0] : '',
    baseName: path.basename(normalized),
    extension: path.extname(normalized).toLowerCase(),
  };
}

function isComponentLocalSupportFile(file) {
  const baseName = path.basename(file);
  return /^(use[A-Z].*|types|utils|.*\.(types|utils))\.(ts|tsx|js|jsx)$/.test(baseName);
}

function importsSiblingSupportFile(source) {
  return /from\s*['"]\.\/(?:use[A-Z][^'"]*|types|utils|[^/'"]+\.(?:types|utils))['"]/g.test(source);
}

function checkComponentColocation(file, content) {
  const errors = [];
  const info = getComponentsPathInfo(file);
  if (!info) return errors;

  if (info.extension === '.vue' && info.directChild && importsSiblingSupportFile(content)) {
    const componentName = path.basename(info.baseName, '.vue');
    errors.push(`component-local hooks/types/utils for ${info.baseName} must live under ${info.componentRoot}/${componentName}/ with ${componentName}.vue, not as sibling files in components/`);
  }

  if (isComponentLocalSupportFile(file)) {
    if (info.directChild) {
      errors.push(`component-local support file ${info.baseName} must be placed in a same-named component folder with its owning .vue file`);
    } else {
      const expectedComponent = `${info.componentRoot}/${info.folderName}/${info.folderName}.vue`;
      if (!existsSync(path.resolve(process.cwd(), expectedComponent))) {
        errors.push(`component-local support file ${info.baseName} must live beside ${info.folderName}.vue in ${info.componentRoot}/${info.folderName}/`);
      }
    }
  }

  return errors;
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

function addFunctionLengthFindings(source, lineOffset, errors, warnings) {
  for (const fn of findFunctionLengths(source, lineOffset)) {
    if (fn.length > FUNCTION_ERROR_LIMIT) {
      errors.push(`function ${fn.name} lines ${fn.start}-${fn.end} is ${fn.length} lines; limit is ${FUNCTION_ERROR_LIMIT}`);
    } else if (fn.length > FUNCTION_WARN_LIMIT) {
      warnings.push(`function ${fn.name} lines ${fn.start}-${fn.end} is ${fn.length} lines; prefer <= ${FUNCTION_WARN_LIMIT}`);
    }
  }
}

function checkVueLineLimit(content, normalized, statusCode, options, messages, errors, warnings) {
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
}

function checkVueFile(content, normalized, statusCode, options, result) {
  const { messages, errors, warnings } = result;
  if (isImplementationStyleScope(normalized)) {
    errors.push(...findExternalStyleReferences(content, 0));
    errors.push(...findScrollbarViolations(content, 0));
    errors.push(...checkRepeatedVisualInteractionBlocks(content));
    errors.push(...checkComponentColocation(normalized, content));
  }

  checkVueLineLimit(content, normalized, statusCode, options, messages, errors, warnings);

  const scriptBlocks = getVueScriptBlocks(content);
  if (scriptBlocks.length === 0) {
    warnings.push('no <script> block found; verify this SFC is intentionally template-only');
  }

  for (const block of scriptBlocks) {
    if (!/\bsetup\b/i.test(block.attrs)) {
      errors.push(`Vue SFC script block at line ${block.startLine} is not <script setup>`);
    }
    const propConvention = checkPropConventions(block.code, block.startLine);
    errors.push(...propConvention.errors);
    warnings.push(...propConvention.warnings);
    addFunctionLengthFindings(block.code, block.startLine, errors, warnings);
  }
}

function checkScriptFile(content, normalized, result) {
  const { errors, warnings } = result;
  if (isImplementationStyleScope(normalized)) {
    errors.push(...findExternalStyleReferences(content, 0));
    errors.push(...findScrollbarViolations(content, 0));
    errors.push(...checkComponentColocation(normalized, content));
  }

  addFunctionLengthFindings(content, 0, errors, warnings);
}

function checkFile(file, statusCode, options) {
  const result = { file: normalizeGitPath(file), errors: [], warnings: [], messages: [] };
  const absolute = path.resolve(process.cwd(), file);

  if (!existsSync(absolute)) {
    result.errors.push(`File does not exist: ${file}`);
    return result;
  }

  const content = readFileSync(absolute, 'utf8');
  const extension = path.extname(file).toLowerCase();
  const inImplementationStyleScope = isImplementationStyleScope(result.file);

  if (extension === '.vue') {
    checkVueFile(content, result.file, statusCode, options, result);
  } else if (isScriptExtension(extension)) {
    checkScriptFile(content, result.file, result);
  } else if (isStyleExtension(extension) && inImplementationStyleScope) {
    const { errors } = result;
    errors.push('external style file in a view/component scope is not allowed; move styles into the owning .vue <style scoped> block or an existing shared style entry');
    errors.push(...findScrollbarViolations(content, 0));
  }

  return result;
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
    .filter((file) => {
      const extension = path.extname(file).toLowerCase();
      return isScriptExtension(extension) || isStyleExtension(extension);
    });

  if (files.length === 0) {
    console.log('Project Mamba implementation check: no Vue/TS/JS/style files to inspect.');
    if (!options.allowEmpty) {
      console.error('error: empty check is not allowed; pass explicit target files or use --allow-empty with a reason in the final checklist');
      process.exitCode = 1;
    }
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
