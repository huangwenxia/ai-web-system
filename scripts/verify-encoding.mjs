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
  'coverage'
]);
const ignoredFiles = new Set([
  path.resolve(rootDir, 'scripts/verify-encoding.mjs')
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
  '.sh'
]);
const suspiciousText = [
  '�',
  '锟',
  '馃',
  '鈿',
  '姝ゅ',
  '鏂板',
  '绯荤',
  '鍒涘',
  '鍔犺',
  '璇锋',
  '閰嶇',
  '鐩戞',
  '鍙戦',
  '瑙掕',
  '浣犳',
  '鏍囬',
  '涓嶈',
  '宸插',
  '鏈',
  '杩斿',
  '鏆傛',
  '鍥炲',
  '妫€',
  '鐢ㄦ埛'
];

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        walk(path.join(dir, entry.name), results);
      }
      continue;
    }

    const filePath = path.join(dir, entry.name);
    if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      results.push(filePath);
    }
  }

  return results;
}

function hasUtf8Bom(buffer) {
  return buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
}

const issues = [];
const files = walk(rootDir);

for (const file of files) {
  if (ignoredFiles.has(path.resolve(file))) {
    continue;
  }

  const buffer = fs.readFileSync(file);
  const content = buffer.toString('utf8');
  const fileIssues = [];

  if (hasUtf8Bom(buffer)) {
    fileIssues.push('UTF-8 BOM');
  }

  const hits = suspiciousText.filter((token) => content.includes(token));
  if (hits.length > 0) {
    fileIssues.push(`suspicious text: ${hits.join(', ')}`);
  }

  if (fileIssues.length > 0) {
    issues.push({ file, fileIssues });
  }
}

if (issues.length > 0) {
  console.error('Encoding issues detected:');
  for (const issue of issues) {
    console.error(`- ${path.relative(rootDir, issue.file)} -> ${issue.fileIssues.join(' | ')}`);
  }
  process.exit(1);
}

console.log(`Encoding check passed. ${files.length} text files scanned in ${rootDir}`);