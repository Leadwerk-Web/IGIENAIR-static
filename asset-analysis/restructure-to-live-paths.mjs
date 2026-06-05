import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const REFERENZEN = {
  "baden-wuerttemberg": [
    "freiburg",
    "heidelberg",
    "karlsruhe",
    "konstanz",
    "mannheim",
    "stuttgart",
    "ulm",
  ],
  bayern: ["augsburg", "ingolstadt", "munchen", "nurnberg", "regensburg"],
  berlin: [
    "bernau",
    "brandenburg",
    "brandenburg-havel",
    "cottbus",
    "eberswalde",
    "falkensee",
    "frankfurt-oder",
    "oranienburg",
    "potsdam",
  ],
  hamburg: [
    "bremen",
    "buxtehude",
    "elmshorn",
    "flensburg",
    "kiel",
    "luebeck",
    "lueneburg",
    "munster",
    "neumuenster",
    "norderstedt",
    "stade",
  ],
  hessen: ["darmstadt", "frankfurt", "giessen", "kassel", "wiesbaden"],
  nrw: ["bonn", "duesseldorf", "duisburg", "koeln", "wuppertal"],
  "region-bodensee": [
    "biberach-an-der-riss",
    "friedrichshafen",
    "memmingen",
    "ravensburg",
    "sigmaringen",
    "singen",
    "tuttlingen",
  ],
  "rheinland-pfalz": [
    "bitburg",
    "kaiserslautern",
    "koblenz",
    "ludwigshafen",
    "mainz",
    "trier",
    "wittlich",
  ],
  saarland: ["homburg", "merzig", "saarbrucken"],
};

function buildMoveMap() {
  const moves = {
    "index.html": "index.html",
  };

  const overview = [
    "unternehmen",
    "leistungen",
    "normen",
    "anlagen",
    "kunden",
    "jobs",
  ];
  for (const slug of overview) {
    moves[`${slug}.html`] = `${slug}/index.html`;
  }

  for (const slug of [
    "zertifizierungen",
    "nachhaltigkeit",
    "sicherheit",
    "qualitaet",
    "umweltschutz",
    "agb",
  ]) {
    moves[`${slug}.html`] = `unternehmen/${slug}/index.html`;
  }

  moves["glossar.html"] = "glossar/index.html";
  moves["standorte.html"] = "kontakt/index.html";
  moves["angebot-anfordern.html"] = "kontakt/angebot-anfordern/index.html";

  for (const slug of [
    "inspektionundgutachten",
    "reinigung-desinfektion",
    "instandsetzung-sanierung",
  ]) {
    moves[`${slug}.html`] = `leistungen/${slug}/index.html`;
  }

  for (const slug of [
    "vdi-6022",
    "vdi-2047",
    "vdi-2052-bgr-111",
    "din-en-15780",
    "din-en-14175",
  ]) {
    moves[`${slug}.html`] = `normen/${slug}/index.html`;
  }

  for (const slug of [
    "kuechenabluftsysteme",
    "kuehlregale",
    "kuehlsysteme",
    "kuehlturmreinigung",
    "laborabzuege",
    "lueftungsanlagenreinigung",
    "lueftungsreinigung",
    "luftkanalreinigung",
    "op-raum-pruefung",
    "prozessabluft-und-entrauchungsanlagen",
    "raumluftdesinfektion",
    "rechenzentrum",
    "reinraumqualifizierung",
    "splitklimageraete-und-umluftkuehlgeraete",
    "textilschlaeuche",
    "verdampfer-und-kondensatoren",
  ]) {
    moves[`${slug}.html`] = `anlagen/${slug}/index.html`;
  }

  moves["referenzen.html"] = "kunden/referenzen/index.html";
  moves["gastronomie.html"] = "kunden/gastronomie/index.html";
  moves["gemeinden.html"] = "kunden/gemeinden/index.html";
  moves["gesundheitswesen.html"] = "kunden/gesundheit/index.html";
  moves["lebensmittel.html"] = "kunden/lebensmittel/index.html";
  moves["pharma.html"] = "kunden/pharma/index.html";

  moves["mitarbeiter-technische-reinigung-gesucht.html"] =
    "jobs/mitarbeiter-technische-reinigung-gesucht/index.html";
  moves["teamleiter-hygienereinigung-gesucht.html"] =
    "jobs/teamleiter-hygienereinigung-gesucht/index.html";

  for (const slug of [
    "branchen",
    "industrie",
    "impressum",
    "datenschutz",
    "cookie-richtlinie-eu",
    "energetische-inspektion-geg-2020",
    "filterintegritaetstest",
    "hygieneinspektion-vdi-6022",
    "kanaluntersuchung",
    "lecktest-schwebstofffilter",
    "rlt-hygiene",
  ]) {
    moves[`${slug}.html`] = `${slug}/index.html`;
  }

  for (const [region, cities] of Object.entries(REFERENZEN)) {
    moves[`${region}.html`] = `kunden/referenzen/${region}/index.html`;
    for (const city of cities) {
      moves[`${city}.html`] =
        `kunden/referenzen/${region}/${city}/index.html`;
    }
  }

  return moves;
}

