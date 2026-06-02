#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VUE_LINE_LIMIT = 250;
const FUNCTION_WARN_LIMIT = 70;
const FUNCTION_ERROR_LIMIT = 100;
const RECURSIVE_EXTRACTION_AUDIT_ROUNDS = 3;
const VIEWPORT_BREAKPOINT_MANY_THRESHOLD = 3;
const VIEWPORT_BREAKPOINT_CLUSTER_THRESHOLD = 80;
const SCRIPT_EXTENSIONS = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const STYLE_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less', '.pcss', '.postcss']);
const MOJIBAKE_TOKENS = [
  0xfffd,
  0x951f,
  0x9983,
  0x923f,
  0x59dd,
  0x93c2,
  0x7efe,
  0x9352,
  0x7487,
].map((codePoint) => String.fromCharCode(codePoint));

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
Repeated visual/interaction blocks and heavy conditional state branches should be extracted into child components, component-local hooks/types/constants/utils must live in a same-named component folder with index.vue, and icon usage must be covered by the final prototype icon semantic/dependency review.`);
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

function isViewEntryVue(file) {
  const normalized = normalizeGitPath(file).toLowerCase();
  if (!/^apps\/[^/]+\/src\/views\/.+\.vue$/.test(normalized)) return false;

  const baseName = path.basename(normalized);
  if (baseName === 'index.vue') return true;

  const ownerDirName = path.basename(path.dirname(normalized));
  return path.basename(baseName, '.vue') === ownerDirName;
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

const TAILWIND_PREFERRED_CSS_PROPERTIES = new Set([
  'display',
  'flex',
  'flex-direction',
  'flex-wrap',
  'align-items',
  'align-content',
  'justify-content',
  'justify-items',
  'gap',
  'row-gap',
  'column-gap',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'font-size',
  'font-weight',
  'line-height',
  'text-align',
  'border-radius',
]);

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function isSimpleStyleSelector(selector) {
  const normalized = selector.trim();
  if (!normalized || normalized.startsWith('@')) return false;
  if (/(^|[\s,])(:deep|::v-deep|:global|::part|::slotted)\b/.test(normalized)) return false;
  if (/:(?!where\b|is\b|not\b|has\b)/.test(normalized)) return false;
  return true;
}

function getTailwindPreferredDeclarations(ruleBody) {
  const declarations = [];
  const declarationRegex = /([a-z-]+)\s*:/gi;
  let match;

  while ((match = declarationRegex.exec(ruleBody))) {
    const property = match[1].toLowerCase();
    if (property.startsWith('--')) continue;
    if (TAILWIND_PREFERRED_CSS_PROPERTIES.has(property)) declarations.push(property);
  }

  return Array.from(new Set(declarations));
}

function findTailwindPreferenceWarnings(source, lineOffset = 0) {
  const warnings = [];
  const cleanSource = stripCssComments(source);
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleanSource))) {
    const selector = match[1];
    if (!isSimpleStyleSelector(selector)) continue;

    const declarations = getTailwindPreferredDeclarations(match[2]);
    if (declarations.length < 3) continue;

    warnings.push(
      `style rule at line ${lineNumberAt(cleanSource, match.index, lineOffset)} contains simple layout/spacing/size declarations (${declarations.slice(0, 6).join(', ')}); prefer Tailwind utilities in template, keep scoped style for deep overrides, pseudo states, media/container queries, or hard-to-express styles`,
    );
  }

  return warnings;
}

function findViewportBreakpointWarnings(source, lineOffset = 0) {
  const cleanSource = stripCssComments(source);
  const mediaRegex = /@media\s+([^{]+)\{/gi;
  const breakpointsByValue = new Map();
  let mediaMatch;

  while ((mediaMatch = mediaRegex.exec(cleanSource))) {
    const params = mediaMatch[1];
    const widthRegex = /\b(?:min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\b/gi;
    let widthMatch;

    while ((widthMatch = widthRegex.exec(params))) {
      const value = Number(widthMatch[1]);
      if (!Number.isFinite(value)) continue;
      if (!breakpointsByValue.has(value)) {
        breakpointsByValue.set(value, lineNumberAt(cleanSource, mediaMatch.index, lineOffset));
      }
    }
  }

  const breakpoints = Array.from(breakpointsByValue.entries())
    .map(([value, line]) => ({ value, line }))
    .sort((a, b) => a.value - b.value);
  if (breakpoints.length === 0) return [];

  const warnings = [];
  if (breakpoints.length >= VIEWPORT_BREAKPOINT_MANY_THRESHOLD) {
    warnings.push(
      `viewport media breakpoints at lines ${breakpoints.map((item) => item.line).join(', ')} (${breakpoints.map((item) => `${item.value}px`).join(', ')}) should be justified in the final checklist; prefer flex natural wrapping/shrinking with flex-wrap, flex-basis, min/max width, gap, and ml-auto before adding multiple viewport breakpoints`,
    );
  }

  const clusteredPairs = [];
  for (let index = 1; index < breakpoints.length; index += 1) {
    const previous = breakpoints[index - 1];
    const current = breakpoints[index];
    if (current.value - previous.value <= VIEWPORT_BREAKPOINT_CLUSTER_THRESHOLD) {
      clusteredPairs.push(`${previous.value}px/${current.value}px`);
    }
  }

  if (clusteredPairs.length > 0) {
    warnings.push(
      `clustered viewport media breakpoints (${clusteredPairs.join(', ')}) suggest hand-tuned wrapping; prefer flex-wrap/flex-basis/min-w/max-w/gap/ml-auto and keep only semantic layout breakpoints`,
    );
  }

  return warnings;
}

function findVueStyleBlockScopeErrors(block) {
  if (/\bscoped\b/i.test(block.attrs)) return [];
  return [`Vue style block at line ${block.startLine} must be <style scoped>; use Tailwind utilities first and keep component-private CSS scoped`];
}

function isCjkOrChinesePunctuation(codePoint) {
  return (
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0x3000 && codePoint <= 0x303f) ||
    (codePoint >= 0xff00 && codePoint <= 0xffef)
  );
}

function isEscaped(index, text) {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

function isInsideQuotedString(line, column) {
  const quoteOpen = { "'": false, '"': false, '`': false };
  for (let index = 0; index < column; index += 1) {
    const char = line[index];
    if ((char === "'" || char === '"' || char === '`') && !isEscaped(index, line)) {
      quoteOpen[char] = !quoteOpen[char];
    }
  }

  return quoteOpen["'"] || quoteOpen['"'] || quoteOpen['`'];
}

