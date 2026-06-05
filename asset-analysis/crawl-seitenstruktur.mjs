/**
 * Ermittelt die öffentliche Seitenstruktur von igienair.de
 * Ausgabe: asset-analysis/output/seitenstruktur.{txt,csv,json}
 *
 * Nutzung: node asset-analysis/crawl-seitenstruktur.mjs
 * Optional: node asset-analysis/crawl-seitenstruktur.mjs https://igienair.de/
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "output");

const START_URL = process.argv[2] ?? "https://igienair.de/";
const MAX_CRAWL_PAGES = 400;
const CRAWL_CONCURRENCY = 6;
const FETCH_TIMEOUT_MS = 20000;

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "ref",
  "_ga",
  "_gl",
]);

const IGNORED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".css",
  ".js",
  ".mjs",
  ".map",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".ico",
  ".mp4",
  ".webm",
  ".zip",
  ".rar",
  ".xml",
  ".xsl",
]);

const IGNORED_PATH_PREFIXES = [
  "/wp-content/",
  "/wp-admin/",
  "/wp-includes/",
  "/wp-json",
  "/wp-login.php",
  "/xmlrpc.php",
  "/feed/",
  "/comments/feed/",
  "/login",
];

const startUrl = new URL(START_URL);
const origin = startUrl.origin;
const hostname = startUrl.hostname.replace(/^www\./, "");

function log(...args) {
  console.log(...args);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, redirectCount = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "IGIENAIR-static-seitenstruktur-bot/1.0 (+internal audit)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "manual",
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location || redirectCount >= 5) {
        return { ok: false, status: res.status, url, text: "" };
      }
      const nextUrl = new URL(location, url).href;
      return fetchText(nextUrl, redirectCount + 1);
    }

    const contentType = res.headers.get("content-type") ?? "";
    const text = res.ok ? await res.text() : "";
    return { ok: res.ok, status: res.status, url, text, contentType };
  } catch (error) {
    return { ok: false, status: 0, url, text: "", error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

function isSameSite(urlObj) {
  const host = urlObj.hostname.replace(/^www\./, "");
  return host === hostname || host.endsWith(`.${hostname}`);
}

function shouldIgnorePath(pathname) {
  const lower = pathname.toLowerCase();

  if (lower === "/feed" || lower.endsWith("/feed") || lower.includes("/feed/")) {
    return true;
  }

  if (IGNORED_PATH_PREFIXES.some((prefix) => lower.includes(prefix))) {
    return true;
  }

  const ext = path.extname(lower.split("?")[0]);
  if (ext && IGNORED_EXTENSIONS.has(ext)) {
    return true;
  }

  return false;
}

function normalizeUrl(raw, baseUrl = START_URL) {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:")
  ) {
    return null;
  }

  let urlObj;
  try {
    urlObj = new URL(trimmed, baseUrl);
  } catch {
    return null;
  }

  if (!isSameSite(urlObj)) {
    return null;
  }

  if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
    return null;
  }

  urlObj.protocol = "https:";
  urlObj.hostname = hostname;

  urlObj.hash = "";

  for (const key of [...urlObj.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith("utm_")) {
      urlObj.searchParams.delete(key);
    }
  }

  // Für eine saubere Seitenstruktur keine Query-Parameter (z. B. WordPress ?p=…)
  urlObj.search = "";

  let pathname = decodeURIComponent(urlObj.pathname);
  pathname = pathname.replace(/\/{2,}/g, "/");
  if (pathname !== "/" && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  urlObj.pathname = pathname || "/";

  if (shouldIgnorePath(urlObj.pathname)) {
    return null;
  }

  return urlObj.href;
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  const hrefPattern = /\shref\s*=\s*(["'])(.*?)\1/gi;
  let match;

  while ((match = hrefPattern.exec(html)) !== null) {
    const normalized = normalizeUrl(match[2], baseUrl);
    if (normalized) {
      links.add(normalized);
    }
  }

  return links;
}

function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
}

function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/i.test(xml);
}

async function collectFromSitemaps() {
  const sitemapCandidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ];

  const collected = new Set();
  const visitedSitemaps = new Set();
  const queue = [];

  for (const candidate of sitemapCandidates) {
    const res = await fetchText(candidate);
    if (res.ok && res.text.includes("<loc>")) {
      queue.push(candidate);
      break;
    }
  }

  while (queue.length > 0) {
    const sitemapUrl = queue.shift();
    if (visitedSitemaps.has(sitemapUrl)) {
      continue;
    }
    visitedSitemaps.add(sitemapUrl);

    const res = await fetchText(sitemapUrl);
    if (!res.ok) {
      log(`Sitemap nicht lesbar: ${sitemapUrl} (${res.status})`);
      continue;
    }

    const locs = parseSitemapLocs(res.text);
    if (isSitemapIndex(res.text)) {
      for (const loc of locs) {
        if (!visitedSitemaps.has(loc)) {
          queue.push(loc);
        }
      }
      continue;
    }

    for (const loc of locs) {
      const normalized = normalizeUrl(loc);
      if (normalized) {
        collected.add(normalized);
      }
    }
  }

  return { urls: collected, visitedSitemaps: [...visitedSitemaps] };
}

async function crawlSite(seedUrls, { fullCrawl = false } = {}) {
  const discovered = new Set(seedUrls);
  const queue = fullCrawl ? [...seedUrls] : [normalizeUrl(START_URL)].filter(Boolean);
  const crawled = new Set();
  const htmlPages = new Set();
  const failures = [];

  while (queue.length > 0 && crawled.size < MAX_CRAWL_PAGES) {
    const batch = [];
    while (batch.length < CRAWL_CONCURRENCY && queue.length > 0) {
      const next = queue.shift();
      if (!next || crawled.has(next)) {
        continue;
      }
      crawled.add(next);
      batch.push(next);
    }

    if (batch.length === 0) {
      break;
    }

    const results = await Promise.all(batch.map((url) => fetchText(url)));

    for (const res of results) {
      if (!res.ok) {
        failures.push({ url: res.url, status: res.status, error: res.error });
        continue;
      }

      const isHtml = /text\/html|application\/xhtml\+xml/i.test(res.contentType ?? "");
      if (!isHtml) {
        continue;
      }

      htmlPages.add(res.url);
      const links = extractLinks(res.text, res.url);
      for (const link of links) {
        if (!discovered.has(link)) {
          discovered.add(link);
          queue.push(link);
        }
      }
    }

    await sleep(150);
  }

  return { urls: discovered, htmlPages: [...htmlPages], crawledCount: crawled.size, failures };
}

function toDisplayPath(url) {
  const { pathname } = new URL(url);
  if (pathname === "/") {
    return "/";
  }
  return `${pathname}/`;
}

function buildTree(urls) {
  const root = { name: "/", children: new Map(), urls: [] };

  for (const url of urls) {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split("/").filter(Boolean);
    let node = root;

    if (segments.length === 0) {
      root.urls.push(url);
      continue;
    }

    for (const segment of segments) {
      if (!node.children.has(segment)) {
        node.children.set(segment, { name: segment, children: new Map(), urls: [] });
      }
      node = node.children.get(segment);
    }
    node.urls.push(url);
  }

  return root;
}

function serializeTree(node, currentPath = "") {
  const fullPath = currentPath ? `${currentPath}/${node.name}` : (node.name === "/" ? "" : node.name);
  const pathDisplay = fullPath ? `/${fullPath}/` : "/";
  const children = [...node.children.values()]
    .sort((a, b) => a.name.localeCompare(b.name, "de"))
    .map((child) => serializeTree(child, fullPath || (child.name ? "" : "")));

  return {
    path: pathDisplay,
    urls: node.urls,
    children,
  };
}

function treeToLines(node, prefix = "") {
  const lines = [];
  const current = prefix || "/";
  lines.push(`- ${current.endsWith("/") || current === "/" ? current : `${current}/`}`);

  const childEntries = [...node.children.values()].sort((a, b) => a.name.localeCompare(b.name, "de"));
  for (const child of childEntries) {
    const childPath = prefix === "" ? `/${child.name}/` : `${prefix}${child.name}/`;
    lines.push(...treeToLines(child, childPath));
  }

  return lines;
}

function collectMainSections(urls) {
  const sections = new Map();

  for (const url of urls) {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const key = segments[0] ?? "(startseite)";
    sections.set(key, (sections.get(key) ?? 0) + 1);
  }

  return [...sections.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

function findSimilarUrls(urls) {
  const byLeaf = new Map();
  const groups = [];

  for (const url of urls) {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const leaf = segments.at(-1) ?? "";
    if (!leaf) {
      continue;
    }
    if (!byLeaf.has(leaf)) {
      byLeaf.set(leaf, []);
    }
    byLeaf.get(leaf).push(url);
  }

  for (const [leaf, list] of byLeaf.entries()) {
    if (list.length > 1) {
      groups.push({ reason: `Gleicher Seitenname: ${leaf}`, urls: list.sort() });
    }
  }

  const normalizedPaths = new Map();
  for (const url of urls) {
    const compact = new URL(url).pathname.replace(/-/g, "").replace(/\//g, "");
    if (!compact) {
      continue;
    }
    if (!normalizedPaths.has(compact)) {
      normalizedPaths.set(compact, []);
    }
    normalizedPaths.get(compact).push(url);
  }

  for (const list of normalizedPaths.values()) {
    if (list.length > 1) {
      const unique = [...new Set(list)];
      if (unique.length > 1 && !groups.some((g) => g.urls.join() === unique.sort().join())) {
        groups.push({ reason: "Ähnliche Pfade (Bindestrich-Varianten)", urls: unique.sort() });
      }
    }
  }

  return groups.slice(0, 20);
}

function renderFlatList(urls) {
  return urls
    .map(toDisplayPath)
    .sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  log(`Start-URL: ${START_URL}`);
  log(`Domain: ${hostname}`);
  log("");

  log("1/3 Sitemap prüfen …");
  const sitemapResult = await collectFromSitemaps();
  log(`   Sitemaps gelesen: ${sitemapResult.visitedSitemaps.length}`);
  log(`   URLs aus Sitemap: ${sitemapResult.urls.size}`);
  sitemapResult.visitedSitemaps.forEach((s) => log(`   - ${s}`));

  const useCrawl = sitemapResult.urls.size === 0;
  let crawlResult = { urls: new Set(), htmlPages: [], crawledCount: 0, failures: [] };

  log("");
  if (useCrawl) {
    log("2/3 Keine Sitemap-URLs – vollständiger Crawl ab Start-URL …");
    crawlResult = await crawlSite([normalizeUrl(START_URL)].filter(Boolean), { fullCrawl: true });
  } else {
    log("2/3 Start-URL crawlen (Ergänzung zur Sitemap) …");
    crawlResult = await crawlSite([...sitemapResult.urls], { fullCrawl: false });
  }
  log(`   Gecrawlte Seiten: ${crawlResult.crawledCount}`);
  log(`   HTML-Seiten: ${crawlResult.htmlPages.length}`);
  if (crawlResult.failures.length > 0) {
    log(`   Fehler: ${crawlResult.failures.length}`);
  }

  const allUrls = new Set([...sitemapResult.urls, ...crawlResult.urls]);
  const sortedUrls = [...allUrls].sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));
  const flatPaths = renderFlatList(sortedUrls);
  const tree = buildTree(sortedUrls);
  const sections = collectMainSections(sortedUrls);
  const similar = findSimilarUrls(sortedUrls);
  const onlyInCrawl = [...new Set(
    [...crawlResult.urls]
      .filter((u) => !sitemapResult.urls.has(u))
      .map((u) => toDisplayPath(u))
  )];
  const onlyInSitemap = [...new Set(
    [...sitemapResult.urls]
      .filter((u) => !crawlResult.urls.has(u))
      .map((u) => toDisplayPath(u))
  )];

  const payload = {
    generatedAt: new Date().toISOString(),
    startUrl: START_URL,
    domain: hostname,
    totalPages: sortedUrls.length,
    sources: {
      sitemapUrls: sitemapResult.urls.size,
      crawlDiscoveredUrls: crawlResult.urls.size,
      sitemaps: sitemapResult.visitedSitemaps,
    },
    mainSections: sections,
    similarOrDuplicateCandidates: similar,
    onlyInCrawl: onlyInCrawl.sort(),
    onlyInSitemapNotReachedByCrawl: onlyInSitemap.sort(),
    pages: sortedUrls.map((url) => ({
      url,
      path: toDisplayPath(url),
      depth: new URL(url).pathname.split("/").filter(Boolean).length,
    })),
    tree: serializeTree(tree),
  };

  const txt = [
    `# Seitenstruktur ${hostname}`,
    `# Generiert: ${payload.generatedAt}`,
    `# Seiten gesamt: ${sortedUrls.length}`,
    "",
    "## Flache Liste (URL-Pfade)",
    ...flatPaths.map((p) => `- ${p}`),
    "",
    "## Hierarchie (URL-Pfade)",
    ...treeToLines(tree),
  ].join("\n");

  const csvHeader = "url,path,depth\n";
  const csvBody = payload.pages
    .map((p) => `"${p.url.replace(/"/g, '""')}","${p.path.replace(/"/g, '""')}",${p.depth}`)
    .join("\n");

  const summary = [
    `# Zusammenfassung – Seitenstruktur ${hostname}`,
    "",
    `Anzahl gefundener Seiten: ${sortedUrls.length}`,
    `Quelle Sitemap: ${sitemapResult.urls.size} URLs`,
    `Quelle Crawl: ${crawlResult.urls.size} URLs (${crawlResult.crawledCount} abgerufen)`,
    "",
    "## Wichtigste Hauptbereiche",
    ...sections.slice(0, 15).map((s) => `- /${s.name === "(startseite)" ? "" : `${s.name}/`} → ${s.count} Seite(n)`),
    "",
    "## Nur in Sitemap (nicht per Crawl erreicht)",
    ...(onlyInSitemap.length ? onlyInSitemap.slice(0, 20).map((p) => `- ${p}`) : ["- (keine)"]),
    ...(onlyInSitemap.length > 20 ? [`- … +${onlyInSitemap.length - 20} weitere`] : []),
    "",
    "## Nur per Crawl (nicht in Sitemap)",
    ...(onlyInCrawl.length ? onlyInCrawl.slice(0, 20).map((p) => `- ${p}`) : ["- (keine)"]),
    ...(onlyInCrawl.length > 20 ? [`- … +${onlyInCrawl.length - 20} weitere`] : []),
    "",
    "## Mögliche doppelte oder ähnliche URLs",
    ...(similar.length
      ? similar.flatMap((g) => [`- ${g.reason}:`, ...g.urls.map((u) => `  - ${toDisplayPath(u)}`)])
      : ["- (keine Auffälligkeiten)"]),
  ].join("\n");

  fs.writeFileSync(path.join(OUT_DIR, "seitenstruktur.txt"), txt, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "seitenstruktur.csv"), csvHeader + csvBody, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "seitenstruktur.json"), JSON.stringify(payload, null, 2), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "seitenstruktur-zusammenfassung.txt"), summary, "utf8");

  log("");
  log("3/3 Ergebnisse gespeichert:");
  log(`   ${path.join(OUT_DIR, "seitenstruktur.txt")}`);
  log(`   ${path.join(OUT_DIR, "seitenstruktur.csv")}`);
  log(`   ${path.join(OUT_DIR, "seitenstruktur.json")}`);
  log(`   ${path.join(OUT_DIR, "seitenstruktur-zusammenfassung.txt")}`);
  log("");
  log(summary);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
