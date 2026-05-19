import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const cssPath = path.join(root, 'style.css');
const manifestPath = path.join(root, 'assets/vendor/manifest.json');

let html = fs.readFileSync(indexPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function htmlAmp(value) {
  return value.replace(/&/g, '&amp;');
}

function html038(value) {
  return value.replace(/&/g, '&#038;');
}

for (const [remote, local] of Object.entries(manifest)) {
  for (const variant of [remote, htmlAmp(remote), html038(remote)]) {
    html = html.replace(new RegExp(escapeRegExp(variant), 'g'), local);
  }
}

html = html.replace(/<link\b[^>]*(?:rss\+xml|oembed|wp-json|xmlrpc|rsd|shortlink|dns-prefetch)[^>]*>\s*/gi, '');
html = html.replace(/<link\b[^>]*rel=["']https:\/\/api\.w\.org\/["'][^>]*>\s*/gi, '');
html = html.replace(/<script\b[^>]*src=["']data:text\/javascript[^"']*["'][^>]*><\/script>\s*/gi, '');

const movedCss = [];
html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_match, attrs, content) => {
  const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
  const label = id ? `/* moved from #${id} */` : '/* moved from inline <style> */';
  movedCss.push(`${label}\n${content.trim()}`);
  return '';
});

const styleMap = new Map();
let styleIndex = 1;
html = html.replace(/\sstyle=(["'])([\s\S]*?)\1/g, (_match, quote, rawStyle) => {
  const style = rawStyle.trim();
  if (!style) return '';
  if (!styleMap.has(style)) styleMap.set(style, `migrated-style-${styleIndex++}`);
  return ` class="${styleMap.get(style)}"`;
});

html = html.replace(/<([a-z0-9:-]+)([^>]*?)\sclass=(["'])([^"']*)\3([^>]*?)\sclass=(["'])([^"']*)\6/gi, (_match, tag, before, _q1, c1, after, _q2, c2) => {
  return `<${tag}${before}${after} class="${`${c1} ${c2}`.trim()}"`;
});

const commentReplacement = `
<div class="elementor-element elementor-element-c5f67fe elementor-widget local-comment-widget" data-id="c5f67fe" data-element_type="widget" data-e-type="widget">
  <div class="elementor-widget-container">
    <div class="local-comment-box">
      <form id="localCommentForm" class="local-comment-form">
        <input id="localCommentName" type="text" placeholder="Nama" required>
        <textarea id="localCommentMessage" rows="3" placeholder="Ucapan" required></textarea>
        <select id="localCommentAttendance" required>
          <option value="Hadir">Hadir</option>
          <option value="Tidak Hadir">Tidak Hadir</option>
          <option value="Masih Ragu">Masih Ragu</option>
        </select>
        <button type="submit">Kirim</button>
      </form>
      <div id="localCommentStats" class="local-comment-stats"></div>
      <div id="localCommentList" class="local-comment-list" aria-live="polite"></div>
    </div>
  </div>
</div>
`;

html = html.replace(/<div class="elementor-element elementor-element-c5f67fe[\s\S]*?(?=<div class="elementor-element elementor-element-567ff494)/, commentReplacement);

if (movedCss.length || styleMap.size) {
  css += '\n\n/* Migrated from index.html */\n';
  if (movedCss.length) css += movedCss.join('\n\n') + '\n';
  for (const [style, className] of styleMap.entries()) {
    css += `.${className} { ${style} }\n`;
  }
}

fs.writeFileSync(indexPath, html);
fs.writeFileSync(cssPath, css);

console.log(`Localized ${Object.keys(manifest).length} assets.`);
console.log(`Moved ${movedCss.length} style blocks and ${styleMap.size} style attributes.`);
