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
  "/kontakt/": "kontakt/index.html",
  "/kunden/gesundheit/": "kunden/gesundheit/index.html",
  "/gastronomie/": "kunden/gastronomie/index.html",
  "/gemeinden/": "kunden/gemeinden/index.html",
  "/gesundheitswesen/": "kunden/gesundheit/index.html",
  "/lebensmittel/": "kunden/lebensmittel/index.html",
  "/pharma/": "kunden/pharma/index.html",
  "/inspektionundgutachten/": "leistungen/inspektionundgutachten/index.html",
  "/instandsetzung-sanierung/": "leistungen/instandsetzung-sanierung/index.html",
  "/reinigung-desinfektion/": "leistungen/reinigung-desinfektion/index.html",
};

const redirectStubs = {
  "gastronomie/index.html": "/gastronomie/",
  "gemeinden/index.html": "/gemeinden/",
  "gesundheitswesen/index.html": "/gesundheitswesen/",
  "pharma/index.html": "/pharma/",
  "lebensmittel/index.html": "/lebensmittel/",
  "inspektionundgutachten/index.html": "/inspektionundgutachten/",
  "instandsetzung-sanierung/index.html": "/instandsetzung-sanierung/",
  "reinigung-desinfektion/index.html": "/reinigung-desinfektion/",
};

function livePathToStaticFile(livePath) {
  const normalized = livePath.endsWith("/") ? livePath : `${livePath}/`;
  if (pathAliases[normalized]) return pathAliases[normalized];
  if (normalized === "/") return "index.html";
  const slugPath = normalized.replace(/^\/|\/$/g, "");
  for (const candidate of [`${slugPath}/index.html`, `${slugPath}.html`]) {
    if (htmlFiles.has(candidate)) return candidate;
  }
  return null;
}