function targetToUrl(targetPath) {
  if (targetPath === "index.html") {
    return "/";
  }
  return `/${targetPath.replace(/\/index\.html$/, "/")}`;
}

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".html", ".css", ".js", ".mjs", ".json", ".md"].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const moveMap = buildMoveMap();
const htmlAtRoot = fs
  .readdirSync(root)
  .filter((f) => f.endsWith(".html") && f !== "_acm-temp.html");

const unmapped = htmlAtRoot.filter((f) => !moveMap[f]);
if (unmapped.length) {
  console.warn("Nicht zugeordnete HTML-Dateien:", unmapped.join(", "));
}

const linkReplacements = Object.entries(moveMap)
  .filter(([from]) => from !== "index.html")
  .map(([from, to]) => [from, targetToUrl(to)])
  .sort((a, b) => b[0].length - a[0].length);

linkReplacements.push(["index.html", "/"]);

function updateContent(content) {
  let updated = content;

  for (const [from, to] of linkReplacements) {
    updated = updated.split(`href="${from}"`).join(`href="${to}"`);
    updated = updated.split(`href='${from}'`).join(`href='${to}'`);

    const hashPrefix = `${from}#`;
    const hashReplacement = `${to}#`;
    updated = updated.split(`href="${hashPrefix}`).join(`href="${hashReplacement}`);
    updated = updated.split(`href='${hashPrefix}`).join(`href='${hashReplacement}`);
  }

  updated = updated.replace(/href="\/\/([^"]+)"/g, 'href="/$1"');

  updated = updated
    .replace(/href="assets\//g, 'href="/assets/')
    .replace(/href='assets\//g, "href='/assets/")
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/src='assets\//g, "src='/assets/")
    .replace(/url\("assets\//g, 'url("/assets/')
    .replace(/url\('assets\//g, "url('/assets/")
    .replace(/href="styles\.css/g, 'href="/styles.css')
    .replace(/href='styles\.css/g, "href='/styles.css")
    .replace(/src="script\.js/g, 'src="/script.js')
    .replace(/src='script\.js/g, "src='/script.js");

  return updated;
}

const files = walkFiles(root);
let changedFiles = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const updated = updateContent(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, "utf8");
    changedFiles += 1;
  }
}

console.log(`Links/Assets in ${changedFiles} Dateien aktualisiert.`);

let moved = 0;
for (const [from, to] of Object.entries(moveMap)) {
  if (from === to) {
    continue;
  }

  const fromPath = path.join(root, from);
  const toPath = path.join(root, to);

  if (!fs.existsSync(fromPath)) {
    console.warn(`Übersprungen (nicht gefunden): ${from}`);
    continue;
  }
  if (fs.existsSync(toPath)) {
    throw new Error(`Ziel existiert bereits: ${to}`);
  }

  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.renameSync(fromPath, toPath);
  console.log(`Verschoben: ${from} → ${to}`);
  moved += 1;
}

console.log(`\n${moved} Seiten verschoben. Fertig.`);
