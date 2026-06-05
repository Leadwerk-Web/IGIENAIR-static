import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

const button =
  '<a class="button button--solid" href="/#angebot">Angebot anfordern</a>';

const copyArticleRe =
  /(<article class="section-copy (?:cleanroom-overview__copy|bernau-overview__copy|brandenburg-overview__copy)">[\s\S]*?)(\s*<\/article>)/;

function patch(content) {
  const section = content.match(
    /<section[^>]*data-section="overview"[\s\S]*?<\/section>/
  );
  if (!section || !/VOR ORT|VOR&nbsp;ORT/i.test(section[0])) return content;

  const copyBlock = section[0].match(copyArticleRe);
  if (!copyBlock) return content;
  if (/Angebot anfordern/.test(copyBlock[0])) return content;

  return content.replace(
    /(<section[^>]*data-section="overview"[\s\S]*?<article class="section-copy (?:cleanroom-overview__copy|bernau-overview__copy|brandenburg-overview__copy)">[\s\S]*?)(\s*<\/article>)/,
    `$1\n          ${button}$2`
  );
}

const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .map((name) => path.join(root, name))
  .filter((file) => referencePageRe.test(fs.readFileSync(file, "utf8")));

let updated = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const patched = patch(original);
  if (patched !== original) {
    fs.writeFileSync(file, patched, "utf8");
    updated += 1;
    console.log("Updated:", path.basename(file));
  }
}

console.log(`\n${updated} Seiten mit Vor-Ort-Button ergänzt.`);
