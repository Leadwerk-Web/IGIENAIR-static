import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

const titles = new Map();

for (const f of fs.readdirSync(root).filter((x) => x.endsWith(".html"))) {
  const c = fs.readFileSync(path.join(root, f), "utf8");
  if (!referencePageRe.test(c)) continue;
  const section = c.match(/data-section="services"[\s\S]*?<\/section>/);
  if (!section) continue;
  const hs = section[0].match(/<h3>([^<]+)<\/h3>/g) || [];
  for (const h of hs) {
    const t = h.replace(/<\/?h3>/g, "").trim();
    titles.set(t, (titles.get(t) || 0) + 1);
  }
}

for (const [t, n] of [...titles.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${n}\t${t}`);
}
