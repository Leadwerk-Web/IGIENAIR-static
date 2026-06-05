import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const imageBase = "assets/images/Genutze Bilder_LW/Referenzen/";

const referencePageRe =
  /page-reference-city|page-reference-region|page-karlsruhe-reference/;

const EXCLUDE_FILES = new Set([
  "Unternehmen-Hero.png",
  "Leistungen_hero.png",
]);

const VOR_ORT_ONLY_PATTERN = /Referenzen_Leistungen_ReinigungDesinfektion/i;

function isVorOrtOnlyImage(filePath) {
  return VOR_ORT_ONLY_PATTERN.test(path.basename(filePath));
}

function naturalSort(a, b) {
  return path.basename(a).localeCompare(path.basename(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function listImages(basePath) {
  const dir = path.join(root, basePath);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .filter((name) => !EXCLUDE_FILES.has(name))
    .filter((name) => !isVorOrtOnlyImage(name))
    .map((name) => `${basePath}${name}`)
    .sort(naturalSort);
}

function uniqueSorted(...lists) {
  return [...new Set(lists.flat())].sort(naturalSort);
}

function buildReferenzenPools() {
  const files = listImages(imageBase);
  const pools = {
    rlt: [],
    kuehlturm: [],
    kuechenabluft: [],
    reinraum: [],
    brandschutz: [],
    sanierung: [],
    general: [],
  };

  for (const file of files) {
    const name = path.basename(file);
    if (/RLT-Anlagen/i.test(name)) pools.rlt.push(file);
    else if (/Kuechenabluft/i.test(name)) pools.kuechenabluft.push(file);
    else if (/Kuehlturm/i.test(name)) pools.kuehlturm.push(file);
    else if (/Reinraum/i.test(name)) pools.reinraum.push(file);
    else if (/Brandschutz/i.test(name)) pools.brandschutz.push(file);
    else if (/Sanierung/i.test(name)) pools.sanierung.push(file);
    else pools.general.push(file);
  }

  for (const key of Object.keys(pools)) {
    pools[key].sort(naturalSort);
  }

  return pools;
}

const referenzen = buildReferenzenPools();

const categoryPools = {
  reinraum: uniqueSorted(referenzen.reinraum),
  kuechenabluft: uniqueSorted(referenzen.kuechenabluft),
  brandschutz: uniqueSorted(
    referenzen.kuechenabluft,
    referenzen.brandschutz,
    referenzen.general
  ),
  sanierung: uniqueSorted(referenzen.sanierung),
  inspektion: uniqueSorted(referenzen.rlt),
  reinigung: uniqueSorted(referenzen.rlt, referenzen.kuehlturm, referenzen.general),
  kuehlturm: uniqueSorted(referenzen.kuehlturm),
};

const relatedCategories = {
  reinraum: ["inspektion", "reinigung"],
  kuechenabluft: ["brandschutz", "reinigung"],
  brandschutz: ["kuechenabluft", "reinigung", "sanierung", "inspektion"],
  sanierung: ["kuehlturm", "inspektion", "reinigung"],
  inspektion: ["reinigung", "kuehlturm", "sanierung"],
  reinigung: ["inspektion", "kuehlturm", "sanierung"],
  kuehlturm: ["inspektion", "reinigung", "sanierung"],
};

const allPoolImages = uniqueSorted(...Object.values(categoryPools));

const globalRotators = Object.fromEntries(
  Object.keys(categoryPools).map((key) => [key, 0])
);

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&uuml;/g, "ü")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&auml;/g, "ä")
    .replace(/&Auml;/g, "Ä")
    .replace(/&szlig;/g, "ß")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function normalize(text) {
  return decodeHtml(text)
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

function matchCategory(title) {
  const t = normalize(title);

  if (
    /reinraum|op- und rein|op- raume|reinraumprufung|reinraumqualifiz|reinraumvalid|reinraumdesinfektion|en iso 14644|din en iso 14175/.test(
      t
    ) ||
    /^reinraum:?$/i.test(t)
  ) {
    return "reinraum";
  }

  if (
    /kuchenabluft|kuchenabluftreinigung|rauchabzug|grosskuchen|gewerblicher kuchen|kuchenabluftsysteme|absaug- und kuchenabluft|kuchenhaube|abluftsysteme in gewerblichen kuchen/.test(
      t
    )
  ) {
    return "kuechenabluft";
  }

  if (
    /brandschutz|brandlast|brandrisik|vdi 2052|bgr 111|abluft.*brand|brand.*abluft|brand.*sicherheit|brandrisiko|brandvorbeug|brandvorbeugemassnahmen|brandschutzmassnahmen|brandschutzvorschriften/.test(
      t
    ) ||
    /^brandschutz:?$/i.test(t)
  ) {
    return "brandschutz";
  }

  if (
    /sanierung|instandsetzung|instandhaltung|reparatur|schadensfall|wartung, pflege|wartung ihrer|instandsetzung:|sanierung:|reparatur- und sanierung|reparaturmassnahmen|instandsetzung von rlt|instandsetzung & sanierung|instandsetzung und sanierung|sanierung mangelhafter|sanierung ihrer|sanierung von luftung|sanierung & instandhaltung|sanierung und instandsetzung|im schadensfall/.test(
      t
    )
  ) {
    return "sanierung";
  }

  if (
    /^(inspektion:|reinigung:|instandsetzung:)$/i.test(t) ||
    /inspektion|gutachten|hygieneinspektion|gefahrdungsbeurteilung|bewertung|begutachtung|beurteilung|risikoanalyse|kontrolle|prufung und begutachtung|prufung von|einschatzung & bewertung|hygieneinspektion vdi|kontrollen an anlagen|einrichtung und prufung|risikoanalyse- und bewertung/.test(
      t
    )
  ) {
    return "inspektion";
  }

  if (
    /reinigung|desinfektion|luftungsreinigung|luftkanalreinigung|hygienetechnische reinigung|funktionserhaltende reinigung|desinfektion und rlt|desinfektion & luftung|wartung der rlt-anlage|professionelle hygienetechnische|hygiene nach|luftanlagen|luftungsanlagen|luftkanal|raumlufttechn|rlt-anlagen|rlt anlagen/.test(
      t
    )
  ) {
    return "reinigung";
  }

  if (/kuhlturm|kuhlturme|verdunstungskuhl|ruckkuhlwerk|kuhlsystem|kuhlanlagen/.test(t)) {
    return "kuehlturm";
  }

  return null;
}

function pickFromPool(pool, rotatorKey, used) {
  if (!pool?.length) return null;

  const start = globalRotators[rotatorKey] ?? 0;

  for (let i = 0; i < pool.length; i += 1) {
    const idx = (start + i) % pool.length;
    const img = pool[idx];
    if (used.has(img) || isVorOrtOnlyImage(img)) continue;
    globalRotators[rotatorKey] = (idx + 1) % pool.length;
    return img;
  }

  return null;
}

function pickImage(category, used) {
  let picked = pickFromPool(categoryPools[category], category, used);
  if (picked) return picked;

  for (const related of relatedCategories[category] || []) {
    picked = pickFromPool(categoryPools[related], related, used);
    if (picked) return picked;
  }

  picked = pickFromPool(allPoolImages, "fallback", used);
  if (picked) return picked;

  for (const img of allPoolImages) {
    if (!used.has(img) && !isVorOrtOnlyImage(img)) return img;
  }

  return null;
}

function getOverviewImageSrc(content) {
  const section = content.match(/data-section="overview"[\s\S]*?<\/section>/);
  if (!section) return null;
  return (
    section[0].match(/<figure class="company-media-card[^"]*">\s*<img src="([^"]+)"/)?.[1] ??
    null
  );
}

function pageContentImages(html) {
  const imgs = [];
  const overview = html.match(/data-section="overview"[\s\S]*?<\/section>/);
  if (overview) {
    const src = overview[0].match(
      /<figure class="company-media-card[^"]*">\s*<img src="([^"]+)"/
    )?.[1];
    if (src) imgs.push(src);
  }
  const services = html.match(/data-section="services"[\s\S]*?<\/section>/);
  if (services) {
    for (const m of services[0].matchAll(
      /filtertest-standard__media[\s\S]*?<img src="([^"]+)"/g
    )) {
      imgs.push(m[1]);
    }
  }
  return imgs;
}

function patchServicesSection(sectionHtml, used) {
  let result = sectionHtml;

  const rows = [
    ...sectionHtml.matchAll(/<div class="filtertest-standard__row[^"]*">([\s\S]*?)<\/div>/g),
  ];

  for (const row of rows) {
    const fullRow = row[0];
    const rowBody = row[1];
    const h3Match = rowBody.match(/<h3>([^<]+)<\/h3>/);
    const imgMatch = rowBody.match(
      /(<figure class="company-media-card filtertest-standard__media">\s*<img src=")([^"]+)("[^>]*>)/
    );
    if (!h3Match || !imgMatch) continue;

    const category = matchCategory(h3Match[1]);
    let newSrc = category ? pickImage(category, used) : imgMatch[2];

    if (newSrc && used.has(newSrc)) {
      newSrc = pickImage("inspektion", used) ?? pickImage("reinigung", used);
    }

    if (!newSrc || used.has(newSrc)) continue;

    used.add(newSrc);

    if (newSrc === imgMatch[2]) continue;

    const updatedRow = fullRow.replace(imgMatch[0], `${imgMatch[1]}${newSrc}${imgMatch[3]}`);
    result = result.replace(fullRow, updatedRow);
  }

  return result;
}

function patch(content) {
  if (!content.includes('data-section="services"')) return content;

  const used = new Set();
  const overviewImg = getOverviewImageSrc(content);
  if (overviewImg) used.add(overviewImg);

  return content.replace(
    /(<section[^>]*data-section="services"[\s\S]*?<\/section>)/,
    (section) => patchServicesSection(section, used)
  );
}

const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .map((name) => path.join(root, name))
  .filter((file) => referencePageRe.test(fs.readFileSync(file, "utf8")))
  .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

let updated = 0;
const duplicatePages = [];
const usageCount = new Map();

console.log("Bild-Pools:");
for (const [key, pool] of Object.entries(categoryPools)) {
  console.log(`  ${key}: ${pool.length} Bilder`);
}
console.log("");

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const patched = patch(original);
  if (patched !== original) {
    fs.writeFileSync(file, patched, "utf8");
    updated += 1;
    console.log("Updated:", path.basename(file));
  }

  const section = patched.match(/data-section="services"[\s\S]*?<\/section>/);
  if (!section) continue;

  const srcs = [
    ...section[0].matchAll(/filtertest-standard__media[\s\S]*?<img src="([^"]+)"/g),
  ].map((m) => m[1]);

  for (const src of srcs) {
    usageCount.set(src, (usageCount.get(src) ?? 0) + 1);
  }

  const dupes = srcs.filter((s, i) => srcs.indexOf(s) !== i);
  if (dupes.length) {
    duplicatePages.push({ file: path.basename(file), dupes: [...new Set(dupes)] });
  }

  const pageDupes = pageContentImages(patched).filter((s, i, arr) => arr.indexOf(s) !== i);
  if (pageDupes.length) {
    duplicatePages.push({
      file: path.basename(file),
      dupes: [...new Set(pageDupes)],
      scope: "overview+services",
    });
  }
}

