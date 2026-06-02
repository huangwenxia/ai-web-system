#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = path.resolve(fileURLToPath(import.meta.url));
const ignoredDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.turbo',
  '.vite',
  'coverage',
]);
const textExtensions = new Set([
  '.md',
  '.txt',
  '.json',
  '.jsonc',
  '.yml',
  '.yaml',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.vue',
  '.css',
  '.scss',
  '.html',
  '.ps1',
  '.sh',
]);
const suspiciousCodePoints = [
  [0xfffd],
  [0x951f],
  [0x9983],
  [0x923f],
  [0x59dd, 0x3085],
  [0x93c2, 0x677f],
  [0x7eef, 0x8364],
  [0x9352, 0x6d98],
  [0x9354, 0x72ba],
  [0x7487, 0x950b],
  [0x95b0, 0x5d87],
  [0x9429, 0x621e],
  [0x9359, 0x6226],
  [0x7459, 0x6395],
  [0x6d63, 0x72b3],
  [0x93cd, 0x56ec],
  [0x6d93, 0x5d88],
  [0x5bb8, 0x63d2],
  [0x93c8, 0xe045],
  [0x6769, 0x65bf],
  [0x93c6, 0x509b],
  [0x9365, 0x70b2],
  [0x59ab, 0x20ac],
  [0x9422, 0x3126, 0x57db],
];
const suspiciousText = suspiciousCodePoints.map((codePoints) => ({
  codePoints,
  text: String.fromCodePoint(...codePoints),
}));

function usage() {
  console.log(`Usage:
  node ${path.relative(process.cwd(), scriptPath)} [options] [files-or-dirs...]

Options:
  --allow-empty     Allow no text files to be checked
  --help            Show this help

Checks UTF-8 readability, UTF-8 BOM, and common mojibake tokens.
Chinese unicode escape rules are enforced by check-project-mamba-implementation.mjs.`);
}

function parseArgs(argv) {
  const options = {
    allowEmpty: false,
    help: false,
    targets: [],
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--allow-empty') {
      options.allowEmpty = true;
    } else {
      options.targets.push(arg);
    }
  }

  if (options.targets.length === 0) {
    options.targets.push(process.cwd());
  }

  return options;
}

function isTextFile(filePath) {
  return textExtensions.has(path.extname(filePath).toLowerCase());
}

function walk(dir, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(entryPath, results);
      }
      continue;
    }

    if (entry.isFile() && isTextFile(entryPath)) {
      results.push(entryPath);
    }
  }

  return results;
}

function collectFiles(targets) {
  const files = [];
  const errors = [];

  for (const target of targets) {
    const targetPath = path.resolve(target);
    if (!existsSync(targetPath)) {
      errors.push(`missing target: ${target}`);
      continue;
    }

    const stat = statSync(targetPath);
    if (stat.isDirectory()) {
      walk(targetPath, files);
    } else if (stat.isFile() && isTextFile(targetPath)) {
      files.push(targetPath);
    }
  }

  return {
    files: Array.from(new Set(files.map((file) => path.resolve(file)))).filter((file) => file !== scriptPath),
    errors,
  };
}

function hasUtf8Bom(buffer) {
  return buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
}

function formatCodePoints(codePoints) {
  return codePoints.map((codePoint) => `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`).join(' ');
}

function verifyFile(filePath) {
  const buffer = readFileSync(filePath);
  const content = buffer.toString('utf8');
  const issues = [];

  if (hasUtf8Bom(buffer)) {
    issues.push('UTF-8 BOM is not allowed');
  }

  for (const token of suspiciousText) {
    if (content.includes(token.text)) {
      issues.push(`possible mojibake token ${formatCodePoints(token.codePoints)}`);
    }
  }

  return issues;
}

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  usage();
  process.exit(0);
}

const { files, errors } = collectFiles(options.targets);
const fileIssues = [];

if (files.length === 0 && !options.allowEmpty) {
  errors.push('no text files matched; pass target files explicitly or use --allow-empty for non-code checks');
}

for (const file of files) {
  const issues = verifyFile(file);
  if (issues.length > 0) {
    fileIssues.push({ file, issues });
  }
}

console.log('Encoding verification');
console.log(`Checked files: ${files.length}`);

if (errors.length > 0 || fileIssues.length > 0) {
  for (const error of errors) {
    console.error(`error: ${error}`);
  }

  for (const issue of fileIssues) {
    console.error(`\n${path.relative(process.cwd(), issue.file)}`);
    for (const detail of issue.issues) {
      console.error(`  error: ${detail}`);
    }
  }

  console.error(`\nSummary: ${errors.length + fileIssues.reduce((count, issue) => count + issue.issues.length, 0)} error(s)`);
  process.exit(1);
}

console.log('Summary: 0 error(s)');
