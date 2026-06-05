import fs from "fs";
import path from "path";

// Hinweis: Für Vor-Ort + Leistungen gemeinsam ohne Duplikate pro Seite
// update-reference-page-images.mjs verwenden.

const root = path.resolve(import.meta.dirname, "..");
const imageBase = "assets/images/Genutze Bilder_LW/Referenzen/";

const referencePageRe =
  /page-reference-city|page-karlsruhe-reference/;

function naturalSort(a, b) {
  return path.basename(a).localeCompare(path.basename(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function loadOverviewImages() {
  const dir = path.join(root, imageBase);
  return fs
    .readdirSync(dir)
    .filter((name) => /Referenzen_Leistungen_ReinigungDesinfektion/i.test(name))
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .map((name) => `${imageBase}${name}`)
    .sort(naturalSort);
}

const images = loadOverviewImages();
let imageIndex = 0;

function nextImage() {
  if (!images.length) return null;
  const img = images[imageIndex % images.length];
  imageIndex += 1;
  return img;
}

function patchOverviewSection(sectionHtml) {
  if (!/VOR ORT|VOR&nbsp;ORT/i.test(sectionHtml)) return sectionHtml;

  const imgMatch = sectionHtml.match(
    /(<figure class="company-media-card[^"]*">\s*<img src=")([^"]+)("[^>]*>)/
  );
  if (!imgMatch) return sectionHtml;

  const newSrc = nextImage();
  if (!newSrc || newSrc === imgMatch[2]) return sectionHtml;

  return sectionHtml.replace(imgMatch[0], `${imgMatch[1]}${newSrc}${imgMatch[3]}`);
}

function patch(content) {
  if (!content.includes('data-section="overview"')) return content;

  return content.replace(
    /(<section[^>]*data-section="overview"[\s\S]*?<\/section>)/,
    (section) => patchOverviewSection(section)
  );
}

const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .map((name) => path.join(root, name))
  .filter((file) => referencePageRe.test(fs.readFileSync(file, "utf8")))
  .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

let updated = 0;
const usageCount = new Map();

console.log(`Bild-Pool „Vor Ort“: ${images.length} Bilder`);
for (const img of images) console.log(`  - ${path.basename(img)}`);
console.log("");

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const patched = patch(original);
  if (patched !== original) {
    fs.writeFileSync(file, patched, "utf8");
    updated += 1;
    console.log("Updated:", path.basename(file));
  }

  const section = patched.match(/data-section="overview"[\s\S]*?<\/section>/);
  if (!section || !/VOR ORT|VOR&nbsp;ORT/i.test(section[0])) continue;

  const src = section[0].match(/<figure class="company-media-card[^"]*">\s*<img src="([^"]+)"/)?.[1];
  if (src) usageCount.set(src, (usageCount.get(src) ?? 0) + 1);
}

console.log(`\nUpdated ${updated} reference pages (Abschnitt „Vor Ort“).`);

const sortedUsage = [...usageCount.entries()].sort((a, b) => b[1] - a[1]);
if (sortedUsage.length) {
  console.log("\nBildverteilung:");
  for (const [src, count] of sortedUsage) {
    console.log(`  ${count}x ${path.basename(src)}`);
  }
}

if (!images.length) {
  console.error("\nKeine Referenzen_Leistungen_ReinigungDesinfektion-Bilder gefunden.");
  process.exit(1);
}
