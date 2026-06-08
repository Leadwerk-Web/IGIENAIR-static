import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const glossaryIndexPath = path.join(root, "glossar", "index.html");
const contentPath = path.join(root, "asset-analysis/output/glossary-live-content.json");

const glossaryIndexHtml = fs.readFileSync(glossaryIndexPath, "utf8");
const liveTerms = JSON.parse(fs.readFileSync(contentPath, "utf8"));

const PATH_OVERRIDES = {
  "/": "../../index.html",
  "/inspektionundgutachten": "../../leistungen/inspektionundgutachten/index.html",
  "/hygieneinspektion-vdi-6022": "../../hygieneinspektion-vdi-6022/index.html",
  "/energetische-inspektion-geg-2020": "../../energetische-inspektion-geg-2020/index.html",
  "/filterintegritaetstest": "../../filterintegritaetstest/index.html",
  "/lecktest-schwebstofffilter": "../../lecktest-schwebstofffilter/index.html",
  "/normen/vdi-2047": "../../normen/vdi-2047/index.html",
};

function decodeHtml(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&szlig;/g, "ß")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mapLivePathToLocal(rawPath) {
  const [pathPart, hashPart = ""] = rawPath.split("#");
  const hash = hashPart ? `#${hashPart}` : "";
  let normalized = pathPart.replace(/\/$/, "");
  if (!normalized) normalized = "/";

  if (PATH_OVERRIDES[normalized]) {
    return PATH_OVERRIDES[normalized] + hash;
  }

  if (normalized === "/glossar") {
    return `../index.html${hash}`;
  }

  if (normalized.startsWith("/glossar/")) {
    const slug = normalized.slice("/glossar/".length);
    return `../${slug}/index.html${hash}`;
  }

  const relative = normalized.replace(/^\//, "");
  return `../../${relative}/index.html${hash}`;
}

function rewriteContentLinks(html) {
  return html.replace(
    /href="https:\/\/igienair\.de([^"]*)"/g,
    (_, rawPath) => `href="${mapLivePathToLocal(rawPath)}"`
  );
}

function sanitizeContentHtml(html) {
  return rewriteContentLinks(html)
    .replace(/\s+id="[^"]*"/g, "")
    .replace(/<i class="fas[^"]*"[^>]*><\/i>\s*/g, "")
    .trim();
}

function plainText(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function adjustPathsForSubpage(html) {
  return html
    .replace(/href="\.\/index\.html"/g, 'href="__GLOSSAR_INDEX__"')
    .replace(/aria-current="page"/g, "")
    .replace(/\.\.\//g, "../../")
    .replace(/href="__GLOSSAR_INDEX__"/g, 'href="../index.html"')
    .replace(/href="#glossary-index"/g, 'href="../index.html#glossary-index"');
}

function buildMain(term) {
  const content = sanitizeContentHtml(term.contentHtml);
  const titleHtml = term.title.replace(/&/g, "&amp;");

  return `
    <section class="company-hero" id="top" data-section="hero">
      <div class="container company-hero__content">
        <p class="eyebrow">Unternehmen</p>
        <h1>${titleHtml}</h1>
        <div class="glossary-term-hero__actions">
          <a class="button button--outline" href="../index.html">Zur Glossar-&Uuml;bersicht</a>
          <a class="button button--solid" href="../../kontakt/index.html">Jetzt Kontakt aufnehmen</a>
        </div>
      </div>
    </section>

    <section class="glossary-term" data-section="article">
      <div class="container glossary-term__layout">
        <article class="section-copy glossary-term__content">
          ${content}
        </article>
        <aside class="glossary-term__aside" aria-label="Kontakt">
          <div class="glossary-term__aside-card">
            <h2 class="glossary-term__aside-title">Kontaktdaten und Angebot</h2>
            <p><strong>IGIENAIR GmbH</strong><br><em>Firmensitz/<br>Niederlassung Baden-W&uuml;rttemberg</em></p>
            <p>Robert-Bosch-Str. 10<br>76275 Ettlingen<br>07243 3699101<br><a class="text-link" href="mailto:anfrage@igienair.com">anfrage@igienair.com</a></p>
            <a class="button button--solid" href="../../kontakt/angebot-anfordern/index.html">Jetzt ein Angebot anfordern</a>
          </div>
        </aside>
      </div>
    </section>`;
}

function buildPage(shellBefore, shellAfter, term) {
  const main = buildMain(term);
  const description = escapeHtml(plainText(term.contentHtml).slice(0, 155));
  const pageTitle = escapeHtml(
    (term.metaTitle || `${term.title} - Glossar - Igienair GmbH`).replace(/&/g, "&amp;")
  );

  const head = shellBefore
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${pageTitle}</title>`)
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${description}">`
    )
    .replace('class="page-glossary"', 'class="page-glossary page-glossary-term"');

  return `${head}<main>${main}
  </main>${shellAfter}`;
}

const mainStart = glossaryIndexHtml.indexOf("<main>");
const mainEnd = glossaryIndexHtml.indexOf("</main>") + "</main>".length;
const shellBefore = adjustPathsForSubpage(glossaryIndexHtml.slice(0, mainStart));
const shellAfter = adjustPathsForSubpage(glossaryIndexHtml.slice(mainEnd));

for (const term of liveTerms) {
  const dir = path.join(root, "glossar", term.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "index.html"),
    buildPage(shellBefore, shellAfter, term),
    "utf8"
  );
}

