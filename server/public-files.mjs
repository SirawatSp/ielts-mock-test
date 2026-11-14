import { readdir } from 'node:fs/promises';

export const PUBLIC_FILES = [
  'index.html', 'practice.html', 'app.css', 'app.js', 'sw.js', 'manifest.webmanifest',
  'skills.html', 'skills.css', 'skills.js', 'skills-content.js',
];

export async function publicFiles(root) {
  // Deliberate allowlist: a new backend, secret, package or test file can never
  // accidentally become a public static asset.
  const assets = await readdir(new URL('assets/', root), { withFileTypes: true });
  return [...PUBLIC_FILES, ...assets.filter(item => item.isFile() && /\.(?:png|svg|txt)$/.test(item.name)).map(item => `assets/${item.name}`)];
}
