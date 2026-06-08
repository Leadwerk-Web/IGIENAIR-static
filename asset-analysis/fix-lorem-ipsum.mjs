import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const loremFooter =
  "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.";

const footerText =
  "Seit 2003 bieten wir als Familienunternehmen Expertise in technischer Hygiene und Raumlufthygiene. Inspektion, Reinigung und Wartung von L&uuml;ftungs- und RLT-Anlagen &ndash; normkonform dokumentiert und deutschlandweit f&uuml;r Sie im Einsatz.";

const files = [
  { path: "impressum/index.html", eyebrow: "IMPRESSUM" },
  { path: "datenschutz/index.html", eyebrow: "DATENSCHUTZ" },
  { path: "cookie-richtlinie-eu/index.html", eyebrow: "COOKIE-RICHTLINIE" },
  { path: "unternehmen/agb/index.html", eyebrow: "AGB" },
  { path: "leistungen/instandsetzung-sanierung/index.html", eyebrow: null },
  {
    path: "leadwerk_importer/source_assets/pages/impressum/index.html",
    eyebrow: "IMPRESSUM",
  },
  {
    path: "leadwerk_importer/source_assets/pages/datenschutz/index.html",
    eyebrow: "DATENSCHUTZ",
  },
  {
    path: "leadwerk_importer/source_assets/pages/cookie-richtlinie-eu/index.html",
    eyebrow: "COOKIE-RICHTLINIE",
  },
  {
    path: "leadwerk_importer/source_assets/pages/unternehmen/agb/index.html",
    eyebrow: "AGB",
  },
  {
    path: "leadwerk_importer/source_assets/pages/leistungen/instandsetzung-sanierung/index.html",
    eyebrow: null,
  },
];

for (const { path: rel, eyebrow } of files) {
  const full = path.join(root, rel);
  let content = fs.readFileSync(full, "utf8");
  content = content.split(loremFooter).join(footerText);
  if (eyebrow) {
    content = content.replace(
      '<p class="eyebrow">Lorem Ipsum</p>',
      `<p class="eyebrow">${eyebrow}</p>`
    );
  }
  fs.writeFileSync(full, content, "utf8");
}

console.log(`Bereinigt: ${files.length} Seiten`);