function lineInfoAt(source, index) {
  const lineStart = source.lastIndexOf('\n', index - 1) + 1;
  const lineEnd = source.indexOf('\n', index);
  const end = lineEnd >= 0 ? lineEnd : source.length;
  return {
    text: source.slice(lineStart, end),
    column: index - lineStart,
  };
}

function isUnicodeRangeEscape(line, column) {
  const before = line.slice(Math.max(0, column - 16), column);
  const after = line.slice(column + 6, column + 24);

  return /\\{1,2}u[0-9a-fA-F]{4}\s*-\s*\\?$/.test(before) || /^\s*-\s*\\{1,2}u[0-9a-fA-F]{4}/.test(after);
}

function isInsideRegexLiteral(line, column) {
  const before = line.slice(0, column);
  const after = line.slice(column + 6);
  const lastSlash = before.search(/\/(?:[^/\\]|\\.)*$/);
  if (lastSlash < 0 || before[lastSlash - 1] === '/') return false;

  return /(?:[^/\\]|\\.)*\//.test(after);
}

function findEscapedChineseText(source, lineOffset = 0) {
  const errors = [];
  const unicodeEscapeRegex = /\\u([0-9a-fA-F]{4})/g;
  let match;

  while ((match = unicodeEscapeRegex.exec(source))) {
    const codePoint = Number.parseInt(match[1], 16);
    const line = lineInfoAt(source, match.index);
    if (!isCjkOrChinesePunctuation(codePoint)) continue;
    if (isUnicodeRangeEscape(line.text, line.column)) continue;
    if (!isInsideQuotedString(line.text, line.column) && !isInsideRegexLiteral(line.text, line.column)) continue;

    errors.push(`Chinese unicode escape "${match[0]}" at line ${lineNumberAt(source, match.index, lineOffset)} is not allowed; write readable Chinese text directly unless it is a Unicode character range such as \\u4e00-\\u9fff`);
  }

  return errors;
}

