#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const pluginDir = path.resolve(toolDir, "..");
const rootDir = path.resolve(pluginDir, "..");
const sourceDir = path.join(pluginDir, "source_assets");
const pagesDir = path.join(sourceDir, "pages");
const manifestDir = path.join(pluginDir, "manifest");
const excludedRoots = new Set([
  ".git",
  ".playwright-mcp",
  "asset-analysis",
  "Bildmaterial_final",
  "assets",
  "glossar/leadwerk-fields",
  "glossar/leadwerk-wpml-clone",
  "glossar/leadwerk_importer",
  "glossar/leadwerk_theme",
  "leadwerk-fields",
  "leadwerk-wpml-clone",
  "leadwerk_importer",
  "leadwerk_theme",
]);

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const normalizeText = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const decodeEntities = (value = "") =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

async function walkHtml(directory, relative = "") {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const childRelative = relative
      ? `${relative}/${entry.name}`
      : entry.name;
    const normalized = childRelative.replaceAll("\\", "/");

    if (
      [...excludedRoots].some(
        (excluded) =>
          normalized === excluded || normalized.startsWith(`${excluded}/`),
      )
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(
        ...(await walkHtml(path.join(directory, entry.name), childRelative)),
      );
    } else if (
      entry.name.toLowerCase().endsWith(".html") &&
      !entry.name.startsWith("_acm")
    ) {
      files.push(normalized);
    }
  }
  return files;
}

function pagePathFromFile(file) {
  return file === "index.html" ? "" : file.replace(/\/index\.html$/i, "");
}

function sourceKeyFromPath(pagePath) {
  return pagePath
    ? `igienair-${pagePath.replaceAll("/", "--")}`
    : "igienair-home";
}

function getMatch(html, regex) {
  return decodeEntities((html.match(regex) || [])[1] || "").trim();
}

function getDependencies(html, sourceFile) {
  const dependencies = new Set();
  const sourceDirectory = path.posix.dirname(sourceFile);
  const expression =
    /(?:href|src|poster)\s*=\s*["']([^"'#]+)["']|url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  let match;

  while ((match = expression.exec(html))) {
    const raw = decodeEntities(match[1] || match[2] || "").split(/[?#]/)[0];
    if (
      !raw ||
      /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(raw) ||
      raw.toLowerCase().endsWith(".html")
    ) {
      continue;
    }

    const resolved = path.posix
      .normalize(path.posix.join(sourceDirectory, raw))
      .replace(/^(\.\.\/)+/, "");
    if (resolved && !resolved.startsWith(".")) {
      dependencies.add(resolved);
    }
  }

  const dataAssetExpression =
    /data-cert-(?:img|pdf)\s*=\s*["']([^"']+)["']/gi;
  while ((match = dataAssetExpression.exec(html))) {
    const raw = decodeEntities(match[1] || "").split(/[?#]/)[0];
    if (raw) {
      dependencies.add(path.posix.normalize(raw).replace(/^\/+/, ""));
    }
  }

  return [...dependencies].sort();
}

async function copyDirectory(source, destination) {
  await fs.cp(source, destination, {
    recursive: true,
    force: true,
    preserveTimestamps: true,
  });
}

async function removeFinderMetadata(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeFinderMetadata(file);
    } else if (entry.name === ".DS_Store") {
      await fs.rm(file, { force: true });
    }
  }
}

await fs.rm(sourceDir, { recursive: true, force: true });
await fs.mkdir(pagesDir, { recursive: true });
await fs.mkdir(manifestDir, { recursive: true });

const htmlFiles = (await walkHtml(rootDir)).sort();
const pages = [];

for (const sourceFile of htmlFiles) {
  const absoluteSource = path.join(rootDir, sourceFile);
  const html = await fs.readFile(absoluteSource, "utf8");
  const pagePath = pagePathFromFile(sourceFile);
  const parentPath = pagePath.includes("/")
    ? pagePath.slice(0, pagePath.lastIndexOf("/"))
    : "";
  const slug = pagePath ? pagePath.split("/").at(-1) : "home";
  const bodyClass = getMatch(html, /<body[^>]*class=["']([^"']*)/i);
  let mainHtml = (html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i) || [""])[0];
  let normalizedMain = false;
  if (!mainHtml) {
    const bodyInner = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || "";
    const withoutHeader = bodyInner.replace(/^[\s\S]*?<\/header>/i, "");
    const withoutFooter = withoutHeader.replace(/<footer\b[\s\S]*$/i, "");
    if (withoutFooter.trim()) {
      mainHtml = `<main>${withoutFooter.trim()}</main>`;
      normalizedMain = true;
    }
  }
  const documentTitle = normalizeText(
    getMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
  );
  const headingTitle = normalizeText(
    getMatch(mainHtml, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i),
  );
  const title = headingTitle || documentTitle;
  const description = getMatch(
    html,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i,
  );
  const canonical = getMatch(
    html,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i,
  );
  const robots = getMatch(
    html,
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)/i,
  );

  if (!mainHtml) {
    throw new Error(`Missing <main> element: ${sourceFile}`);
  }

  const destination = path.join(pagesDir, sourceFile);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const packagedHtml = normalizedMain
    ? html.replace(
        /<body\b([^>]*)>[\s\S]*?<\/body>/i,
        `<body$1>${mainHtml}</body>`,
      )
    : html;
  await fs.writeFile(destination, packagedHtml);

  pages.push({
    source_key: sourceKeyFromPath(pagePath),
    source_file: sourceFile,
    path: pagePath,
    slug,
    parent_source_key: pagePath.includes("/")
      ? sourceKeyFromPath(parentPath)
      : "",
    title,
    document_title: documentTitle,
    meta_description: description,
    canonical,
    robots,
    body_class: bodyClass,
    checksum: sha256(html),
    main_checksum: sha256(mainHtml),
    normalized_main: normalizedMain,
    dependencies: getDependencies(html, sourceFile),
    is_front_page: sourceFile === "index.html",
    status: "publish",
    language: "de",
  });
}

await fs.copyFile(path.join(rootDir, "styles.css"), path.join(sourceDir, "styles.css"));
await fs.copyFile(path.join(rootDir, "script.js"), path.join(sourceDir, "script.js"));
await copyDirectory(
  path.join(rootDir, "Bildmaterial_final"),
  path.join(sourceDir, "Bildmaterial_final"),
);
await copyDirectory(path.join(rootDir, "assets"), path.join(sourceDir, "assets"));
await removeFinderMetadata(sourceDir);

const manifest = {
  version: 1,
  project: "IGIENAIR",
  generated_at: new Date().toISOString(),
  source_root: "source_assets/pages",
  default_language: "de",
  page_count: pages.length,
  pages,
};

await fs.writeFile(
  path.join(manifestDir, "mapping.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await fs.writeFile(
  path.join(manifestDir, "import-manifest.json"),
  `${JSON.stringify(
    {
      version: 1,
      project: "IGIENAIR",
      page_count: pages.length,
      canonical_manifest: "mapping.json",
      activation_order: [
        "leadwerk-fields",
        "leadwerk-wpml-clone",
        "leadwerk_theme",
        "leadwerk_importer",
      ],
    },
    null,
    2,
  )}\n`,
);
await fs.writeFile(
  path.join(manifestDir, "translation-seeds.json"),
  `${JSON.stringify({ default_language: "de", translations: [] }, null, 2)}\n`,
);

console.log(`Built IGIENAIR source package with ${pages.length} pages.`);
