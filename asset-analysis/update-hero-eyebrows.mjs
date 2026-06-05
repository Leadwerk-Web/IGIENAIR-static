import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CLASS_TO_OVERVIEW = [
  ["Unternehmen", ["page-company", "page-sustainability", "page-safety", "page-quality", "page-environment", "page-environmental", "page-certifications"]],
  ["Leistungen", ["page-services", "page-inspection", "page-repair", "page-energy", "page-cleaning", "page-room-disinfection"]],
  ["Normen", ["page-standards", "page-vdi-detail", "page-glossary"]],
  [
    "Anlagen",
    [
      "page-equipment",
      "page-duct-cleaning",
      "page-air-duct-cleaning",
      "page-hygiene-inspection",
      "page-kitchen-exhaust",
      "page-evaporators",
      "page-cleanroom",
      "page-oproom",
      "page-cooling-tower",
      "page-cold-shelves",
      "page-textile-ducts",
      "page-datacenter",
      "page-filtertest",
      "page-leaktest",
      "page-laborabzug",
      "page-chiller",
      "page-splitcooling",
      "page-processair",
      "page-channel-inspection",
      "page-cooling-systems",
    ],
  ],
  ["Kunden", ["page-customers", "page-references", "page-industries"]],
  ["Jobs", ["page-jobs"]],
  ["Standorte", ["page-locations", "page-reference-city", "page-reference-region", "page-karlsruhe-reference"]],
];

const FILE_TO_OVERVIEW = {
  "rlt-hygiene.html": "Anlagen",
  "hygieneinspektion-vdi-6022.html": "Leistungen",
};

function resolveOverview(file, bodyClasses) {
  if (FILE_TO_OVERVIEW[file]) return FILE_TO_OVERVIEW[file];
  for (const [title, tokens] of CLASS_TO_OVERVIEW) {
    if (bodyClasses.some((c) => tokens.includes(c))) return title;
  }
  if (bodyClasses.includes("page-agb")) return "Unternehmen";
  return null;
}

const heroBlockRe =
  /<div class="container (?:company-hero__content|vdi-hero__content|job-detail-hero__content)[^"]*">([\s\S]*?)<\/div>\s*<\/section>/g;

function updateHeroBlock(inner, overview) {
  if (!/<h1\b/.test(inner)) return inner;
  if (/<p class="eyebrow">/.test(inner)) {
    return inner.replace(/<p class="eyebrow">[^<]*<\/p>/, `<p class="eyebrow">${overview}</p>`);
  }
  return inner.replace(/(\s*)(<h1\b)/, `$1<p class="eyebrow">${overview}</p>$1$2`);
}

let updated = 0;
const skipped = [];

for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  const filePath = path.join(root, file);
  let html = fs.readFileSync(filePath, "utf8");
  if (!html.includes("company-hero__content") && !html.includes("job-detail-hero__content")) {
    continue;
  }

  const bodyMatch = html.match(/<body class="([^"]+)"/);
  if (!bodyMatch) continue;

  const overview = resolveOverview(file, bodyMatch[1].split(/\s+/));
  if (!overview) {
    skipped.push(`${file}: ${bodyMatch[1]}`);
    continue;
  }

  const newHtml = html.replace(heroBlockRe, (sectionMatch, inner) => {
    const newInner = updateHeroBlock(inner, overview);
    return sectionMatch.replace(inner, newInner);
  });

  if (newHtml !== html) {
    fs.writeFileSync(filePath, newHtml, "utf8");
    updated++;
  }
}

console.log(`Updated ${updated} files`);
if (skipped.length) {
  console.log(`Skipped ${skipped.length}:`);
  skipped.forEach((s) => console.log(`  ${s}`));
}
