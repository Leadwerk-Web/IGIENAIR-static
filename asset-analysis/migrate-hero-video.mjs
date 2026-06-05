import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const HERO_SOURCES = [
  path.join(root, "assets/video/hero.mp4"),
  path.join(root, "assets/video/hero-live.mp4"),
];

const HERO_DEST = path.join(root, "Bildmaterial_final/startseite/startseite-hero.mp4");
const HERO_BACKUP = path.join(root, "assets/video/hero.mp4");
const INDEX_HTML = path.join(root, "index.html");
const GIT_COMMIT = "83a7f9f";

function restoreFromGit(targetPath, gitPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const buffer = execSync(`git show ${GIT_COMMIT}:${gitPath}`, {
    cwd: root,
    maxBuffer: 1024 * 1024 * 128,
  });
  if (buffer.length < 12 || buffer.slice(4, 8).toString("ascii") !== "ftyp") {
    throw new Error(`Ungültige Video-Datei aus Git: ${gitPath}`);
  }
  fs.writeFileSync(targetPath, buffer);
  return targetPath;
}

function copyBinary(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function findHeroSource() {
  for (const candidate of HERO_SOURCES) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
      return candidate;
    }
  }
  return null;
}

function ensureHeroVideo() {
  let source = findHeroSource();

  if (!source) {
    console.log("Hero-Video nicht gefunden – stelle aus Git wieder her …");
    restoreFromGit(HERO_BACKUP, "assets/video/hero.mp4");
    source = HERO_BACKUP;
  }

  fs.mkdirSync(path.dirname(HERO_DEST), { recursive: true });

  const destHeader = fs.existsSync(HERO_DEST) ? fs.readFileSync(HERO_DEST).slice(4, 8).toString("ascii") : "";
  if (destHeader !== "ftyp") {
    copyBinary(source, HERO_DEST);
    console.log(`Kopiert: ${path.relative(root, source)} → ${path.relative(root, HERO_DEST)}`);
  } else {
    console.log(`Vorhanden: ${path.relative(root, HERO_DEST)}`);
  }

  return HERO_DEST;
}

function updateIndexHtml() {
  const videoPath = "./Bildmaterial_final/startseite/startseite-hero.mp4";
  let html = fs.readFileSync(INDEX_HTML, "utf8");
  const updated = html.replace(
    /<source\s+src="[^"]*"\s+type="video\/mp4">/,
    `<source src="${videoPath}" type="video/mp4">`
  );

  if (updated === html) {
    if (html.includes(videoPath)) {
      console.log("index.html bereits korrekt verlinkt.");
      return false;
    }
    throw new Error("Hero-Video-Quelle in index.html nicht gefunden.");
  }

  fs.writeFileSync(INDEX_HTML, updated, "utf8");
  console.log("index.html aktualisiert.");
  return true;
}

const dest = ensureHeroVideo();
updateIndexHtml();

console.log(`Hero-Video bereit (${(fs.statSync(dest).size / 1024 / 1024).toFixed(1)} MB)`);
