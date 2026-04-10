import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value ?? true];
    }),
);

const manifest = args.manifest;

if (!manifest) {
    console.error('Usage: node validate-asset-compatibility.mjs --manifest=path-to-manifest');
    process.exit(1);
}

const manifestPath = path.isAbsolute(manifest)
    ? manifest
    : path.join('E:/work/ai-web-system', manifest);

const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const projectPkg = JSON.parse(fs.readFileSync('E:/work/project-mamba/package.json', 'utf8'));

const allowedDeps = new Set([
    ...Object.keys(projectPkg.dependencies ?? {}),
    ...Object.keys(projectPkg.devDependencies ?? {}),
]);

const deps = manifestJson.projectCompatibility?.dependencies ?? [];
const invalidDeps = deps.filter((dep) => !allowedDeps.has(dep));

if (invalidDeps.length) {
    console.log('Compatibility check failed. Invalid dependencies found:');
    invalidDeps.forEach((dep) => console.log(`- ${dep}`));
    process.exit(2);
}

console.log('Compatibility check passed.');
