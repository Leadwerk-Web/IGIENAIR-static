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
    else if (/\.(html|mjs)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

const replacements = [
  [
    '<a href="tel:+4972433699101">+49 (0) 7243 3699101</a>',
    '<a href="tel:+4972433699101">+49 (0) 7243 3699101</a>',
  ],
  [
    '<a href="tel:+4972433694943">+49 (0) 7243 3694 943</a>',
    '<a href="tel:+4972433694943">+49 (0) 7243 3694 943</a>',
  ],
  [
    '<a href="mailto:kontakt@igienair.com">kontakt@igienair.com</a>',
    '<a href="mailto:kontakt@igienair.com">kontakt@igienair.com</a>',
  ],
  [
    '<a href="mailto:anfrage@igienair.com">anfrage@igienair.com</a>',
    '<a href="mailto:anfrage@igienair.com">anfrage@igienair.com</a>',
  ],
  [
    "76275 Ettlingen<br><a class="text-link" href="tel:+4972433699101">07243 3699101</a><br>",
    '76275 Ettlingen<br><a class="text-link" href="tel:+4972433699101">07243 3699101</a><br>',
  ],
  [
    "Telefon: <a class="text-link" href="tel:+4972433699101">+49 (0) 7243 / 3699 101</a><br>",
    'Telefon: <a class="text-link" href="tel:+4972433699101">+49 (0) 7243 / 3699 101</a><br>',
  ],
  [
    "Telefon: <a class="text-link" href="tel:+4972433699101">07243 &ndash; 3699 10</a><br>",
    'Telefon: <a class="text-link" href="tel:+4972433699101">07243 &ndash; 3699 10</a><br>',
  ],
  [
    "Telefonnummer <a class="text-link" href="tel:+4972433699101">07243 3699 10</a></p>",
    'Telefonnummer <a class="text-link" href="tel:+4972433699101">07243 3699 10</a></p>',
  ],
  [
    "Fax: <a href="tel:+4972433694943">+49 (0) 7243 3694 943</a></p>",
    'Fax: <a href="tel:+4972433694943">+49 (0) 7243 3694 943</a></p>',
  ],
];

function enableContactLinks(html) {
  return html.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
    if (!/\shref="(?:mailto|tel|https?):/i.test(attrs)) return match;
    const cleaned = attrs.replace(/\sdata-inert/g, "");
    return `<a${cleaned}>`;
  });
}

let changed = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, "utf8");
  let next = content;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  next = enableContactLinks(next);
  if (next !== content) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
  }
}

console.log(`Aktualisiert: ${changed} Dateien`);
