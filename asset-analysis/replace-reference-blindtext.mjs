import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const footerText =
  "Seit 2003 bieten wir als Familienunternehmen Expertise in technischer Hygiene und Raumlufthygiene. Inspektion, Reinigung und Wartung von L&uuml;ftungs- und RLT-Anlagen &ndash; normkonform dokumentiert und deutschlandweit f&uuml;r Sie im Einsatz.";

const footerLorem =
  "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.";

const sectorsOld = `<header class="sectors__header">
          <p class="eyebrow eyebrow--light">Blindtext</p>
          <h2>Quisque rutrum. Aenean imperdiet.</h2>
          <div class="gradient-line"></div>
        </header>

        <div class="sectors__columns">
          <div class="sectors__copy">
            <p>Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna.</p>
            <button class="button button--outline-light" type="button" data-inert>Erfahren Sie mehr</button>`;

const sectorsNew = `<header class="sectors__header">
          <p class="eyebrow eyebrow--light">BRANCHEN</p>
          <h2>Technische Hygiene f&uuml;r jede Branche</h2>
          <div class="gradient-line"></div>
        </header>

        <div class="sectors__columns">
          <div class="sectors__copy">
            <p>Unsere Spezialisten gehen in allen Bereichen der <strong>L&uuml;ftungsanlagenreinigung</strong> auf Ihre individuellen Herausforderungen ein. Wir bieten technische Hygiene und ma&szlig;geschneiderte Kundenl&ouml;sungen in vielen verschiedenen Branchen. Raumlufttechnik in Gemeindeeinrichtungen oder in der Industrie, Hygieneanforderungen in der Gastronomie oder Hygieneinspektionen im Bereich Gesundheitswesen geh&ouml;ren zu unserem Leistungsportfolio.</p>
          </div>`;

function patch(content) {
  let next = content;

  next = next.replaceAll(footerLorem, footerText);
  next = next.replaceAll(sectorsOld, sectorsNew);

  next = next.replace(
    /<header class="sectors__header">\s*<p class="eyebrow eyebrow--light">Blindtext<\/p>\s*<h2>Quisque rutrum\. Aenean imperdiet\.<\/h2>\s*<div class="gradient-line"><\/div>\s*<\/header>\s*<div class="sectors__columns">\s*<div class="sectors__copy">\s*<p>Etiam sit amet orci eget eros faucibus tincidunt\. Duis leo\. Sed fringilla mauris sit amet nibh\. Donec sodales sagittis magna\.<\/p>\s*<button class="button button--(?:outline-light|ghost)" type="button" data-inert>Erfahren Sie mehr<\/button>/g,
    `<header class="sectors__header">
          <p class="eyebrow eyebrow--light">BRANCHEN</p>
          <h2>Technische Hygiene f&uuml;r jede Branche</h2>
          <div class="gradient-line"></div>
        </header>

        <div class="sectors__columns">
          <div class="sectors__copy">
            <p>Unsere Spezialisten gehen in allen Bereichen der <strong>L&uuml;ftungsanlagenreinigung</strong> auf Ihre individuellen Herausforderungen ein. Wir bieten technische Hygiene und ma&szlig;geschneiderte Kundenl&ouml;sungen in vielen verschiedenen Branchen. Raumlufttechnik in Gemeindeeinrichtungen oder in der Industrie, Hygieneanforderungen in der Gastronomie oder Hygieneinspektionen im Bereich Gesundheitswesen geh&ouml;ren zu unserem Leistungsportfolio.</p>
          </div>`
  );
  next = next.replaceAll(
    '<button class="button button--solid" type="button" data-inert>Button</button>',
    '<a class="button button--solid" href="/#angebot">Angebot anfordern</a>'
  );
  next = next.replaceAll("<span>Jetzt bewerben</span>", "<span>Region ansehen</span>");
  next = next.replace('alt="2"', 'alt="Referenzen Igienair Deutschland"');

  next = next.replace(
    /(<article class="section-copy karlsruhe-benefits__intro">\s*)<p class="eyebrow">REFERENZEN<\/p>/g,
    '$1<p class="eyebrow">VORTEILE</p>'
  );
  next = next.replace(
    /(<article class="section-copy city-reference-benefits__intro">\s*)<p class="eyebrow">REFERENZEN<\/p>/g,
    '$1<p class="eyebrow">VORTEILE</p>'
  );
  next = next.replace(
    /(<header class="section-copy memmingen-overview__head">\s*)<p class="eyebrow">REFERENZEN<\/p>/g,
    '$1<p class="eyebrow">VOR ORT</p>'
  );

  const rules = [
    [
      /(<article class="section-copy cleanroom-overview__copy">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">VOR ORT</p>',
    ],
    [
      /(<article class="section-copy reference-region-overview__copy">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">REGION</p>',
    ],
    [
      /(<header class="section-copy reference-region-overview__heading">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">REGION</p>',
    ],
    [
      /(<header class="section-copy (?:bernau|brandenburg)-overview__head">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">VOR ORT</p>',
    ],
    [
      /(<article class="section-copy industries-overview__copy">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">DEUTSCHLANDWEIT</p>',
    ],
    [
      /(<section class="filtertest-standard karlsruhe-services" id="[^"]*-benefits"[\s\S]*?<header class="section-copy karlsruhe-services__heading">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">VORTEILE</p>',
    ],
    [
      /(<header class="section-copy cleanroom-benefits__copy">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">VORTEILE</p>',
    ],
    [
      /(<section class="cleanroom-overview filtertest-overview karlsruhe-overview" id="[^"]*-cta"[\s\S]*?<article class="section-copy cleanroom-overview__copy">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">KONTAKT</p>',
    ],
    [
      /(<header class="section-copy (?:karlsruhe|brandenburg|bernau)-services__heading">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">LEISTUNGEN</p>',
    ],
    [
      /(<div class="reference-region-overview__locations-block">\s*)<p class="eyebrow">Lorem Ipsum<\/p>/g,
      '$1<p class="eyebrow">STANDORTE</p>',
    ],
  ];

  for (const [pattern, replacement] of rules) {
    next = next.replace(pattern, replacement);
  }

  next = next.replace(/<p class="eyebrow">Lorem Ipsum<\/p>/g, '<p class="eyebrow">REFERENZEN</p>');

  return next;
}

const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .map((name) => path.join(root, name))
  .filter((file) => {
    const body = fs.readFileSync(file, "utf8");
    return /page-reference-city|page-reference-region|page-karlsruhe-reference|page-references/.test(body);
  });

let updated = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const patched = patch(original);
  if (patched !== original) {
    fs.writeFileSync(file, patched, "utf8");
    updated += 1;
  }
}

console.log(`Updated ${updated} of ${files.length} reference pages.`);
