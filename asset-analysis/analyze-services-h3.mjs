import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .map((name) => path.join(root, name))
  .filter((file) => referencePageRe.test(fs.readFileSync(file, "utf8")));

const missingCopyClass = [];
const h3WithClass = [];
const otherCopyClasses = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const section = content.match(/<section[^>]*data-section="services"[\s\S]*?<\/section>/);
  if (!section) continue;

  const html = section[0];
  const articles = [...html.matchAll(/<article class="([^"]*filtertest-standard__copy[^"]*)"/g)];

  for (const [, cls] of articles) {
    if (!cls.includes("karlsruhe-services__copy")) {
      missingCopyClass.push({ file: path.basename(file), cls });
    }
    if (/bernau-services__copy|brandenburg-services__copy|berlin-services__copy/.test(cls)) {
      otherCopyClasses.push({ file: path.basename(file), cls });
    }
  }

  const h3s = [...html.matchAll(/<h3([^>]*)>/g)];
  for (const [, attrs] of h3s) {
    if (attrs.includes("class=")) {
      h3WithClass.push({ file: path.basename(file), attrs: attrs.trim() });
    }
  }
}

console.log("Pages missing karlsruhe-services__copy on article:", missingCopyClass.length);
for (const e of missingCopyClass.slice(0, 5)) console.log(" ", e.file, "->", e.cls);
if (missingCopyClass.length > 5) console.log(`  ... +${missingCopyClass.length - 5} more`);

console.log("\nOther copy class variants:", otherCopyClasses.length);
for (const e of otherCopyClasses) console.log(" ", e.file, "->", e.cls);

console.log("\nH3 with class attribute in services:", h3WithClass.length);
const byClass = new Map();
for (const e of h3WithClass) {
  const key = e.attrs;
  byClass.set(key, (byClass.get(key) ?? 0) + 1);
}
for (const [key, count] of byClass) console.log(`  ${count}x ${key}`);
