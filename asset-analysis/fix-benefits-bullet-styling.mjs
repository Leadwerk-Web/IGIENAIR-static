import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

function patchWiesbadenBenefits(content) {
  const match = content.match(
    /<section class="filtertest-standard karlsruhe-services" id="wiesbaden-benefits"[\s\S]*?<\/section>/
  );
  if (!match) return content;

  const section = match[0];
  const h2 = section.match(/<h2>([\s\S]*?)<\/h2>/)?.[1]?.trim() ?? "";
  const intro =
    section.match(/<p class="karlsruhe-services__intro">([\s\S]*?)<\/p>/)?.[1]?.trim() ??
    "";

  const copies = [
    ...section.matchAll(
      /<article class="section-copy filtertest-standard__copy[^"]*">([\s\S]*?)<\/article>/g
    ),
  ];

  const cardsHtml = copies
    .map((copy) => copy[1].trim())
    .filter((body) => body.includes("<h3>"))
    .map(
      (body) => `            <article class="karlsruhe-benefit-card">
              <span class="karlsruhe-benefit-card__icon" aria-hidden="true"></span>
              <div>
                ${body}
              </div>
            </article>`
    )
    .join("\n\n");

  const newSection = `    <section class="karlsruhe-benefits" id="wiesbaden-benefits" data-section="benefits">
      <div class="container karlsruhe-benefits__grid">
        <article class="section-copy karlsruhe-benefits__intro">
          <p class="eyebrow">VORTEILE</p>
          <h2>${h2}</h2>
          <div class="gradient-line"></div>
        </article>

        <div class="karlsruhe-benefits__content">
          <p>${intro}</p>

          <div class="karlsruhe-benefits__cards">
${cardsHtml}
          </div>
        </div>
      </div>
    </section>`;

  return content.replace(section, newSection);
}

function patchBenefitsMarkup(content) {
  let next = content;

  next = next.replaceAll(
    '<div class="cleanroom-benefits__items">',
    '<div class="karlsruhe-benefits__cards">'
  );

  next = next.replace(
    /<article class="cleanroom-benefits__item">\s*<span class="cleanroom-benefits__dot" aria-hidden="true"><\/span>/g,
    '<article class="karlsruhe-benefit-card">\n              <span class="karlsruhe-benefit-card__icon" aria-hidden="true"></span>'
  );

  next = next.replaceAll(
    '<div class="city-reference-benefits__list">',
    '<div class="karlsruhe-benefits__cards">'
  );

  next = next.replace(
    /<article class="benefit-card">\s*<div>/g,
    '<article class="karlsruhe-benefit-card">\n              <span class="karlsruhe-benefit-card__icon" aria-hidden="true"></span>\n              <div>'
  );

  next = patchWiesbadenBenefits(next);

  return next;
}

const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .map((name) => path.join(root, name))
  .filter((file) => {
    const body = fs.readFileSync(file, "utf8");
    return referencePageRe.test(body) && body.includes('data-section="benefits"');
  });

let updated = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const patched = patchBenefitsMarkup(original);
  if (patched !== original) {
    fs.writeFileSync(file, patched, "utf8");
    updated += 1;
    console.log("Updated:", path.basename(file));
  }
}

console.log(`Updated ${updated} of ${files.length} reference pages with benefits section.`);
