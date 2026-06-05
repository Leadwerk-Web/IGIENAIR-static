import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

const files = fs
  .readdirSync(root)
  .filter((n) => n.endsWith(".html"))
  .filter((n) => referencePageRe.test(fs.readFileSync(path.join(root, n), "utf8")));

for (const f of files.sort()) {
  const c = fs.readFileSync(path.join(root, f), "utf8");
  const main = c.match(/<main[\s\S]*?<\/main>/)?.[0] ?? c;
  const content = [];
  const ov = main.match(/data-section="overview"[\s\S]*?<\/section>/);
  if (ov) {
    const src = ov[0].match(/<figure class="company-media-card[^"]*">\s*<img src="([^"]+)"/)?.[1];
    if (src) content.push(src);
  }
  const sv = main.match(/data-section="services"[\s\S]*?<\/section>/);
  if (sv) {
    for (const m of sv[0].matchAll(/filtertest-standard__media[\s\S]*?<img src="([^"]+)"/g)) {
      content.push(m[1]);
    }
  }
  const dupes = content.filter((s, i) => content.indexOf(s) !== i);
  if (dupes.length) {
    console.log(f, content.map((s) => path.basename(s)).join(" | "));
    console.log("  DUP:", [...new Set(dupes)].map((s) => path.basename(s)).join(", "));
  }
}
