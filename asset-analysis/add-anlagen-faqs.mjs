import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

/** @type {Array<{ file: string, id: string, slug: string, extraClass?: string, title: string, items: Array<{ q: string, a: string }> }>} */
const faqPages = [
  {
    file: "kuehlturmreinigung.html",
    id: "kuehlturm-faq",
    slug: "kuehlturm",
    title: "FAQ K&uuml;hlturmreinigung",
    items: [
      {
        q: "Warum ist eine K&uuml;hlturmreinigung gesetzlich erforderlich?",
        a: "Verdunstungsk&uuml;hlanlagen unterliegen der 42. BImSchV und der <a class=\"text-link\" href=\"vdi-2047.html\">VDI 2047-2</a>. Als Betreiber m&uuml;ssen Sie das Risiko wasserassoziierter Keime wie Legionellen minimieren und den hygienischen Betrieb Ihrer Anlage nachweisbar sicherstellen.",
      },
      {
        q: "Was umfasst eine fachgerechte K&uuml;hlturmreinigung durch Igienair?",
        a: "Vor der Reinigung f&uuml;hren wir eine Gef&auml;hrdungsbeurteilung durch. Anschlie&szlig;end reinigen und desinfizieren wir relevante Bauteile wie Tropfenabscheider, F&uuml;llk&ouml;rper, K&uuml;hltassen und R&uuml;cklaufbecken &ndash; normkonform dokumentiert mit Bildmaterial.",
      },
      {
        q: "Wie oft sollte eine Verdunstungsk&uuml;hlanlage gereinigt werden?",
        a: "Das Intervall richtet sich nach dem Ergebnis der Gef&auml;hrdungsanalyse, dem Verschmutzungsgrad und den Vorgaben der VDI 2047-2. Nach der Inspektion empfehlen wir Ihnen ein individuelles Reinigungs- und Wartungsintervall.",
      },
      {
        q: "Welche Risiken bestehen ohne regelm&auml;&szlig;ige K&uuml;hlturmreinigung?",
        a: "Ohne Reinigung k&ouml;nnen sich Biofilme, Algen, Kalk und Schlamm bilden. Das erh&ouml;ht das Legionellenrisiko, mindert die Anlagenleistung und f&uuml;hrt zu h&ouml;herem Energieverbrauch bis hin zum Anlagenausfall.",
      },
      {
        q: "Wie erhalte ich ein Angebot f&uuml;r die K&uuml;hlturmreinigung?",
        a: "Kontaktieren Sie uns &uuml;ber <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a>. Nach einer Vor-Ort-Begehung erstellen wir Ihnen ein individuelles, unverbindliches Angebot f&uuml;r Reinigung, Desinfektion und Dokumentation.",
      },
    ],
  },
  {
    file: "lueftungsreinigung.html",
    id: "lueftungsreinigung-faq",
    slug: "lueftung",
    extraClass: "duct-faq",
    title: "FAQ L&uuml;ftungsreinigung VDI 6022",
    items: [
      {
        q: "Was ist eine L&uuml;ftungsreinigung nach VDI 6022?",
        a: "Bei einer L&uuml;ftungsreinigung werden L&uuml;ftungskan&auml;le, Bauteile und relevante Bereiche Ihrer RLT-Anlage von Staub, Schmutz und Ablagerungen befreit. So wird ein hygienisch sicherer und rechtlich einwandfreier Betrieb gew&auml;hrleistet.",
      },
      {
        q: "Wie oft sollte eine L&uuml;ftungsanlage gereinigt werden?",
        a: "Als Orientierung dient eine <a class=\"text-link\" href=\"hygieneinspektion-vdi-6022.html\">Hygieneinspektion nach VDI 6022</a> alle zwei bis drei Jahre. Liegt eine Verunreinigung vor oder treten gesundheitliche Beschwerden auf, ist eine Reinigung erforderlich.",
      },
      {
        q: "Welche Normen gelten f&uuml;r die L&uuml;ftungsreinigung?",
        a: "Entscheidend sind <a class=\"text-link\" href=\"vdi-6022.html\">VDI 6022</a> und <a class=\"text-link\" href=\"din-en-15780.html\">DIN EN 15780</a>. Igienair arbeitet nach diesen Richtlinien und dokumentiert alle Ma&szlig;nahmen nachvollziehbar.",
      },
      {
        q: "Wird die Reinigung dokumentiert?",
        a: "Ja. Wir erstellen ein ausf&uuml;hrliches Protokoll mit Vorher-Nachher-Bildmaterial und den durchgef&uuml;hrten Schritten. So k&ouml;nnen Sie Ihre Betreiberpflichten gegen&uuml;ber Beh&ouml;rden und Pr&uuml;fern erf&uuml;llen.",
      },
      {
        q: "Kann die L&uuml;ftungsreinigung au&szlig;erhalb der Betriebszeiten erfolgen?",
        a: "Ja. Auf Wunsch f&uuml;hren wir Reinigungen nachts, an Wochenenden oder Feiertagen durch, damit Ihr laufender Betrieb m&ouml;glichst wenig beeintr&auml;chtigt wird.",
      },
    ],
  },
  {
    file: "rlt-hygiene.html",
    id: "rlt-hygiene-faq",
    slug: "rlt",
    extraClass: "hygiene-faq",
    title: "FAQ RLT-Anlagen Hygiene",
    items: [
      {
        q: "Was versteht man unter RLT Hygiene?",
        a: "RLT Hygiene umfasst alle Ma&szlig;nahmen zur Sicherstellung eines hygienisch einwandfreien Betriebs raumlufttechnischer Anlagen &ndash; von der Inspektion &uuml;ber Reinigung und Desinfektion bis zur normkonformen Dokumentation.",
      },
      {
        q: "Welche Leistungen bietet Igienair f&uuml;r RLT-Anlagen?",
        a: "Wir f&uuml;hren <a class=\"text-link\" href=\"hygieneinspektion-vdi-6022.html\">Hygieneinspektionen</a>, <a class=\"text-link\" href=\"luftkanalreinigung.html\">Luftkanalreinigungen</a>, <a class=\"text-link\" href=\"reinigung-desinfektion.html\">Reinigung &amp; Desinfektion</a> sowie Gutachten und Kanaluntersuchungen durch.",
      },
      {
        q: "Nach welcher Norm wird die Hygieneinspektion durchgef&uuml;hrt?",
        a: "Die Hygieneinspektion erfolgt nach <a class=\"text-link\" href=\"vdi-6022.html\">VDI 6022</a>. Sie bildet die Grundlage f&uuml;r Reinigungsintervalle, Ma&szlig;nahmenempfehlungen und die rechtssichere Bewertung Ihrer Anlage.",
      },
      {
        q: "Warum ist regelm&auml;&szlig;ige RLT Hygiene wichtig?",
        a: "Verschmutzte Anlagen k&ouml;nnen die Raumluftqualit&auml;t mindern, Energiekosten erh&ouml;hen und gesundheitliche Risiken verursachen. Als Betreiber sind Sie verpflichtet, f&uuml;r einen hygienisch einwandfreien Betrieb zu sorgen.",
      },
      {
        q: "Wie starte ich ein RLT-Hygieneprojekt mit Igienair?",
        a: "Fordern Sie &uuml;ber <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a> ein unverbindliches Angebot an. Wir beraten Sie zu Inspektion, Reinigung und weiteren Ma&szlig;nahmen f&uuml;r Ihre Anlage.",
      },
    ],
  },
  {
    file: "raumluftdesinfektion.html",
    id: "raumdesinfektion-faq",
    slug: "raumdesinfektion",
    title: "FAQ Raumluftdesinfektion",
    items: [
      {
        q: "Was ist eine Raumluftdesinfektion?",
        a: "Bei der Raumluftdesinfektion werden R&auml;ume und Luftvolumina mit geeigneten Verfahren desinfiziert, um Keime, Viren und Sporen zu reduzieren. Igienair setzt dabei unter anderem Wasserstoffperoxid-Verfahren nach NF T72-110 ein.",
      },
      {
        q: "Wann ist eine Raumdesinfektion sinnvoll?",
        a: "Eine Desinfektion ist sinnvoll nach Kontaminationen, in sensiblen Bereichen wie Gesundheitswesen oder Lebensmittelproduktion, nach Renovierungen oder wenn eine fl&auml;chendeckende Keimreduktion erforderlich ist.",
      },
      {
        q: "Wie l&auml;uft die Desinfektion mit Wasserstoffperoxid ab?",
        a: "Das Desinfektionsmittel wird als Nebel im Raum verteilt und dringt auch in schwer zug&auml;ngliche Bereiche ein. Nach der Einwirkzeit wird der Raum bel&uuml;ftet und freigegeben &ndash; dokumentiert und reproduzierbar.",
      },
      {
        q: "Ist die Raumdesinfektion schonend f&uuml;r Oberfl&auml;chen?",
        a: "Das Verfahren ist materialschonend und eignet sich f&uuml;r viele Oberfl&auml;chen und Einrichtungsgegenst&auml;nde. Vorab kl&auml;ren wir den Einsatzbereich und die Anforderungen mit Ihnen.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Kontaktieren Sie uns &uuml;ber <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a>. Wir besprechen mit Ihnen Raumgr&ouml;&szlig;e, Einsatzzweck und den optimalen Desinfektionsablauf.",
      },
    ],
  },
  {
    file: "kuechenabluftsysteme.html",
    id: "kuechenabluft-faq",
    slug: "kuechenabluft",
    title: "FAQ K&uuml;chenabluftsysteme",
    items: [
      {
        q: "Warum muss eine K&uuml;chenabluftanlage gereinigt werden?",
        a: "In gewerblichen K&uuml;chen lagern sich Fette und Brandlasten in Abluftkan&auml;len ab. Das erh&ouml;ht das Brandrisiko und mindert die Leistung der Anlage. Betreiber m&uuml;ssen f&uuml;r einen sicheren Betrieb sorgen.",
      },
      {
        q: "Welche Normen gelten f&uuml;r K&uuml;chenabluftsysteme?",
        a: "Entscheidend sind <a class=\"text-link\" href=\"vdi-2052-bgr-111.html\">VDI 2052 &amp; BGR 111</a> sowie die brandschutzrechtlichen Vorgaben. Igienair reinigt normkonform und dokumentiert den Zustand Ihrer Anlage.",
      },
      {
        q: "Wie oft ist eine Brandschutzinspektion erforderlich?",
        a: "Halbj&auml;hrlich ist eine Brandschutzinspektion mit Fotodokumentation durchzuf&uuml;hren. Werden Brandlasten festgestellt, ist eine brandschutztechnische Reinigung erforderlich.",
      },
      {
        q: "Was umfasst die Reinigung einer K&uuml;chenabluftanlage?",
        a: "Wir reinigen Abluftkan&auml;le, Hauben, Filter und relevante Bauteile fettfrei und entfernen Brandlasten. Auf Wunsch f&uuml;hren wir die Reinigung au&szlig;erhalb Ihrer Betriebszeiten durch.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Nutzen Sie <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a> oder kontaktieren Sie uns direkt. Nach einer Begehung erstellen wir ein individuelles Angebot f&uuml;r Inspektion und Reinigung.",
      },
    ],
  },
  {
    file: "laborabzuege.html",
    id: "laborabzug-faq",
    slug: "laborabzug",
    title: "FAQ Laborabz&uuml;ge &amp; Digestorien",
    items: [
      {
        q: "Was ist ein Digestorium bzw. Laborabzug?",
        a: "Ein Digestorium (Laborabzug) ist ein abgesicherter Arbeitsplatz in Laboren, der gef&auml;hrliche D&auml;mpfe und St&auml;ube sicher absaugt. Die regelm&auml;&szlig;ige Pr&uuml;fung sichert Schutz f&uuml;r Mitarbeiter und Prozesse.",
      },
      {
        q: "Nach welcher Norm werden Laborabz&uuml;ge gepr&uuml;ft?",
        a: "Pr&uuml;fungen erfolgen nach <a class=\"text-link\" href=\"din-en-14175.html\">DIN EN 14175</a>. Die Norm definiert Pr&uuml;fanforderungen f&uuml;r Digestorien, Gefahrstoffschr&auml;nke und Abzugsanlagen.",
      },
      {
        q: "Wie oft m&uuml;ssen Laborabz&uuml;ge gepr&uuml;ft werden?",
        a: "Digestorien und Abzugsanlagen sind mindestens einmal j&auml;hrlich zu pr&uuml;fen. Die Ergebnisse m&uuml;ssen dokumentiert und archiviert werden.",
      },
      {
        q: "Was passiert bei einer mangelhaften Laborabzug Pr&uuml;fung?",
        a: "Wird die Anlage als nicht funktionsf&auml;hig bewertet, darf sie nicht weiter betrieben werden, bis die M&auml;ngel behoben sind. Wir dokumentieren Befunde und beraten zu erforderlichen Ma&szlig;nahmen.",
      },
      {
        q: "Wie beauftrage ich Igienair f&uuml;r eine Laborabzug Pr&uuml;fung?",
        a: "Fordern Sie &uuml;ber <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a> ein unverbindliches Angebot an. Wir planen Pr&uuml;fung, Dokumentation und bei Bedarf Folgema&szlig;nahmen.",
      },
    ],
  },
  {
    file: "verdampfer-und-kondensatoren.html",
    id: "verdampfer-faq",
    slug: "verdampfer",
    title: "FAQ Verdampfer &amp; Kondensatoren",
    items: [
      {
        q: "Warum sollten Verdampfer und Kondensatoren gereinigt werden?",
        a: "Verschmutzte W&auml;rme&uuml;bertrager mindern die K&auml;lle- und Heizleistung, erh&ouml;hen den Energieverbrauch und k&ouml;nnen Hygieneprobleme verursachen. Regelm&auml;&szlig;ige Reinigung sichert Effizienz und Betriebssicherheit.",
      },
      {
        q: "Welche Anlagen betreut Igienair in diesem Bereich?",
        a: "Wir reinigen Verdampfer, Kondensatoren und Register in RLT-Anlagen, K&auml;lteanlagen und Klimasystemen &ndash; abgestimmt auf Anlagentyp, Zug&auml;nglichkeit und Verschmutzungsgrad.",
      },
      {
        q: "Wie l&auml;uft die Reinigung ab?",
        a: "Nach Sichtpr&uuml;fung w&auml;hlen wir das passende Reinigungsverfahren, entfernen Ablagerungen schonend und dokumentieren den Zustand vor und nach der Ma&szlig;nahme.",
      },
      {
        q: "Wie oft ist eine Reinigung sinnvoll?",
        a: "Das Intervall h&auml;ngt von Nutzung, Umgebung und Verschmutzung ab. Im Rahmen einer Inspektion empfehlen wir Ihnen ein passendes Wartungs- und Reinigungsintervall.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Nutzen Sie <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a>. Wir erstellen nach Vor-Ort-Termin ein individuelles Angebot f&uuml;r Reinigung und Wartung.",
      },
    ],
  },
  {
    file: "kuehlregale.html",
    id: "kuehlregale-faq",
    slug: "kuehlregale",
    title: "FAQ K&uuml;hlregale",
    items: [
      {
        q: "Warum ist die Hygiene von K&uuml;hlregalen wichtig?",
        a: "In K&uuml;hlregalen k&ouml;nnen sich Ablagerungen, Biofilme und Keime bilden. Das gef&auml;hrdet Lebensmittelhygiene, Produktqualit&auml;t und die Effizienz der K&uuml;hlung.",
      },
      {
        q: "Welche Leistungen bietet Igienair f&uuml;r K&uuml;hlregale?",
        a: "Wir reinigen und desinfizieren K&uuml;hlregale, Lufteintrittsbereiche und relevante Bauteile fachgerecht &ndash; angepasst an Ihre Branche und Hygieneanforderungen.",
      },
      {
        q: "Nach welchen Vorgaben wird gereinigt?",
        a: "Je nach Einsatzbereich orientieren wir uns an branchenspezifischen Hygienevorgaben und den Anforderungen des Lebensmittel- bzw. Handelssektors. Alle Schritte werden dokumentiert.",
      },
      {
        q: "Kann die Reinigung au&szlig;erhalb der &Ouml;ffnungszeiten erfolgen?",
        a: "Ja. Wir planen Reinigungen so, dass Ihr Betrieb m&ouml;glichst wenig beeintr&auml;chtigt wird &ndash; etwa nachts oder in Schlie&szlig;zeiten.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Kontaktieren Sie uns &uuml;ber <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a>. Nach einer Begehung erstellen wir ein passgenaues Angebot.",
      },
    ],
  },
  {
    file: "textilschlaeuche.html",
    id: "textilschlaeuche-faq",
    slug: "textilschlaeuche",
    title: "FAQ Textilschl&auml;uche",
    items: [
      {
        q: "Was sind Textilschl&auml;uche in der Raumlufttechnik?",
        a: "Textilschl&auml;uche sind flexible Luftverteilsysteme aus Spezialgewebe. Sie sorgen f&uuml;r gleichm&auml;&szlig;ige Luftf&uuml;hrung in Hallen, Sporthallen, Produktionsbereichen und weiteren Anwendungen.",
      },
      {
        q: "Warum m&uuml;ssen Textilschl&auml;uche gereinigt werden?",
        a: "Staub, Pollen und Feuchtigkeit k&ouml;nnen die Luftqualit&auml;t mindern und die Hygiene beeintr&auml;chtigen. Regelm&auml;&szlig;ige Reinigung erh&auml;lt Funktion, Optik und hygienischen Zustand.",
      },
      {
        q: "Wie reinigt Igienair Textilschl&auml;uche?",
        a: "Wir reinigen Textilschlauchsysteme schonend und materialspezifisch, pr&uuml;fen den Zustand und dokumentieren die durchgef&uuml;hrten Ma&szlig;nahmen.",
      },
      {
        q: "In welchen Intervallen ist eine Reinigung sinnvoll?",
        a: "Das h&auml;ngt von Nutzung, Umgebung und Verschmutzungsgrad ab. Wir empfehlen ein Intervall auf Basis der Hygieneinspektion und des tats&auml;chlichen Anlagenzustands.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Nutzen Sie <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a> f&uuml;r ein unverbindliches Angebot nach Vor-Ort-Termin.",
      },
    ],
  },
  {
    file: "rechenzentrum.html",
    id: "rechenzentrum-faq",
    slug: "rechenzentrum",
    title: "FAQ Rechenzentrum Reinigung",
    items: [
      {
        q: "Warum ist Hygiene im Rechenzentrum besonders wichtig?",
        a: "Staub und Partikel k&ouml;nnen empfindliche IT-Hardware beeintr&auml;chtigen, K&uuml;hlung reduzieren und Ausfallzeiten verursachen. Saubere RLT- und K&uuml;hlsysteme sind Grundlage f&uuml;r Verf&uuml;gbarkeit und Effizienz.",
      },
      {
        q: "Welche Anlagen betreut Igienair in Rechenzentren?",
        a: "Wir reinigen und warten RLT-Anlagen, Kanalsysteme, K&uuml;hlsysteme und relevante Bauteile in Rechenzentren &ndash; mit minimaler Beeintr&auml;chtigung des laufenden Betriebs.",
      },
      {
        q: "Kann die Reinigung im laufenden Betrieb erfolgen?",
        a: "Ja. Wir planen Ma&szlig;nahmen so, dass kritische Systeme m&ouml;lichst wenig gest&ouml;rt werden, und stimmen Abl&auml;ufe mit Ihrem Rechenzentrumsteam ab.",
      },
      {
        q: "Wird die Reinigung dokumentiert?",
        a: "Ja. Alle Leistungen werden normkonform dokumentiert &ndash; mit Protokoll, Bildmaterial und den durchgef&uuml;hrten Schritten.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Fordern Sie &uuml;ber <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a> ein individuelles Angebot f&uuml;r Ihr Rechenzentrum an.",
      },
    ],
  },
  {
    file: "filterintegritaetstest.html",
    id: "filterintegritaet-faq",
    slug: "filterintegritaet",
    title: "FAQ Filterintegrit&auml;tstest",
    items: [
      {
        q: "Was ist ein Filterintegrit&auml;tstest?",
        a: "Der Filterintegrit&auml;tstest pr&uuml;ft, ob HEPA- und ULPA-Filter in Reinr&auml;umen und sensiblen Bereichen dicht sind und ihre Schutzfunktion erf&uuml;llen. Er ist ein zentraler Bestandteil der Reinraumqualifizierung.",
      },
      {
        q: "Nach welchen Normen wird gepr&uuml;ft?",
        a: "Wir orientieren uns an einschl&auml;gigen Normen wie DIN EN ISO 14644 und den Vorgaben f&uuml;r Reinraumqualifizierung. Die Ergebnisse werden in Pr&uuml;fprotokollen festgehalten.",
      },
      {
        q: "Wie oft sind Filterintegrit&auml;tstests erforderlich?",
        a: "Das h&auml;ngt von Reinraumklasse, Nutzung und internen Vorgaben ab. Im Rahmen der Qualifizierung weisen wir auf erforderliche Wiederholungsintervalle hin.",
      },
      {
        q: "Was passiert bei einem nicht bestandenen Test?",
        a: "Wird Undichtigkeit festgestellt, empfehlen wir Ma&szlig;nahmen wie Filtertausch, Nachdichtung oder erneute Pr&uuml;fung. Alle Befunde werden dokumentiert.",
      },
      {
        q: "Wie beauftrage ich Igienair?",
        a: "Nutzen Sie <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a> f&uuml;r ein unverbindliches Angebot zu Filterintegrit&auml;tstest und Reinraumqualifizierung.",
      },
    ],
  },
  {
    file: "lecktest-schwebstofffilter.html",
    id: "lecktest-faq",
    slug: "lecktest",
    extraClass: "leaktest-faq",
    title: "FAQ Lecktest Schwebstofffilter",
    items: [
      {
        q: "Was ist ein Lecktest an Schwebstofffiltern?",
        a: "Beim Lecktest wird gepr&uuml;ft, ob Schwebstofffilter (HEPA/ULPA) und deren Rahmen dicht sind. Undichtigkeiten k&ouml;nnen die Schutzfunktion in Reinr&auml;men und sensiblen Bereichen erheblich mindern.",
      },
      {
        q: "Wann ist ein Lecktest erforderlich?",
        a: "Lecktests sind Teil der Reinraumqualifizierung, nach Filterwechsel, bei Inbetriebnahme oder in regelm&auml;&szlig;igen Pr&uuml;fintervallen gem&auml;&szlig; Norm und interner Qualit&auml;tssicherung.",
      },
      {
        q: "Wie l&auml;uft der Lecktest ab?",
        a: "Mit Pr&uuml;faerosol und Photometer werden Filter und Rahmen systematisch auf Leckagen untersucht. Befunde werden protokolliert und bei Bedarf Ma&szlig;nahmen empfohlen.",
      },
      {
        q: "Was ist der Unterschied zum Filterintegrit&auml;tstest?",
        a: "Beide Verfahren pr&uuml;fen die Dichtheit von Filtern. Der Lecktest fokussiert auf Schwebstofffilter und Rahmen und ist ein standardisierter Bestandteil der Reinraumpr&uuml;fung.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Kontaktieren Sie uns &uuml;ber <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a>. Wir planen Lecktest, Dokumentation und bei Bedarf Folgema&szlig;nahmen.",
      },
    ],
  },
  {
    file: "splitklimageraete-und-umluftkuehlgeraete.html",
    id: "splitklima-faq",
    slug: "splitklima",
    title: "FAQ Split- &amp; Umluftk&uuml;hlger&auml;te",
    items: [
      {
        q: "Warum sollten Split- und Umluftk&uuml;hlger&auml;te gereinigt werden?",
        a: "Staub, Pollen und Feuchtigkeit f&uuml;hren zu Ablagerungen in Filtern, Verdampfern und Kan&auml;len. Das mindert Leistung, verschlechtert die Luftqualit&auml;t und erh&ouml;ht den Energieverbrauch.",
      },
      {
        q: "Welche Bauteile reinigt Igienair?",
        a: "Wir reinigen Filter, Verdampfer, Kondensatoren, Lufteintrittsbereiche und relevante Kanalabschnitte &ndash; abgestimmt auf Ger&auml;tetyp und Verschmutzungsgrad.",
      },
      {
        q: "Wie oft ist eine Reinigung sinnvoll?",
        a: "Das Intervall h&auml;ngt von Nutzungsintensit&auml;t und Umgebung ab. In stark genutzten Bereichen empfehlen wir k&uuml;rzere Intervalle als in gelegentlich genutzten R&auml;umen.",
      },
      {
        q: "Kann die Reinigung im laufenden Betrieb erfolgen?",
        a: "Je nach Anlage planen wir Reinigungen au&szlig;erhalb der Nutzungszeiten oder in Absprache mit Ihrem Facility-Management, um St&ouml;rungen zu minimieren.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Nutzen Sie <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a> f&uuml;r ein unverbindliches Angebot nach Vor-Ort-Termin.",
      },
    ],
  },
  {
    file: "prozessabluft-und-entrauchungsanlagen.html",
    id: "prozessabluft-faq",
    slug: "prozessabluft",
    title: "FAQ Prozessabluft &amp; Entrauchungsanlagen",
    items: [
      {
        q: "Was sind Prozessabluft- und Entrauchungsanlagen?",
        a: "Prozessabluftanlagen f&uuml;hren Stoffe aus Produktionsprozessen ab. Entrauchungsanlagen sichern im Brandfall die Rauchableitung. Beide Systeme m&uuml;ssen funktionsf&auml;hig und hygienisch sicher betrieben werden.",
      },
      {
        q: "Warum ist regelm&auml;&szlig;ige Reinigung wichtig?",
        a: "Ablagerungen k&ouml;nnen Durchfluss, Sicherheit und Funktion beeintr&auml;chtigen. In Prozessabluftanlagen mindern Verschmutzungen zudem die Luftqualit&auml;t und Prozesssicherheit.",
      },
      {
        q: "Welche Leistungen bietet Igienair?",
        a: "Wir reinigen und warten Prozessabluft- und Entrauchungskan&auml;le, pr&uuml;fen den Zustand und dokumentieren alle Ma&szlig;nahmen normkonform.",
      },
      {
        q: "K&ouml;nnen Reinigungen au&szlig;erhalb der Betriebszeiten erfolgen?",
        a: "Ja. Wir stimmen Termine und Abl&auml;ufe mit Ihnen ab, damit Produktion und Betrieb m&ouml;lichst wenig beeintr&auml;chtigt werden.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Fordern Sie &uuml;ber <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a> ein individuelles Angebot an.",
      },
    ],
  },
  {
    file: "kuehlsysteme.html",
    id: "kuehlsysteme-faq",
    slug: "kuehlsysteme",
    title: "FAQ K&uuml;hlsysteme",
    items: [
      {
        q: "Welche K&uuml;hlsysteme betreut Igienair?",
        a: "Wir betreuen Verdunstungsk&uuml;hlanlagen, K&uuml;hlregale, Split- und Umluftk&uuml;hlger&auml;te, K&auml;ltemaschinen und zugeh&ouml;rige RLT-Komponenten &ndash; von Inspektion bis Reinigung.",
      },
      {
        q: "Warum ist hygienische Wartung von K&uuml;hlsystemen wichtig?",
        a: "Verschmutzte Systeme arbeiten ineffizient, verbrauchen mehr Energie und k&ouml;nnen Hygiene- sowie Legionellenrisiken bergen. Regelm&auml;&szlig;ige Wartung sichert Leistung und Betriebssicherheit.",
      },
      {
        q: "Nach welchen Normen arbeitet Igienair?",
        a: "Je nach Anlagentyp orientieren wir uns an <a class=\"text-link\" href=\"vdi-6022.html\">VDI 6022</a>, <a class=\"text-link\" href=\"vdi-2047.html\">VDI 2047-2</a> und weiteren einschl&auml;gigen Richtlinien.",
      },
      {
        q: "Wird die Wartung dokumentiert?",
        a: "Ja. Alle Inspektionen, Reinigungen und Ma&szlig;nahmen werden nachvollziehbar dokumentiert &ndash; mit Protokoll und Bildmaterial.",
      },
      {
        q: "Wie erhalte ich ein Angebot?",
        a: "Nutzen Sie <a class=\"text-link\" href=\"index.html#angebot\">Angebot anfordern</a>. Wir beraten Sie zu passenden Leistungen f&uuml;r Ihre K&uuml;hlsysteme.",
      },
    ],
  },
];

