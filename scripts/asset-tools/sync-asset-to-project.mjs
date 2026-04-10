import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value ?? true];
    }),
);

const source = args.source;
const manifest = args.manifest;
const target = args.target;

if (!source || !manifest || !target) {
    console.error('Usage: node sync-asset-to-project.mjs --source=source-path --manifest=manifest-path --target=project-target-path');
    process.exit(1);
}

const manifestPath = path.isAbsolute(manifest)
    ? manifest
    : path.join('E:/work/ai-web-system', manifest);
const sourcePath = path.isAbsolute(source)
    ? source
    : path.join('E:/work/ai-web-system', source);
const targetPath = path.isAbsolute(target)
    ? target
    : path.join('E:/work/project-mamba', target);

const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (!manifestJson.sync?.allowed) {
    console.error('Sync rejected: manifest.sync.allowed is false');
    process.exit(2);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);

manifestJson.sync.targetPath = target;
manifestJson.sync.targetProject = 'project-mamba';
manifestJson.sync.lastSyncedAt = new Date().toISOString();

fs.writeFileSync(manifestPath, `${JSON.stringify(manifestJson, null, 2)}\n`, 'utf8');

console.log(`Synced ${sourcePath} -> ${targetPath}`);