function staticPathScore(livePath, staticFile) {
  const liveSlug = livePath.replace(/^\/|\/$/g, "");
  const staticSlug = staticFile.replace(/\/index\.html$/, "");
  if (liveSlug === staticSlug) return 3;
  if (staticFile.endsWith(`${liveSlug}/index.html`)) return 2;
  return 1;
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
    .replace(/&raquo;/g, "»")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&szlig;/g, "ß")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function escapeAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getAttr(tag, name) {
  const re = new RegExp(
    `(?:${name}|property)\\s*=\\s*(["'])([^"']*)\\1`,
    "i",
  );
  const byName = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([^"']*)\\1`, "i"));
  if (byName) return byName[2];
  const byProp = tag.match(new RegExp(`\\bproperty\\s*=\\s*(["'])${name}\\1`, "i"));
  return byProp ? byProp[1] : null;
}

function normalizeMetaTag(tag) {
  const robots = tag.match(/\bname\s*=\s*(["'])robots\1/i);
  const desc = tag.match(/\bname\s*=\s*(["'])description\1/i);
  const og = tag.match(/\bproperty\s*=\s*(["'])og:/i);
  const twitter = tag.match(/\bname\s*=\s*(["'])twitter:/i);
  if (!robots && !desc && !og && !twitter) return null;

  const contentMatch = tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i);
  if (!contentMatch) return null;

  let nameAttr = "";
  if (robots) nameAttr = 'name="robots"';
  else if (desc) nameAttr = 'name="description"';
  else if (twitter) {
    const n = tag.match(/\bname\s*=\s*(["'])(twitter:[^"']+)\1/i)?.[2];
    nameAttr = `name="${n}"`;
  } else {
    const p = tag.match(/\bproperty\s*=\s*(["'])(og:[^"']+)\1/i)?.[2];
    nameAttr = `property="${p}"`;
  }

  return `  <meta ${nameAttr} content="${escapeAttr(decodeEntities(contentMatch[2]))}">`;
}

function normalizeCanonical(tag) {
  const href = tag.match(/\bhref\s*=\s*(["'])([^"']*)\1/i)?.[2];
  if (!href) return null;
  return `  <link rel="canonical" href="${escapeAttr(href)}">`;
}

function extractSeoFromLive(html) {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");

  const metaLines = [];
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const line = normalizeMetaTag(match[0]);
    if (line) metaLines.push(line);
  }

  const canonicalMatch = html.match(/<link\s+[^>]*rel\s*=\s*["']canonical["'][^>]*>/i);
  const canonicalLine = canonicalMatch ? normalizeCanonical(canonicalMatch[0]) : null;

  let description =
    metaLines.find((l) => l.includes('name="description"'))?.match(/content="([^"]*)"/)?.[1] ??
    "";
  description = decodeEntities(description.replace(/&quot;/g, '"'));

  if (!description) {
    const ogDesc = metaLines
      .find((l) => l.includes('property="og:description"'))
      ?.match(/content="([^"]*)"/)?.[1];
    if (ogDesc) {
      description = decodeEntities(ogDesc.replace(/&quot;/g, '"'));
      metaLines.unshift(
        `  <meta name="description" content="${escapeAttr(description)}">`,
      );
    }
  }

  return { title, metaLines, canonicalLine };
}

function stripManagedSeoTags(html) {
  return html
    .replace(/^\s*<meta\s+name=["']robots["'][^>]*>\s*\n?/gim, "")
    .replace(/^\s*<meta\s+name=["']description["'][^>]*>\s*\n?/gim, "")
    .replace(/^\s*<link\s+rel=["']canonical["'][^>]*>\s*\n?/gim, "")
    .replace(/^\s*<meta\s+property=["']og:[^"']*["'][^>]*>\s*\n?/gim, "")
    .replace(/^\s*<meta\s+name=["']twitter:[^"']*["'][^>]*>\s*\n?/gim, "");
}

function applySeo(html, seo) {
  let next = stripManagedSeoTags(html);
  next = next.replace(
    /<title[^>]*>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(seo.title)}</title>`,
  );

  const block = [
    ...seo.metaLines,
    ...(seo.canonicalLine ? [seo.canonicalLine] : []),
  ].join("\n");

  if (block) {
    next = next.replace(
      /(<title[^>]*>[\s\S]*?<\/title>\s*\n)/i,
      `$1${block}\n`,
    );
  }

  return next;
}

function applySeoToRedirectStub(html, seo) {
  const title = escapeHtml(seo.title);
  const desc = seo.metaLines.find((l) => l.includes('name="description"')) ?? "";
  const canonical = seo.canonicalLine ?? "";

  let head = `  <meta charset="UTF-8">\n`;
  if (desc) head += `${desc.replace(/^  /, "  ")}\n`;
  if (canonical) head += `${canonical}\n`;
  head += `  <title>${title}</title>\n`;

  return html.replace(/<head>[\s\S]*?<\/head>/i, `<head>\n${head}</head>`);
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "IGIENAIR-static-meta-sync/1.0" },
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

const pairMap = new Map();
for (const page of data.pages) {
  const staticFile = livePathToStaticFile(page.path);
  if (!staticFile) continue;

  const existing = pairMap.get(staticFile);
  const score = staticPathScore(page.path, staticFile);
  if (!existing || score > existing.score) {
    pairMap.set(staticFile, {
      liveUrl: page.url,
      livePath: page.path,
      staticFile,
      score,
    });
  }
}

const pairs = [...pairMap.values()];

const results = await mapPool(pairs, async (pair) => {
  try {
    const liveHtml = await fetchHtml(pair.liveUrl);
    const seo = extractSeoFromLive(liveHtml);
    const filePath = path.join(root, pair.staticFile);
    const staticHtml = await fs.promises.readFile(filePath, "utf8");
    const updated = applySeo(staticHtml, seo);
    if (updated !== staticHtml) {
      await fs.promises.writeFile(filePath, updated, "utf8");
    }
    return { ...pair, ok: true, title: seo.title };
  } catch (err) {
    return { ...pair, ok: false, error: err.message };
  }
});

const redirectResults = await mapPool(
  Object.entries(redirectStubs),
  async ([staticFile, livePath]) => {
    try {
      const page = data.pages.find((p) => p.path === livePath);
      const liveUrl = page?.url ?? `https://igienair.de${livePath}`;
      const liveHtml = await fetchHtml(liveUrl);
      const seo = extractSeoFromLive(liveHtml);
      const filePath = path.join(root, staticFile);
      const staticHtml = await fs.promises.readFile(filePath, "utf8");
      const updated = applySeoToRedirectStub(staticHtml, seo);
      await fs.promises.writeFile(filePath, updated, "utf8");
      return { staticFile, ok: true };
    } catch (err) {
      return { staticFile, ok: false, error: err.message };
    }
  },
);

const ok = results.filter((r) => r.ok);
const failed = results.filter((r) => !r.ok);

const summary = {
  updated: ok.length,
  failed: failed.length,
  redirectStubs: redirectResults.filter((r) => r.ok).length,
  redirectFailed: redirectResults.filter((r) => !r.ok).length,
};

fs.writeFileSync(
  path.join(root, "asset-analysis/output/meta-sync-log.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary,
      failed,
      redirectResults,
      samples: ok.slice(0, 5).map((r) => ({
        file: r.staticFile,
        title: r.title,
      })),
    },
    null,
    2,
  ),
);

console.log(JSON.stringify(summary, null, 2));
if (failed.length) {
  console.log("\nFehler:");
  for (const f of failed) console.log(`- ${f.staticFile}: ${f.error}`);
}
