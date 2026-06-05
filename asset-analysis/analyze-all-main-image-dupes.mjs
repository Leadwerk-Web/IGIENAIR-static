import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

const files = fs
  .readdirSync(root)
  .filter((n) => n.endsWith(".html"))
  .filter((n) => referencePageRe.test(fs.readFileSync(path.join(root, n), "utf8")));

let found = 0;

for (const f of files.sort()) {
  const c = fs.readFileSync(path.join(root, f), "utf8");
  const main = c.match(/<main[\s\S]*?<\/main>/)?.[0] ?? c;
  const imgs = [...main.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]);
  const dupes = imgs.filter((s, i) => imgs.indexOf(s) !== i);
  if (dupes.length) {
    found += 1;
    console.log(f);
    console.log("  ", [...new Set(dupes)].map((s) => path.basename(s)).join(", "));
  }
}

if (!found) {
  console.log("Keine doppelten Bilder im <main> auf Referenz-Seiten.");
}
