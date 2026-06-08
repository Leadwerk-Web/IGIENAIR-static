import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set([
  "leadwerk_importer",
  "leadwerk_theme",
  "leadwerk-fields",
  "asset-analysis",
  "node_modules",
]);

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (e.name.endsWith(".html")) files.push(p);
  }
  return files;
}

function relTo(fromFile, targetPath) {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, path.join(ROOT, targetPath)).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function jobsPrefix(relFile) {
  const dir = path.dirname(relFile).replace(/\\/g, "/");
  if (!dir || dir === ".") return "./jobs/";
  const depth = dir.split("/").filter(Boolean).length;
  return `${"../".repeat(depth)}jobs/`;
}

function offerHref(relFile) {
  return relTo(relFile, "kontakt/angebot-anfordern/index.html");
}

function norm14175Href(relFile) {
  return relTo(relFile, "normen/din-en-14175/index.html");
}

const stats = {
  inertCtaFixed: 0,
  jobNavFixed: 0,
  placeholderLinksFixed: 0,
  filesChanged: 0,
};

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  let html = fs.readFileSync(file, "utf8");
  const original = html;

  html = html.replace(
    /<button class="button (button--(?:solid|ghost))" type="button" data-inert>([\s\S]*?)<\/button>/gi,
    (_, variant, text) => {
      stats.inertCtaFixed += 1;
      return `<a class="button ${variant}" href="${offerHref(rel)}">${text}</a>`;
    }
  );

  const jobs = jobsPrefix(rel);
  const mitarbeiterHref = `${jobs}mitarbeiter-technische-reinigung-gesucht/index.html`;
  const teamleiterHref = `${jobs}teamleiter-hygienereinigung-gesucht/index.html`;

  const jobNavReplacements = [
    [
      /<button type="button" class="nav-link" data-inert>Mitarbeiter technische Reinigung<\/button>/g,
      `<a class="nav-link" href="${mitarbeiterHref}">Mitarbeiter technische Reinigung</a>`,
    ],
    [
      /<button type="button" class="nav-link" data-inert>Teamleiter technische Hygienereinigung<\/button>/g,
      `<a class="nav-link" href="${teamleiterHref}">Teamleiter technische Hygienereinigung</a>`,
    ],
    [
      /<button type="button" class="mobile-link" data-inert>Mitarbeiter technische Reinigung<\/button>/g,
      `<a class="mobile-link" href="${mitarbeiterHref}">Mitarbeiter technische Reinigung</a>`,
    ],
    [
      /<button type="button" class="mobile-link" data-inert>Teamleiter technische Hygienereinigung<\/button>/g,
      `<a class="mobile-link" href="${teamleiterHref}">Teamleiter technische Hygienereinigung</a>`,
    ],
  ];

  for (const [pattern, replacement] of jobNavReplacements) {
    const count = (html.match(pattern) || []).length;
    if (count) {
      stats.jobNavFixed += count;
      html = html.replace(pattern, replacement);
    }
  }

  html = html.replace(
    /<a href="#!" data-inert>DIN EN ISO 14175<\/a>/g,
    () => {
      stats.placeholderLinksFixed += 1;
      return `<a href="${norm14175Href(rel)}">DIN EN ISO 14175</a>`;
    }
  );

  if (rel === "anlagen/op-raum-pruefung/index.html") {
    html = html.replace(
      /<a class="duct-inline-link" href="#!" data-inert>Lecktest f&uuml;r Schwebstofffilter<\/a>/g,
      `<a class="duct-inline-link" href="${relTo(rel, "lecktest-schwebstofffilter/index.html")}">Lecktest f&uuml;r Schwebstofffilter</a>`
    );
    html = html.replace(
      /<a class="duct-inline-link" href="#!" data-inert>Gef&auml;hrdungsbeurteilung nach VDI 2047<\/a>/g,
      `<a class="duct-inline-link" href="${relTo(rel, "gefaehrdungsbeurteilung-vdi-2047/index.html")}">Gef&auml;hrdungsbeurteilung nach VDI 2047</a>`
    );
  }

  if (html !== original) {
    fs.writeFileSync(file, html, "utf8");
    stats.filesChanged += 1;
  }
}

console.log(JSON.stringify(stats, null, 2));
