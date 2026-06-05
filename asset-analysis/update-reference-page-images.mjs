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

function listImages(basePath, { allowVorOrtOnly = false } = {}) {
  const dir = path.join(root, basePath);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .filter((name) => !EXCLUDE_FILES.has(name))
    .filter((name) => allowVorOrtOnly || !isVorOrtOnlyImage(name))
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

const vorOrtImages = listImages(imageBase, { allowVorOrtOnly: true }).filter(isVorOrtOnlyImage);
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

const allPoolImages = uniqueSorted(...Object.values(categoryPools)).filter(
  (img) => !isVorOrtOnlyImage(img)
);

const globalRotators = Object.fromEntries(
  [...Object.keys(categoryPools), "vorOrt", "fallback"].map((key) => [key, 0])
);

let vorOrtIndex = 0;

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

function isReferenzenImage(src) {
  return src.includes("Genutze Bilder_LW/Referenzen/");
}

function isSkippedImage(src) {
  return /Logo|sector-/i.test(src);
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

function pickAnyUnused(used) {
  for (const img of allPoolImages) {
    if (!used.has(img)) return img;
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

  return pickAnyUnused(used);
}

function nextVorOrtImage(used) {
  if (!vorOrtImages.length) return null;

  for (let i = 0; i < vorOrtImages.length; i += 1) {
    const idx = (vorOrtIndex + i) % vorOrtImages.length;
    const img = vorOrtImages[idx];
    if (!used.has(img)) {
      vorOrtIndex = (idx + 1) % vorOrtImages.length;
      return img;
    }
  }

  return null;
}

function patchOverviewSection(sectionHtml, used) {
  const imgMatch = sectionHtml.match(
    /(<figure class="company-media-card[^"]*">\s*<img src=")([^"]+)("[^>]*>)/
  );
  if (!imgMatch) return sectionHtml;

  if (/VOR ORT|VOR&nbsp;ORT/i.test(sectionHtml)) {
    const newSrc = nextVorOrtImage(used);
    if (!newSrc) return sectionHtml;
    used.add(newSrc);
    if (newSrc === imgMatch[2]) return sectionHtml;
    return sectionHtml.replace(imgMatch[0], `${imgMatch[1]}${newSrc}${imgMatch[3]}`);
  }

  const current = imgMatch[2];
  if (isReferenzenImage(current)) {
    used.add(current);
    return sectionHtml;
  }

  const newSrc =
    pickImage("inspektion", used) ??
    pickImage("reinigung", used) ??
    pickAnyUnused(used);
  if (!newSrc) return sectionHtml;

  used.add(newSrc);
  return sectionHtml.replace(imgMatch[0], `${imgMatch[1]}${newSrc}${imgMatch[3]}`);
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
    let newSrc = category ? pickImage(category, used) : null;

    if (!newSrc || !isReferenzenImage(imgMatch[2])) {
      newSrc =
        (category ? pickImage(category, used) : null) ??
        pickImage("inspektion", used) ??
        pickAnyUnused(used);
    }

    if (newSrc && used.has(newSrc)) {
      newSrc = pickAnyUnused(used);
    }

    if (!newSrc) continue;

    used.add(newSrc);

    if (newSrc === imgMatch[2]) continue;

    const updatedRow = fullRow.replace(imgMatch[0], `${imgMatch[1]}${newSrc}${imgMatch[3]}`);
    result = result.replace(fullRow, updatedRow);
  }

  return result;
}

function patchRemainingMainImages(html, used) {
  return html.replace(/(<main[\s\S]*?<\/main>)/, (main) =>
    main.replace(/(<img src=")([^"]+)("[^>]*>)/g, (full, pre, src, post) => {
      if (isSkippedImage(src)) return full;
      if (isReferenzenImage(src)) {
        used.add(src);
        return full;
      }

      const newSrc = pickAnyUnused(used);
      if (!newSrc) return full;

      used.add(newSrc);
      return `${pre}${newSrc}${post}`;
    })
  );
}

function patchPage(content) {
  const used = new Set();
  let result = content;

  if (result.includes('data-section="overview"')) {
    result = result.replace(
      /(<section[^>]*data-section="overview"[\s\S]*?<\/section>)/,
      (section) => patchOverviewSection(section, used)
    );
  }

  if (result.includes('data-section="services"')) {
    result = result.replace(
      /(<section[^>]*data-section="services"[\s\S]*?<\/section>)/,
      (section) => patchServicesSection(section, used)
    );
  }

  result = patchRemainingMainImages(result, used);

  return result;
}

function pageContentImages(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? html;
  const imgs = [];

  const overview = main.match(/data-section="overview"[\s\S]*?<\/section>/);
  if (overview) {
    const src = overview[0].match(
      /<figure class="company-media-card[^"]*">\s*<img src="([^"]+)"/
    )?.[1];
    if (src) imgs.push(src);
  }

  const services = main.match(/data-section="services"[\s\S]*?<\/section>/);
  if (services) {
    for (const m of services[0].matchAll(
      /filtertest-standard__media[\s\S]*?<img src="([^"]+)"/g
    )) {
      imgs.push(m[1]);
    }
  }

  return imgs;
}

