import fs from "fs";
import path from "path";

const ROOT = path.resolve(".");
const SCORED = JSON.parse(
  fs.readFileSync("asset-analysis/output/meta-audit-scored.json", "utf8")
).scored;

const CITY_LABELS = {
  muenchen: "München",
  koeln: "Köln",
  duesseldorf: "Düsseldorf",
  nurnberg: "Nürnberg",
  giessen: "Gießen",
  saarbrucken: "Saarbrücken",
  neumuenster: "Neumünster",
  luebeck: "Lübeck",
  lueneburg: "Lüneburg",
  wuerzburg: "Würzburg",
  frankfurt: "Frankfurt am Main",
  "frankfurt-oder": "Frankfurt (Oder)",
  "brandenburg-havel": "Brandenburg an der Havel",
  "biberach-an-der-riss": "Biberach an der Riss",
  "baden-wuerttemberg": "Baden-Württemberg",
  wuppertal: "Wuppertal",
  regensburg: "Regensburg",
  friedrichshafen: "Friedrichshafen",
  tuttlingen: "Tuttlingen",
  kaiserslautern: "Kaiserslautern",
  ludwigshafen: "Ludwigshafen",
  cottbus: "Cottbus",
  oranienburg: "Oranienburg",
  falkensee: "Falkensee",
  eberswalde: "Eberswalde",
  bernau: "Bernau",
  munster: "Münster",
  buxtehude: "Buxtehude",
  elmshorn: "Elmshorn",
  norderstedt: "Norderstedt",
};

const REGION_LABELS = {
  "baden-wuerttemberg": "Baden-Württemberg",
  bayern: "Bayern",
  berlin: "Berlin und Brandenburg",
  hamburg: "Norddeutschland",
  hessen: "Hessen",
  nrw: "Nordrhein-Westfalen",
  "rheinland-pfalz": "Rheinland-Pfalz",
  saarland: "Saarland",
  "region-bodensee": "Bodensee-Region",
};

function cityLabel(slug) {
  if (!slug) return "";
  if (CITY_LABELS[slug]) return CITY_LABELS[slug];
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Ae/g, "Ä")
    .replace(/Oe/g, "Ö")
    .replace(/Ue/g, "Ü");
}

function regionLabel(slug) {
  return REGION_LABELS[slug] || cityLabel(slug);
}

function len(s) {
  return s?.length ?? 0;
}

function escapeMeta(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  return m[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&uuml;/gi, "ü")
    .replace(/&auml;/gi, "ä")
    .replace(/&ouml;/gi, "ö")
    .replace(/&szlig;/gi, "ß")
    .replace(/&amp;/gi, "&")
    .replace(/&ndash;/gi, "–")
    .replace(/\s+/g, " ")
    .trim();
}

