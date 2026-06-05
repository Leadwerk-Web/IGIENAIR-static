import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const redirects = {
  gastronomie: "kunden/gastronomie/index.html",
  gemeinden: "kunden/gemeinden/index.html",
  gesundheitswesen: "kunden/gesundheit/index.html",
  lebensmittel: "kunden/lebensmittel/index.html",
  pharma: "kunden/pharma/index.html",
  inspektionundgutachten: "leistungen/inspektionundgutachten/index.html",
  "instandsetzung-sanierung": "leistungen/instandsetzung-sanierung/index.html",
  "reinigung-desinfektion": "leistungen/reinigung-desinfektion/index.html",
};

function toRelative(fromFile, targetFile) {
  const fromDir = path.dirname(fromFile).replace(/\\/g, "/") || ".";
  let rel = path.relative(fromDir, targetFile).replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel;
}

for (const [slug, targetFile] of Object.entries(redirects)) {
  const fromFile = `${slug}/index.html`;
  const rel = toRelative(fromFile, targetFile);
  const canonical = `https://igienair.de/${targetFile.replace(/\/index\.html$/, "/")}`;
  const dir = path.join(root, slug);
  fs.mkdirSync(dir, { recursive: true });
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${rel}">
  <link rel="canonical" href="${canonical}">
  <title>Weiterleitung</title>
  <script>location.replace("${rel}");</script>
</head>
<body><p><a href="${rel}">Weiter zur Seite</a></p></body>
</html>`;
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  console.log(`Redirect: /${slug}/ → ${rel}`);
}
