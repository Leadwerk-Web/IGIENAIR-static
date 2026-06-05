import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference|page-references/;

const hasSeparateHeadRe =
  /reference-region-overview__heading|reference-overview__head|memmingen-overview__head|bernau-overview__head|brandenburg-overview__head/;

function patchCityOverview(content) {
  if (!content.includes('class="container cleanroom-overview__grid"')) return content;
  if (hasSeparateHeadRe.test(content)) return content;

  const openingRe =
    /(<section class="cleanroom-overview filtertest-overview karlsruhe-overview" id="[^"]*" data-section="overview">\s*)<div class="container cleanroom-overview__grid">\s*<article class="section-copy cleanroom-overview__copy">\s*(<p class="eyebrow">[\s\S]*?<\/p>)\s*(<h2>[\s\S]*?<\/h2>)\s*(<div class="gradient-line"><\/div>)\s*/;

  if (!openingRe.test(content)) return content;

  let next = content.replace(
    openingRe,
    `$1<div class="container reference-overview__layout">
        <header class="section-copy reference-overview__head">
          $2
          $3
          $4
        </header>

        <div class="cleanroom-overview__grid">
        <article class="section-copy cleanroom-overview__copy">
          `
  );

  next = next.replace(
    /(<section class="cleanroom-overview filtertest-overview karlsruhe-overview"[\s\S]*?<figure class="company-media-card karlsruhe-overview__media">[\s\S]*?<\/figure>)\s*<\/div>\s*<\/section>/,
    "$1\n        </div>\n      </div>\n    </section>"
  );

  return next;
}

function patchRegionOverview(content) {
  if (content.includes("reference-region-overview__stack")) return content;

  const openingRe =
    /(<section class="company-section company-section--soft reference-region-overview" id="[^"]*" data-section="overview">\s*)<div class="container company-grid reference-region-overview__grid">\s*<article class="section-copy reference-region-overview__copy">\s*(<p class="eyebrow">[\s\S]*?<\/p>)\s*(<h2>[\s\S]*?<\/h2>)\s*(<div class="gradient-line"><\/div>)\s*/;

  if (!openingRe.test(content)) return content;

  let next = content.replace(
    openingRe,
    `$1<div class="container reference-region-overview__stack">
        <header class="section-copy reference-region-overview__heading">
          $2
          $3
          $4
        </header>

        <div class="company-grid reference-region-overview__grid">
        <article class="section-copy reference-region-overview__copy company-section__copy">
          `
  );

  next = next.replace(
    /(<section class="company-section company-section--soft reference-region-overview"[\s\S]*?<aside class="reference-region-overview__side">[\s\S]*?<\/aside>)\s*<\/div>\s*<\/section>/,
    "$1\n        </div>\n      </div>\n    </section>"
  );

  return next;
}

function patchReferencesOverview(content) {
  if (content.includes("reference-overview__head")) return content;

  const openingRe =
    /(<section class="company-section company-section--soft references-overview"[\s\S]*?)<div class="container company-grid industries-overview__intro">\s*<article class="section-copy industries-overview__copy">\s*(<p class="eyebrow">[\s\S]*?<\/p>)\s*(<h2>[\s\S]*?<\/h2>)\s*(<div class="gradient-line"><\/div>)\s*/;

  if (!openingRe.test(content)) return content;

  let next = content.replace(
    openingRe,
    `$1<div class="container reference-overview__layout">
        <header class="section-copy reference-overview__head">
          $2
          $3
          $4
        </header>

        <div class="company-grid industries-overview__intro">
        <article class="section-copy industries-overview__copy">
          `
  );

  next = next.replace(
    /(<section class="company-section company-section--soft references-overview"[\s\S]*?<figure class="company-media-card industries-overview__media">[\s\S]*?<\/figure>)\s*<\/div>\s*\n\s*<div class="container">/,
    "$1\n        </div>\n      </div>\n\n      <div class=\"container\">"
  );

  return next;
}

function patch(content) {
  let next = content;
  next = patchCityOverview(next);
  next = patchRegionOverview(next);
  next = patchReferencesOverview(next);
  return next;
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
