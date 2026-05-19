import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/vendor/manifest.json'), 'utf8'));

let ok = 0;
let failed = 0;

for (const [url, local] of Object.entries(manifest)) {
  const target = path.join(root, local);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target) && fs.statSync(target).size > 0) {
    ok += 1;
    continue;
  }

  const result = spawnSync('curl', ['-L', '--fail', '--silent', '--show-error', '--retry', '2', '--output', target, url], {
    stdio: 'pipe',
    encoding: 'utf8',
  });

  if (result.status === 0) {
    ok += 1;
  } else {
    failed += 1;
    fs.rmSync(target, { force: true });
    process.stderr.write(`FAILED ${url}\n${result.stderr || ''}\n`);
  }
}

console.log(`Downloaded ${ok} assets, failed ${failed}.`);
process.exit(failed ? 1 : 0);
