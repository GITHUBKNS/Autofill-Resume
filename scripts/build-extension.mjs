import { mkdir, cp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve('.');
const dist = resolve(root, 'dist/extension');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const entries = [
  ['extension/src/service_worker.ts', 'service_worker.js'],
  ['extension/src/content_script.ts', 'content_script.js'],
  ['extension/src/popup/popup.ts', 'popup.js'],
  ['extension/src/options/options.ts', 'options.js']
];

for (const [entry, out] of entries) {
  await build({
    entryPoints: [resolve(root, entry)],
    outfile: resolve(dist, out),
    bundle: true,
    format: 'esm',
    target: 'es2022',
    sourcemap: false,
    logLevel: 'info'
  });
}

const assets = [
  ['extension/manifest.json', 'manifest.json'],
  ['extension/src/popup/popup.html', 'popup.html'],
  ['extension/src/popup/popup.css', 'popup.css'],
  ['extension/src/options/options.html', 'options.html'],
  ['extension/src/options/options.css', 'options.css']
];

for (const [from, to] of assets) {
  const src = resolve(root, from);
  const dst = resolve(dist, to);
  await mkdir(dirname(dst), { recursive: true });
  await cp(src, dst);
}

console.log('Built extension in dist/extension');
