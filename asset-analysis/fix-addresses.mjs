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
  "asset-analysis",
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(html|js|mjs|php)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

const replacements = [
  ["Am Hardtwald 6–8", "Robert-Bosch-Str. 10"],
  ["Am Hardtwald 6-8", "Robert-Bosch-Str. 10"],
  ["Am Hardtwald 6<br>", "Robert-Bosch-Str. 10<br>"],
  [
    "IGIENAIR+GmbH,+Am+Hardtwald+6-8",
    "IGIENAIR+GmbH,+Robert-Bosch-Str.+10",
  ],
  [
    "Honbergstr. 23<br>78532 Tuttlingen",
    "Frank-Ziwey-Ring 18 Unit 102<br>78333 Stockach",
  ],
  ["tel:+4974619134000", "tel:+49777163640009"],
  [">07461 9134000<", ">07771 63640009<"],
  ['street: "Honbergstr. 23"', 'street: "Frank-Ziwey-Ring 18 Unit 102"'],
  ['city: "78532 Tuttlingen"', 'city: "78333 Stockach"'],
  ['phone: "07461 9134000"', 'phone: "07771 63640009"'],
];

let changed = 0;
for (const file of walk(root)) {
  let content = fs.readFileSync(file, "utf8");
  let next = content;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  if (next !== content) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
  }
}

console.log(`Aktualisiert: ${changed} Dateien`);
