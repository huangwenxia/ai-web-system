#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const DEFAULT_MATRIX = 'skills/frontend-implementer-skill/docs/project-mamba-app-topology-matrix.md';
const ROUTE_SOURCE_LABELS = {
  local: 'local src/views',
  common: 'common views',
  cbdp: 'cbdp views',
  virtual: 'VITE_ROUTER_MODULES',
};

function usage() {
  console.log(`Usage:
  node ${path.relative(process.cwd(), scriptPath)} [options]

Options:
  --app=<name[,name]>     Verify one or more apps. Default: all apps under apps/*
  --all                  Verify all apps under apps/*
  --matrix=<path>         Matrix markdown path. Default: ${DEFAULT_MATRIX}
  --json                 Print JSON instead of Markdown
  --suggest              Include suggested matrix sections in Markdown output
  --help                 Show this help

The script extracts facts from apps/<app>/vite.config.ts and apps/<app>/src/main.ts,
then compares them with project-mamba-app-topology-matrix.md. It reports drift but
does not modify the matrix.`);
}

function parseArgs(argv) {
  const options = {
    apps: [],
    matrix: DEFAULT_MATRIX,
    json: false,
    suggest: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--suggest') {
      options.suggest = true;
    } else if (arg.startsWith('--app=')) {
      options.apps.push(...arg.slice('--app='.length).split(',').map((item) => item.trim()).filter(Boolean));
    } else if (arg.startsWith('--matrix=')) {
      options.matrix = arg.slice('--matrix='.length);
    } else {
      options.apps.push(arg);
    }
  }

  return options;
}

