import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "output/seitenstruktur.json"), "utf8")
);

function walkHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith(".html") && entry.name !== "_acm-temp.html") {
      files.push(path.relative(root, fullPath).replace(/\\/g, "/"));
    }
  }
  return files;
}

const htmlFiles = new Set(walkHtmlFiles(root));

const pathAliases = {
  "/kontakt/": "/kontakt/index.html",
  "/kunden/gesundheit/": "/kunden/gesundheit/index.html",
  "/gastronomie/": "/kunden/gastronomie/index.html",
  "/gemeinden/": "/kunden/gemeinden/index.html",
  "/gesundheitswesen/": "/kunden/gesundheit/index.html",
  "/lebensmittel/": "/kunden/lebensmittel/index.html",
  "/pharma/": "/kunden/pharma/index.html",
  "/inspektionundgutachten/": "/leistungen/inspektionundgutachten/index.html",
  "/instandsetzung-sanierung/": "/leistungen/instandsetzung-sanierung/index.html",
  "/reinigung-desinfektion/": "/leistungen/reinigung-desinfektion/index.html",
};

function livePathToStaticFile(livePath) {
  const normalized = livePath.endsWith("/") ? livePath : `${livePath}/`;
  if (pathAliases[normalized]) {
    return pathAliases[normalized].replace(/^\//, "");
  }

  if (normalized === "/") {
    return "index.html";
  }

  const slugPath = normalized.replace(/^\/|\/$/g, "");
  const candidates = [`${slugPath}/index.html`, `${slugPath}.html`];

  return candidates.find((c) => htmlFiles.has(c)) ?? null;
}

const missing = [];
const implemented = [];
const glossarSkipped = [];

for (const page of data.pages) {
  if (page.path.startsWith("/glossar/") && page.path !== "/glossar/") {
    glossarSkipped.push(page.path);
    continue;
  }

  const match = livePathToStaticFile(page.path);
  if (match) {
    implemented.push({ live: page.path, static: match });
  } else {
    missing.push({
      live: page.path,
      url: page.url,
      guessed: `${page.path.replace(/^\/|\/$/g, "")}/index.html`,
    });
  }
}

missing.sort((a, b) => a.live.localeCompare(b.live, "de"));

const bySection = {};
for (const item of missing) {
  const section = item.live.split("/").filter(Boolean)[0] ?? "(root)";
  if (!bySection[section]) {
    bySection[section] = [];
  }
  bySection[section].push(item.live);
}

const report = {
  generatedAt: new Date().toISOString(),
  livePagesTotal: data.pages.length,
  implemented: implemented.length,
  missing: missing.length,
  glossarTermsSkipped: glossarSkipped.length,
  missingBySection: Object.fromEntries(
    Object.entries(bySection)
      .sort(([a], [b]) => a.localeCompare(b, "de"))
      .map(([k, v]) => [k, v])
  ),
  missingPages: missing,
};

fs.writeFileSync(
  path.join(__dirname, "output/fehlende-seiten.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log(`Live-Seiten: ${data.pages.length}`);
console.log(`Umgesetzt: ${implemented.length}`);
console.log(`Fehlend: ${missing.length}`);
console.log(`Glossar-Einzelbegriffe (bewusst ohne eigene HTML): ${glossarSkipped.length}`);
console.log("\n--- Fehlende Seiten nach Bereich ---");
for (const [section, pages] of Object.entries(report.missingBySection)) {
  console.log(`\n[${section}] (${pages.length})`);
  pages.forEach((p) => console.log(`  ${p}`));
}
