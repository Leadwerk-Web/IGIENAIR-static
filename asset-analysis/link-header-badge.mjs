import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const KONTAKT = path.join(ROOT, "kontakt/index.html");

function walkHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "leadwerk_importer") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(full, files);
    } else if (entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

function kontaktHref(filePath) {
  const rel = path
    .relative(path.dirname(filePath), KONTAKT)
    .replace(/\\/g, "/");
  return rel === "index.html" ? "#locations" : `${rel}#locations`;
}

const badgeRe =
  /<img class="header-badge" src="([^"]+)" alt="([^"]*)"\s*\/?>/g;

let updated = 0;

for (const file of walkHtmlFiles(ROOT)) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes('class="header-badge"') || html.includes("header-badge-link")) {
    continue;
  }

  const href = kontaktHref(file);
  const next = html.replace(
    badgeRe,
    `<a class="header-badge-link" href="${href}" aria-label="Standorte anzeigen"><img class="header-badge" src="$1" alt="$2"></a>`,
  );

  if (next !== html) {
    fs.writeFileSync(file, next, "utf8");
    updated += 1;
    console.log(path.relative(ROOT, file));
  }
}

console.log(`Fertig: ${updated} Dateien aktualisiert.`);