function readText(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function listApps() {
  const appsRoot = path.resolve(process.cwd(), 'apps');
  if (!existsSync(appsRoot)) return [];

  return readdirSync(appsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function extractQuotedSources(text) {
  const sources = [];
  const regex = /['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = regex.exec(text))) {
    sources.push(match[1]);
  }

  return unique(sources);
}

function extractRouteDirs(viteText) {
  return extractQuotedSources(viteText).filter((source) => source.includes('src/views'));
}

function extractRouteSources(viteText, appName, knownApps) {
  const dirs = extractRouteDirs(viteText);
  const sources = new Set();
  const otherApps = new Set();

  for (const dir of dirs) {
    if (/^(src\/views|\.\/src\/views|@\/views)/.test(dir)) sources.add('local');
    if (dir.includes('../common/src/views')) sources.add('common');
    if (dir.includes('../cbdp/src/views')) sources.add('cbdp');

    const appMatch = dir.match(/\.\.\/([^/]+)\/src\/views/);
    if (appMatch && !['common', 'cbdp'].includes(appMatch[1]) && appMatch[1] !== appName) {
      otherApps.add(appMatch[1]);
    }
  }

  if (/\bVITE_ROUTER_MODULES\b/.test(viteText)) {
    sources.add('virtual');
    for (const app of knownApps) {
      if (app !== appName && new RegExp(`\\b${app}\\b`).test(viteText)) {
        otherApps.add(app);
      }
    }
  }

  return {
    routeDirs: dirs,
    routeSources: Array.from(sources),
    otherRouteApps: Array.from(otherApps).sort(),
    hasVirtualModules: sources.has('virtual'),
  };
}

function extractAliases(viteText) {
  const aliases = [];
  const regexes = [
    /['"`](@[\w-]+|~[\w-]+)['"`]\s*:/g,
    /alias\s*\(\s*['"`](@[\w-]+|~[\w-]+)['"`]/g,
  ];

  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(viteText))) aliases.push(match[1]);
  }

  return unique(aliases).sort();
}

function extractImports(mainText) {
  const imports = [];
  const fromRegex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;

  while ((match = fromRegex.exec(mainText))) {
    imports.push(match[1]);
  }

  return unique(imports);
}

function categorizeImports(imports) {
  const categories = {
    install: [],
    directives: [],
    globals: [],
    locales: [],
    auth: [],
    store: [],
    style: [],
    theme: [],
  };

  for (const source of imports) {
    const lower = source.toLowerCase();
    if (lower.includes('install')) categories.install.push(source);
    if (lower.includes('directives') || lower.includes('directive')) categories.directives.push(source);
    if (lower.includes('global')) categories.globals.push(source);
    if (lower.includes('locale') || lower.includes('i18n')) categories.locales.push(source);
    if (lower.includes('auth')) categories.auth.push(source);
    if (lower.includes('store') || lower.includes('stores')) categories.store.push(source);
    if (/\.(css|scss|sass|less)$/.test(lower)) categories.style.push(source);
    if (lower.includes('theme')) categories.theme.push(source);
  }

  return Object.fromEntries(
    Object.entries(categories).map(([key, values]) => [key, unique(values)]),
  );
}

function classifyTopology(routeSources) {
  const hasLocal = routeSources.includes('local');
  const externalSources = routeSources.filter((source) => source !== 'local');

  if (hasLocal && externalSources.length === 0) return 'T4 standalone route app';
  if (hasLocal && externalSources.length === 1 && externalSources[0] === 'common') return 'T2 common-view mixed app';
  if (hasLocal && externalSources.length > 0) return 'T3 multi-source route app';
  if (!hasLocal && routeSources.includes('common')) return 'T1/T2 shared route source';
  return 'unknown';
}

function extractFacts(appName, knownApps) {
  const vitePath = path.resolve(process.cwd(), 'apps', appName, 'vite.config.ts');
  const mainPath = path.resolve(process.cwd(), 'apps', appName, 'src', 'main.ts');
  const viteText = readText(vitePath);
  const mainText = readText(mainPath);
  const route = extractRouteSources(viteText, appName, knownApps);
  const imports = extractImports(mainText);

  return {
    app: appName,
    files: {
      viteConfig: existsSync(vitePath),
      main: existsSync(mainPath),
    },
    routeDirs: route.routeDirs,
    routeSources: route.routeSources,
    otherRouteApps: route.otherRouteApps,
    hasVirtualModules: route.hasVirtualModules,
    topology: classifyTopology(route.routeSources),
    aliases: extractAliases(viteText),
    imports: categorizeImports(imports),
  };
}

function parseMatrixSections(matrixText) {
  const sections = new Map();
  const headingRegex = /^###\s+([^\r\n]+)\s*$/gm;
  const matches = Array.from(matrixText.matchAll(headingRegex));

  for (let index = 0; index < matches.length; index += 1) {
    const name = matches[index][1].trim();
    const start = matches[index].index + matches[index][0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : matrixText.length;
    sections.set(name, matrixText.slice(start, end));
  }

  return sections;
}

function matrixContainsRouteSource(section, source, otherRouteApps) {
  const lower = section.toLowerCase();
  if (source === 'local') return /src\/views|本地/.test(section);
  if (source === 'common') return lower.includes('common');
  if (source === 'cbdp') return lower.includes('cbdp');
  if (source === 'virtual') return /VITE_ROUTER_MODULES|虚拟模块|多源拼装/.test(section);
  return otherRouteApps.every((app) => lower.includes(app.toLowerCase()));
}

function extractBacktickTokens(line) {
  return Array.from(line.matchAll(/`([^`]+)`/g)).map((match) => match[1]);
}

function matrixCategorySources(section, category) {
  const categoryWords = {
    install: ['install'],
    directives: ['directive', 'directives', 'directives'],
    globals: ['global', 'globals'],
    locales: ['locale', 'locales', 'i18n'],
    auth: ['auth', '权限'],
    store: ['store', 'stores'],
    style: ['tailwind', 'scss', 'css', '样式'],
    theme: ['theme', 'initTheme'],
  }[category] || [category];

  return section
    .split(/\r?\n/)
    .filter((line) => categoryWords.some((word) => line.toLowerCase().includes(word.toLowerCase())))
    .flatMap(extractBacktickTokens)
    .filter((token) => token.includes('/') || token.startsWith('@') || token.startsWith('.') || /\.(css|scss|sass|less)$/.test(token));
}

function sourceMatches(matrixSource, codeSource) {
  return matrixSource === codeSource || matrixSource.endsWith(codeSource) || codeSource.endsWith(matrixSource);
}

function compareFactsWithMatrix(facts, section) {
  const drift = [];
  const warnings = [];

  if (!section) {
    drift.push('matrix section missing');
    return { drift, warnings };
  }

  for (const source of facts.routeSources) {
    const ok = matrixContainsRouteSource(section, source, facts.otherRouteApps);
    if (!ok) {
      drift.push(`route source missing in matrix: ${ROUTE_SOURCE_LABELS[source] || source}`);
    }
  }

  for (const app of facts.otherRouteApps) {
    if (!section.toLowerCase().includes(app.toLowerCase())) {
      drift.push(`mounted route app missing in matrix: ${app}`);
    }
  }

  for (const alias of facts.aliases) {
    if (!section.includes(alias)) {
      warnings.push(`alias missing in matrix: ${alias}`);
    }
  }

  for (const [category, codeSources] of Object.entries(facts.imports)) {
    if (codeSources.length === 0) continue;

    const matrixSources = matrixCategorySources(section, category);
    if (matrixSources.length === 0) {
      warnings.push(`${category} source not described in matrix: ${codeSources.join(', ')}`);
      continue;
    }

    const hasMatch = matrixSources.some((matrixSource) => codeSources.some((codeSource) => sourceMatches(matrixSource, codeSource)));
    if (!hasMatch) {
      drift.push(`${category} source drift: matrix says ${matrixSources.join(', ')}, code says ${codeSources.join(', ')}`);
    }
  }

  return { drift, warnings };
}

function sectionSuggestion(facts) {
  const routeBits = [
    facts.routeSources.includes('local') ? '本地 `src/views`' : '',
    facts.routeSources.includes('common') ? '`../common/src/views`' : '',
    facts.routeSources.includes('cbdp') ? '`../cbdp/src/views`' : '',
    facts.otherRouteApps.length ? facts.otherRouteApps.map((app) => `\`${app}\``).join(' / ') : '',
    facts.hasVirtualModules ? '`VITE_ROUTER_MODULES` 虚拟模块' : '',
  ].filter(Boolean);

  const imports = Object.entries(facts.imports)
    .filter(([, values]) => values.length > 0)
    .map(([category, values]) => `  - ${category}: ${values.map((value) => `\`${value}\``).join('、')}`);

  return [
    `### ${facts.app}`,
    `- \`vite.config.ts\`：${routeBits.length ? `挂载 ${routeBits.join(' + ')}` : '未识别到 views 挂载；需人工确认'}`,
    `- alias：${facts.aliases.length ? facts.aliases.map((alias) => `\`${alias}\``).join('、') : '未识别'}`,
    `- topology：${facts.topology}`,
    '- `main.ts` 关键来源：',
    ...(imports.length ? imports : ['  - 未识别关键 import；需人工确认']),
    facts.hasVirtualModules ? `- 其他：存在 \`VITE_ROUTER_MODULES\`，需确认虚拟模块 route ownership` : '',
    '- 结论：以当前代码核对后更新。',
  ].filter(Boolean).join('\n');
}

