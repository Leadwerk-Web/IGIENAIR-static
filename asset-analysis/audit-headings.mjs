import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set([
  "node_modules",
  ".git",
  "leadwerk_importer",
  "leadwerk_theme",
  ".playwright-mcp",
  "asset-analysis",
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function isRedirectStub(html) {
  return (
    /<meta http-equiv="refresh"/i.test(html) &&
    /<body><p><a href/i.test(html)
  );
}

const issues = [];
const stats = {
  pages: 0,
  withH2: 0,
  noH2: 0,
  skipAfterH1: 0,
  levelSkips: 0,
  h3NoH2: 0,
  ok: 0,
};

for (const file of walk(root)) {
  const html = fs.readFileSync(file, "utf8");
  if (isRedirectStub(html)) continue;

  const rel = path.relative(root, file).replace(/\\/g, "/");
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings = [];
  let m;
  while ((m = re.exec(html))) {
    headings.push({ level: +m[1], text: stripHtml(m[2]).slice(0, 70) });
  }
  if (!headings.length) continue;

  stats.pages++;
  const h2count = headings.filter((h) => h.level === 2).length;
  const h3count = headings.filter((h) => h.level === 3).length;
  if (h2count === 0) stats.noH2++;
  else stats.withH2++;

  const pageIssues = [];

  const h1idx = headings.findIndex((h) => h.level === 1);
  if (h1idx >= 0) {
    const after = headings.slice(h1idx + 1);
    const firstSub = after.find((h) => h.level >= 2);
    if (firstSub && firstSub.level > 2) {
      pageIssues.push({
        type: "skip-after-h1",
        detail: `H1 → H${firstSub.level}: „${firstSub.text}"`,
      });
      stats.skipAfterH1++;
    }
  }

  let prev = headings[0]?.level || 1;
  for (let i = 1; i < headings.length; i++) {
    const cur = headings[i].level;
    if (cur > prev + 1) {
      pageIssues.push({
        type: "level-skip",
        detail: `H${prev} → H${cur}: „${headings[i].text}"`,
      });
      stats.levelSkips++;
    }
    if (cur <= prev) prev = cur;
    else prev = cur;
  }

  if (h3count > 0 && h2count === 0 && headings.some((h) => h.level === 1)) {
    pageIssues.push({
      type: "h3-no-h2",
      detail: `${h3count}× H3 ohne H2`,
    });
    stats.h3NoH2++;
  }

  if (pageIssues.length) {
    issues.push({
      rel,
      h2: h2count,
      h3: h3count,
      outline: headings.map((h) => `H${h.level}: ${h.text}`),
      issues: pageIssues,
    });
  } else {
    stats.ok++;
  }
}

const byType = {};
for (const p of issues) {
  for (const i of p.issues) {
    byType[i.type] = (byType[i.type] || 0) + 1;
  }
}

const patternCounts = {};
for (const p of issues) {
  const key = p.issues.map((i) => i.type).sort().join("+");
  patternCounts[key] = (patternCounts[key] || 0) + 1;
}

console.log(
  JSON.stringify(
    {
      stats,
      issueTypes: byType,
      patterns: patternCounts,
      affectedPages: issues.length,
      samples: issues.slice(0, 6),
      allAffected: issues.map((p) => ({
        rel: p.rel,
        issues: p.issues.map((i) => i.detail),
      })),
    },
    null,
    2,
  ),
);
