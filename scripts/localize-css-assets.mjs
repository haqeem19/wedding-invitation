import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const vendorDir = path.join(root, "assets", "vendor");
const remoteUrlPattern = /url\((['"]?)(https?:\/\/[^'")]+)\1\)/g;

async function listCssFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listCssFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".css")) files.push(fullPath);
  }

  return files;
}

function assetPathForUrl(url) {
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname) || ".asset";
  const basename = path.basename(parsed.pathname, ext).replace(/[^a-zA-Z0-9._-]/g, "-") || "asset";
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 10);
  return path.join(vendorDir, parsed.hostname, `${basename}-${hash}${ext}`);
}

async function download(url) {
  const destination = assetPathForUrl(url);
  await mkdir(path.dirname(destination), { recursive: true });

  try {
    await readFile(destination);
    return destination;
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destination, buffer);
    return destination;
  }
}

const cssFiles = await listCssFiles(vendorDir);
const urls = new Set();

for (const file of cssFiles) {
  const content = await readFile(file, "utf8");
  for (const match of content.matchAll(remoteUrlPattern)) {
    urls.add(match[2]);
  }
}

const urlToLocal = new Map();
let failed = 0;

for (const url of urls) {
  try {
    urlToLocal.set(url, await download(url));
  } catch (error) {
    failed += 1;
    console.error(`Failed ${url}: ${error.message}`);
  }
}

for (const file of cssFiles) {
  let content = await readFile(file, "utf8");
  let changed = false;

  content = content.replace(remoteUrlPattern, (match, quote, url) => {
    const local = urlToLocal.get(url);
    if (!local) return match;
    changed = true;
    return `url(${quote}${path.relative(path.dirname(file), local).replaceAll(path.sep, "/")}${quote})`;
  });

  if (changed) await writeFile(file, content);
}

console.log(`Localized ${urlToLocal.size} CSS assets, failed ${failed}.`);