function markdownReport(results, includeSuggestions) {
  const lines = ['# Project Mamba Topology Verification', ''];

  for (const result of results) {
    const status = result.drift.length > 0 ? 'drift' : 'ok';
    lines.push(`## ${result.app}`, '');
    lines.push(`Status: ${status}`, '');
    lines.push('Current code facts:');
    lines.push(`- topology: ${result.facts.topology}`);
    lines.push(`- route sources: ${result.facts.routeSources.join(', ') || 'none'}`);
    if (result.facts.otherRouteApps.length) lines.push(`- mounted route apps: ${result.facts.otherRouteApps.join(', ')}`);
    lines.push(`- aliases: ${result.facts.aliases.join(', ') || 'none'}`);
    for (const [category, values] of Object.entries(result.facts.imports)) {
      if (values.length) lines.push(`- ${category}: ${values.join(', ')}`);
    }
    if (result.drift.length) {
      lines.push('', 'Drift:');
      for (const item of result.drift) lines.push(`- ${item}`);
    }
    if (result.warnings.length) {
      lines.push('', 'Warnings:');
      for (const item of result.warnings) lines.push(`- ${item}`);
    }
    if (includeSuggestions) {
      lines.push('', 'Suggested matrix section:', '', '```md', sectionSuggestion(result.facts), '```');
    }
    lines.push('');
  }

  const driftCount = results.reduce((sum, result) => sum + result.drift.length, 0);
  const warningCount = results.reduce((sum, result) => sum + result.warnings.length, 0);
  lines.push(`Summary: ${driftCount} drift(s), ${warningCount} warning(s)`);
  return lines.join('\n');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const knownApps = listApps();
  const apps = unique(options.apps.length ? options.apps : knownApps);
  const matrixPath = path.resolve(process.cwd(), options.matrix);
  const matrixText = readText(matrixPath);
  const sections = parseMatrixSections(matrixText);

  if (!knownApps.length) {
    const message = 'No apps/* directories found. Run this script from the project-mamba repository root.';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, message, results: [] }, null, 2));
    } else {
      console.log(message);
    }
    return;
  }

  const results = apps.map((app) => {
    const facts = extractFacts(app, knownApps);
    const comparison = compareFactsWithMatrix(facts, sections.get(app));
    return { app, facts, ...comparison };
  });

  const driftCount = results.reduce((sum, result) => sum + result.drift.length, 0);
  const payload = { ok: driftCount === 0, matrix: options.matrix, results };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(markdownReport(results, options.suggest));
  }

  if (driftCount > 0) process.exitCode = 1;
}

main();
