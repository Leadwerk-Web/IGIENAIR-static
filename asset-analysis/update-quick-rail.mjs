import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PHONE_HREF = "tel:+4972433699101";
const MAIL_HREF = "mailto:kontakt@igienair.com";

const PHONE_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8c1.5 3 3.5 5.1 6.5 6.5l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1.1L6.6 10.8z"/></svg>';

const MAIL_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/></svg>';

const FORM_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6Zm2 16H8v-2h8v2Zm0-4H8v-2h8v2Zm-3-5V3.5L18.5 9H13Z"/></svg>';

const SKIP_DIRS = new Set(["leadwerk_importer", "leadwerk_theme", "leadwerk-fields", "node_modules", ".git"]);

function walkHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

function resolveOfferHref(filePath, content) {
  if (filePath.replace(/\\/g, "/").endsWith("kontakt/angebot-anfordern/index.html")) {
    return "#angebot-form";
  }

  const match = content.match(/href="([^"]*kontakt\/angebot-anfordern\/index\.html)"/i);
  if (match) {
    return match[1];
  }

  const target = path.join(ROOT, "kontakt", "angebot-anfordern", "index.html");
  let rel = path.relative(path.dirname(filePath), target).replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel;
}

function buildQuickRailItems(offerHref) {
  return `    <a href="${PHONE_HREF}" class="quick-rail__item" aria-label="Telefon">
      ${PHONE_SVG}
    </a>
    <a href="${MAIL_HREF}" class="quick-rail__item" aria-label="E-Mail">
      ${MAIL_SVG}
    </a>
    <a href="${offerHref}" class="quick-rail__item" aria-label="Angebot anfordern">
      ${FORM_SVG}
    </a>`;
}

function updateQuickRails(content, offerHref) {
  const items = buildQuickRailItems(offerHref);
  const navPattern =
    /<nav class="quick-rail quick-rail--(?:desktop|mobile)"[^>]*>[\s\S]*?<\/nav>/g;

  return content.replace(navPattern, (navBlock) => {
    const labelMatch = navBlock.match(/aria-label="([^"]*)"/);
    const label = labelMatch ? labelMatch[1] : "Schnellzugriff";
    const variant = navBlock.includes("quick-rail--mobile") ? "mobile" : "desktop";
    const ariaLabel = variant === "mobile" ? "Schnellzugriff mobil" : label;

    return `<nav class="quick-rail quick-rail--${variant}" aria-label="${ariaLabel}">
${items}
  </nav>`;
  });
}

const htmlFiles = walkHtmlFiles(ROOT);
let filesChanged = 0;
let navsUpdated = 0;

for (const filePath of htmlFiles) {
  const original = fs.readFileSync(filePath, "utf8");
  if (!original.includes("quick-rail")) continue;

  const offerHref = resolveOfferHref(filePath, original);
  const updated = updateQuickRails(original, offerHref);
  const countBefore = (original.match(/quick-rail quick-rail--/g) || []).length;

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, "utf8");
    filesChanged += 1;
    navsUpdated += countBefore;
  }
}

console.log(`Updated ${navsUpdated} quick rails in ${filesChanged} HTML files.`);
