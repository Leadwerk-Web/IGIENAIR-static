import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "leadwerk_importer",
  "leadwerk_theme",
  ".playwright-mcp",
  "asset-analysis",
]);

const SEGMENT_LABELS = {
  unternehmen: "Unternehmen",
  leistungen: "Leistungen",
  normen: "Normen",
  anlagen: "Anlagen",
  kunden: "Kunden",
  referenzen: "Referenzen",
  glossar: "Glossar",
  jobs: "Jobs",
  kontakt: "Kontakt",
  branchen: "Branchen",
  downloads: "Downloads",
  impressum: "Impressum",
  datenschutz: "Datenschutz",
  "cookie-richtlinie-eu": "Cookie-Richtlinie (EU)",
  industrie: "Industrie",
  gesundheit: "Gesundheitswesen",
  pharma: "Pharma",
  gastronomie: "Gastronomie",
  lebensmittel: "Lebensmittel",
  gemeinden: "Gemeinden",
  bayern: "Bayern",
  berlin: "Berlin",
  hamburg: "Hamburg",
  hessen: "Hessen",
  nrw: "NRW",
  "baden-wuerttemberg": "Baden-Württemberg",
  "rheinland-pfalz": "Rheinland-Pfalz",
  saarland: "Saarland",
  "region-bodensee": "Region Bodensee",
  "angebot-anfordern": "Angebot anfordern",
  agb: "AGB",
  zertifizierungen: "Zertifizierungen",
  nachhaltigkeit: "Nachhaltigkeit",
  sicherheit: "Sicherheit",
  qualitaet: "Qualität",
  umweltschutz: "Umweltschutz",
  inspektionundgutachten: "Inspektion & Gutachten",
  "reinigung-desinfektion": "Reinigung & Desinfektion",
  "instandsetzung-sanierung": "Instandsetzung & Sanierung",
  "energetische-inspektion-geg-2020": "Energetische Inspektion",
  "hygieneinspektion-vdi-6022": "Hygieneinspektion VDI 6022",
  "gefaehrdungsbeurteilung-vdi-2047": "Gefährdungsbeurteilung VDI 2047",
  filterintegritaetstest: "Filterintegritätstest",
  "lecktest-schwebstofffilter": "Lecktest Schwebstofffilter",
  kanaluntersuchung: "Kanaluntersuchung",
  "rlt-hygiene": "RLT-Hygiene",
  danke: "Danke",
};

const EYEBROW_SECTIONS = {
  Unternehmen: "unternehmen/index.html",
  Leistungen: "leistungen/index.html",
  Normen: "normen/index.html",
  Anlagen: "anlagen/index.html",
  Kunden: "kunden/index.html",
  Referenzen: "kunden/referenzen/index.html",
  Glossar: "glossar/index.html",
  Jobs: "jobs/index.html",
  Kontakt: "kontakt/index.html",
  Branchen: "branchen/index.html",
  Downloads: "downloads/index.html",
};

function walkHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function decodeEyebrow(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&szlig;/g, "ß")
    .replace(/&ndash;/g, "–")
    .trim();
}

function relHref(fromFile, toFile) {
  const href = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, "/");
  return href || "./";
}

function labelForSegment(segment) {
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ");
}

function buildCrumbs(relativeFile, h1Inner, eyebrowText) {
  if (relativeFile === "index.html") return null;

  const parts = relativeFile.replace(/\/index\.html$/, "").split("/").filter(Boolean);
  const crumbs = [{ label: "Startseite", href: relHref(relativeFile, "index.html") }];

  if (parts.length === 1 && EYEBROW_SECTIONS[eyebrowText]) {
    const sectionPath = EYEBROW_SECTIONS[eyebrowText];
    if (sectionPath !== relativeFile) {
      crumbs.push({
        label: eyebrowText,
        href: relHref(relativeFile, sectionPath),
      });
    }
  }

  let acc = [];
  for (let i = 0; i < parts.length; i++) {
    const segment = parts[i];
    acc.push(segment);

    if (segment === "kunden" && parts[i + 1] === "referenzen") continue;

    const isLast = i === parts.length - 1;
    if (isLast) break;

    crumbs.push({
      label: labelForSegment(segment),
      href: relHref(relativeFile, `${acc.join("/")}/index.html`),
    });
  }

  const currentLabel = h1Inner.replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
  crumbs.push({ label: currentLabel, current: true });

  return crumbs;
}

function renderBreadcrumb(crumbs) {
  const items = crumbs.map((crumb, index) => {
    const sep =
      index > 0
        ? '\n          <span class="hero-breadcrumb__sep" aria-hidden="true">&raquo;</span>'
        : "";
    if (crumb.current) {
      return `${sep}\n          <span class="hero-breadcrumb__current" aria-current="page">${crumb.label}</span>`;
    }
    return `${sep}\n          <a class="hero-breadcrumb__link" href="${crumb.href}">${crumb.label}</a>`;
  });

  return `        <nav class="hero-breadcrumb" aria-label="Brotkrumen">${items.join("")}\n        </nav>`;
}

function injectBreadcrumb(html, navHtml) {
  if (html.includes("hero-breadcrumb")) return html;

  const heroMatch = html.match(
    /<section class="(?:hero|company-hero[^"]*)"[^>]*>[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>/i,
  );
  if (!heroMatch) return html;

  return html.replace(
    /(<section class="(?:hero|company-hero[^"]*)"[^>]*>[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>)(\s*)/i,
    `$1\n${navHtml}$2`,
  );
}

function removeOfferFooterBreadcrumb(html) {
  return html.replace(
    /\s*<nav class="offer-page__breadcrumb"[\s\S]*?<\/nav>\s*/i,
    "\n",
  );
}

let changed = 0;
let skipped = 0;

for (const file of walkHtml(root)) {
  const relativeFile = path.relative(root, file).replace(/\\/g, "/");
  if (relativeFile === "index.html") continue;

  let html = fs.readFileSync(file, "utf8");
  if (!/<section class="(?:hero|company-hero)/i.test(html)) {
    skipped += 1;
    continue;
  }
  if (html.includes("hero-breadcrumb")) continue;

  const heroSection = html.match(
    /<section class="(?:hero|company-hero[^"]*)"[^>]*>[\s\S]*?<\/section>/i,
  )?.[0];
  if (!heroSection) continue;

  const h1Inner = heroSection.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (!h1Inner) continue;

  const eyebrowHtml = heroSection.match(/<p class="eyebrow[^"]*">([\s\S]*?)<\/p>/i)?.[1] ?? "";
  const eyebrowText = decodeEyebrow(eyebrowHtml);

  const crumbs = buildCrumbs(relativeFile, h1Inner, eyebrowText);
  if (!crumbs) continue;

  const navHtml = renderBreadcrumb(crumbs);
  let next = injectBreadcrumb(html, navHtml);
  if (relativeFile === "kontakt/angebot-anfordern/index.html") {
    next = removeOfferFooterBreadcrumb(next);
  }

  if (next !== html) {
    fs.writeFileSync(file, next, "utf8");
    changed += 1;
  }
}

console.log(`Hero-Breadcrumbs ergänzt: ${changed} Dateien (${skipped} ohne Hero übersprungen)`);
