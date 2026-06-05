const html = await fetch("https://igienair.de/downloads/").then((r) => r.text());
const pdfBlocks = [...html.matchAll(/href="([^"]+\.pdf)"/gi)];
for (const m of pdfBlocks) {
  const idx = html.indexOf(m[0]);
  console.log("PDF:", m[1]);
  console.log(html.slice(Math.max(0, idx - 200), idx + 400));
  console.log("---");
}
