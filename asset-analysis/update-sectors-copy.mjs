import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

const indexCopy = `<p>Unsere Spezialisten gehen in allen Bereichen der <strong>L&uuml;ftungsanlagenreinigung</strong> auf Ihre individuellen Herausforderungen ein. Wir bieten technische Hygiene und ma&szlig;geschneiderte Kundenl&ouml;sungen in vielen verschiedenen Branchen. Raumlufttechnik in Gemeindeeinrichtungen oder in der Industrie, Hygieneanforderungen in der Gastronomie oder Hygieneinspektionen im Bereich Gesundheitswesen geh&ouml;ren zu unserem Leistungsportfolio.</p>`;

const skipFiles = new Set(["index.html", "energetische-inspektion-geg-2020.html"]);

const shortCopy =
  "<p>Vom Gesundheitswesen &uuml;ber Industrie und Gastronomie bis hin zu &ouml;ffentlichen Einrichtungen: Igienair betreut Kunden aus zahlreichen Branchen mit normkonformer Raumlufthygiene.</p>";

const loremParagraph =
  "<p>Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna.</p>";

const buttonPatterns = [
  /\s*<button class="button button--ghost" type="button" data-inert>Erfahren Sie mehr<\/button>/g,
  /\s*<button class="button button--outline-light" type="button" data-inert>Erfahren Sie mehr<\/button>/g,
];

function patch(content) {
  if (!content.includes('class="sectors__copy"')) return content;

  let next = content;

  next = next.replaceAll(shortCopy, indexCopy);
  next = next.replaceAll(loremParagraph, indexCopy);

  for (const pattern of buttonPatterns) {
    next = next.replace(pattern, "");
  }

  return next;
}

const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html") && !skipFiles.has(name))
  .map((name) => path.join(root, name))
  .filter((file) => fs.readFileSync(file, "utf8").includes('class="sectors__copy"'));

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

console.log(`Updated ${updated} of ${files.length} pages with sectors section.`);