function findMojibakeText(source, lineOffset = 0) {
  const errors = [];

  for (const token of MOJIBAKE_TOKENS) {
    let index = source.indexOf(token);
    while (index >= 0) {
      errors.push(`possible mojibake "${token}" at line ${lineNumberAt(source, index, lineOffset)}; keep source files UTF-8 and readable, do not fix by unicode-escaping Chinese text`);
      index = source.indexOf(token, index + token.length);
    }
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

function findGridPolicyViolations(source, lineOffset = 0) {
  const errors = [];
  const gridCssRegexes = [
    /\bdisplay\s*:\s*(?:inline-)?grid\b/gi,
    /\bgrid(?:-(?:template(?:-(?:columns|rows|areas))?|auto(?:-(?:flow|columns|rows))?|column|row|area))?\s*:/gi,
  ];
  let match;

  for (const regex of gridCssRegexes) {
    while ((match = regex.exec(source))) {
      errors.push(`CSS grid layout at line ${lineNumberAt(source, match.index, lineOffset)} is not allowed; use flex layout`);
    }
  }

  return errors;
}

function isGridUtility(utility) {
  return (
    utility === 'grid' ||
    utility === 'inline-grid' ||
    /^grid-(?:cols|rows|flow)-/.test(utility) ||
    /^(?:col|row)-(?:span|start|end)-/.test(utility) ||
    /^auto-(?:cols|rows)-/.test(utility) ||
    /^place-(?:content|items|self)-/.test(utility)
  );
}

function findGridClassViolations(source, lineOffset = 0) {
  const errors = [];
  const classRegex = /\bclass\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = classRegex.exec(source))) {
    const tokens = match[1].split(/\s+/).filter(Boolean);
    const badToken = tokens.find((token) => isGridUtility(token.split(':').pop()));

    if (badToken) {
      errors.push(`grid utility class "${badToken}" at line ${lineNumberAt(source, match.index, lineOffset)} is not allowed; use flex layout`);
    }
  }

  return errors;
}

function findGridViolations(source, lineOffset = 0) {
  return [
    ...findGridPolicyViolations(source, lineOffset),
    ...findGridClassViolations(source, lineOffset),
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

function findStateBranchExtractionWarnings(source, lineOffset = 0) {
  const warnings = [];
  const branchRegex = /\bv-(if|else-if|else)\b(?:\s*=\s*["']([^"']*)["'])?/gi;
  const stateLikePattern = /(loading|error|empty|permission|authorized|disabled|filtered|scope|list|items|length|retry)/i;
  const branches = [];
  let match;

  while ((match = branchRegex.exec(source))) {
    branches.push({
      directive: match[1],
      expression: match[2] || '',
      line: lineNumberAt(source, match.index, lineOffset),
    });
  }

  const stateLikeCount = branches.filter((branch) => stateLikePattern.test(branch.expression)).length;
  if (branches.length >= 4 && stateLikeCount >= 2) {
    const firstLine = branches[0].line;
    warnings.push(
      `template has ${branches.length} conditional branches (${stateLikeCount} state-like) starting near line ${firstLine}; consider extracting loading/error/empty/list state UI into a child component`,
    );
  }

  return warnings;
}

function countPattern(source, regex) {
  let count = 0;
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(source))) {
    count += 1;
  }
  return count;
}

function findPageEntryStructureWarnings(content, normalized) {
  if (!isViewEntryVue(normalized)) return [];

  const templateBlocks = getVueTemplateBlocks(content);
  const template = templateBlocks.map((block) => block.code).join('\n');
  if (!template.trim()) return [];

  const templateLineCount = template.split(/\r?\n/).length;
  const sectionLikeCount = countPattern(template, /<(?:section|aside|article|el-scrollbar|MainBox|HeaderBox)\b/gi);
  const branchCount = countPattern(template, /\bv-(?:if|else-if|else)\b/gi);
  const loopCount = countPattern(template, /\bv-for\b/gi);
  const complexScore = sectionLikeCount + branchCount + loopCount;

  if (templateLineCount >= 120 && complexScore >= 8) {
    return [
      `primary structure check: view entry ${normalized} has ${templateLineCount} template lines with ${sectionLikeCount} section-like blocks, ${branchCount} conditional branches, and ${loopCount} loops; review extraction into page-private components before delivery`,
    ];
  }

  if (branchCount >= 5 || loopCount >= 4) {
    return [
      `primary structure check: view entry ${normalized} has ${branchCount} conditional branches and ${loopCount} loops; keep index/main .vue as orchestration and extract stable UI blocks when readability drops`,
    ];
  }

  return [];
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
  return /^(use[A-Z].*|types|type|constants|constant|utils|.*\.(types|utils|constants))\.(ts|tsx|js|jsx)$/.test(baseName);
}

