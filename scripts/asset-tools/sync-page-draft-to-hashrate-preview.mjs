import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value ?? true];
    }),
);

const source = args.source;
const name = args.name;

if (!source || !name) {
    console.error('Usage: node sync-page-draft-to-hashrate-preview.mjs --source=assets/pages/drafts/example-page.vue --name=PreviewDraftPage.vue');
    process.exit(1);
}

const sourcePath = path.isAbsolute(source)
    ? source
    : path.join('E:/work/ai-web-system', source);

const targetPath = path.join('E:/work/project-mamba/apps/hashrate/src/__preview__/pages', name);

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);

console.log(`Page draft synced to hashrate preview: ${targetPath}`);
