import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(
  fs.readFileSync(path.join(root, "asset-analysis/output/seitenstruktur.json"), "utf8"),
);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "leadwerk_importer",
  "leadwerk_theme",
  ".playwright-mcp",
  "asset-analysis",
]);

function walkHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

const htmlFiles = new Set(
  walkHtml(root).map((f) => path.relative(root, f).replace(/\\/g, "/")),
);

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
  if (normalized === "/") return "index.html";
  const slugPath = normalized.replace(/^\/|\/$/g, "");
  for (const c of [`${slugPath}/index.html`, `${slugPath}.html`]) {
    if (htmlFiles.has(c)) return c;
  }
  return null;
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&szlig;/g, "ß")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const description =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] ??
    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i)?.[1] ??
    "";
  const canonical =
    html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)?.[1] ??
    html.match(/<link\s+href=["']([^"']*)["']\s+rel=["']canonical["']/i)?.[1] ??
    "";
  const ogTitle =
    html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i)?.[1] ??
    "";
  const ogDescription =
    html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i)?.[1] ??
    "";
  const robots =
    html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i)?.[1] ?? "";

  return {
    title: decodeEntities(title),
    description: decodeEntities(description),
    canonical,
    ogTitle: decodeEntities(ogTitle),
    ogDescription: decodeEntities(ogDescription),
    robots,
  };
}

function norm(s) {
  return decodeEntities(s).toLowerCase();
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "IGIENAIR-static-meta-audit/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function mapPool(items, fn, concurrency = 8) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

const pairs = [];
for (const page of data.pages) {
  const staticFile = livePathToStaticFile(page.path);
  if (!staticFile) continue;
  pairs.push({ liveUrl: page.url, livePath: page.path, staticFile });
}

const results = await mapPool(pairs, async (pair) => {
  try {
    const [liveHtml, staticHtml] = await Promise.all([
      fetchHtml(pair.liveUrl),
      fs.promises.readFile(path.join(root, pair.staticFile), "utf8"),
    ]);
    const live = extractMeta(liveHtml);
    const stat = extractMeta(staticHtml);
    const titleMatch = norm(live.title) === norm(stat.title);
    const descMatch = norm(live.description) === norm(stat.description);
    const liveDescSource = live.description || live.ogDescription;
    const descMatchWithOg =
      norm(liveDescSource) === norm(stat.description) ||
      norm(live.ogDescription) === norm(stat.description);

    return {
      ...pair,
      live,
      static: stat,
      titleMatch,
      descriptionMatch: descMatch || descMatchWithOg,
      issues: [
        ...(titleMatch ? [] : [{ field: "title", live: live.title, static: stat.title }]),
        ...(descMatch || descMatchWithOg
          ? []
          : [
              {
                field: "description",
                live: live.description || live.ogDescription,
                static: stat.description,
              },
            ]),
      ],
      staticHasCanonical: Boolean(stat.canonical),
      staticHasOg: Boolean(stat.ogTitle || stat.ogDescription),
      liveHasCanonical: Boolean(live.canonical),
      liveHasOg: Boolean(live.ogTitle || live.ogDescription),
    };
  } catch (err) {
    return { ...pair, error: err.message };
  }
});

const ok = results.filter((r) => !r.error && r.issues.length === 0);
const mismatches = results.filter((r) => !r.error && r.issues.length > 0);
const errors = results.filter((r) => r.error);

const summary = {
  compared: results.length,
  titleDescriptionMatch: ok.length,
  mismatches: mismatches.length,
  fetchErrors: errors.length,
  staticMissingCanonical: results.filter((r) => !r.error && !r.staticHasCanonical).length,
  staticMissingOg: results.filter((r) => !r.error && !r.staticHasOg).length,
  liveWithCanonical: results.filter((r) => !r.error && r.liveHasCanonical).length,
  liveWithOg: results.filter((r) => !r.error && r.liveHasOg).length,
};

const outPath = path.join(root, "asset-analysis/output/meta-vergleich.json");
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary,
      mismatches: mismatches.map((r) => ({
        staticFile: r.staticFile,
        livePath: r.livePath,
        issues: r.issues,
      })),
      errors,
      samplesMatch: ok.slice(0, 5).map((r) => ({
        staticFile: r.staticFile,
        title: r.static.title,
      })),
    },
    null,
    2,
  ),
);

console.log(JSON.stringify(summary, null, 2));
console.log(`\nDetails: ${outPath}`);
if (mismatches.length) {
  console.log("\nErste Abweichungen:");
  for (const m of mismatches.slice(0, 8)) {
    console.log(`- ${m.staticFile}`);
    for (const i of m.issues) {
      console.log(`  ${i.field} LIVE:  ${i.live?.slice(0, 90)}`);
      console.log(`  ${i.field} STATIC: ${i.static?.slice(0, 90)}`);
    }
  }
}
