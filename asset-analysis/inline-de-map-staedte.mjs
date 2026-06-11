import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const SRC = path.join(ROOT, "Bildmaterial_final/icons/germany-admin-map_Staedte.svg");

const TARGETS = [
  path.join(ROOT, "index.html"),
  path.join(ROOT, "unternehmen/index.html"),
  path.join(ROOT, "kontakt/index.html"),
];

const CITY_META = {
  Karlsruhe: { label: "Ettlingen", region: "Baden-Württemberg" },
  Tuttlingen: { label: "Stockach", region: "Bodensee" },
  Oberasbach: { label: "Oberasbach", region: "Bayern" },
  Eching: { label: "Eching", region: "Bayern" },
  Niederhausen: { label: "Niedernhausen", region: "Hessen" },
  Leichlingen: { label: "Leichlingen", region: "Nordrhein-Westfalen" },
  Winsen: { label: "Winsen (Luhe)", region: "Niedersachsen" },
  Berlin: { label: "Berlin", region: "Berlin" },
};

const MAP_DEFS = `<defs>
    <linearGradient id="de-map-land-gradient" x1="72" y1="48" x2="420" y2="620" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#d4ebff"/>
      <stop offset="38%" stop-color="#9fd0ff"/>
      <stop offset="72%" stop-color="#6eb5f2"/>
      <stop offset="100%" stop-color="#3d8fd9"/>
    </linearGradient>
    <linearGradient id="de-map-city-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4ec4ff"/>
      <stop offset="55%" stop-color="#0194e8"/>
      <stop offset="100%" stop-color="#0154a8"/>
    </linearGradient>
    <filter id="de-map-land-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#0161bf" flood-opacity="0.18"/>
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#073975" flood-opacity="0.12"/>
    </filter>
    <filter id="de-map-city-glow" x="-120%" y="-120%" width="340%" height="340%">
      <feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#0161bf" flood-opacity="0.36"/>
    </filter>
  </defs>`;

function buildInlineSvg() {
  let svg = fs.readFileSync(SRC, "utf8");
  svg = svg.replace(/<\?xml[^?]*\?>\s*/i, "");
  svg = svg.replace(/<!--[\s\S]*?-->\s*/g, "");
  svg = svg.replace(/<style>[\s\S]*?<\/style>\s*/i, "");
  const viewBox = svg.match(/viewBox="([^"]+)"/i)?.[1] ?? "0 0 472.95 639.41";
  svg = svg.replace(
    /<svg[^>]*>/i,
    `<svg xmlns="http://www.w3.org/2000/svg" class="de-map__svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Deutschlandkarte – Igienair Standorte">`
  );
  svg = svg.replace(/<defs>[\s\S]*?<\/defs>\s*/i, "");
  svg = svg.replace(
    /<svg[^>]*>/i,
    (match) => `${match}\n  ${MAP_DEFS}\n`
  );
  svg = svg.replace(/<rect[^>]*\/?>/i, "");
  svg = svg.replace(/<path class="cls-3"/g, '<path class="de-map__bg"');
  svg = svg.replace(
    /((?:<path class="de-map__bg"[\s\S]*?\/>)+)/i,
    '<g class="de-map__land-shape">\n    $1\n  </g>'
  );

  for (const [id, meta] of Object.entries(CITY_META)) {
    const re = new RegExp(
      `<circle\\s+id="${id}"\\s+class="cls-\\d+"\\s+cx="([^"]+)"\\s+cy="([^"]+)"\\s+r="([^"]+)"\\s*/>`,
      "i"
    );
    svg = svg.replace(
      re,
      `<circle class="de-map__land de-map__city" id="${id}" data-label="${meta.label}" cx="$1" cy="$2" r="$3" aria-label="${meta.label}"><title>${meta.label}</title></circle>`
    );
  }

  return svg.trim();
}

const blockRegex =
  /<div class="de-map" data-presence-map(?: data-presence-map-mode="[^"]*")?>[\s\S]*?<span class="de-map__tooltip" data-presence-map-tooltip[^>]*><\/span>/;

function buildMapBlock(inlineSvg, indent = "            ") {
  return `${indent}<div class="de-map" data-presence-map data-presence-map-mode="staedte">
${indent}  <div class="de-map__stage de-map__stage--staedte">
${indent}    <div class="de-map__svg-host" data-presence-map-svg>${inlineSvg}</div>
${indent}    <span class="de-map__tooltip" data-presence-map-tooltip role="status" aria-live="polite"></span>`;
}

const inlineSvg = buildInlineSvg();

for (const target of TARGETS) {
  if (!fs.existsSync(target)) {
    console.warn(`Übersprungen (nicht gefunden): ${path.relative(ROOT, target)}`);
    continue;
  }

  let html = fs.readFileSync(target, "utf8");
  if (!blockRegex.test(html)) {
    console.warn(`Kein Karten-Block in ${path.relative(ROOT, target)}`);
    continue;
  }

  html = html.replace(blockRegex, buildMapBlock(inlineSvg));
  fs.writeFileSync(target, html, "utf8");
  console.log(`Städte-Karte eingebettet: ${path.relative(ROOT, target)}`);
}

console.log(`Fertig (${inlineSvg.length} Zeichen SVG, ${Object.keys(CITY_META).length} Standorte).`);
