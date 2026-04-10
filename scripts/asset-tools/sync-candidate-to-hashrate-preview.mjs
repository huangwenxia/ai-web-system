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
    console.error('Usage: node sync-candidate-to-hashrate-preview.mjs --source=assets/components/candidates/example-card.vue --name=ExampleCardPreview');
    process.exit(1);
}

const sourcePath = path.isAbsolute(source)
    ? source
    : path.join('E:/work/ai-web-system', source);

const targetPath = path.join('E:/work/project-mamba/apps/hashrate/src/__preview__/components', `${name}.vue`);

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);

console.log(`Candidate synced to hashrate preview: ${targetPath}`);