/** @type {Record<string, { title?: string; desc?: string }>} */
const EXPLICIT = {
  "/": {
    title: "Technische Hygiene & Raumlufthygiene | Igienair",
    desc: "Inspektion, Reinigung und Gutachten für RLT-Anlagen nach VDI 6022. Deutschlandweit, dokumentiert und normkonform – jetzt unverbindlich anfragen.",
  },
  "/kontakt/": {
    title: "Standorte & Kontakt | Igienair Deutschland",
    desc: "8 Standorte in Deutschland: persönliche Ansprechpartner für technische Hygiene und Raumlufthygiene. Kontakt aufnehmen oder Angebot anfordern.",
  },
  "/kontakt/angebot-anfordern/": {
    title: "Angebot für RLT-Hygiene anfordern | Igienair",
    desc: "Unverbindliches Angebot für Inspektion, Reinigung oder Gutachten Ihrer Lüftungs- und RLT-Anlagen. Schnelle Rückmeldung durch Igienair-Experten.",
  },
  "/unternehmen/": {
    title: "Über Igienair: Technische Hygiene & Expertise",
    desc: "Familienunternehmen für Raumlufthygiene mit 8 Standorten und über 14.000 Kunden. Qualität, Sicherheit und normkonforme Lösungen für RLT-Anlagen.",
  },
  "/unternehmen/qualitaet/": {
    title: "Qualitätsmanagement für RLT-Hygiene | Igienair",
    desc: "ISO-zertifizierte Prozesse und dokumentierte Hygienestandards für RLT-Anlagen. So sichert Igienair Qualität, Transparenz und Rechtssicherheit.",
  },
  "/unternehmen/sicherheit/": {
    title: "Arbeitssicherheit bei Hygienearbeiten | Igienair",
    desc: "Sicherheitskonzepte für Reinigung und Inspektion an RLT-Anlagen: geschulte Teams, Gefährdungsbeurteilung und dokumentierte Abläufe vor Ort.",
  },
  "/unternehmen/nachhaltigkeit/": {
    title: "Nachhaltigkeit in der Raumlufthygiene | Igienair",
    desc: "Ressourcenschonende Reinigung, Energieeffizienz und umweltbewusste Verfahren bei der technischen Hygiene von Lüftungs- und RLT-Anlagen.",
  },
  "/unternehmen/umweltschutz/": {
    title: "Umweltschutz & technische Hygiene | Igienair",
    desc: "Umweltgerechte Reinigungsverfahren und sichere Entsorgung bei RLT-Projekten. Igienair verbindet Hygiene mit Verantwortung für Mensch und Umwelt.",
  },
  "/unternehmen/zertifizierungen/": {
    title: "Zertifizierungen & Qualitätssiegel | Igienair",
    desc: "ISO 9001, WHG-Fachbetrieb, FGK und weitere Nachweise: Igienairs Zertifikate für normkonforme Inspektion, Reinigung und Gutachten.",
  },
  "/unternehmen/agb/": {
    title: "Allgemeine Geschäftsbedingungen | Igienair GmbH",
    desc: "AGB der Igienair GmbH für Leistungen im Bereich technische Hygiene, Inspektion, Reinigung und Gutachten von RLT-Anlagen.",
  },
  "/leistungen/": {
    title: "Leistungen: Inspektion, Reinigung, Sanierung",
    desc: "Inspektion, Reinigung, Desinfektion, Sanierung und energetische Inspektion für RLT-Anlagen – normkonform nach VDI und DIN, deutschlandweit.",
  },
  "/leistungen/inspektionundgutachten/": {
    title: "Inspektion & Gutachten für RLT-Anlagen | Igienair",
    desc: "Hygieneinspektion, Gutachten und Gefährdungsbeurteilung für RLT-Anlagen nach VDI 6022 und VDI 2047. Dokumentiert und rechtssicher – jetzt beraten lassen.",
  },
  "/leistungen/reinigung-desinfektion/": {
    title: "Reinigung & Desinfektion RLT-Anlagen | Igienair",
    desc: "Professionelle Reinigung und Desinfektion von Lüftungs- und RLT-Anlagen nach VDI 6022, DIN EN 15780 und VDI 2047 – mit Erfolgsgarantie.",
  },
  "/leistungen/instandsetzung-sanierung/": {
    title: "Instandsetzung & Sanierung RLT-Anlagen | Igienair",
    desc: "Instandsetzung und Sanierung raumlufttechnischer Anlagen: Schadensbehebung, Hygienesicherheit und normgerechter Betrieb durch Igienair-Experten.",
  },
  "/inspektionundgutachten/": {
    title: "Hygieneinspektion & Gutachten RLT | Igienair",
    desc: "Umfassende Inspektion und Bewertung Ihrer RLT-Anlagen, Lüftungskanäle und Kühltürme. Igienair liefert klare Gutachten und Handlungsempfehlungen.",
  },
  "/reinigung-desinfektion/": {
    title: "Hygienereinigung RLT-Anlagen | Igienair",
    desc: "Reinigung und Desinfektion raumlufttechnischer Anlagen nach VDI 6022, DIN EN 15780 und VDI 2047. Normkonform, dokumentiert und zuverlässig.",
  },
  "/instandsetzung-sanierung/": {
    title: "RLT-Instandsetzung & Sanierung | Igienair",
    desc: "Sanierung und Instandsetzung von Lüftungs- und RLT-Anlagen für hygienischen, sicheren Anlagenbetrieb. Igienair – technische Hygiene aus einer Hand.",
  },
  "/normen/": {
    title: "VDI & DIN Normen für RLT-Hygiene | Igienair",
    desc: "VDI 6022, VDI 2047, DIN EN 15780 und mehr: Igienair setzt anerkannte Normen für Inspektion, Reinigung und Betrieb von RLT-Anlagen zuverlässig um.",
  },
  "/normen/din-en-14175/": {
    title: "DIN EN 14175: Laborabzüge & Digestorien | Igienair",
    desc: "Prüfung und Validierung von Laborabzügen nach DIN EN 14175. Igienair sichert Funktion, Sicherheit und normgerechten Betrieb Ihrer Abzüge.",
  },
  "/normen/din-en-15780/": {
    title: "DIN EN 15780 Luftkanalreinigung | Igienair",
    desc: "Luftkanalreinigung nach DIN EN 15780: Qualitätsstufen, Verfahren und Dokumentation für hygienische Lüftungskanäle – professionell durch Igienair.",
  },
  "/normen/vdi-2052-bgr-111/": {
    title: "VDI 2052 & BGR 111 Küchenabluft | Igienair",
    desc: "Brandschutzreinigung und Entfettung gewerblicher Küchenabluft nach VDI 2052 und BGR 111. Igienair reduziert Brandrisiken und sichert den Betrieb.",
  },
  "/anlagen/": {
    title: "RLT-Anlagen & Spezialanlagen | Igienair",
    desc: "Reinigung, Inspektion und Wartung für Lüftungs-, Klima- und Spezialanlagen. Alle Igienair-Leistungen nach VDI und DIN im Überblick.",
  },
  "/anlagen/kuehlregale/": {
    title: "Kühlregale reinigen & desinfizieren | Igienair",
    desc: "Hygienische Reinigung von Kühlregalen für Lebensmittelbetriebe: Ablagerungen entfernen, Effizienz steigern, Hygieneanforderungen erfüllen.",
  },
  "/anlagen/kuehlsysteme/": {
    title: "Kühlsysteme & Klimatechnik hygienisch warten | Igienair",
    desc: "Reinigung und Hygienewartung von Kühlsystemen und Klimatechnik. Igienair verhindert Ablagerungen, Keimbildung und Leistungsverluste.",
  },
  "/anlagen/prozessabluft-und-entrauchungsanlagen/": {
    desc: "Reinigung und Inspektion von Prozessabluft- und Entrauchungsanlagen. Igienair sorgt für sicheren Betrieb und normgerechte Dokumentation.",
  },
  "/anlagen/rechenzentrum/": {
    desc: "Hygienereinigung und Inspektion von RLT-Anlagen in Rechenzentren. Igienair schützt sensible IT-Infrastruktur durch saubere Raumluft.",
  },
  "/anlagen/verdampfer-und-kondensatoren/": {
    desc: "Reinigung von Verdampfern und Kondensatoren in Kälteanlagen. Igienair beseitigt Biofilme, steigert Effizienz und verlängert die Lebensdauer.",
  },
  "/anlagen/kuechenabluftsysteme/": {
    title: "Küchenabluftreinigung nach VDI 2052 | Igienair",
    desc: "Reinigung und Brandschutz für gewerbliche Küchenabluftsysteme nach VDI 2052. Igienair entfernt Fettablagerungen und reduziert Brandrisiken.",
  },
  "/anlagen/laborabzuege/": {
    desc: "Prüfung, Validierung und Wartung von Laborabzügen und Digestorien nach DIN EN 14175. Sicherer Betrieb durch Igienair-Spezialisten.",
  },
  "/anlagen/lueftungsanlagenreinigung/": {
    desc: "Professionelle RLT-Anlagenreinigung nach VDI 6022 und DIN EN 15780. Igienair reinigt Lüftungsgeräte, Kanäle und Komponenten normgerecht.",
  },
  "/anlagen/lueftungsreinigung/": {
    title: "Lüftungsreinigung nach VDI 6022 | Igienair",
    desc: "Professionelle Lüftungsreinigung für Büros, Gastronomie und Industrie nach VDI 6022. Zertifizierte Experten – jetzt Angebot anfordern.",
  },
  "/anlagen/luftkanalreinigung/": {
    title: "Luftkanalreinigung nach VDI 6022 | Igienair",
    desc: "Gründliche Luftkanalreinigung nach VDI 6022 und DIN EN 15780. Igienair entfernt Verunreinigungen und verbessert die Raumluftqualität nachhaltig.",
  },
  "/anlagen/op-raum-pruefung/": {
    desc: "Prüfung und Abnahme von OP-Räumen nach DIN EN 1946-4. Igienair validiert Luftführung, Druckverhältnisse und hygienische Anforderungen.",
  },
  "/anlagen/raumluftdesinfektion/": {
    desc: "Raumluftdesinfektion für RLT-Anlagen und Verdunstungskühler. Igienair reduziert Keimlasten und unterstützt hygienischen Anlagenbetrieb.",
  },
  "/anlagen/reinraumqualifizierung/": {
    desc: "Reinraumqualifizierung nach VDI 2083 und ISO 14644. Igienair klassifiziert, prüft und dokumentiert Reinräume für Ihre Branche.",
  },
  "/anlagen/textilschlaeuche/": {
    desc: "Reinigung und Desinfektion von Textilschläuchen in Lüftungssystemen. Igienair verlängert Lebensdauer und sichert hygienischen Lufttransport.",
  },
  "/anlagen/splitklimageraete-und-umluftkuehlgeraete/": {
    title: "Split- & Umluftkühlgeräte reinigen | Igienair",
    desc: "Hygienische Reinigung und Desinfektion von Split- und Umluftkühlgeräten. Normgerecht, dokumentiert – für Büros, Praxen und Gewerbe.",
  },
  "/anlagen/kuehlturmreinigung/": {
    title: "Kühlturmreinigung nach VDI 2047 | Igienair",
    desc: "Hygienereinigung von Kühltürmen und Verdunstungskühlanlagen nach VDI 2047. Legionellenschutz, Gefährdungsbeurteilung und dokumentierte Ergebnisse.",
  },
  "/branchen/": {
    title: "Branchenlösungen Raumlufthygiene | Igienair",
    desc: "Maßgeschneiderte Hygienelösungen für Gesundheitswesen, Pharma, Lebensmittel, Industrie, Gastronomie und Kommunen – normkonform und erprobt.",
  },
  "/kunden/": {
    title: "Kunden & Branchen | Igienair Referenzen",
    desc: "Über 14.000 Kunden vertrauen Igienair: Branchenlösungen und Referenzen aus Gesundheitswesen, Industrie, Pharma und öffentlichem Sektor.",
  },
  "/kunden/referenzen/": {
    title: "Referenzen & Einsatzgebiete | Igienair",
    desc: "Referenzen aus Industrie, Gesundheitswesen, Pharma und öffentlichem Sektor. Igienair ist mit 8 Standorten deutschlandweit für Sie im Einsatz.",
  },
  "/kunden/gastronomie/": {
    title: "Raumlufthygiene für Gastronomie | Igienair",
    desc: "Küchenabluft, Lüftungsreinigung und Brandschutz in der Gastronomie nach VDI 2052. Igienair sorgt für Sicherheit und normkonformen Betrieb.",
  },
  "/kunden/gesundheit/": {
    title: "Raumlufthygiene Gesundheitswesen | Igienair",
    desc: "Hygieneinspektion, Reinigung und Gutachten für RLT-Anlagen in Kliniken, Praxen und Pflegeeinrichtungen – rechtssicher und dokumentiert.",
  },
  "/kunden/gemeinden/": {
    title: "Lüftungshygene für Kommunen | Igienair",
    desc: "Inspektion und Reinigung raumlufttechnischer Anlagen in Schulen, Verwaltung und öffentlichen Gebäuden. Igienair – zuverlässig und normkonform.",
  },
  "/kunden/lebensmittel/": {
    title: "Hygiene für Lebensmittelbetriebe | Igienair",
    desc: "Hygienereinigung von Lüftungs- und Kühlanlagen in Lebensmittelbetrieben nach HACCP, IFS und GMP. Igienair sichert Produktionshygiene.",
  },
  "/kunden/pharma/": {
    title: "Raumlufthygiene Pharma & Life Science | Igienair",
    desc: "Reinraumqualifizierung, RLT-Reinigung und Validierung für Pharma und Life Science nach GMP und ISO 14644. Igienair – höchste Ansprüche.",
  },
  "/gastronomie/": {
    title: "Technische Hygiene Gastronomie | Igienair",
    desc: "Küchenabluftreinigung, Lüftungshygene und Brandschutz für Gastronomiebetriebe. Igienair schützt Gäste, Mitarbeiter und Ihren Betrieb.",
  },
  "/gesundheitswesen/": {
    title: "Technische Hygiene Gesundheitswesen | Igienair",
    desc: "RLT-Hygiene für Krankenhäuser und medizinische Einrichtungen: Inspektion, Reinigung und Gutachten nach anerkannten Hygienestandards.",
  },
  "/gemeinden/": {
    title: "Lüftungshygene öffentliche Einrichtungen | Igienair",
    desc: "Hygienische Betreuung von Lüftungsanlagen in kommunalen Gebäuden. Igienair erfüllt Inspektionspflichten und sorgt für gesunde Raumluft.",
  },
  "/lebensmittel/": {
    title: "Lüftungshygene Lebensmittelindustrie | Igienair",
    desc: "Reinigung und Inspektion von RLT-Anlagen in Lebensmittelbetrieben. Igienair unterstützt HACCP-konforme Produktionsprozesse.",
  },
  "/pharma/": {
    title: "Technische Hygiene Pharma | Igienair",
    desc: "GMP-konforme Reinigung und Qualifizierung von RLT-Anlagen und Reinräumen in der Pharmaindustrie. Igienair – validiert und dokumentiert.",
  },
  "/industrie/": {
    title: "RLT-Hygiene für Industrie & Produktion | Igienair",
    desc: "Inspektion, Reinigung und Wartung raumlufttechnischer Anlagen in Industriebetrieben. Igienair minimiert Ausfallzeiten und sichert Hygiene.",
  },
  "/rlt-hygiene/": {
    title: "RLT-Hygiene: Inspektion & Reinigung | Igienair",
    desc: "Ganzheitliche RLT-Hygiene: Inspektion, Reinigung, Desinfektion und Gutachten nach VDI 6022. Igienair – Ihr Partner für gesunde Raumluft.",
  },
  "/hygieneinspektion-vdi-6022/": {
    title: "Hygieneinspektion VDI 6022 | Igienair",
    desc: "Pflichtgemäße Hygieneinspektion nach VDI 6022 für RLT-Anlagen: dokumentiert, verständlich und rechtssicher. Jetzt Termin oder Angebot anfragen.",
  },
  "/energetische-inspektion-geg-2020/": {
    title: "Energetische Inspektion GEG 2020 | Igienair",
    desc: "Energetische Inspektion von Klimaanlagen nach GEG 2020: Pflicht erfüllen, Effizienz steigern. Zertifizierte Durchführung durch Igienair.",
  },
  "/gefaehrdungsbeurteilung-vdi-2047/": {
    title: "Gefährdungsbeurteilung VDI 2047 | Igienair",
    desc: "Gefährdungsbeurteilung nach VDI 2047-2 für Kühltürme und Verdunstungskühlanlagen. Pflicht für Betreiber – fachgerecht durch Igienair.",
  },
  "/filterintegritaetstest/": {
    title: "Filterintegritätstest für RLT-Anlagen | Igienair",
    desc: "Filterintegritätstests für HEPA- und Schwebstofffilter in RLT-Anlagen. Igienair prüft Dichtheit und dokumentiert Ergebnisse zuverlässig.",
  },
  "/lecktest-schwebstofffilter/": {
    title: "Lecktest Schwebstofffilter | Igienair",
    desc: "Lecktest für Schwebstofffilter in sensiblen RLT-Systemen. Igienair sichert maximale Filtersicherheit und normgerechte Dokumentation.",
  },
  "/kanaluntersuchung/": {
    title: "Kanaluntersuchung & TV-Inspektion | Igienair",
    desc: "Kanaluntersuchung und TV-Inspektion von Lüftungskanälen zur Schadens- und Verschmutzungsanalyse. Igienair liefert belastbare Gutachten.",
  },
  "/datenschutz/": {
    title: "Datenschutzerklärung | Igienair GmbH",
    desc: "Informationen zur Verarbeitung personenbezogener Daten bei Igienair gemäß DSGVO. Transparenz über Speicherung, Rechte und Kontakt.",
  },
  "/impressum/": {
    title: "Impressum & Anbieterkennzeichnung | Igienair",
    desc: "Impressum der Igienair GmbH: Ansprechpartner, Kontaktdaten, Registerangaben und verantwortliche Stelle gemäß TMG.",
  },
  "/cookie-richtlinie-eu/": {
    title: "Cookie-Richtlinie (EU) | Igienair GmbH",
    desc: "Informationen zur Verwendung von Cookies und Tracking-Technologien auf igienair.de. Arten, Zwecke und Ihre Einstellungsmöglichkeiten.",
  },
  "/downloads/": {
    title: "Downloads & Dokumente | Igienair",
    desc: "Hilfreiche Dokumente, Formulare und Informationen zum Download rund um technische Hygiene, Inspektion und Reinigung von RLT-Anlagen.",
  },
  "/glossar/": {
    title: "Glossar: Begriffe der Raumlufthygiene | Igienair",
    desc: "Fachbegriffe zu RLT-Hygiene, Normen und Verfahren verständlich erklärt. Das Igienair-Glossar für Betreiber, Planer und Facility Manager.",
  },
};

