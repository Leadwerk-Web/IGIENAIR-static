import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "Bildmaterial_final");
const reportDir = path.join(__dirname, "output");
const MEDIA_EXT = /\.(jpg|jpeg|png|webp|svg|gif|avif|mp4|webm|mov)(\?[^"'()\s,]*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)(\?[^"'()\s,]*)?$/i;
const SKIP_DIRS = new Set(["node_modules", ".git", "Bildmaterial_final"]);

const ROOT_ALIASES = {
  "hygieneinspektion-vdi-6022": "leistungen/hygieneinspektion-vdi-6022",
  "gefaehrdungsbeurteilung-vdi-2047": "leistungen/gefaehrdungsbeurteilung-vdi-2047",
  inspektionundgutachten: "leistungen/inspektionundgutachten",
  "reinigung-desinfektion": "leistungen/reinigung-desinfektion",
  "instandsetzung-sanierung": "leistungen/instandsetzung-sanierung",
  "energetische-inspektion-geg-2020": "leistungen/energetische-inspektion-geg-2020",
  kanaluntersuchung: "leistungen/kanaluntersuchung",
  filterintegritaetstest: "anlagen/filterintegritaetstest",
  "lecktest-schwebstofffilter": "anlagen/lecktest-schwebstofffilter",
  "rlt-hygiene": "anlagen/rlt-hygiene",
  pharma: "kunden/pharma",
  gastronomie: "kunden/gastronomie",
  gemeinden: "kunden/gemeinden",
  lebensmittel: "kunden/lebensmittel",
  gesundheitswesen: "kunden/gesundheit",
  industrie: "kunden/industrie",
};

const GLOBAL_IMAGE_PATTERNS = [
  /logo/i,
  /favicon/i,
  /sector-/i,
  /germany-/i,
  /karte-/i,
  /standorte-location/i,
  /certifications-hero-bg/i,
  /company-cta-bg/i,
  /Unternehmen-Hero/i,
  /brochure-thumb/i,
  /bodensee-quadrat/i,
  /downloads\//i,
];

function walkFiles(dir, exts, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, exts, files);
    } else if (exts.some((re) => re.test(entry.name))) {
      files.push(path.relative(root, full).replace(/\\/g, "/"));
    }
  }
  return files;
}

function getPageCategory(htmlPath) {
  const normalized = htmlPath.replace(/\\/g, "/");
  if (normalized === "index.html") return "startseite";

  const parts = normalized.replace(/\/index\.html$/, "").split("/");
  const top = parts[0];

  if (top === "kunden" && parts[1] === "referenzen") {
    if (parts.length === 2) return "referenzen";
    if (parts.length === 3) return `referenzen/${parts[2]}`;
    return `referenzen/${parts[2]}/${parts[3]}`;
  }

  if (parts.length === 1 && ROOT_ALIASES[parts[0]]) {
    return ROOT_ALIASES[parts[0]];
  }

  if (top === "kontakt") {
    return parts.length > 1 ? `kontakt/${parts.slice(1).join("/")}` : "kontakt";
  }

  if (top === "jobs") {
    return parts.length > 1 ? `jobs/${parts.slice(1).join("/")}` : "jobs";
  }

  if (top === "glossar") return "unternehmen/glossar";
  if (top === "downloads") return "unternehmen/downloads";
  if (top === "branchen") return "kunden/branchen";
  if (top === "datenschutz" || top === "impressum" || top === "cookie-richtlinie-eu") {
    return "global/legal";
  }
  if (top === "login") return "global/login";

  return parts.join("/");
}

