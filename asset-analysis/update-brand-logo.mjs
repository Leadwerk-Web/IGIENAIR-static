import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brandBlock = `      <a class="brand" href="BRAND_HREF" aria-label="Igienair Startseite">
        <img class="brand__logo brand__logo--light" src="/assets/images/Logo-weiss.svg" alt="">
        <img class="brand__logo brand__logo--dark" src="/assets/images/Logo.svg" alt="">
      </a>`;

const patterns = [
  /<a class="brand" href="([^"]*)"[^>]*>\s*<span class="brand__logo brand__logo--light"[^>]*><\/span>\s*<img class="brand__logo brand__logo--dark"[^>]*>\s*<\/a>/gs,
  /<a class="brand" href="([^"]*)"[^>]*>\s*<img class="brand__logo brand__logo--light"[^>]*>\s*<img class="brand__logo brand__logo--dark"[^>]*>\s*<\/a>/gs,
  /<a class="brand" href="([^"]*)"[^>]*>\s*<img class="brand__logo" src="assets\/images\/Logo\.svg"[^>]*>\s*<\/a>/gs,
];

let updated = 0;
for (const file of fs.readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const fp = path.join(root, file);
  let html = fs.readFileSync(fp, 'utf8');
  let changed = false;
  for (const re of patterns) {
    const next = html.replace(re, (_, href) => {
      changed = true;
      return brandBlock.replace('BRAND_HREF', href);
    });
    if (next !== html) html = next;
  }
  if (changed) {
    fs.writeFileSync(fp, html);
    updated++;
  }
}
console.log(`Logo-Markup aktualisiert in ${updated} Dateien`);