/** @type {Record<string, { title?: string; desc?: string }>} */
const GLOSSAR_META = {
  "/glossar/bedeutung-hygieneinspektionen-unternehmen/": {
    desc: "Warum Hygieneinspektionen für Unternehmen wichtig sind: Risiken senken, Raumluft sichern und Betreiberpflichten zuverlässig erfüllen.",
  },
  "/glossar/brandschutzreinigung-entfettung-grosskuechenabluftsystemen/": {
    title: "Brandschutzreinigung Küchenabluft | Glossar",
    desc: "Brandschutzreinigung und Entfettung von Großküchenabluft: Pflicht, Verfahren und Normen nach VDI 2052 und BGR 111 kompakt erklärt.",
  },
  "/glossar/lecktest-schwebstofffilter/": {
    title: "Lecktest Schwebstofffilter erklärt | Glossar",
    desc: "Was ein Lecktest für Schwebstofffilter prüft, wann er nötig ist und welche Anforderungen an Filtersicherheit in RLT-Anlagen gelten.",
  },
  "/glossar/gefaehrdungsbeurteilung-vdi-2047-2/": {
    title: "Gefährdungsbeurteilung VDI 2047-2 | Glossar",
    desc: "Gefährdungsbeurteilung nach VDI 2047-2 für Kühltürme: Pflichten, Inhalte und Bedeutung für Betreiber von Verdunstungskühlanlagen.",
  },
  "/glossar/reinraum/": {
    title: "Reinraum: Definition & Anforderungen | Glossar",
    desc: "Was ist ein Reinraum? Klassifizierung, Normen und hygienische Anforderungen für produktionsrelevante Umgebungen – erklärt im Igienair-Glossar.",
  },
  "/glossar/vdi-2047-2/": {
    title: "VDI 2047-2 Richtlinie erklärt | Glossar Igienair",
    desc: "VDI 2047-2 für Verdunstungskühlanlagen: Pflichten, Gefährdungsbeurteilung und Hygieneanforderungen für Betreiber kompakt erklärt.",
  },
  "/glossar/energetische-inspektion/": {
    desc: "Energetische Inspektion von Klimaanlagen: Pflicht, Ablauf und Bedeutung nach GEG 2020 für Betreiber raumlufttechnischer Anlagen.",
  },
  "/glossar/hygieneinspektion-nach-vdi-6022/": {
    desc: "Hygieneinspektion nach VDI 6022: Pflicht, Intervall und Inhalt der Prüfung für hygienischen Betrieb von RLT-Anlagen.",
  },
  "/glossar/kuehlregale/": {
    desc: "Kühlregale in der Lebensmittelbranche: Hygieneanforderungen, Reinigungsbedarf und typische Risiken durch Ablagerungen.",
  },
  "/glossar/umluftkuehlgeraet/": {
    desc: "Umluftkühlgeräte: Funktion, Hygieneanforderungen und Reinigungsintervalle für sicheren Einsatz in Innenräumen.",
  },
  "/glossar/verdampfer-und-kondensatoren/": {
    desc: "Verdampfer und Kondensatoren in Kälteanlagen: Reinigungsbedarf, Biofilme und Effizienzverluste durch Verschmutzung.",
  },
  "/glossar/filterintegritaetstest/": {
    title: "Filterintegritätstest erklärt | Glossar Igienair",
    desc: "Filterintegritätstest: Verfahren, Normen und Bedeutung für HEPA- und Schwebstofffilter in sensiblen raumlufttechnischen Anlagen.",
  },
};

