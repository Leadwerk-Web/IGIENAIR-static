import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const STANDORTE = [
  { label: "Baden-W&uuml;rttemberg", anchor: "standort-baden-wuerttemberg" },
  { label: "Nordbayern", anchor: "standort-nordbayern-oberasbach" },
  { label: "S&uuml;dbayern", anchor: "standort-suedbayern-eching" },
  { label: "Rhein-Main", anchor: "standort-rhein-main-niedernhausen" },
  { label: "Nordrhein-Westfalen", anchor: "standort-nordrhein-westfalen" },
  { label: "Nord", anchor: "standort-nord-winsen" },
  { label: "Bodensee", anchor: "standort-bodensee-tuttlingen" },
  { label: "Berlin", anchor: "standort-berlin" },
];

function walkHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith(".html") && !entry.name.startsWith("_acm")) {
      files.push(path.relative(root, fullPath).replace(/\\/g, "/"));
    }
  }
  return files;
}

function getKontaktHref(htmlFile) {
  const fileDir = path.dirname(htmlFile).replace(/\\/g, "/") || ".";
  if (fileDir === "kontakt") return "./index.html";
  const relDir = path.relative(fileDir, "kontakt").replace(/\\/g, "/");
  let href = `${relDir}/index.html`;
  if (!href.startsWith(".")) href = `./${href}`;
  return href;
}

function buildStandorteList(kontaktHref) {
  const items = STANDORTE.map(
    ({ label, anchor }) =>
      `          <li><a href="${kontaktHref}#${anchor}">${label}</a></li>`
  );
  return items.join("\n");
}

function updateFooter(content, htmlFile) {
  let updated = content.replace(/ <span>3<\/span>/g, "");

  const kontaktHref = getKontaktHref(htmlFile);
  const standorteList = buildStandorteList(kontaktHref);

  updated = updated.replace(
    /(<h2>STANDORTE<\/h2>\s*<ul>)[\s\S]*?(<\/ul>)/g,
    `$1\n${standorteList}\n        $2`
  );

  return updated;
}

const files = walkHtmlFiles(root);
let changed = 0;

for (const file of files) {
  const fullPath = path.join(root, file);
  const original = fs.readFileSync(fullPath, "utf8");
  if (!original.includes("site-footer")) continue;

  const updated = updateFooter(original, file);
  if (updated !== original) {
    fs.writeFileSync(fullPath, updated, "utf8");
    changed += 1;
  }
}

console.log(`Updated ${changed} HTML files`);

const remainingButtons = files.filter((file) => {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  return /STANDORTE[\s\S]{0,400}<button type="button" data-inert>/.test(content);
});

const remainingSpans = files.filter((file) =>
  fs.readFileSync(path.join(root, file), "utf8").includes("<span>3</span>")
);

console.log(`Remaining standort buttons: ${remainingButtons.length}`);
console.log(`Remaining span 3: ${remainingSpans.length}`);
