import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const SRC = path.join(ROOT, "assets/images/Karte_Deutschland.svg");
const STATE_ID = process.argv[2] || "Baden__x26__Württemberg";
const OUT = process.argv[3] || path.join(ROOT, "assets/images/Genutze Bilder_LW/Referenzen/karte-baden-wuerttemberg.svg");

function xmlEscape(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const svgText = fs.readFileSync(SRC, "utf8");
const pathMatch = svgText.match(new RegExp(`<path[^>]*id="${STATE_ID.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*\\/>`));

if (!pathMatch) {
  console.error(`Path with id "${STATE_ID}" not found.`);
  process.exit(1);
}

const pathEl = pathMatch[0];
const dMatch = pathEl.match(/\sd="([^"]+)"/);
if (!dMatch) {
  console.error("No d attribute found.");
  process.exit(1);
}

const d = dMatch[1];
const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) || [];
let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;

for (let i = 0; i + 1 < nums.length; i += 2) {
  const x = nums[i];
  const y = nums[i + 1];
  if (Number.isFinite(x) && Number.isFinite(y)) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
}

const pad = 24;
const vbX = minX - pad;
const vbY = minY - pad;
const vbW = maxX - minX + pad * 2;
const vbH = maxY - minY + pad * 2;
const viewBox = [vbX.toFixed(3), vbY.toFixed(3), vbW.toFixed(3), vbH.toFixed(3)].join(" ");

const label = STATE_ID.replace("__x26__", "-").replace(/_/g, " ").replace(/\s+/g, " ").trim();
const safeLabel = xmlEscape(label);

const outSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${safeLabel}">
  <path fill="#ffffff" stroke="rgba(1, 97, 191, 0.22)" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" d="${d}"><title>${safeLabel}</title></path>
</svg>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, outSvg, "utf8");
console.log(`Written ${OUT}`);
console.log(`viewBox="${viewBox}"`);