function referenzParts(url) {
  return url.split("/").filter(Boolean);
}

function buildReferenzCityMeta(url) {
  const parts = referenzParts(url);
  const region = parts[2];
  const citySlug = parts[3];
  const city = cityLabel(citySlug);
  const regionName = regionLabel(region);

  const title = `RLT-Hygiene & Reinigung in ${city} | Igienair`;
  const desc = `Hygieneinspektion und Reinigung für RLT-Anlagen in ${city}. Igienair in ${regionName} – normkonform und dokumentiert. Jetzt anfragen.`;

  return { title: len(title) <= 65 ? title : `RLT-Reinigung ${city} | Igienair`, desc };
}

function buildReferenzRegionMeta(url) {
  const parts = referenzParts(url);
  const region = parts[2];
  const name = regionLabel(region);
  return {
    title: `RLT-Hygiene ${name} | Igienair Referenzen`,
    desc: `Technische Hygiene in ${name}: Inspektion, Reinigung und Gutachten für RLT-Anlagen. Igienair ist in der Region mit erfahrenen Teams vor Ort.`,
  };
}

function buildGlossarMeta(url, page) {
  if (GLOSSAR_META[url]) return GLOSSAR_META[url];

  const explicit = EXPLICIT[url];
  if (explicit) return explicit;

  let topic = page.title?.replace(/ - Igienair GmbH$/, "") ?? "";
  if (!topic || topic.length < 5) {
    topic = url.split("/").filter(Boolean).pop() ?? "Begriff";
    topic = cityLabel(topic);
  }

  const shortTopic = topic.length > 45 ? topic.slice(0, 42) + "…" : topic;
  return {
    title:
      page.titleScore !== "Gut" && len(topic) < 50
        ? `${topic} | Glossar Igienair`
        : undefined,
    desc:
      page.descScore !== "Gut"
        ? `${topic}: Definition, Bedeutung und praxisrelevante Hinweise zur Raumlufthygiene – kompakt erklärt im Igienair-Glossar.`
        : undefined,
  };
}

