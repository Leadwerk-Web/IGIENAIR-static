import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

const buttonPatterns = [
  /\s*<a class="button button--solid" href="index\.html#angebot">Angebot anfordern<\/a>\s*/g,
  /\s*<a class="button button--solid reference-region-overview__cta" href="index\.html#angebot">Angebot anfordern<\/a>\s*/g,
  /\s*<button class="button button--solid" type="button" data-inert>Angebot anfordern<\/button>\s*/g,
  /\s*<button class="button button--solid" type="button" data-inert>Button<\/button>\s*/g,
];

function patch(content) {
  const match = content.match(
    /<section[^>]*data-section="services"[\s\S]*?<\/section>/
  );
  if (!match) return content;

  let section = match[0];
  const originalSection = section;

  for (const pattern of buttonPatterns) {
    section = section.replace(pattern, "\n");
  }

  if (section === originalSection) return content;
  return content.replace(originalSection, section);
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
