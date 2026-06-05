import fs from "node:fs";

const ROOT = "c:/Users/haag_/Desktop/Github/IGIENAIR-static";
const SRC = `${ROOT}/assets/images/Karte_Deutschland.svg`;
const INDEX = `${ROOT}/index.html`;

const svgText = fs.readFileSync(SRC, "utf8");
const paths = svgText.match(/<path[\s\S]*?\/>/g) || [];

const labels = {
  "Baden__x26__Württemberg": "Baden-Württemberg",
  Bayern: "Bayern",
  Berlin: "Berlin",
  Brandenburg: "Brandenburg",
  Bremen: "Bremen",
  Hamburg: "Hamburg",
  Hessen: "Hessen",
  "Mecklenburg-Vorpommern": "Mecklenburg-Vorpommern",
  Niedersachsen: "Niedersachsen",
  "Nordrhein-Westfalen": "Nordrhein-Westfalen",
  "Rheinland-Pfalz": "Rheinland-Pfalz",
  Saarland: "Saarland",
  Sachsen: "Sachsen",
  "Sachsen-Anhalt": "Sachsen-Anhalt",
  "Schleswig-Holstein": "Schleswig-Holstein",
  "Thüringen": "Thüringen",
};

const cleaned = paths
  .filter((p) => !/id="path3789"/.test(p))
  .map((p) => {
    const idMatch = p.match(/id="([^"]+)"/);
    const id = idMatch ? idMatch[1] : "";
    const label = labels[id] || id;
    let normalized = p
      .replace(/\s+style="[^"]*"/g, "")
      .replace(/\s+/g, " ")
      .trim();
    normalized = normalized.replace(
      /^<path\s+/,
      `<path class="de-map__land" tabindex="0" role="img" aria-label="${label}" data-label="${label}" `
    );
    normalized = normalized.replace(/\/>$/, `><title>${label}</title></path>`);
    return normalized;
  });

const inlineSvg = [
  '<svg xmlns="http://www.w3.org/2000/svg" class="de-map__svg"',
  ' viewBox="0 0 591.504 800.504" preserveAspectRatio="xMidYMid meet"',
  ' role="img" aria-label="Deutschlandkarte – 16 Bundesländer"><g>',
  cleaned.join(""),
  "</g></svg>",
].join("");

let html = fs.readFileSync(INDEX, "utf8");

const blockRegex =
  /<div class="de-map__svg-host" data-presence-map-svg>[\s\S]*?<\/div>/;

if (!blockRegex.test(html)) {
  console.error("Konnte den Karten-Container in index.html nicht finden.");
  process.exit(1);
}

html = html.replace(
  blockRegex,
  `<div class="de-map__svg-host" data-presence-map-svg>${inlineSvg}</div>`
);

fs.writeFileSync(INDEX, html, "utf8");
console.log(`Karte eingebettet (${inlineSvg.length} Zeichen, ${cleaned.length} Bundesländer).`);