function buildMeta(page, html) {
  const url = page.url;
  const needsTitle = page.titleScore !== "Gut";
  const needsDesc = page.descScore !== "Gut";

  let generated = EXPLICIT[url] ? { ...EXPLICIT[url] } : {};

  const refParts = referenzParts(url);
  if (refParts[0] === "kunden" && refParts[1] === "referenzen" && refParts.length === 4) {
    generated = { ...generated, ...buildReferenzCityMeta(url) };
  } else if (refParts[0] === "kunden" && refParts[1] === "referenzen" && refParts.length === 3) {
    generated = { ...generated, ...buildReferenzRegionMeta(url) };
  } else if (url.startsWith("/glossar/") && url !== "/glossar/") {
    const g = buildGlossarMeta(url, page);
    generated = { ...generated, ...g };
  }

  if (!generated.title && needsTitle) {
    const h1 = extractH1(html);
    if (h1) {
      const t = `${h1} | Igienair`;
      generated.title = len(t) <= 65 ? t : `${h1.slice(0, 50).trim()} | Igienair`;
    }
  }

  if (!generated.desc && needsDesc) {
    const h1 = extractH1(html);
    const subject = h1 || page.title?.replace(/ - Igienair GmbH$/, "") || "Leistung";
    generated.desc = `${subject}: Igienair bietet normkonforme Inspektion, Reinigung und Gutachten für RLT-Anlagen – deutschlandweit. Jetzt informieren.`;
  }

  return {
    title: needsTitle ? generated.title ?? null : null,
    desc: needsDesc ? generated.desc ?? null : null,
  };
}

