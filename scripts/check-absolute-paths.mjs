import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(process.argv[2] ?? process.cwd());
const ignoredDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.turbo',
  '.vite',
  'coverage',
]);
const ignoredRelativePrefixes = [
  ['docs', '原始准则来源'].join('/') + '/',
  ['docs', '90-归档'].join('/') + '/',
];
const targetExtensions = new Set(['.md', '.mdc']);
const windowsAbsolutePathPattern = /(?:^|[\s`("'<>])([A-Za-z]:[\\/][^\s`)"'<>]+)/g;

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(path.join(dir, entry.name), results);
      }
      continue;
    }

    const filePath = path.join(dir, entry.name);
    if (targetExtensions.has(path.extname(entry.name).toLowerCase())) {
      results.push(filePath);
    }
  }

  return results;
}

function shouldIgnore(filePath) {
  const relativePath = path.relative(rootDir, filePath).replaceAll('\\', '/');
  return ignoredRelativePrefixes.some((prefix) => relativePath.startsWith(prefix));
}

function collectLineStarts(content) {
  const starts = [0];
  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === '\n') {
      starts.push(index + 1);
    }
  }
  return starts;
}

function getLineNumber(index, lineStarts) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= index) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return high + 1;
}

function findIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lineStarts = collectLineStarts(content);
  const hits = [];
  let match;

  while ((match = windowsAbsolutePathPattern.exec(content)) !== null) {
    hits.push({
      line: getLineNumber(match.index, lineStarts),
      absolutePath: match[1],
    });
  }

  return hits;
}

const files = walk(rootDir).filter((filePath) => !shouldIgnore(filePath));
const issues = [];

for (const file of files) {
  const hits = findIssues(file);
  if (hits.length > 0) {
    issues.push({
      file,
      hits,
    });
  }
}

if (issues.length > 0) {
  console.error('Absolute path issues detected:');
  for (const issue of issues) {
    const relativePath = path.relative(rootDir, issue.file).replaceAll('\\', '/');
    for (const hit of issue.hits) {
      console.error(`- ${relativePath}:${hit.line} -> ${hit.absolutePath}`);
    }
  }
  process.exit(1);
}

console.log(`Absolute path check passed. ${files.length} markdown files scanned in ${rootDir}`);
