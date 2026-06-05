import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

for (const f of fs.readdirSync(root).filter((x) => x.endsWith(".html"))) {
  const c = fs.readFileSync(path.join(root, f), "utf8");
  if (!referencePageRe.test(c)) continue;
  const m = c.match(/data-section="benefits"[\s\S]*?<\/section>/);
  if (!m) continue;
  const s = m[0];
  let type = "other";
  if (s.includes("karlsruhe-benefit-card")) type = "karlsruhe-card";
  else if (s.includes("cleanroom-benefits__item")) type = "cleanroom-item";
  else if (s.includes('class="benefit-card"')) type = "benefit-card";
  else if (s.includes("<ul")) type = "ul";
  if (type !== "karlsruhe-card") console.log(f, type);
}