function updateHtml(filePath, title, desc) {
  let html = fs.readFileSync(filePath, "utf8");
  let changed = false;

  if (title) {
    const next = `<title>${escapeMeta(title)}</title>`;
    html = html.replace(/<title>[^<]*<\/title>/i, next);
    changed = true;
  }

  if (desc) {
    const attr = escapeMeta(desc);
    if (/<meta\s+name="description"/i.test(html)) {
      const re = /<meta\s+name="description"\s+content="[^"]*"/i;
      const next = `<meta name="description" content="${attr}"`;
      html = html.replace(re, next);
      changed = true;
    } else if (/<meta\s+name="viewport"/i.test(html)) {
      html = html.replace(
        /(<meta\s+name="viewport"[^>]*>)/i,
        `$1\n  <meta name="description" content="${attr}">`
      );
      changed = true;
    } else if (/<title>[^<]*<\/title>/i.test(html)) {
      html = html.replace(
        /(<title>[^<]*<\/title>)/i,
        `$1\n  <meta name="description" content="${attr}">`
      );
      changed = true;
    }
  }

  if (changed) fs.writeFileSync(filePath, html);
  return changed;
}

const changelog = [];
let titlesUpdated = 0;
let descsUpdated = 0;
let skipped = 0;
let manual = 0;

