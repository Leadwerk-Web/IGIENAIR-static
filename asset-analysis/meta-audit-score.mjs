import fs from "fs";
import path from "path";

const raw = JSON.parse(
  fs.readFileSync("asset-analysis/output/meta-audit-raw.json", "utf8")
);

const titleDup = new Map(raw.dupTitles.map(([t, urls]) => [t, urls]));
const descDup = new Map(raw.dupDescs.map(([d, urls]) => [d, urls]));

function cityFromUrl(url) {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function regionFromUrl(url) {
  const parts = url.split("/").filter(Boolean);
  if (parts[0] === "kunden" && parts[1] === "referenzen") return parts[2] || "";
  return "";
}

function scorePage(p) {
  const issues = [];
  let titleScore = "Gut";
  let descScore = p.desc ? "Gut" : "Kritisch";
  let priority = "Niedrig";

  if (!p.title) {
    titleScore = "Kritisch";
    issues.push("Titel fehlt");
    priority = "Hoch";
  } else {
    if (titleDup.has(p.title) && titleDup.get(p.title).length > 1) {
      titleScore = "Kritisch";
      issues.push(`Doppelter Titel (${titleDup.get(p.title).length}×)`);
      priority = "Hoch";
    }
    if (p.titleLen > 65) {
      titleScore = titleScore === "Gut" ? "Optimierungsbedarf" : titleScore;
      issues.push(`Titel zu lang (${p.titleLen} Zeichen)`);
      if (priority === "Niedrig") priority = "Mittel";
    }
    if (p.titleLen < 30) {
      titleScore = titleScore === "Gut" ? "Optimierungsbedarf" : titleScore;
      issues.push(`Titel zu kurz (${p.titleLen} Zeichen)`);
      if (priority === "Niedrig") priority = "Mittel";
    }
    if (/^[\w\s&-]+ - Igienair GmbH$/.test(p.title) && p.titleLen < 35) {
      titleScore = "Optimierungsbedarf";
      issues.push("Generischer Marken-Titel ohne Keyword-Fokus");
      if (priority === "Niedrig") priority = "Mittel";
    }
    if (/ᐅ|✔/.test(p.title)) {
      issues.push("Sonderzeichen im Titel (Snippet-Risiko)");
      if (titleScore === "Gut") titleScore = "Optimierungsbedarf";
    }
  }

  if (!p.desc) {
    descScore = "Kritisch";
    issues.push("Description fehlt");
    priority = "Hoch";
  } else {
    for (const [d, urls] of descDup) {
      if (d === p.desc && urls.length > 1) {
        descScore = urls.length >= 5 ? "Kritisch" : "Optimierungsbedarf";
        issues.push(`Doppelte Description (${urls.length}×)`);
        priority = "Hoch";
        break;
      }
    }
    if (p.descLen > 165) {
      if (descScore === "Gut") descScore = "Optimierungsbedarf";
      issues.push(`Description zu lang (${p.descLen} Zeichen)`);
      if (priority === "Niedrig") priority = "Mittel";
    }
    if (p.descLen < 90) {
      if (descScore === "Gut") descScore = "Optimierungsbedarf";
      issues.push(`Description zu kurz (${p.descLen} Zeichen)`);
    }
    if (/✔|ᐅ/.test(p.desc)) {
      issues.push("Checkmark-/Pfeil-Spam in Description");
      if (descScore === "Gut") descScore = "Optimierungsbedarf";
    }
    if (p.desc.startsWith("Gefährdungsbeurteilungen") && p.descLen > 200) {
      descScore = "Kritisch";
      issues.push("Description wirkt abgeschnitten / aus Fließtext");
      priority = "Hoch";
    }
  }

  return { titleScore, descScore, priority, issues };
}

function suggest(p) {
  const city = cityFromUrl(p.url);
  const region = regionFromUrl(p.url);
  const cityLabel = city.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  let newTitle = null;
  let newDesc = null;

  if (p.url === "/") {
    newTitle = "Technische Hygiene & Raumlufthygiene | Igienair";
    newDesc =
      "Inspektion, Reinigung und Gutachten für RLT-Anlagen nach VDI 6022. Deutschlandweit, dokumentiert und normkonform – jetzt unverbindlich anfragen.";
  } else if (p.url === "/unternehmen/qualitaet/") {
    newTitle = "Qualitätsmanagement & Normen | Igienair";
    newDesc =
      "ISO-zertifizierte Prozesse, dokumentierte Hygienereinigung und klare Qualitätsstandards für RLT-Anlagen. Erfahren Sie, wie Igienair Qualität sichert.";
  } else if (p.url.startsWith("/kunden/referenzen/") && city && region) {
    newTitle = `RLT-Reinigung & Hygieneinspektion in ${cityLabel} | Igienair`;
    newDesc = `Hygieneinspektion, Reinigung und Gutachten für RLT-Anlagen in ${cityLabel} und Umgebung. Igienair – zertifizierte Technische Hygiene vor Ort. Jetzt Beratung anfragen.`;
  } else if (p.url === "/anlagen/") {
    newTitle = "Anlagen & RLT-Systeme | Igienair Leistungen";
    newDesc =
      "Reinigung, Inspektion und Wartung für Lüftungs-, Klima- und Spezialanlagen. Übersicht aller Igienair-Leistungen nach VDI und DIN – kompetent und dokumentiert.";
  } else if (p.url === "/kontakt/") {
    newTitle = "Standorte & Kontakt | Igienair Deutschland";
    newDesc =
      "8 Standorte in Deutschland: persönliche Ansprechpartner für technische Hygiene und Raumlufthygiene. Kontakt aufnehmen oder Angebot anfordern.";
  }

  return { newTitle, newDesc };
}

const scored = raw.pages.map((p) => ({
  ...p,
  ...scorePage(p),
  ...suggest(p),
}));

const summary = {
  gut: scored.filter((p) => p.titleScore === "Gut" && p.descScore === "Gut").length,
  hoch: scored.filter((p) => p.priority === "Hoch").length,
  mittel: scored.filter((p) => p.priority === "Mittel").length,
  niedrig: scored.filter((p) => p.priority === "Niedrig").length,
};

scored.sort((a, b) => {
  const pr = { Hoch: 0, Mittel: 1, Niedrig: 2 };
  return pr[a.priority] - pr[b.priority] || a.url.localeCompare(b.url);
});

fs.writeFileSync(
  "asset-analysis/output/meta-audit-scored.json",
  JSON.stringify({ summary, scored }, null, 2)
);

console.log(JSON.stringify(summary, null, 2));
console.log("Hoch:", scored.filter((p) => p.priority === "Hoch").length);
