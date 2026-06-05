import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../assets/images/Genutze Bilder_LW/Leistungen");

const tiles = [
  {
    slug: "inspektion-hygieneinspektion-vdi-6022",
    url: "https://igienair.de/wp-content/uploads/2018/07/header_petri_2.jpg",
  },
  {
    slug: "inspektion-gefaehrdungsbeurteilung-vdi-2047",
    url: "https://igienair.de/wp-content/uploads/2018/07/kuehlturm_2.png",
  },
  {
    slug: "inspektion-kanaluntersuchung",
    url: "https://igienair.de/wp-content/uploads/2018/07/inspektion_kanaluntersuchung.jpg",
  },
  {
    slug: "inspektion-reinraumqualifizierung",
    url: "https://igienair.de/wp-content/uploads/2020/03/filterintegritaetstest.jpg",
  },
  {
    slug: "inspektion-laborabzuege",
    url: "https://igienair.de/wp-content/uploads/2018/07/header_14175.jpg",
  },
  {
    slug: "inspektion-splitklimageraete",
    url: "https://igienair.de/wp-content/uploads/2018/07/header_splitklima.jpg",
  },
  {
    slug: "inspektion-filterintegritaetstest",
    url: "https://igienair.de/wp-content/uploads/2020/03/filterintegritaetstests.jpg",
  },
  {
    slug: "inspektion-op-raum-pruefung",
    url: "https://igienair.de/wp-content/uploads/2018/07/header_op_klima.jpg",
  },
  {
    slug: "inspektion-lecktest-schwebstofffilter",
    url: "https://igienair.de/wp-content/uploads/2020/03/Filterlecktest.jpg",
  },
];

async function verifyOrder() {
  const res = await fetch("https://igienair.de/inspektionundgutachten/");
  const html = await res.text();
  const urls = [...html.matchAll(/data-src=\"(https:\/\/igienair\.de\/wp-content\/uploads\/[^\"]+)\"/g)].map((m) => m[1]);
  console.log("Found URLs on page:", urls.length);
  urls.forEach((url, i) => console.log(`${i + 1}. ${url}`));
}

async function download() {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = [];

  for (const tile of tiles) {
    const ext = path.extname(new URL(tile.url).pathname);
    const filename = `${tile.slug}${ext}`;
    const dest = path.join(outDir, filename);
    const res = await fetch(tile.url);
    if (!res.ok) throw new Error(`Failed ${tile.url}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    manifest.push({ ...tile, filename, localPath: `assets/images/Genutze Bilder_LW/Leistungen/${filename}` });
    console.log("saved", filename);
  }

  fs.writeFileSync(path.join(__dirname, "output/inspection-tile-images.json"), JSON.stringify(manifest, null, 2));
}

await verifyOrder();
await download();