for (const page of SCORED) {
  const needsUpdate = page.titleScore !== "Gut" || page.descScore !== "Gut";
  if (!needsUpdate) {
    skipped++;
    continue;
  }

  const filePath = path.join(ROOT, page.rel.replace(/\//g, path.sep));
  if (!fs.existsSync(filePath)) {
    manual++;
    changelog.push({
      url: page.url,
      status: "Nicht gefunden",
      oldTitle: page.title,
      newTitle: null,
      oldDesc: page.desc,
      newDesc: null,
    });
    continue;
  }

  const html = fs.readFileSync(filePath, "utf8");
  const { title, desc } = buildMeta(page, html);

  if ((page.titleScore !== "Gut" && !title) || (page.descScore !== "Gut" && !desc)) {
    manual++;
    changelog.push({
      url: page.url,
      status: "Manuelle Prüfung nötig",
      oldTitle: page.title,
      newTitle: title,
      oldDesc: page.desc,
      newDesc: desc,
    });
    continue;
  }

  const oldTitle = page.title;
  const oldDesc = page.desc;
  updateHtml(filePath, title, desc);

  if (title) titlesUpdated++;
  if (desc) descsUpdated++;

  changelog.push({
    url: page.url,
    status: "Optimiert",
    oldTitle,
    newTitle: title ?? oldTitle,
    titleLen: len(title ?? oldTitle),
    oldDesc,
    newDesc: desc ?? oldDesc,
    descLen: len(desc ?? oldDesc),
  });
}

fs.writeFileSync(
  "asset-analysis/output/meta-optimization-changelog.json",
  JSON.stringify(
    {
      stats: {
        checked: SCORED.length,
        unchanged: skipped,
        titlesUpdated,
        descsUpdated,
        manual,
      },
      changelog,
    },
    null,
    2
  )
);

console.log(JSON.stringify({ checked: SCORED.length, unchanged: skipped, titlesUpdated, descsUpdated, manual }, null, 2));