function importsSiblingSupportFile(source) {
  return /from\s*['"]\.\/(?:use[A-Z][^'"]*|types|type|constants|constant|utils|[^/'"]+\.(?:types|utils|constants))['"]/g.test(source);
}

function hasComponentEntry(componentRoot, folderName) {
  const folder = `${componentRoot}/${folderName}`;
  return existsSync(path.resolve(process.cwd(), folder, 'index.vue'));
}

function checkComponentColocation(file, content) {
  const errors = [];
  const info = getComponentsPathInfo(file);
  if (!info) return errors;

  if (info.extension === '.vue' && !info.directChild && info.baseName === `${info.folderName}.vue`) {
    errors.push(`component capsule ${info.componentRoot}/${info.folderName}/ must use index.vue as the entry; rename ${info.baseName} to index.vue`);
  }

  if (info.extension === '.vue' && info.directChild && importsSiblingSupportFile(content)) {
    const componentName = path.basename(info.baseName, '.vue');
    errors.push(`component-local hooks/types/constants/utils for ${info.baseName} must live under ${info.componentRoot}/${componentName}/ with index.vue, not as sibling files in components/`);
  }

  if (isComponentLocalSupportFile(file)) {
    if (info.directChild) {
      errors.push(`component-local support file ${info.baseName} must be placed in a same-named component folder with index.vue`);
    } else {
      if (!hasComponentEntry(info.componentRoot, info.folderName)) {
        errors.push(`component-local support file ${info.baseName} must live beside index.vue in ${info.componentRoot}/${info.folderName}/`);
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

function getVueTemplateBlocks(content) {
  const blocks = [];
  const templateRegex = /<template\b[^>]*>([\s\S]*?)<\/template>/gi;
  let match;

  while ((match = templateRegex.exec(content))) {
    const before = content.slice(0, match.index);
    const startLine = before.split(/\r?\n/).length;
    blocks.push({
      code: match[1],
      startLine,
    });
  }

  return blocks;
}

function getVueStyleBlocks(content) {
  const blocks = [];
  const styleRegex = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  let match;

  while ((match = styleRegex.exec(content))) {
    const before = content.slice(0, match.index);
    const startLine = before.split(/\r?\n/).length;
    blocks.push({
      attrs: match[1],
      code: match[2],
      startLine,
    });
  }

  return blocks;
}

function getRelativeVueImportSpecifiers(content) {
  const specifiers = [];
  const sourceRegex = /\bfrom\s*['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  let match;

  while ((match = sourceRegex.exec(content))) {
    specifiers.push(match[1] || match[2]);
  }

  return unique(specifiers);
}

function resolveLocalVueImport(fromFile, specifier) {
  if (!specifier || !specifier.startsWith('.')) return '';

  const baseDir = path.dirname(fromFile);
  const rawTarget = normalizeGitPath(path.join(baseDir, specifier));
  const extension = path.extname(rawTarget).toLowerCase();
  const candidates = extension === '.vue'
    ? [rawTarget]
    : [
        `${rawTarget}.vue`,
        `${rawTarget}/index.vue`,
        `${rawTarget}/${path.basename(rawTarget)}.vue`,
      ];

  return candidates.find((candidate) => existsSync(path.resolve(process.cwd(), candidate))) || '';
}

function findPageRootImportFanoutWarnings(content, normalized) {
  if (!isViewEntryVue(normalized)) return [];

  const warnings = [];
  const pageDir = normalizeGitPath(path.dirname(normalized));
  const directSiblingImports = [];
  const localVueImports = [];

  for (const specifier of getRelativeVueImportSpecifiers(content)) {
    const child = resolveLocalVueImport(normalized, specifier);
    if (!child) continue;

    localVueImports.push(child);
    if (normalizeGitPath(path.dirname(child)) === pageDir) directSiblingImports.push(child);
  }

  if (directSiblingImports.length >= 3) {
    warnings.push(`page root ${normalized} imports ${directSiblingImports.length} sibling .vue files directly (${directSiblingImports.join(', ')}); keep page root orchestration-only and move detailed UI into capsule directories`);
  }

  if (localVueImports.length >= 6) {
    warnings.push(`page root ${normalized} imports ${localVueImports.length} local Vue components; review whether small/detail UI should be grouped inside feature capsules instead of being fanned out from index.vue`);
  }

  return warnings;
}

function collectLocalVueDescendants(rootFile, maxDepth) {
  const descendants = [];
  const visited = new Set([normalizeGitPath(rootFile)]);
  const queue = [{ file: normalizeGitPath(rootFile), depth: 0 }];

  while (queue.length) {
    const current = queue.shift();
    if (current.depth >= maxDepth) continue;

    const absolute = path.resolve(process.cwd(), current.file);
    if (!existsSync(absolute)) continue;

    const content = readFileSync(absolute, 'utf8');
    for (const specifier of getRelativeVueImportSpecifiers(content)) {
      const child = resolveLocalVueImport(current.file, specifier);
      if (!child || visited.has(child)) continue;

      visited.add(child);
      const depth = current.depth + 1;
      descendants.push({ file: child, depth, parent: current.file });
      queue.push({ file: child, depth });
    }
  }

  return descendants;
}

function addRecursiveComponentCoverageWarnings(files, results) {
  const checkedSet = new Set(files.map(normalizeGitPath));
  const resultMap = new Map(results.map((result) => [result.file, result]));
  const warned = new Set();

  for (const file of files) {
    const normalized = normalizeGitPath(file);
    if (path.extname(normalized).toLowerCase() !== '.vue') continue;
    if (!isImplementationStyleScope(normalized)) continue;

    const result = resultMap.get(normalized);
    if (!result) continue;

    const descendants = collectLocalVueDescendants(normalized, RECURSIVE_EXTRACTION_AUDIT_ROUNDS);
    if (descendants.length === 0) {
      result.messages.push(`recursive extraction audit coverage ok: no local child components found within ${RECURSIVE_EXTRACTION_AUDIT_ROUNDS} rounds`);
      continue;
    }

    let missingCount = 0;
    for (const child of descendants) {
      if (checkedSet.has(child.file)) continue;
      const warnKey = `${normalized}::${child.file}`;
      if (warned.has(warnKey)) continue;

      warned.add(warnKey);
      missingCount += 1;
      result.warnings.push(
        `recursive extraction audit coverage round ${child.depth}/${RECURSIVE_EXTRACTION_AUDIT_ROUNDS}: local child component ${child.file} imported by ${child.parent} is not included in checked files; include the entry file and every extracted child component in the validation command before final delivery`,
      );
    }

    if (missingCount === 0) {
      result.messages.push(`recursive extraction audit coverage ok: checked local child components through ${RECURSIVE_EXTRACTION_AUDIT_ROUNDS} rounds`);
    }
  }
}

function isNativeHtmlTag(tagName) {
  return /^[a-z]+[1-6]?$/.test(tagName) && !tagName.startsWith('el-');
}

function findVForReuseWarnings(source, lineOffset = 0) {
  const warnings = [];
  const vForRegex = /<([A-Za-z][\w.-]*)\b[^>]*\bv-for\s*=\s*["'][^"']+["'][^>]*>/g;
  let match;

  while ((match = vForRegex.exec(source))) {
    const tagName = match[1];
    const line = lineNumberAt(source, match.index, lineOffset);
    const prefix = isNativeHtmlTag(tagName) ? `native <${tagName}> v-for` : `<${tagName}> v-for`;
    warnings.push(`${prefix} at line ${line} must have reuse evidence in the final checklist; check project components before rendering repeated items manually`);
  }

  return warnings;
}

function findRawElementPlusOverlayFormWarnings(source, lineOffset = 0) {
  const warnings = [];
  const overlayRegex = /<(el-dialog|el-drawer|el-popover)(?=[\s>/])[\s\S]*?<\/\1>/gi;
  let match;

  while ((match = overlayRegex.exec(source))) {
    const block = match[0];
    if (!/<el-form(?:\s|>|\/)/i.test(block) && !/<el-form-item(?:\s|>|\/)/i.test(block)) {
      continue;
    }

    const line = lineNumberAt(source, match.index, lineOffset);
    warnings.push(
      `${match[1]} form overlay at line ${line} uses raw Element Plus form markup; first check existing dialog/drawer/popover form components, InstanceForm/Schema form patterns, apps/common, current app commons/views/components, easybill-ui, and document reuse candidates or non-reuse reason in the final checklist`,
    );
  }

  return warnings;
}

function findRawTableReuseWarnings(source, lineOffset = 0) {
  const warnings = [];
  const rawTableRegex = /<(el-table|table)(?=[\s>/])[^>]*>/gi;
  let match;

  while ((match = rawTableRegex.exec(source))) {
    const tagName = match[1].toLowerCase();
    const line = lineNumberAt(source, match.index, lineOffset);
    const tableKind = tagName === 'el-table' ? 'Element Plus el-table' : 'native table';
    warnings.push(
      `${tableKind} at line ${line} must have table reuse evidence in the final checklist; first check existing CurdTable/DataTable/table wrappers, ColumnFactory, useCurdTable, apps/common component layer, current app commons/views/components, and current module table patterns. apps/common/src/utils is not the primary table source; check genericExportImport there only for import/export flows. Document candidates or non-reuse reason`,
    );
  }

  return warnings;
}

function findIconSemanticReviewWarnings(source, lineOffset = 0) {
  const findings = [];
  const patterns = [
    ['Element Plus <el-icon>', new RegExp('</?el-icon\\b', 'i')],
    ['@element-plus/icons-vue', new RegExp("from\\s*['\"]@element-plus/icons-vue['\"]")],
    ['lucide-vue-next', new RegExp("from\\s*['\"]lucide-vue-next['\"]")],
    ['@iconify/vue', new RegExp("from\\s*['\"]@iconify/vue['\"]")],
  ];

  for (const [label, regex] of patterns) {
    const match = source.match(regex);
    if (!match) continue;
    findings.push({
      label,
      line: lineNumberAt(source, match.index, lineOffset),
    });
  }

  if (findings.length === 0) return [];

  const firstLine = Math.min(...findings.map((finding) => finding.line));
  const labels = findings.map((finding) => finding.label).join(', ');
  return [
    `icon usage detected near line ${firstLine} (${labels}); final checklist must compare prototype icon system and specific icon names with implementation mapping, check current app dependencies and shared icon wrappers, and document adoption/deviation reason. Do not silently substitute approximate icons`,
  ];
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

function splitTopLevelObjectEntries(objectText) {
  const inner = objectText.replace(/^\s*\{/, '').replace(/\}\s*$/, '');
  const entries = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
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

    if ('{[('.includes(char)) depth += 1;
    if ('}])'.includes(char)) depth -= 1;

    if (char === ',' && depth === 0) {
      entries.push(inner.slice(start, index).trim());
      start = index + 1;
    }
  }

  entries.push(inner.slice(start).trim());
  return entries.filter(Boolean);
}

function objectEntryName(entry) {
  const cleaned = entry
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .trim();
  if (!cleaned || cleaned.startsWith('...')) return '';

  const keyValue = cleaned.match(/^([A-Za-z_$][\w$]*)\s*:/);
  if (keyValue) return keyValue[1];

  const shorthand = cleaned.match(/^([A-Za-z_$][\w$]*)\b/);
  return shorthand?.[1] || '';
}

function objectEntryNames(objectText) {
  return splitTopLevelObjectEntries(objectText).map(objectEntryName).filter(Boolean);
}

function dataOwnershipGroups(names) {
  const groups = new Set();
  const dataLikeSuffix = /(List|Options|Tags|Cards|TableData|Data|Loading|Empty|Error|Selected|Dialog|Form|Visible|Open|State)$/;

  for (const name of names) {
    if (!dataLikeSuffix.test(name)) continue;
    const group = name.replace(dataLikeSuffix, '');
    groups.add(group || name);
  }

  return groups;
}

function findReturnedObjectLiteral(body) {
  const returnMatch = body.match(/\breturn\s*\{/);
  if (!returnMatch) return null;
  return findObjectLiteralAfter(body, returnMatch.index + returnMatch[0].indexOf('{'));
}

function findHookReturnOwnershipFindings(source, lineOffset = 0) {
  const errors = [];
  const warnings = [];
  const lines = source.split(/\r?\n/);

  for (const fn of findFunctionLengths(source, lineOffset)) {
    if (!/^use[A-Z]/.test(fn.name)) continue;

    const localStart = Math.max(0, fn.start - lineOffset - 1);
    const localEnd = Math.max(localStart, fn.end - lineOffset);
    const body = lines.slice(localStart, localEnd).join('\n');
    const returned = findReturnedObjectLiteral(body);
    if (!returned) continue;

    const names = objectEntryNames(returned.text);
    const groups = dataOwnershipGroups(names);
    const apiCallCount = (body.match(/\b(?:api|Api|service|Service|request|fetch[A-Z]\w*|get[A-Z]\w*|post[A-Z]\w*)\s*[.(]/g) || []).length;
    const line = fn.start + body.slice(0, returned.start).split(/\r?\n/).length - 1;

    if (names.length > 10) {
      errors.push(`hook ${fn.name} returns ${names.length} values at line ${line}; split by data-owning business component instead of one page-level hook`);
    } else if (names.length > 8) {
      warnings.push(`hook ${fn.name} returns ${names.length} values at line ${line}; final checklist must justify why it is not split by component ownership`);
    }

    if (groups.size >= 4 || (groups.size >= 3 && apiCallCount >= 2)) {
      warnings.push(`hook ${fn.name} appears to own ${groups.size} data groups (${Array.from(groups).join(', ')}) and ${apiCallCount} request-like calls; page-level hooks should keep only shared flow state`);
    }
  }

  return { errors, warnings };
}

function findHookDestructureOwnershipFindings(source, lineOffset = 0, normalized = '') {
  const errors = [];
  const warnings = [];
  const isPageRoot = isViewEntryVue(normalized);
  const destructureRegex = /\b(?:const|let)\s*\{([\s\S]*?)\}\s*=\s*(use[A-Z]\w*)\s*\(/g;
  let match;

  while ((match = destructureRegex.exec(source))) {
    const names = objectEntryNames(`{${match[1]}}`);
    const groups = dataOwnershipGroups(names);
    const line = lineNumberAt(source, match.index, lineOffset);
    const hookName = match[2];

    if (isPageRoot && names.length > 10) {
      errors.push(`page root destructures ${names.length} values from ${hookName} at line ${line}; index.vue must not own child-component private data`);
    } else if (isPageRoot && names.length > 8) {
      warnings.push(`page root destructures ${names.length} values from ${hookName} at line ${line}; justify or split by data-owning component`);
    }

    if (isPageRoot && groups.size >= 3) {
      warnings.push(`page root destructures multiple component data groups from ${hookName} at line ${line} (${Array.from(groups).join(', ')}); page hooks should keep shared flow state only`);
    }
  }

  return { errors, warnings };
}

function componentDisplayName(normalized) {
  const baseName = path.basename(normalized, path.extname(normalized));
  if (baseName === 'index') return path.basename(path.dirname(normalized));
  return baseName;
}

function isPureVisualComponentName(name) {
  return /(Pill|IconCapsule|MetricCell|CardItem|PlanCard|EmptyState|Badge|Tag|Metric)$/.test(name);
}

function findPureVisualDataAccessErrors(source, lineOffset = 0, normalized = '') {
  const componentName = componentDisplayName(normalized);
  if (!isPureVisualComponentName(componentName)) return [];

  const errors = [];
  const dataAccessRegex = /(?:from\s*['"][^'"]*(?:\/api\b|\/api\/|@\/api|service|mock|router|store|vue-router|pinia)[^'"]*['"])|(?:\buse(?:Route|Router|Store)\s*\()/gi;
  let match;

  while ((match = dataAccessRegex.exec(source))) {
    errors.push(`pure visual component ${componentName} imports or accesses data/navigation state at line ${lineNumberAt(source, match.index, lineOffset)}; visual components only receive props`);
  }

  return errors;
}

function collectImportedTypeNames(source) {
  const importedTypes = new Set();
  const importRegex = /(^|\n)\s*import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(source))) {
    const isTypeOnlyImport = Boolean(match[2]);
    const clause = match[3].trim();
    const importSource = match[4];
    if (importSource === 'vue') continue;

    const namedMatch = clause.match(/\{([\s\S]*?)\}/);
    if (namedMatch) {
      for (const rawSpecifier of namedMatch[1].split(',')) {
        let specifier = rawSpecifier.trim();
        if (!specifier) continue;
        const isInlineTypeImport = specifier.startsWith('type ');
        if (!isTypeOnlyImport && !isInlineTypeImport) continue;
        specifier = specifier.replace(/^type\s+/, '').trim();
        const aliasMatch = specifier.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
        const name = aliasMatch ? aliasMatch[1] : specifier.match(/^([A-Za-z_$][\w$]*)/)?.[1];
        if (name) importedTypes.add(name);
      }
      continue;
    }

    if (isTypeOnlyImport) {
      const defaultName = clause.match(/^([A-Za-z_$][\w$]*)/)?.[1];
      if (defaultName) importedTypes.add(defaultName);
    }
  }

  return importedTypes;
}

function findDefinePropsGenericUsages(source) {
  const usages = [];
  let cursor = 0;

  while (cursor < source.length) {
    const callIndex = source.indexOf('defineProps', cursor);
    if (callIndex < 0) break;

    let cursorAfterName = callIndex + 'defineProps'.length;
    while (/\s/.test(source[cursorAfterName] ?? '')) cursorAfterName += 1;
    if (source[cursorAfterName] !== '<') {
      cursor = cursorAfterName;
      continue;
    }

    let depth = 0;
    for (let index = cursorAfterName; index < source.length; index += 1) {
      const char = source[index];
      if (char === '<') depth += 1;
      if (char === '>') depth -= 1;
      if (depth === 0) {
        usages.push({
          text: source.slice(cursorAfterName + 1, index),
          start: cursorAfterName,
        });
        cursor = index + 1;
        break;
      }
    }

    if (cursor <= cursorAfterName) {
      cursor = cursorAfterName + 1;
    }
  }

  return usages;
}

function checkPropConventions(source, lineOffset = 0) {
  const errors = [];
  const warnings = [];
  const badImportRegex = /(^|\n)\s*import\s*\{[^}]*\bPropType\b[^}]*\}\s*from\s*['"]vue['"]/g;
  const importedTypeNames = collectImportedTypeNames(source);
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

  for (const generic of findDefinePropsGenericUsages(source)) {
    const referencedImportedType = Array.from(importedTypeNames).find((name) => new RegExp(`\\b${name}\\b`).test(generic.text));
    if (referencedImportedType) {
      warnings.push(`defineProps generic at line ${lineNumberAt(source, generic.start, lineOffset)} references imported type "${referencedImportedType}"; extracted components with external business props should use runtime props object + PropType to avoid SFC macro resolution failures`);
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
    errors.push(...findGridViolations(content, 0));
    errors.push(...findScrollbarViolations(content, 0));
    errors.push(...checkRepeatedVisualInteractionBlocks(content));
    warnings.push(...findPageEntryStructureWarnings(content, normalized));
    warnings.push(...findPageRootImportFanoutWarnings(content, normalized));
    warnings.push(...findStateBranchExtractionWarnings(content, 0));
    warnings.push(...findIconSemanticReviewWarnings(content, 0));
    errors.push(...checkComponentColocation(normalized, content));
    errors.push(...findPureVisualDataAccessErrors(content, 0, normalized));
  }
  errors.push(...findEscapedChineseText(content, 0));
  errors.push(...findMojibakeText(content, 0));

  checkVueLineLimit(content, normalized, statusCode, options, messages, errors, warnings);

  for (const block of getVueTemplateBlocks(content)) {
    warnings.push(...findVForReuseWarnings(block.code, block.startLine));
    warnings.push(...findRawElementPlusOverlayFormWarnings(block.code, block.startLine));
    warnings.push(...findRawTableReuseWarnings(block.code, block.startLine));
  }

  for (const block of getVueStyleBlocks(content)) {
    errors.push(...findVueStyleBlockScopeErrors(block));
    warnings.push(...findTailwindPreferenceWarnings(block.code, block.startLine));
    warnings.push(...findViewportBreakpointWarnings(block.code, block.startLine));
  }

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
    const hookReturnOwnership = findHookReturnOwnershipFindings(block.code, block.startLine);
    errors.push(...hookReturnOwnership.errors);
    warnings.push(...hookReturnOwnership.warnings);
    const hookDestructureOwnership = findHookDestructureOwnershipFindings(block.code, block.startLine, normalized);
    errors.push(...hookDestructureOwnership.errors);
    warnings.push(...hookDestructureOwnership.warnings);
    addFunctionLengthFindings(block.code, block.startLine, errors, warnings);
  }
}

function checkScriptFile(content, normalized, result) {
  const { errors, warnings } = result;
  if (isImplementationStyleScope(normalized)) {
    errors.push(...findExternalStyleReferences(content, 0));
    errors.push(...findGridViolations(content, 0));
    errors.push(...findScrollbarViolations(content, 0));
    errors.push(...checkComponentColocation(normalized, content));
  }
  errors.push(...findEscapedChineseText(content, 0));
  errors.push(...findMojibakeText(content, 0));

  const hookReturnOwnership = findHookReturnOwnershipFindings(content, 0);
  errors.push(...hookReturnOwnership.errors);
  warnings.push(...hookReturnOwnership.warnings);
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
    const { errors, warnings } = result;
    errors.push('external style file in a view/component scope is not allowed; move styles into the owning .vue <style scoped> block or an existing shared style entry');
    errors.push(...findGridViolations(content, 0));
    errors.push(...findScrollbarViolations(content, 0));
    warnings.push(...findViewportBreakpointWarnings(content, 0));
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
  addRecursiveComponentCoverageWarnings(files, results);
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
