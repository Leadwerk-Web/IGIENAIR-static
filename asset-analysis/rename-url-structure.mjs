import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const RENAMES = [
  ["unternehmen.html", "unternehmen.html"],
  ["leistungen.html", "leistungen.html"],
  ["normen.html", "normen.html"],
  ["anlagen.html", "anlagen.html"],
  ["kunden.html", "kunden.html"],
  ["jobs.html", "jobs.html"],
  ["biberach-an-der-riss.html", "biberach-an-der-riss.html"],
];

const TEXT_EXTENSIONS = new Set([".html", ".css", ".js", ".mjs", ".md", ".json"]);

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = walkFiles(root);
let totalReplacements = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  for (const [from, to] of RENAMES) {
    if (!content.includes(from)) {
      continue;
    }
    const parts = content.split(from);
    totalReplacements += parts.length - 1;
    content = parts.join(to);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, "utf8");
  }
}

for (const [from, to] of RENAMES) {
  const fromPath = path.join(root, from);
  const toPath = path.join(root, to);

  if (!fs.existsSync(fromPath)) {
    console.warn(`Übersprungen (nicht gefunden): ${from}`);
    continue;
  }
  if (fs.existsSync(toPath)) {
    throw new Error(`Ziel existiert bereits: ${to}`);
  }

  fs.renameSync(fromPath, toPath);
  console.log(`Umbenannt: ${from} → ${to}`);
}

console.log(`\nErsetzungen in Dateien: ${totalReplacements}`);
console.log("Fertig.");