function extractMediaUrls(content) {
  const urls = [];
  const patterns = [
    /(?:src|href|content|poster)\s*=\s*["']([^"']+\.(?:jpg|jpeg|png|webp|svg|gif|avif|mp4|webm|mov)(?:\?[^"']*)?)["']/gi,
    /srcset\s*=\s*["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+\.(?:jpg|jpeg|png|webp|svg|gif|avif|mp4|webm|mov)(?:\?[^"')]*)?)["']?\s*\)/gi,
    /url\(\s*["']?(assets\/(?:images|video)\/[^"')]+)["']?\s*\)/gi,
  ];

  for (const re of patterns) {
    let match;
    while ((match = re.exec(content)) !== null) {
      if (match[1].startsWith("data:")) continue;
      if (re === patterns[1]) {
        for (const part of match[1].split(",")) {
          const url = part.trim().split(/\s+/)[0];
          if (MEDIA_EXT.test(url)) urls.push(url);
        }
      } else {
        urls.push(match[1]);
      }
    }
  }

  return urls;
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function resolveImagePath(sourceFile, imageUrl) {
  const clean = decodeHtmlEntities(imageUrl.split("?")[0].split("#")[0]);
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return { resolved: null, reason: "external" };
  }
  if (clean.startsWith("/")) {
    const abs = path.join(root, clean.slice(1));
    return fs.existsSync(abs)
      ? { resolved: path.relative(root, abs).replace(/\\/g, "/"), reason: "ok" }
      : { resolved: null, reason: "missing" };
  }

  const sourceDir = path.dirname(sourceFile);
  const abs = path.normalize(path.join(root, sourceDir, clean));
  if (!abs.startsWith(root)) return { resolved: null, reason: "outside-root" };
  return fs.existsSync(abs)
    ? { resolved: path.relative(root, abs).replace(/\\/g, "/"), reason: "ok" }
    : { resolved: null, reason: "missing" };
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inferGlobalBucket(resolvedPath) {
  const base = path.basename(resolvedPath).toLowerCase();
  if (/logo/.test(base)) return "logos";
  if (/favicon/.test(base)) return "logos";
  if (/sector-|karte-|bodensee|brochure-thumb|germany-|standorte-location/.test(resolvedPath.toLowerCase())) {
    return "icons";
  }
  if (GLOBAL_IMAGE_PATTERNS.some((re) => re.test(resolvedPath))) {
    return "shared";
  }
  return null;
}

function buildDescriptiveName(resolvedPath, category, usedNames) {
  const ext = path.extname(resolvedPath).toLowerCase();
  const baseName = path.basename(resolvedPath, ext);
  const parts = resolvedPath.split("/");

  let stem = slugify(baseName);
  if (VIDEO_EXT.test(resolvedPath) && /hero/i.test(baseName)) {
    stem = slugify(`${category.split("/").pop() || "startseite"}-hero`);
  }
  const generic = /^(img|dsc|photo|bild|adobe|image|untitled|screenshot|capture|pic)[-_]?\d*$/i.test(baseName);
  const hasSpacesOrUmlauts = /[^a-zA-Z0-9._-]/.test(baseName);

  if (generic || hasSpacesOrUmlauts || stem.length < 4) {
    const folderHints = parts
      .slice(-3, -1)
      .map((p) => slugify(p.replace(/^Genutze Bilder_LW$/i, "")))
      .filter(Boolean);
    const catHint = category.split("/").pop() || "bild";
    stem = slugify([catHint, ...folderHints, slugify(baseName)].filter(Boolean).join("-"));
  }

  if (!stem) stem = slugify(category.split("/").pop() || "bild");

  let candidate = `${stem}${ext}`;
  let counter = 2;
  while (usedNames.has(candidate)) {
    candidate = `${stem}-${counter}${ext}`;
    counter += 1;
  }
  usedNames.add(candidate);
  return candidate;
}

function getTopSection(category) {
  if (category.startsWith("referenzen/")) return "referenzen";
  return category.split("/")[0];
}

