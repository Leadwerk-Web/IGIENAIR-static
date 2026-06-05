import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "asset-analysis/output/glossary-live-content.json");

const SLUGS = [
  "bedeutung-hygieneinspektionen-unternehmen",
  "brandschutzreinigung-entfettung-grosskuechenabluftsystemen",
  "digestorium",
  "din-en-14175-norm",
  "din-en-15780-norm",
  "energetische-inspektion",
  "entrauchungsanlage",
  "fachbetrieb-nach-whg",
  "fgk-qm-01-zertifizierung",
  "filterintegritaetstest",
  "gebaeudeenergiegesetz-geg-2020",
  "gefaehrdungsbeurteilung-vdi-2047-2",
  "gefaehrdungsbeurteilung-von-rlt-anlagen",
  "hygieneinspektion-nach-vdi-6022",
  "hygienetechnische-reinigung",
  "inspektionspflicht-geg-2020",
  "iso-140012015-zertifizierung",
  "iso-14644-norm",
  "iso-90012015-zertifizierung",
  "kuehlregale",
  "lecktest-schwebstofffilter",
  "luftkanalreinigung",
  "op-raum",
  "prozessabluftsystem",
  "rechenzentrum",
  "reinigung-rechenzentrum",
  "reinraum",
  "rlt-anlagen",
  "splitklimageraet",
  "textilschlaeuche",
  "umluftkuehlgeraet",
  "vdi-2047-2",
  "vdi-2052-bgr-111",
  "vdi-6022-richtlinienreihe",
  "verdampfer-und-kondensatoren",
  "verdunstungskuehlanlagen",
  "vorschriften-laborabzuege",
  "whg-zertifizierung",
];

function extractPostContent(html) {
  const start = html.indexOf('class="w-post-elm post_content"');
  if (start === -1) return null;
  const contentStart = html.indexOf(">", start) + 1;
  const endMarker = '</div></div></div></div><div class="vc_col-sm-4';
  const end = html.indexOf(endMarker, contentStart);
  if (end === -1) return null;
  return html.slice(contentStart, end).trim();
}

function extractTitle(html) {
  const m = html.match(
    /<h1 class="w-post-elm post_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/
  );
  return m ? m[1].trim() : null;
}

function extractMetaTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  return m ? m[1].trim() : null;
}

async function fetchSlug(slug) {
  const url = `https://igienair.de/glossar/${slug}/`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; IGIENAIR-static/1.0)" },
  });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const html = await res.text();
  const content = extractPostContent(html);
  if (!content) throw new Error(`${slug}: Kein post_content gefunden`);
  return {
    slug,
    title: extractTitle(html),
    metaTitle: extractMetaTitle(html),
    contentHtml: content,
  };
}

const results = [];
for (const slug of SLUGS) {
  process.stdout.write(`Fetch ${slug}… `);
  try {
    const data = await fetchSlug(slug);
    results.push(data);
    console.log("ok");
  } catch (err) {
    console.log("FEHLER:", err.message);
  }
  await new Promise((r) => setTimeout(r, 300));
}

fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf8");
console.log(`\nGespeichert: ${results.length}/${SLUGS.length} → ${outputPath}`);
