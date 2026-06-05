import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CTA_TEXTS = [
  "Angebot sichern",
  "Jetzt anfragen",
  "Anfrage senden",
  "Jetzt anfragen",
  "Kontakt aufnehmen",
  "Beratung sichern",
  "Passendes Angebot erhalten",
];

let globalCounter = 0;

function nextCtaText() {
  const text = CTA_TEXTS[globalCounter % CTA_TEXTS.length];
  globalCounter += 1;
  return text;
}

function isOfferHref(attrs) {
  return /href="[^"]*(?:angebot-anfordern\.html(?:#[^"]*)?|#angebot(?:-form)?)"/i.test(attrs);
}

function isButtonElement(attrs) {
  return /\bclass="[^"]*\bbutton\b/i.test(attrs);
}

function isOfferCtaText(text) {
  return /^(?:Jetzt\s+)?Angebot anfordern$/i.test(text.trim());
}

function updateUrls(content, fileName) {
  content = content.replace(/index\.html#angebot/g, "angebot-anfordern.html");

  if (fileName !== "angebot-anfordern.html") {
    content = content.replace(/href="#angebot"/g, 'href="/kontakt/angebot-anfordern/"');
  }

  return content;
}

function isHeaderButton(attrs) {
  return /\bbutton--header\b/i.test(attrs);
}

function rotateButtonTexts(content) {
  content = content.replace(/<a\b([^>]*)>([^<]*)<\/a>/gi, (match, attrs, text) => {
    if (!isButtonElement(attrs) || !isOfferHref(attrs) || isHeaderButton(attrs)) {
      return match;
    }
    if (!isOfferCtaText(text)) {
      return match;
    }
    return `<a${attrs}>${nextCtaText()}</a>`;
  });

  content = content.replace(/<button\b([^>]*)>([^<]*)<\/button>/gi, (match, attrs, text) => {
    if (!isButtonElement(attrs) || !isOfferCtaText(text)) {
      return match;
    }
    return `<button${attrs}>${nextCtaText()}</button>`;
  });

  return content;
}

function updateQuickRail(content, fileName) {
  if (fileName === "angebot-anfordern.html") {
    return content.replace(
      /(<a\b[^>]*class="[^"]*quick-rail__item[^"]*"[^>]*href=")[^"]*("[^>]*aria-label="Angebot")/gi,
      '$1#angebot-form$2',
    );
  }

  return content.replace(
    /(<a\b[^>]*class="[^"]*quick-rail__item[^"]*"[^>]*href=")[^"]*("[^>]*aria-label="Angebot")/gi,
    '$1angebot-anfordern.html$2',
  );
}

const htmlFiles = fs
  .readdirSync(ROOT)
  .filter((name) => name.endsWith(".html"))
  .sort((a, b) => a.localeCompare(b, "de"));

let filesChanged = 0;
let linksUpdated = 0;

for (const fileName of htmlFiles) {
  const filePath = path.join(ROOT, fileName);
  const original = fs.readFileSync(filePath, "utf8");
  let content = original;

  const beforeLinks = (content.match(/index\.html#angebot|href="#angebot"/g) || []).length;
  content = updateUrls(content, fileName);
  content = updateQuickRail(content, fileName);
  content = rotateButtonTexts(content);

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    filesChanged += 1;
    linksUpdated += beforeLinks;
  }
}

console.log(`Updated ${filesChanged} files. Rotated ${globalCounter} CTA labels.`);
