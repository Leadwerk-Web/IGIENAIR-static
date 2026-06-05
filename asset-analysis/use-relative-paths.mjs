import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function walkHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith(".html") && entry.name !== "_acm-temp.html") {
      files.push(path.relative(root, fullPath).replace(/\\/g, "/"));
    }
  }
  return files;
}

function toRelative(fromFile, rootPath) {
  const fromDir = path.dirname(fromFile).replace(/\\/g, "/") || ".";

  const qIdx = rootPath.indexOf("?");
  const query = qIdx >= 0 ? rootPath.slice(qIdx) : "";
  const pathAndHash = qIdx >= 0 ? rootPath.slice(0, qIdx) : rootPath;

  const hashIdx = pathAndHash.indexOf("#");
  const hash = hashIdx >= 0 ? pathAndHash.slice(hashIdx) : "";
  const pathname = hashIdx >= 0 ? pathAndHash.slice(0, hashIdx) : pathAndHash;

  let target;
  if (!pathname || pathname === "/") {
    target = "index.html";
  } else if (/^\/(assets\/|styles\.css|script\.js)/.test(pathname)) {
    target = pathname.slice(1);
  } else {
    const clean = pathname.replace(/^\/+|\/+$/g, "");
    target = `${clean}/index.html`;
  }

  let rel = path.relative(fromDir, target).replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }

  return `${rel}${hash}${query}`;
}

function replaceRootPaths(content, fromFile) {
  return content
    .replace(/href="(\/[^"]*)"/g, (_, value) => `href="${toRelative(fromFile, value)}"`)
    .replace(/href='(\/[^']*)'/g, (_, value) => `href='${toRelative(fromFile, value)}'`)
    .replace(/src="(\/[^"]*)"/g, (_, value) => `src="${toRelative(fromFile, value)}"`)
    .replace(/src='(\/[^']*)'/g, (_, value) => `src='${toRelative(fromFile, value)}'`);
}

function fixRedirectPage(content, fromFile) {
  const match = content.match(/content="0; url=([^"]+)"/);
  if (!match || !match[1].startsWith("/")) {
    return replaceRootPaths(content, fromFile);
  }

  const target = toRelative(fromFile, match[1]);
  return content
    .replace(/content="0; url=[^"]+"/, `content="0; url=${target}"`)
    .replace(/location\.replace\("[^"]+"\)/, `location.replace("${target}")`)
    .replace(/<a href="[^"]+">/, `<a href="${target}">`);
}

const htmlFiles = walkHtmlFiles(root);
let changed = 0;

for (const file of htmlFiles) {
  const fullPath = path.join(root, file);
  const original = fs.readFileSync(fullPath, "utf8");
  const content = fixRedirectPage(original, file);

  if (content !== original) {
    fs.writeFileSync(fullPath, content, "utf8");
    changed += 1;
  }
}

const stylesPath = path.join(root, "styles.css");
let styles = fs.readFileSync(stylesPath, "utf8");
const stylesBefore = styles;
styles = styles.replace(/url\("\/assets\//g, 'url("assets/');
if (styles !== stylesBefore) {
  fs.writeFileSync(stylesPath, styles, "utf8");
  console.log("styles.css: Asset-Pfade relativ gesetzt.");
}

console.log(`${changed} HTML-Dateien auf relative Pfade umgestellt.`);
