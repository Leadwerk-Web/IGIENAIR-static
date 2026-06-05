import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "..");
const htmlFiles = readdirSync(root).filter((name) => name.endsWith(".html"));

const sectorCards = `          <div class="sector-grid" aria-label="Branchen">
          <a class="sector-card" href="/kunden/gesundheit/">
            <img src="/assets/images/sector-healthcare.png" alt="">
            <h3>Gesundheitswesen</h3>
          </a>
          <a class="sector-card" href="/industrie/">
            <img src="/assets/images/sector-industry.png" alt="">
            <h3>Industrie</h3>
          </a>
          <a class="sector-card" href="/kunden/pharma/">
            <img src="/assets/images/sector-pharma.png" alt="">
            <h3>Pharmaindustrie</h3>
          </a>
          <a class="sector-card" href="/kunden/gastronomie/">
            <img src="/assets/images/sector-gastronomy.png" alt="">
            <h3>Gastronomie</h3>
          </a>
          <a class="sector-card" href="/kunden/lebensmittel/">
            <img src="/assets/images/sector-food.png" alt="">
            <h3>Lebensmittel</h3>
          </a>
          <a class="sector-card" href="/kunden/gemeinden/">
            <img src="/assets/images/sector-municipal.png" alt="">
            <h3>Gemeinden</h3>
          </a>
          </div>`;

function extractCopyBlock(html) {
  const eyebrowMatch = html.match(/<p class="eyebrow[^"]*">([\s\S]*?)<\/p>/i);
  const h2Match = html.match(/<h2>([\s\S]*?)<\/h2>/i);
  if (!h2Match) {
    return null;
  }

  const eyebrow = eyebrowMatch?.[1]?.trim() || "BRANCHENLÖSUNGEN";
  const h2 = h2Match[1].trim();
  const paragraphs = [...html.matchAll(/<p(?![^>]*class="[^"]*eyebrow)([^>]*)>([\s\S]*?)<\/p>/gi)].map((match) => match[0]);
  const button = html.match(/<button[\s\S]*?<\/button>/i)?.[0] || "";

  return { eyebrow, h2, paragraphs, button };
}

function buildSectorsSection(copy, dataSection = "sectors") {
  const copyBody = [...copy.paragraphs, copy.button].filter(Boolean).join("\n            ");

  return `<section class="sectors" data-section="${dataSection}">
      <div class="container sectors__layout">
        <header class="sectors__header">
          <p class="eyebrow eyebrow--light">${copy.eyebrow}</p>
          <h2>${copy.h2}</h2>
          <div class="gradient-line"></div>
        </header>

        <div class="sectors__columns">
          <div class="sectors__copy">
            ${copyBody}
          </div>

${sectorCards}
        </div>
      </div>
    </section>`;
}

function buildGridOnlySection(dataSection = "sectors") {
  return `<section class="sectors sectors--grid-only" data-section="${dataSection}">
      <div class="container sectors__layout">
${sectorCards}
      </div>
    </section>`;
}

function transformExistingSectors(html) {
  return html.replace(
    /<section class="sectors" data-section="sectors">([\s\S]*?)<\/section>/,
    (match, inner) => {
      if (inner.includes("sectors__header")) {
        return match;
      }

      const copyMatch = inner.match(/<div class="sectors__copy">([\s\S]*?)<\/div>/);
      if (!copyMatch) {
        return match;
      }

      const copy = extractCopyBlock(copyMatch[1]);
      if (!copy) {
        return match;
      }

      return buildSectorsSection(copy);
    }
  );
}

function transformTowerIndustries(html) {
  return html.replace(
    /<section class="tower-industries[^"]*" data-section="industries">([\s\S]*?)<\/section>/,
    (match, inner) => {
      const copyMatch = inner.match(/<article class="section-copy tower-industries__copy">([\s\S]*?)<\/article>/);
      if (!copyMatch) {
        return match;
      }

      const copy = extractCopyBlock(copyMatch[1]);
      if (!copy) {
        return match;
      }

      return buildSectorsSection(copy, "industries");
    }
  );
}

function transformIndustriesBand(html) {
  return html.replace(
    /<section class="industries-band" data-section="industries">([\s\S]*?)<\/section>/,
    (match, inner) => {
      const copyMatch = inner.match(/<header class="section-copy industries-band__copy">([\s\S]*?)<\/header>/);
      if (!copyMatch) {
        return match;
      }

      const copy = extractCopyBlock(copyMatch[1]);
      if (!copy) {
        return match;
      }

      return buildSectorsSection(copy, "industries");
    }
  );
}

function transformIndustriesStrip(html) {
  return html.replace(
    /<section class="industries-strip" data-section="industries">([\s\S]*?)<\/section>/,
    (match, inner) => {
      const copyMatch = inner.match(/<article class="section-copy industries-strip__copy">([\s\S]*?)<\/article>/);
      if (!copyMatch) {
        return match;
      }

      const copy = extractCopyBlock(copyMatch[1]);
      if (!copy) {
        return match;
      }

      return buildSectorsSection(copy, "industries");
    }
  );
}

function transformDuctSectors(html) {
  return html.replace(
    /<section class="duct-sectors" data-section="sectors">[\s\S]*?<\/section>/,
    buildGridOnlySection("sectors")
  );
}

let updated = 0;

for (const file of htmlFiles) {
  const filePath = join(root, file);
  let html = readFileSync(filePath, "utf8");
  const original = html;

  html = transformExistingSectors(html);
  html = transformTowerIndustries(html);
  html = transformIndustriesBand(html);
  html = transformIndustriesStrip(html);
  html = transformDuctSectors(html);

  if (html !== original) {
    writeFileSync(filePath, html, "utf8");
    updated += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`Done. Updated ${updated} files.`);
