import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "leadwerk_importer",
  "leadwerk_theme",
  ".playwright-mcp",
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function fixLinkedCardIcons(html, className, imgPattern, altPrefix = "") {
  const re = new RegExp(`<a class="${className}"[\\s\\S]*?<\\/a>`, "g");
  return html.replace(re, (block) => {
    if (!imgPattern.test(block) || !block.includes('alt=""')) {
      imgPattern.lastIndex = 0;
      return block;
    }
    imgPattern.lastIndex = 0;
    const h3 = block.match(/<h3>([^<]*)<\/h3>/);
    if (!h3) return block;
    const label = `${altPrefix}${h3[1]}`;
    return block.replace(
      /(<img src="[^"]+") alt=""/g,
      `$1 alt="${label}"`,
    );
  });
}

function fixAltText(html) {
  let next = html;

  for (const className of ["sector-card", "customers-teaser"]) {
    next = fixLinkedCardIcons(next, className, /sector-|germany-admin-map/);
  }

  next = fixLinkedCardIcons(next, "branchen-card", /pdf-document\.svg/, "PDF: ");
  next = fixLinkedCardIcons(next, "branchen-card", /sector-/);

  next = next.replace(
    /(<img class="header-badge"[^>]*src="[^"]*germany-badge\.webp") alt=""/g,
    '$1 alt="Deutschlandweit pr&auml;sent"',
  );

  return next;
}

let changed = 0;
for (const file of walk(root)) {
  const content = fs.readFileSync(file, "utf8");
  const next = fixAltText(content);
  if (next !== content) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
  }
}

console.log(`Alt-Texte ergänzt in ${changed} Dateien`);
