import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const urls = new Set();
const filePattern = /\.(css|js|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|eot)(?:[?#][^"' <>)]+)?$/i;

function decodeEntities(value) {
  return value.replace(/&#038;/g, '&').replace(/&amp;/g, '&');
}

for (const match of html.matchAll(/https?:\/\/[^"' <>)]+/g)) {
  const url = decodeEntities(match[0]);
  if (filePattern.test(url)) urls.add(url);
}

const manifest = {};
for (const url of [...urls].sort()) {
  const parsed = new URL(url);
  const base = path.basename(parsed.pathname);
  const ext = path.extname(base) || '.bin';
  const stem = base.slice(0, base.length - ext.length).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80) || 'asset';
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 10);
  const dir = parsed.hostname.replace(/^www\./, '').replace(/[^a-zA-Z0-9.-]/g, '-');
  const local = `assets/vendor/${dir}/${stem}-${hash}${ext}`;
  manifest[url] = local;
}

fs.mkdirSync(path.join(root, 'assets/vendor'), { recursive: true });
fs.writeFileSync(path.join(root, 'assets/vendor/manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(root, 'assets/vendor/asset-urls.txt'), Object.keys(manifest).join('\n') + '\n');
console.log(`Prepared ${Object.keys(manifest).length} remote file assets.`);