function renderFaq({ id, extraClass = "", title, slug, items }) {
  const sectionClass = extraClass
    ? `sustainability-accordion-section home-faq ${extraClass}`
    : "sustainability-accordion-section home-faq";

  const accordionItems = items
    .map((item, index) => {
      const n = index + 1;
      const isOpen = index === 0;
      const panelAttrs = isOpen ? "" : " hidden";
      const expanded = isOpen ? "true" : "false";

      return `          <article class="accordion-item${isOpen ? " is-open" : ""}" data-accordion-item>
            <h3 class="accordion-item__heading">
              <button class="accordion-item__trigger" type="button" aria-expanded="${expanded}" aria-controls="${slug}-panel-${n}" id="${slug}-trigger-${n}" data-accordion-trigger>${item.q}</button>
            </h3>
            <div class="accordion-item__panel" id="${slug}-panel-${n}" role="region" aria-labelledby="${slug}-trigger-${n}" data-accordion-panel${panelAttrs}>
              <p>${item.a}</p>
            </div>
          </article>`;
    })
    .join("\n\n");

  return `
    <section class="${sectionClass}" data-section="faq" id="${id}">
      <div class="container faq-section">
        <header class="faq-section__header">
          <p class="eyebrow">H&Auml;UFIGE FRAGEN</p>
          <h2>${title}</h2>
          <div class="gradient-line"></div>
        </header>

        <div class="accordion faq-accordion" data-accordion>
${accordionItems}
        </div>
      </div>
    </section>`;
}

let updated = 0;
let skipped = 0;

for (const page of faqPages) {
  const filePath = path.join(root, page.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`SKIP (missing): ${page.file}`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes('data-section="faq"')) {
    console.log(`SKIP (has FAQ): ${page.file}`);
    skipped++;
    continue;
  }

  const marker = "  </main>";
  const idx = html.lastIndexOf(marker);
  if (idx === -1) {
    console.warn(`SKIP (no </main>): ${page.file}`);
    skipped++;
    continue;
  }

  const faqHtml = renderFaq(page);
  html = html.slice(0, idx) + faqHtml + "\n" + html.slice(idx);
  fs.writeFileSync(filePath, html, "utf8");
  console.log(`UPDATED: ${page.file}`);
  updated++;
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped.`);
