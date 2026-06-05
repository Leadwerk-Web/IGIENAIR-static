import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
      walk(fullPath, files);
    } else if (entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

const eyebrowH3Pattern =
  /(<p class="eyebrow[^"]*">[\s\S]*?<\/p>\s*)<h3([^>]*)>([\s\S]*?)<\/h3>(\s*<div class="gradient-line)/g;

const files = walk(root);
const matches = [];
let changedFiles = 0;

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  html = html.replace(eyebrowH3Pattern, "$1<h2$2>$3</h2>$4");

  if (html !== before) {
    fs.writeFileSync(file, html, "utf8");
    changedFiles += 1;
  }

  let match;
  eyebrowH3Pattern.lastIndex = 0;
  const checkHtml = fs.readFileSync(file, "utf8");
  while ((match = eyebrowH3Pattern.exec(checkHtml)) !== null) {
    const line = checkHtml.slice(0, match.index).split("\n").length;
    matches.push({
      file: path.relative(root, file),
      line,
      text: match[3].replace(/<[^>]+>/g, "").slice(0, 80),
    });
  }
}

console.log(`Updated ${changedFiles} files`);
console.log(`Remaining eyebrow + h3 + gradient-line patterns: ${matches.length}`);
for (const m of matches) {
  console.log(`${m.file}:${m.line} - ${m.text}`);
}
