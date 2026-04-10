import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value ?? true];
    }),
);

const targetDir = args.dir
    ? path.isAbsolute(args.dir)
        ? args.dir
        : path.join('E:/work/ai-web-system', args.dir)
    : 'E:/work/ai-web-system/assets';

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.manifest.json')) {
            files.push(fullPath);
        }
    }

    return files;
}

const manifests = walk(targetDir);
const summary = [];

for (const file of manifests) {
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    summary.push({
        name: json.name,
        type: json.type,
        docs: json.writeback?.docs ?? [],
        standards: json.writeback?.standards ?? [],
        examples: json.writeback?.examples ?? [],
        agents: json.writeback?.agents ?? [],
    });
}

console.log(JSON.stringify(summary, null, 2));
