import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const HEADER_LABEL = "Angebot anfragen";
const headerRe =
  /(<a class="button button--header" href="angebot-anfordern\.html"(?: aria-current="page")?>)[^<]*(<\/a>)/g;

let filesChanged = 0;

for (const fileName of fs.readdirSync(ROOT).filter((name) => name.endsWith(".html"))) {
  const filePath = path.join(ROOT, fileName);
  const original = fs.readFileSync(filePath, "utf8");
  const content = original.replace(headerRe, `$1${HEADER_LABEL}$2`);

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    filesChanged += 1;
  }
}

console.log(`Header button set to "${HEADER_LABEL}" in ${filesChanged} files.`);
