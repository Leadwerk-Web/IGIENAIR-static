import fs from "fs";

const html = await fetch("https://igienair.de/downloads/").then((r) => r.text());
const links = [...html.matchAll(/href="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((h) => /pdf|download|wp-content|brosch/i.test(h));
console.log(links.join("\n") || "no matches");
const blocks = [...html.matchAll(/<h[34][^>]*>([^<]+)<\/h[34]>/gi)].map((m) => m[1]);
console.log("\nHeadings:", blocks.join(" | "));