function decideDestination(resolvedPath, usages) {
  if (VIDEO_EXT.test(resolvedPath)) {
    const categories = [...new Set(usages.map((u) => u.category))];
    if (categories.length === 1 && categories[0] === "startseite") {
      return "startseite";
    }
    if (/hero/i.test(path.basename(resolvedPath))) {
      return "startseite";
    }
  }

  const globalBucket = inferGlobalBucket(resolvedPath);
  if (globalBucket) return globalBucket;

  const categories = [...new Set(usages.map((u) => u.category))];
  const topSections = [...new Set(categories.map(getTopSection))];

  if (usages.some((u) => u.source === "styles.css") && topSections.length >= 2) {
    return "shared";
  }

  if (topSections.length >= 3) return "shared";
  if (topSections.length === 2) {
    const allReferenzen = topSections.every((s) => s === "referenzen");
    if (allReferenzen) return "referenzen/shared";
    return "shared";
  }

  if (categories.length === 1) return categories[0];

  const commonPrefix = categories.reduce((acc, cat) => {
    const accParts = acc.split("/");
    const catParts = cat.split("/");
    const shared = [];
    for (let i = 0; i < Math.min(accParts.length, catParts.length); i += 1) {
      if (accParts[i] === catParts[i]) shared.push(accParts[i]);
      else break;
    }
    return shared.join("/");
  });

  return commonPrefix || "shared";
}

