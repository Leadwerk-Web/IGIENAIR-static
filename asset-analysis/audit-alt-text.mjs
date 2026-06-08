import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".git", "leadwerk_importer", "leadwerk_theme", ".playwright-mcp", "asset-analysis"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

const imgRe = /<img\b[^>]*>/gi;
const stats = { total: 0, empty: 0, missing: 0, hasText: 0 };
const emptySamples = new Map();
const missingSamples = [];
const contentEmpty = [];

for (const file of walk(root)) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file).replace(/\\/g, "/");
  for (const tag of html.match(imgRe) || []) {
    stats.total++;
    const altMatch = tag.match(/\balt=(["'])(.*?)\1/i);
    if (!altMatch) {
      stats.missing++;
      if (missingSamples.length < 15) missingSamples.push({ rel, tag });
      continue;
    }
    const alt = altMatch[2];
    if (alt.trim() === "") {
      stats.empty++;
      const key = tag.replace(/\s+/g, " ").slice(0, 120);
      emptySamples.set(key, (emptySamples.get(key) || 0) + 1);
      if (
        !tag.includes("brand__logo") &&
        !tag.includes("header-badge") &&
        !tag.includes("logo-weiss") &&
        !tag.includes("logo.svg")
      ) {
        contentEmpty.push({ rel, tag: tag.replace(/\s+/g, " ").slice(0, 140) });
      }
    } else {
      stats.hasText++;
    }
  }
}

console.log(JSON.stringify({ stats, emptyPatterns: [...emptySamples.entries()].slice(0, 12), contentEmpty: contentEmpty.slice(0, 30), missingSamples }, null, 2));
