import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

function patchServicesSection(sectionHtml) {
  return sectionHtml.replace(
    /<article class="([^"]*\bfiltertest-standard__copy\b[^"]*)"/g,
    (match, cls) => {
      if (cls.includes("karlsruhe-services__copy")) return match;
      return `<article class="${cls} karlsruhe-services__copy"`;
    }
  );
}

function patch(content) {
  if (!content.includes('data-section="services"')) return content;

  return content.replace(
    /(<section[^>]*data-section="services"[\s\S]*?<\/section>)/,
    (section) => patchServicesSection(section)
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

console.log(`\nAdded karlsruhe-services__copy on ${updated} pages.`);
