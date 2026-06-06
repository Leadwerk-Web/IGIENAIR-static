#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(pluginDir, "..");
const manifestFile = path.join(pluginDir, "manifest/mapping.json");
const sourceDir = path.join(pluginDir, "source_assets");
const expectedPageCount = 176;
const errors = [];

const manifest = JSON.parse(await fs.readFile(manifestFile, "utf8"));
const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
const keys = new Set();
const files = new Set();

if (pages.length !== expectedPageCount) {
  errors.push(`Expected ${expectedPageCount} pages, found ${pages.length}.`);
}

for (const page of pages) {
  if (!page.source_key || keys.has(page.source_key)) {
    errors.push(`Duplicate or missing source key: ${page.source_key || "(empty)"}`);
  }
  keys.add(page.source_key);

  if (!page.source_file || files.has(page.source_file)) {
    errors.push(`Duplicate or missing source file: ${page.source_file || "(empty)"}`);
  }
  files.add(page.source_file);

  if (page.parent_source_key && !pages.some((item) => item.source_key === page.parent_source_key)) {
    errors.push(`${page.source_key} has missing parent ${page.parent_source_key}.`);
  }

  const htmlFile = path.join(sourceDir, "pages", page.source_file || "");
  try {
    const html = await fs.readFile(htmlFile, "utf8");
    if (!/<main\b/i.test(html)) {
      errors.push(`${page.source_file} has no <main> element.`);
    }
  } catch {
    errors.push(`Missing packaged HTML: ${page.source_file}`);
  }

  for (const dependency of page.dependencies || []) {
    try {
      await fs.access(path.join(sourceDir, dependency));
    } catch {
      errors.push(`${page.source_file} references missing asset ${dependency}.`);
    }
  }
}

const prohibited = [
  ["_acm-base.css", path.join(rootDir, "_acm-base.css")],
  ["_acm-temp.html", path.join(rootDir, "_acm-temp.html")],
  ["duplicated fields plugin", path.join(rootDir, "glossar/leadwerk-fields")],
  ["duplicated importer plugin", path.join(rootDir, "glossar/leadwerk_importer")],
  ["duplicated translation plugin", path.join(rootDir, "glossar/leadwerk-wpml-clone")],
  ["duplicated theme", path.join(rootDir, "glossar/leadwerk_theme")],
];

for (const [label, file] of prohibited) {
  try {
    await fs.access(file);
    errors.push(`Prohibited distribution artifact remains: ${label}.`);
  } catch {
    // Expected.
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${pages.length} IGIENAIR pages, ${keys.size} source keys, all parents and all declared assets.`,
  );
}