const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".html"))
  .map((name) => path.join(root, name))
  .filter((file) => referencePageRe.test(fs.readFileSync(file, "utf8")))
  .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

let updated = 0;
const duplicatePages = [];

console.log(`Vor-Ort-Pool: ${vorOrtImages.length} Bilder`);
console.log(`Referenzen-Pool gesamt: ${allPoolImages.length} Bilder\n`);

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const patched = patchPage(original);

  if (patched !== original) {
    fs.writeFileSync(file, patched, "utf8");
    updated += 1;
    console.log("Updated:", path.basename(file));
  }

  const imgs = pageContentImages(patched);
  const dupes = imgs.filter((s, i) => imgs.indexOf(s) !== i);
  if (dupes.length) {
    duplicatePages.push({
      file: path.basename(file),
      dupes: [...new Set(dupes)],
    });
  }
}

console.log(`\nUpdated ${updated} pages.`);

if (duplicatePages.length) {
  console.log("\nSeiten mit doppelten Bildern (Vor Ort + Leistungen):");
  for (const entry of duplicatePages) {
    console.log(`  ${entry.file}: ${entry.dupes.map((d) => path.basename(d)).join(", ")}`);
  }
  process.exit(1);
}

console.log("Keine doppelten Bilder pro Seite (Vor Ort + Leistungen).");

const vorOrtInServices = files.filter((file) => {
  const content = fs.readFileSync(file, "utf8");
  const section = content.match(/data-section="services"[\s\S]*?<\/section>/);
  if (!section) return false;
  return [...section[0].matchAll(/<img src="([^"]+)"/g)].some((m) => isVorOrtOnlyImage(m[1]));
});

if (vorOrtInServices.length) {
  console.log("\nWARNUNG: Vor-Ort-Bilder in Leistungen:");
  vorOrtInServices.forEach((f) => console.log(" ", path.basename(f)));
  process.exit(1);
}

const invalidSources = files.filter((file) => {
  const content = fs.readFileSync(file, "utf8");
  const main = content.match(/<main[\s\S]*?<\/main>/)?.[0] ?? content;
  return [...main.matchAll(/<img src="([^"]+)"/g)].some(
    (m) => !isReferenzenImage(m[1]) && !isSkippedImage(m[1])
  );
});

if (invalidSources.length) {
  console.log("\nWARNUNG: Bilder außerhalb Referenzen-Ordner:");
  invalidSources.forEach((f) => console.log(" ", path.basename(f)));
  process.exit(1);
}

console.log("Alle Inhaltsbilder stammen aus dem Referenzen-Ordner.");
