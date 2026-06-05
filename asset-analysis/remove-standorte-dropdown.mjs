import { readFileSync, writeFileSync, readdirSync } from "fs";

const files = readdirSync(".").filter((name) => name.endsWith(".html"));
let updated = 0;

const desktopPattern =
  /(<a class="nav-trigger" href="standorte\.html"(?:\s[^>]*)?>Standorte<\/a>)\s*<div class="nav-dropdown">\s*(?:<button type="button" class="nav-link" data-inert>[^<]*<\/button>\s*)+<\/div>/gi;

const mobilePattern =
  /(<a class="mobile-menu__group-title" href="standorte\.html"(?:\s[^>]*)?>Standorte<\/a>)\s*(?:<button type="button" class="mobile-link" data-inert>[^<]*<\/button>\s*)+/gi;

for (const file of files) {
  let html = readFileSync(file, "utf8");
  const original = html;

  html = html.replace(desktopPattern, "$1");
  html = html.replace(mobilePattern, "$1");

  if (html !== original) {
    writeFileSync(file, html, "utf8");
    updated += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`Done. Updated ${updated} files.`);