function toRelative(fromFile, targetFromRoot) {
  const fromDir = path.dirname(fromFile).replace(/\\/g, "/") || ".";
  let rel = path.relative(fromDir, targetFromRoot).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function replaceImageUrls(content, sourceFile, pathMap) {
  const replacements = new Map();

  for (const rawUrl of extractMediaUrls(content)) {
    const { resolved } = resolveImagePath(sourceFile, rawUrl);
    if (!resolved || !pathMap.has(resolved)) continue;
    const newRel = toRelative(sourceFile, pathMap.get(resolved));
    if (rawUrl !== newRel) {
      replacements.set(rawUrl, newRel);
    }
  }

  if (replacements.size === 0) return content;

  let updated = content;
  const sorted = [...replacements.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [oldUrl, newUrl] of sorted) {
    const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    updated = updated.replace(new RegExp(escaped, "g"), newUrl);
  }

  return updated;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const sourceFiles = walkFiles(root, [/\.html$/, /\.css$/, /\.js$/]).filter(
    (f) => !f.startsWith("_acm")
  );

  /** @type {Map<string, { sourceFile: string, category: string, rawUrl: string }[]>} */
  const usageMap = new Map();
  /** @type {{ sourceFile: string, rawUrl: string, reason: string }[]} */
  const problems = [];

  for (const sourceFile of sourceFiles) {
    const content = fs.readFileSync(path.join(root, sourceFile), "utf8");
    const category =
      sourceFile.endsWith(".html") ? getPageCategory(sourceFile) : "__stylesheet__";
    const urls = extractMediaUrls(content);

    for (const rawUrl of urls) {
      const { resolved, reason } = resolveImagePath(sourceFile, rawUrl);
      if (!resolved) {
        if (reason !== "external") {
          problems.push({ sourceFile, rawUrl, reason });
        }
        continue;
      }

      if (!usageMap.has(resolved)) usageMap.set(resolved, []);
      usageMap.get(resolved).push({
        sourceFile,
        category: category === "__stylesheet__" ? "styles.css" : category,
        rawUrl,
      });
    }
  }

  /** @type {Map<string, string>} old project-relative path -> new project-relative path */
  const pathMap = new Map();
  /** @type {{ from: string, to: string, category: string, usages: number }[]} */
  const copies = [];
  const usedNamesByDir = new Map();

  for (const [resolvedPath, usages] of usageMap.entries()) {
    const usageRecords = usages.map((u) => ({
      source: u.sourceFile,
      category: u.category === "styles.css" ? getPageCategory(u.sourceFile) : u.category,
    }));

    const stylesheetOnly = usages.every((u) => u.sourceFile === "styles.css");
    const categoriesForDecision = stylesheetOnly
      ? usages.map(() => "shared")
      : usages.map((u) => (u.category === "styles.css" ? "shared" : u.category));

    const destination = decideDestination(
      resolvedPath,
      categoriesForDecision.map((category, i) => ({
        category,
        source: usages[i].sourceFile,
      }))
    );

    if (!usedNamesByDir.has(destination)) usedNamesByDir.set(destination, new Set());
    const fileName = buildDescriptiveName(
      resolvedPath,
      destination,
      usedNamesByDir.get(destination)
    );
    const newRelPath = `Bildmaterial_final/${destination}/${fileName}`.replace(/\\/g, "/");
    pathMap.set(resolvedPath, newRelPath);

    copies.push({
      from: resolvedPath,
      to: newRelPath,
      category: destination,
      usages: usages.length,
    });
  }

  if (!dryRun) {
    for (const copy of copies) {
      const destAbs = path.join(root, copy.to);
      fs.mkdirSync(path.dirname(destAbs), { recursive: true });
      if (!fs.existsSync(destAbs)) {
        fs.copyFileSync(path.join(root, copy.from), destAbs);
      }
    }

    let changedFiles = 0;
    for (const sourceFile of sourceFiles) {
      const fullPath = path.join(root, sourceFile);
      const original = fs.readFileSync(fullPath, "utf8");
      const updated = replaceImageUrls(original, sourceFile, pathMap);
      if (updated !== original) {
        fs.writeFileSync(fullPath, updated, "utf8");
        changedFiles += 1;
      }
    }

    console.log(`Changed ${changedFiles} source files`);
  }

  const unresolvedAfter = [];
  for (const sourceFile of sourceFiles) {
    const content = fs.readFileSync(path.join(root, sourceFile), "utf8");
    for (const rawUrl of extractMediaUrls(content)) {
      const { resolved, reason } = resolveImagePath(sourceFile, rawUrl);
      if (!resolved && reason !== "external") {
        unresolvedAfter.push({ sourceFile, rawUrl, reason });
      }
      if (resolved && resolved.startsWith("assets/images/")) {
        unresolvedAfter.push({ sourceFile, rawUrl, reason: "still-old-path" });
      }
    }
  }

  fs.mkdirSync(reportDir, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    totalImages: copies.length,
    totalUsages: [...usageMap.values()].reduce((sum, u) => sum + u.length, 0),
    copies: copies.sort((a, b) => a.to.localeCompare(b.to)),
    problemsBefore: problems,
    problemsAfter: dryRun ? [] : unresolvedAfter,
    folders: [...new Set(copies.map((c) => c.category))].sort(),
  };

  fs.writeFileSync(
    path.join(reportDir, "bildmaterial-migration.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  );

  const md = [
    "# Bildmaterial-Migration",
    "",
    `- **Datum:** ${report.generatedAt}`,
    `- **Modus:** ${dryRun ? "Dry-Run" : "Live"}`,
    `- **Gefundene Bilder:** ${report.totalImages}`,
    `- **Bildreferenzen gesamt:** ${report.totalUsages}`,
    `- **Ordner:** ${report.folders.length}`,
    "",
    "## Ordnerstruktur",
    "",
    ...report.folders.map((f) => `- \`Bildmaterial_final/${f}/\``),
    "",
    "## Problematische Pfade (vor Migration)",
    "",
    ...(problems.length
      ? problems.map((p) => `- \`${p.rawUrl}\` in \`${p.sourceFile}\` (${p.reason})`)
      : ["- Keine"]),
    "",
    ...(dryRun
      ? ["", "*Dry-Run: keine Dateien kopiert oder Pfade geändert.*"]
      : [
          "## Probleme nach Migration",
          "",
          ...(unresolvedAfter.length
            ? unresolvedAfter.map(
                (p) => `- \`${p.rawUrl}\` in \`${p.sourceFile}\` (${p.reason})`
              )
            : ["- Keine"]),
        ]),
    "",
    "## Bildliste (Auszug)",
    "",
    "| Quelle | Ziel | Kategorie | Verwendungen |",
    "|--------|------|-----------|--------------|",
    ...copies
      .slice(0, 50)
      .map((c) => `| \`${c.from}\` | \`${c.to}\` | ${c.category} | ${c.usages} |`),
    copies.length > 50 ? `\n*… und ${copies.length - 50} weitere (siehe JSON)*` : "",
  ].join("\n");

  fs.writeFileSync(path.join(reportDir, "bildmaterial-migration.md"), md, "utf8");

  console.log(`Images: ${report.totalImages}`);
  console.log(`Folders: ${report.folders.length}`);
  console.log(`Problems before: ${problems.length}`);
  if (!dryRun) console.log(`Problems after: ${unresolvedAfter.length}`);
  console.log(`Report: asset-analysis/output/bildmaterial-migration.json`);
}

main();