console.log(`\nUpdated ${updated} pages.`);

if (duplicatePages.length) {
  console.log("\nPages with remaining duplicate images:");
  for (const entry of duplicatePages) {
    const scope = entry.scope ? ` [${entry.scope}]` : "";
    console.log(`${entry.file}${scope}: ${entry.dupes.join(", ")}`);
  }
} else {
  console.log("No duplicate images within services sections.");
  console.log("Keine doppelten Bilder pro Seite (Vor Ort + Leistungen).");
}

const vorOrtInServices = [];
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const section = content.match(/data-section="services"[\s\S]*?<\/section>/);
  if (!section) continue;
  const hits = [
    ...section[0].matchAll(/filtertest-standard__media[\s\S]*?<img src="([^"]+)"/g),
  ]
    .map((m) => m[1])
    .filter((src) => isVorOrtOnlyImage(src));
  if (hits.length) vorOrtInServices.push({ file: path.basename(file), hits });
}

if (vorOrtInServices.length) {
  console.log("\nWARNUNG: Vor-Ort-Bilder noch in Leistungen:");
  for (const entry of vorOrtInServices) {
    console.log(`  ${entry.file}: ${entry.hits.map((h) => path.basename(h)).join(", ")}`);
  }
} else {
  console.log("Keine Vor-Ort-exklusiven Bilder in Leistungen-Abschnitten.");
}

const sortedUsage = [...usageCount.entries()].sort((a, b) => b[1] - a[1]);
console.log("\nTop image usage across reference pages:");
for (const [src, count] of sortedUsage.slice(0, 12)) {
  console.log(`  ${count}x ${path.basename(src)}`);
}
