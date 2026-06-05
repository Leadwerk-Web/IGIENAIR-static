import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "images");

const VIDEOS = [
  { id: "kQRmAC8W9KY", file: "video-poster-1" },
  { id: "EZiDRmqwfTQ", file: "video-poster-2" },
];

const QUALITIES = ["maxresdefault", "sddefault", "hqdefault"];

async function downloadPoster(videoId) {
  for (const quality of QUALITIES) {
    const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
    const response = await fetch(url, { method: "HEAD" });
    const length = Number(response.headers.get("content-length") || 0);
    if (response.ok && length > 1000) {
      const image = await fetch(url);
      if (!image.ok) continue;
      return Buffer.from(await image.arrayBuffer());
    }
  }
  throw new Error(`Kein Thumbnail für ${videoId}`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const video of VIDEOS) {
  const buffer = await downloadPoster(video.id);
  const target = path.join(OUT_DIR, `${video.file}.jpg`);
  fs.writeFileSync(target, buffer);
  console.log(`Gespeichert: ${target}`);
}
