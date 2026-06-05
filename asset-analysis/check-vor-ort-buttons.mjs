import fs from "fs";

const root = ".";
const re = /page-reference-city|page-reference-region|page-karlsruhe-reference/;
const files = fs.readdirSync(root).filter((f) => f.endsWith(".html"));

const missing = [];
const hasVorOrt = [];

for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  if (!re.test(c)) continue;
  const ov = c.match(/data-section="overview"[\s\S]*?<\/section>/);
  if (!ov) continue;
  const isVorOrt = /VOR ORT|VOR&nbsp;ORT/i.test(ov[0]);
  if (!isVorOrt) continue;
  hasVorOrt.push(f);
  const copy = ov[0].match(
    /<article class="section-copy (?:cleanroom-overview__copy|bernau-overview__copy|brandenburg-overview__copy)"[\s\S]*?<\/article>/
  );
  if (!copy) {
    missing.push({ f, reason: "no copy article" });
    continue;
  }
  if (!/Angebot anfordern/.test(copy[0])) {
    missing.push({ f, reason: "no button in copy" });
  }
}

console.log("VOR ORT pages:", hasVorOrt.length);
console.log("Missing button:", missing.length);
for (const m of missing) console.log(" ", m.f, m.reason);
