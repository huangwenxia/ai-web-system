import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value ?? true];
    }),
);

const type = args.type;
const name = args.name;

if (!type || !name || !['component', 'page'].includes(type)) {
    console.error('Usage: node create-manifest.mjs --type=component|page --name=asset-name');
    process.exit(1);
}

const root = 'E:/work/ai-web-system/assets';
const templatePath =
    type === 'component'
        ? path.join(root, 'components', 'manifests', 'component.manifest.template.json')
        : path.join(root, 'pages', 'manifests', 'page.manifest.template.json');

const outputPath =
    type === 'component'
        ? path.join(root, 'components', 'manifests', `${name}.manifest.json`)
        : path.join(root, 'pages', 'manifests', `${name}.manifest.json`);

const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
template.name = name;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
console.log(`Manifest created: ${outputPath}`);
