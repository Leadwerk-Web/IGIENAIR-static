import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

function patch(content) {
  return content.replace(
    /(<section class="filtertest-standard karlsruhe-services[^"]*"[^>]*data-section="services">[\s\S]*?<div class="container">\s*)<div class="karlsruhe-services__head">\s*(<header class="section-copy karlsruhe-services__heading">[\s\S]*?<\/header>)\s*(<a class="button[^>]*>[\s\S]*?<\/a>\s*)?<\/div>/g,
    (_, prefix, header, button = "") => `${prefix}${header}\n        ${button || ""}`.replace(/\n\s+$/, "\n")
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

console.log(`Updated ${updated} of ${files.length} reference pages.`);
