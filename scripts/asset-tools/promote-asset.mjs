import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value ?? true];
    }),
);

const manifest = args.manifest;
const status = args.status ?? 'official';
const maturityLevel = args.maturityLevel;

if (!manifest) {
    console.error('Usage: node promote-asset.mjs --manifest=path-to-manifest --status=official --maturityLevel=L2');
    process.exit(1);
}

const allowedStatuses = new Set(['candidate', 'official', 'project-synced']);
if (!allowedStatuses.has(status)) {
    console.error(`Invalid status: ${status}`);
    process.exit(2);
}

const manifestPath = path.isAbsolute(manifest)
    ? manifest
    : path.join('E:/work/ai-web-system', manifest);

const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifestJson.status = status;

if (maturityLevel) {
    manifestJson.maturityLevel = maturityLevel;
}

manifestJson.review = {
    ...(manifestJson.review ?? {}),
    promotedAt: new Date().toISOString(),
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifestJson, null, 2)}\n`, 'utf8');
console.log(`Asset promoted: ${manifestPath} -> status=${status}`);
