import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

const files = fs
  .readdirSync(root)
  .filter((n) => n.endsWith(".html"))
  .filter((n) => referencePageRe.test(fs.readFileSync(path.join(root, n), "utf8")));

const nonRef = new Map();
const byFile = [];

for (const f of files) {
  const c = fs.readFileSync(path.join(root, f), "utf8");
  const main = c.match(/<main[\s\S]*?<\/main>/)?.[0] ?? c;
  const hits = [];
  for (const m of main.matchAll(/<img src="([^"]+)"/g)) {
    const src = m[1];
    if (/Logo|sector-/i.test(src)) continue;
    if (!src.includes("Referenzen/")) {
      hits.push(src);
      nonRef.set(src, (nonRef.get(src) ?? 0) + 1);
    }
  }
  if (hits.length) byFile.push({ f, hits });
}

console.log("Non-Referenzen images:");
for (const [s, n] of [...nonRef.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${n}x ${s}`);
}
console.log(`\n${byFile.length} pages affected`);