const slugSet = new Set(liveTerms.map((t) => t.slug));
const SLUG_MAP = {
  "Bedeutung von Hygieneinspektionen für Unternehmen":
    "bedeutung-hygieneinspektionen-unternehmen",
  "Brandschutzreinigung und Entfettung von Großküchenabluftsystemen":
    "brandschutzreinigung-entfettung-grosskuechenabluftsystemen",
  Digestorium: "digestorium",
  "DIN EN 14175 Norm": "din-en-14175-norm",
  "DIN EN 15780 Norm": "din-en-15780-norm",
  "Energetische Inspektion": "energetische-inspektion",
  Entrauchungsanlage: "entrauchungsanlage",
  "Fachbetrieb nach WHG": "fachbetrieb-nach-whg",
  "FGK-QM-01-Zertifizierung": "fgk-qm-01-zertifizierung",
  Filterintegritätstest: "filterintegritaetstest",
  "Gebäudeenergiegesetz (GEG 2020)": "gebaeudeenergiegesetz-geg-2020",
  "Gefährdungsbeurteilung VDI 2047-2": "gefaehrdungsbeurteilung-vdi-2047-2",
  "Gefährdungsbeurteilung von RLT-Anlagen":
    "gefaehrdungsbeurteilung-von-rlt-anlagen",
  "Gesetzliche Vorschriften für Laborabzüge": "vorschriften-laborabzuege",
  "Hygieneinspektion nach VDI 6022": "hygieneinspektion-nach-vdi-6022",
  "Hygienetechnische Reinigung": "hygienetechnische-reinigung",
  "Inspektionspflicht Gebäudeenergiegesetz (GEG 2020)":
    "inspektionspflicht-geg-2020",
  "ISO 14001:2015 Zertifizierung": "iso-140012015-zertifizierung",
  "ISO 14644 Norm": "iso-14644-norm",
  "ISO 9001:2015 Zertifizierung": "iso-90012015-zertifizierung",
  Kühlregale: "kuehlregale",
  "Lecktest Schwebstofffilter": "lecktest-schwebstofffilter",
  Luftkanalreinigung: "luftkanalreinigung",
  "OP-Raum": "op-raum",
  Prozessabluftsystem: "prozessabluftsystem",
  Rechenzentrum: "rechenzentrum",
  "Reinigung Rechenzentrum": "reinigung-rechenzentrum",
  Reinraum: "reinraum",
  "RLT-Anlagen": "rlt-anlagen",
  Splitklimagerät: "splitklimageraet",
  "Textilschläuche: Lüftungskanäle aus Textil": "textilschlaeuche",
  Umluftkühlgerät: "umluftkuehlgeraet",
  "VDI 2047-2": "vdi-2047-2",
  "VDI 2052 & BGR 111": "vdi-2052-bgr-111",
  "VDI 6022 Richtlinienreihe": "vdi-6022-richtlinienreihe",
  "Verdampfer und Kondensatoren": "verdampfer-und-kondensatoren",
  Verdunstungskühlanlagen: "verdunstungskuehlanlagen",
  "WHG Zertifizierung": "whg-zertifizierung",
};

const updatedIndex = glossaryIndexHtml.replace(
  /<a class="glossary-card__link" href="[^"]*"(?: data-inert)? aria-label="([^"]+)"/g,
  (match, rawLabel) => {
    const slug = SLUG_MAP[decodeHtml(rawLabel)];
    if (!slug || !slugSet.has(slug)) return match;
    return `<a class="glossary-card__link" href="./${slug}/index.html" aria-label="${rawLabel}"`;
  }
);

fs.writeFileSync(glossaryIndexPath, updatedIndex, "utf8");
console.log(`Aktualisiert: ${liveTerms.length} Glossar-Unterseiten mit Live-Inhalten`);
