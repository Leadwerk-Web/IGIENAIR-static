#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const themeDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(themeDir, "..");
const html = await fs.readFile(path.join(rootDir, "index.html"), "utf8");
const header = (html.match(/<header\b[\s\S]*?<\/header>/i) || [])[0];
const footer = (html.match(/<footer\b[\s\S]*?<\/footer>/i) || [])[0];

if (!header || !footer) {
  throw new Error("Canonical IGIENAIR header/footer could not be extracted.");
}

await fs.rm(path.join(themeDir, "assets"), { recursive: true, force: true });
await fs.mkdir(path.join(themeDir, "assets/css"), { recursive: true });
await fs.mkdir(path.join(themeDir, "assets/js"), { recursive: true });
await fs.mkdir(path.join(themeDir, "assets/images"), { recursive: true });
await fs.mkdir(path.join(themeDir, "assets/fonts"), { recursive: true });
await fs.mkdir(path.join(themeDir, "partials"), { recursive: true });

const css = (await fs.readFile(path.join(rootDir, "styles.css"), "utf8"))
  .replaceAll('url("assets/fonts/', 'url("../fonts/')
  .replaceAll("url('assets/fonts/", "url('../fonts/")
  .replaceAll('url("./Bildmaterial_final/', 'url("../images/Bildmaterial_final/')
  .replaceAll("url('./Bildmaterial_final/", "url('../images/Bildmaterial_final/");
await fs.writeFile(path.join(themeDir, "assets/css/site.css"), css);
let javascript = await fs.readFile(path.join(rootDir, "script.js"), "utf8");
const resolverEnd = javascript.indexOf("\n\nconst body");
if (javascript.startsWith("function resolveSitePath") && resolverEnd > 0) {
  javascript =
    `function resolveSitePath(urlPath) {\n  return urlPath;\n}` +
    javascript.slice(resolverEnd);
}
await fs.writeFile(path.join(themeDir, "assets/js/site.js"), javascript);
await fs.copyFile(
  path.join(themeDir, "admin-yoast-analysis.js"),
  path.join(themeDir, "assets/js/admin-yoast-analysis.js"),
);
await fs.cp(
  path.join(rootDir, "Bildmaterial_final/shared"),
  path.join(themeDir, "assets/images/Bildmaterial_final/shared"),
  { recursive: true },
);
await fs.rm(path.join(themeDir, "assets/images/Bildmaterial_final/shared/.DS_Store"), {
  force: true,
});
await fs.rm(path.join(themeDir, "assets/images/logos/.DS_Store"), {
  force: true,
});
await fs.rm(path.join(themeDir, "assets/fonts/.DS_Store"), { force: true });
await fs.cp(
  path.join(rootDir, "Bildmaterial_final/logos"),
  path.join(themeDir, "assets/images/logos"),
  { recursive: true },
);
await fs.copyFile(
  path.join(rootDir, "Bildmaterial_final/icons/germany-badge.webp"),
  path.join(themeDir, "assets/images/germany-badge.webp"),
);
await fs.cp(
  path.join(rootDir, "assets/fonts"),
  path.join(themeDir, "assets/fonts"),
  { recursive: true },
);
header = header.replace(
  /<button type="button" class="nav-link" data-inert>Extranet<\/button>/g,
  '<a class="nav-link" href="https://kunde.igienair.de/login">Extranet</a>',
);
header = header.replace(
  /<button type="button" class="mobile-link" data-inert>Extranet<\/button>/g,
  '<a class="mobile-link" href="https://kunde.igienair.de/login">Extranet</a>',
);

await fs.writeFile(path.join(themeDir, "partials/site-header.html"), `${header}\n`);
await fs.writeFile(path.join(themeDir, "partials/site-footer.html"), `${footer}\n`);

console.log("Built IGIENAIR theme assets and canonical chrome partials.");
