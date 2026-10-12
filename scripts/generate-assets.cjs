// Optional asset regeneration: requires sharp and lucide on Node's module path.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { icons } = require('lucide');
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const names = {
  'house': 'House', 'zap': 'Zap', 'book-open': 'BookOpen',
  'clipboard-list': 'ClipboardList', 'pen-line': 'PenLine',
  'smartphone': 'Smartphone', 'refresh-cw': 'RefreshCw', 'share': 'Share', 'x': 'X', 'moon': 'Moon'
};
const symbols = Object.entries(names).map(([id, name]) => {
  const elements = icons[name].map(([tag, attrs]) =>
    `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${escape(value)}"`).join(' ')}/>`
  ).join('');
  return `<symbol id="${id}" viewBox="0 0 24 24">${elements}</symbol>`;
}).join('\n');
fs.writeFileSync(path.join(assets, 'ui-icons.svg'), `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols}\n</svg>\n`);
fs.copyFileSync(path.join(path.dirname(require.resolve('lucide/package.json')), 'LICENSE'), path.join(assets, 'LUCIDE-LICENSE.txt'));
Promise.all([[180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']].map(([size, name]) =>
  sharp(path.join(assets, 'icon.svg')).resize(size, size).png().toFile(path.join(assets, name + '.png'))
)).then(() => console.log('Generated home-screen icons and local Lucide sprite.')).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
