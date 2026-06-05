import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = fs.readFileSync(
  path.join(root, "hygieneinspektion-vdi-6022/index.html"),
  "utf8"
);

function extractBetween(html, start, end) {
  const s = html.indexOf(start);
  const e = html.indexOf(end, s);
  return html.slice(0, s) + "{{MAIN}}" + html.slice(e);
}

const shell = extractBetween(template, "<main>", "</main>");
const [head, tail] = shell.split("{{MAIN}}");

const gefaehrdungMain = `
    <section class="company-hero" id="top" data-section="hero">
      <div class="container company-hero__content">
        <p class="eyebrow">Leistungen</p>
        <h1>Gef&auml;hrdungsbeurteilung VDI 2047-2</h1>
      </div>
    </section>

    <section class="cleanroom-overview filtertest-overview hygiene-overview" id="risk-overview" data-section="overview">
      <div class="container hygiene-overview__layout">
        <header class="section-copy hygiene-overview__header">
          <p class="eyebrow">GEF&Auml;HRUNGSBEURTEILUNG</p>
          <h2>Risikoanalyse und Gef&auml;hrdungsbeurteilung f&uuml;r Verdunstungsk&uuml;hlanlagen</h2>
          <div class="gradient-line"></div>
        </header>

        <div class="hygiene-overview__columns">
          <article class="section-copy hygiene-overview__body">
            <p>Verdunstungsk&uuml;hlanlagen, K&uuml;hlt&uuml;rme und Nassabscheider unterliegen strengen gesetzlichen Anforderungen. Nach &sect; 3 der 42. BImSchV ist eine <strong>Gef&auml;hrdungsbeurteilung nach VDI 2047-2</strong> zwingende Voraussetzung f&uuml;r den Betrieb dieser Anlagen.</p>
            <p>Igienair unterst&uuml;tzt Sie bei Erstellung, Aktualisierung und Umsetzung der erforderlichen Risikoanalyse &ndash; normkonform dokumentiert und mit erfahrenen Fachkr&auml;ften f&uuml;r technische Hygiene.</p>
            <a class="button button--solid" href="../kontakt/angebot-anfordern/index.html">Jetzt anfragen</a>
          </article>
          <figure class="company-media-card hygiene-overview__media">
            <img src="../assets/images/Genutze Bilder_LW/Leistungen/inspektion-gefaehrdungsbeurteilung-vdi-2047.png" alt="Gef&auml;hrdungsbeurteilung an einer Verdunstungsk&uuml;hlanlage">
          </figure>
        </div>
      </div>
    </section>

    <section class="filtertest-standard hygiene-air" id="risk-details" data-section="details">
      <div class="container">
        <header class="section-copy filtertest-standard__heading">
          <p class="eyebrow">VDI 2047-2</p>
          <h2>Rechtssichere Bewertung von K&uuml;hlt&uuml;rmen und Verdunstungsk&uuml;hlanlagen</h2>
          <div class="gradient-line"></div>
        </header>

        <div class="filtertest-standard__stack">
          <div class="filtertest-standard__row filtertest-standard__row--nav">
            <article class="section-copy filtertest-standard__copy">
              <p>Die <a class="duct-inline-link" href="../normen/vdi-2047/index.html">VDI 2047-2</a> und die 42. BImSchV regeln Hygiene, Betrieb und die Vermeidung gesundheitlicher Risiken durch Mikroorganismen wie Legionellen. Die Gef&auml;hrdungsbeurteilung wird zwei Jahre nach Erstellung im Rahmen einer Risikoanalyse &uuml;berpr&uuml;ft.</p>
              <p><strong>Zus&auml;tzlich ist alle f&uuml;nf Jahre eine &Uuml;berpr&uuml;fung des ordnungsgem&auml;&szlig;en Anlagenbetriebs erforderlich &ndash; etwa durch eine akkreditierte Inspektionsstelle Typ A.</strong></p>
            </article>
            <aside class="hygiene-air__anchors" aria-label="Schnellnavigation">
              <div class="cleaning-services__pills hygiene-air__pills">
                <div class="cleaning-pill-list">
                  <a class="cleaning-pill" href="#rechtliche-grundlagen">Rechtliche Grundlagen</a>
                  <a class="cleaning-pill" href="#unsere-leistungen">Unsere Leistungen</a>
                  <a class="cleaning-pill" href="#ihre-vorteile">Ihre Vorteile</a>
                </div>
              </div>
            </aside>
          </div>

          <div class="filtertest-standard__row filtertest-standard__row--reverse">
            <figure class="company-media-card filtertest-standard__media">
              <img src="../assets/images/Genutze Bilder_LW/Normen/VDI 2047-2.png" alt="K&uuml;hlturmhygiene nach VDI 2047-2">
            </figure>
            <article class="section-copy filtertest-standard__copy">
              <h3>Schutz vor Legionellen und Betriebsrisiken</h3>
              <p>Unsachgem&auml;&szlig; betriebene Verdunstungsk&uuml;hlanlagen k&ouml;nnen erhebliche Gesundheitsrisiken bergen. Eine fachgerechte Gef&auml;hrdungsbeurteilung identifiziert Schwachstellen, bewertet Risiken und definiert notwendige Ma&szlig;nahmen f&uuml;r einen sicheren Anlagenbetrieb.</p>
              <p>Als erfahrener Partner f&uuml;r <a class="duct-inline-link" href="../anlagen/kuehlturmreinigung/index.html">K&uuml;hlturmreinigung</a> und technische Hygiene begleiten wir Sie von der Analyse bis zur Umsetzung empfohlener Ma&szlig;nahmen.</p>
              <a class="button button--solid" href="../kontakt/angebot-anfordern/index.html">Anfrage senden</a>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="filtertest-procedure hygiene-legal" id="rechtliche-grundlagen" data-section="procedure">
      <div class="container hygiene-legal__layout">
        <div class="hygiene-legal__intro">
          <header class="section-copy hygiene-legal__header">
            <p class="eyebrow">RECHTLICHE GRUNDLAGEN</p>
            <h2>Gesetzliche Pflichten f&uuml;r Betreiber von Verdunstungsk&uuml;hlanlagen</h2>
            <div class="gradient-line"></div>
          </header>
          <article class="section-copy hygiene-legal__lead">
            <p>Die 42. BImSchV verpflichtet Betreiber, Gef&auml;hrdungen durch emittierte Stoffe zu vermeiden. F&uuml;r Verdunstungsk&uuml;hlanlagen, K&uuml;hlt&uuml;rme und Nassabscheider ist die Erstellung einer Gef&auml;hrdungsbeurteilung nach anerkannten Regeln der Technik &ndash; insbesondere der <strong>VDI 2047-2</strong> &ndash; erforderlich.</p>
          </article>
        </div>

        <div class="hygiene-legal__columns">
          <article class="section-copy hygiene-legal__body">
            <h3>Pr&uuml;f- und Aktualisierungsintervalle</h3>
            <ul class="oproom-list">
              <li>Erstellung vor Inbetriebnahme bzw. bei wesentlichen &Auml;nderungen</li>
              <li>Risiko&uuml;berpr&uuml;fung zwei Jahre nach Erstellung</li>
              <li>&Uuml;berpr&uuml;fung des ordnungsgem&auml;&szlig;en Betriebs alle f&uuml;nf Jahre</li>
            </ul>
            <p>Bei Auff&auml;lligkeiten, Sch&auml;den oder nach Reinigungsma&szlig;nahmen kann eine au&szlig;erplanm&auml;&szlig;ige Bewertung erforderlich sein. Wir dokumentieren alle Schritte rechtsicher und nachvollziehbar.</p>
            <a class="button button--solid" href="../kontakt/angebot-anfordern/index.html">Jetzt anfragen</a>
          </article>
          <figure class="company-media-card hygiene-legal__media">
            <img src="../assets/images/Genutze Bilder_LW/Anlagen/Anlage_Kuehlturmreinigung4.jpeg" alt="Inspektion einer Verdunstungsk&uuml;hlanlage">
          </figure>
        </div>
      </div>
    </section>

    <section class="sectors" data-section="industries">
      <div class="container sectors__layout">
        <header class="sectors__header">
          <p class="eyebrow eyebrow--light">BRANCHEN</p>
          <h2>Gef&auml;hrdungsbeurteilung f&uuml;r unterschiedliche Betreiber</h2>
          <div class="gradient-line"></div>
        </header>
        <div class="sectors__columns">
          <div class="sectors__copy">
            <p>Verdunstungsk&uuml;hlanlagen finden sich in Industrie, Gewerbe, Gesundheitswesen und &ouml;ffentlichen Einrichtungen. Wir passen Bewertung und Dokumentation an Ihre Branche und Anlagengr&ouml;&szlig;e an.</p>
          </div>
          <div class="sector-grid" aria-label="Branchen">
            <a class="sector-card" href="../industrie/index.html"><img src="../assets/images/sector-industry.png" alt=""><h3>Industrie</h3></a>
            <a class="sector-card" href="../kunden/gesundheit/index.html"><img src="../assets/images/sector-healthcare.png" alt=""><h3>Gesundheitswesen</h3></a>
            <a class="sector-card" href="../kunden/lebensmittel/index.html"><img src="../assets/images/sector-food.png" alt=""><h3>Lebensmittel</h3></a>
            <a class="sector-card" href="../kunden/gemeinden/index.html"><img src="../assets/images/sector-municipal.png" alt=""><h3>Gemeinden</h3></a>
            <a class="sector-card" href="../kunden/pharma/index.html"><img src="../assets/images/sector-pharma.png" alt=""><h3>Pharma</h3></a>
            <a class="sector-card" href="../kunden/gastronomie/index.html"><img src="../assets/images/sector-gastronomy.png" alt=""><h3>Gastronomie</h3></a>
          </div>
        </div>
      </div>
    </section>

    <section class="duct-partner filtertest-partner hygiene-services" id="unsere-leistungen" data-section="partner">
      <div class="container duct-partner__grid hygiene-services__layout">
        <article class="section-copy duct-partner__copy hygiene-services__copy">
          <p class="eyebrow">UNSERE LEISTUNGEN</p>
          <h2>Gef&auml;hrdungsbeurteilung und begleitende Services</h2>
          <div class="gradient-line"></div>
          <div class="hygiene-services__panel">
            <div class="hygiene-services__grid">
              <article class="hygiene-services__item"><p>Erstellung und Aktualisierung der Gef&auml;hrdungsbeurteilung nach VDI 2047-2</p></article>
              <article class="hygiene-services__item"><p>Risikoanalyse und Bewertung des Anlagenbetriebs</p></article>
              <article class="hygiene-services__item"><p>Beprobung und mikrobiologische Bewertung</p></article>
              <article class="hygiene-services__item"><p>Ma&szlig;nahmenplanung bei festgestellten M&auml;ngeln</p></article>
              <article class="hygiene-services__item"><p>Hygienereinigung von K&uuml;hlt&uuml;rmen nach VDI 2047</p></article>
              <article class="hygiene-services__item"><p>Rechtssichere Dokumentation f&uuml;r Beh&ouml;rden und Betreiber</p></article>
            </div>
          </div>
          <a class="button button--solid" href="../kontakt/angebot-anfordern/index.html">Kontakt aufnehmen</a>
        </article>
      </div>
    </section>

    <section class="company-cta company-cta--hygiene" id="ihre-vorteile" data-section="benefits">
      <div class="container company-cta__inner">
        <p class="eyebrow eyebrow--light">IHRE VORTEILE</p>
        <h2>Ihre Vorteile mit Igienair als Partner f&uuml;r VDI 2047-2:</h2>
        <ul class="hygiene-benefit-grid">
          <li>Einhaltung der gesetzlichen Pflichten nach 42. BImSchV</li>
          <li>Reduzierung von Gesundheits- und Haftungsrisiken</li>
          <li>Normkonforme Dokumentation f&uuml;r Audits und Beh&ouml;rden</li>
          <li>Kombination aus Bewertung, Reinigung und Wartung aus einer Hand</li>
        </ul>
        <a class="button button--ghost" href="../kontakt/angebot-anfordern/index.html">Termin vereinbaren</a>
      </div>
    </section>

    <section class="sustainability-accordion-section home-faq hygiene-faq" data-section="faq" id="risk-faq">
      <div class="container faq-section">
        <header class="faq-section__header">
          <p class="eyebrow">H&Auml;UFIGE FRAGEN</p>
          <h2>Fragen zur Gef&auml;hrdungsbeurteilung VDI 2047-2</h2>
          <div class="gradient-line"></div>
        </header>
        <div class="accordion faq-accordion" data-accordion>
          <article class="accordion-item is-open" data-accordion-item>
            <h3 class="accordion-item__heading">
              <button class="accordion-item__trigger" type="button" aria-expanded="true" aria-controls="risk-faq-panel-1" id="risk-faq-trigger-1" data-accordion-trigger>F&uuml;r welche Anlagen gilt die VDI 2047-2?</button>
            </h3>
            <div class="accordion-item__panel" id="risk-faq-panel-1" role="region" aria-labelledby="risk-faq-trigger-1" data-accordion-panel>
              <p>Die VDI 2047-2 gilt f&uuml;r Verdunstungsk&uuml;hlanlagen, K&uuml;hlt&uuml;rme und Nassabscheider. Sie regelt Hygiene, Betrieb und den Schutz vor gesundheitlichen Risiken durch Mikroorganismen.</p>
            </div>
          </article>
          <article class="accordion-item" data-accordion-item>
            <h3 class="accordion-item__heading">
              <button class="accordion-item__trigger" type="button" aria-expanded="false" aria-controls="risk-faq-panel-2" id="risk-faq-trigger-2" data-accordion-trigger>Wie oft muss die Gef&auml;hrdungsbeurteilung aktualisiert werden?</button>
            </h3>
            <div class="accordion-item__panel" id="risk-faq-panel-2" role="region" aria-labelledby="risk-faq-trigger-2" data-accordion-panel hidden>
              <p>Zwei Jahre nach Erstellung erfolgt eine Risiko&uuml;berpr&uuml;fung. Alle f&uuml;nf Jahre ist zus&auml;tzlich eine &Uuml;berpr&uuml;fung des ordnungsgem&auml;&szlig;en Anlagenbetriebs erforderlich.</p>
            </div>
          </article>
          <article class="accordion-item" data-accordion-item>
            <h3 class="accordion-item__heading">
              <button class="accordion-item__trigger" type="button" aria-expanded="false" aria-controls="risk-faq-panel-3" id="risk-faq-trigger-3" data-accordion-trigger>&Uuml;bernimmt Igienair auch die Reinigung der Anlage?</button>
            </h3>
            <div class="accordion-item__panel" id="risk-faq-panel-3" role="region" aria-labelledby="risk-faq-trigger-3" data-accordion-panel hidden>
              <p>Ja. Neben der Gef&auml;hrdungsbeurteilung f&uuml;hren wir die <a class="text-link" href="../anlagen/kuehlturmreinigung/index.html">Hygienereinigung von Verdunstungsk&uuml;hlanlagen</a> normkonform durch und dokumentieren alle Schritte.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
`;

let gefHtml = head + gefaehrdungMain + tail;
gefHtml = gefHtml
  .replace(
    "<title>Hygieneinspektion nach VDI 6022 - Die Hygienepr&uuml;fung L&uuml;ftung</title>",
    "<title>Gef&auml;hrdungsbeurteilung VDI 2047-2 - Igienair GmbH</title>"
  )
  .replace(
    'content="VDI 6022 Hygieneinspektion Pflicht. Igienair ist Ihr Partner f&uuml;r die Hygieneinspektion nach VDI 6022."',
    'content="Gef&auml;hrdungsbeurteilung nach VDI 2047-2 und 42. BImSchV f&uuml;r Verdunstungsk&uuml;hlanlagen und K&uuml;hlt&uuml;rme &ndash; Igienair GmbH."'
  )
  .replace('class="page-hygiene-inspection"', 'class="page-hygiene-inspection page-gefaehrdungsbeurteilung"')
  .replace("#hygiene-overview", "#risk-overview")
  .replace('aria-label="Hygieneinspektion"', 'aria-label="Gef&auml;hrdungsbeurteilung"');

fs.mkdirSync(path.join(root, "gefaehrdungsbeurteilung-vdi-2047"), { recursive: true });
fs.writeFileSync(path.join(root, "gefaehrdungsbeurteilung-vdi-2047/index.html"), gefHtml, "utf8");

const downloadsMain = `
    <section class="company-hero" id="top" data-section="hero">
      <div class="container company-hero__content">
        <p class="eyebrow">Unternehmen</p>
        <h1>Downloads</h1>
      </div>
    </section>

    <section class="company-section company-section--soft branchen-overview page-downloads__section" id="downloads-list" data-section="overview">
      <div class="container branchen-overview__layout">
        <div class="branchen-overview__intro">
          <p class="eyebrow branchen-overview__eyebrow">INFORMIEREN SIE SICH</p>
          <header class="section-copy branchen-overview__heading">
            <h2>Informationsmaterial zum Download</h2>
            <div class="gradient-line"></div>
          </header>
          <article class="section-copy branchen-overview__copy">
            <p>Erfahren Sie mehr &uuml;ber Igienair und unsere Services und Dienstleistungen. Wir haben Ihnen Informationsmaterialien zum Download bereitgestellt. Denken Sie bitte auch an die Umwelt und drucken Sie die Brosch&uuml;ren und Informationsbl&auml;tter nur aus, wenn dies unbedingt erforderlich ist.</p>
          </article>
        </div>

        <div class="branchen-grid page-downloads__grid" aria-label="Downloads">
          <a class="branchen-card" href="../assets/downloads/igienair-imagebroschuere.pdf" target="_blank" rel="noopener noreferrer">
            <figure class="branchen-card__icon branchen-card__icon--brochure">
              <img src="../assets/images/downloads/brochure-thumb.jpg" alt="Vorschau Imagebrosch&uuml;re">
            </figure>
            <div class="branchen-card__body">
              <h3>Imagebrosch&uuml;re</h3>
              <p>Entdecken Sie Igienair als Partner f&uuml;r technische Hygiene und Raumlufthygiene &ndash; kompakt und &uuml;bersichtlich.</p>
              <span class="branchen-card__link">Download</span>
            </div>
          </a>

          <a class="branchen-card" href="../assets/downloads/igienair-hygieneinspektion.pdf" target="_blank" rel="noopener noreferrer">
            <figure class="branchen-card__icon branchen-card__icon--brochure">
              <img src="../assets/images/downloads/brochure-thumb.jpg" alt="Vorschau Hygieneinspektion">
            </figure>
            <div class="branchen-card__body">
              <h3>Hygieneinspektion</h3>
              <p>Informationsblatt zur Hygieneinspektion nach VDI 6022 &ndash; Pflichten, Ablauf und Vorteile f&uuml;r Betreiber.</p>
              <span class="branchen-card__link">Download</span>
            </div>
          </a>
        </div>
      </div>
    </section>
`;

let downloadsHtml = head + downloadsMain + tail;
downloadsHtml = downloadsHtml
  .replace(
    "<title>Hygieneinspektion nach VDI 6022 - Die Hygienepr&uuml;fung L&uuml;ftung</title>",
    "<title>Downloads - Igienair GmbH</title>"
  )
  .replace(
    'content="VDI 6022 Hygieneinspektion Pflicht. Igienair ist Ihr Partner f&uuml;r die Hygieneinspektion nach VDI 6022."',
    'content="Downloads: Imagebrosch&uuml;re und Informationsmaterial zur Hygieneinspektion von Igienair GmbH."'
  )
  .replace('class="page-hygiene-inspection"', 'class="page-downloads page-branchen"')
  .replace("#hygiene-overview", "#downloads-list")
  .replace('aria-label="Hygieneinspektion"', 'aria-label="Downloads"');

fs.mkdirSync(path.join(root, "downloads"), { recursive: true });
fs.writeFileSync(path.join(root, "downloads/index.html"), downloadsHtml, "utf8");

const loginMain = `
    <section class="company-hero offer-hero" id="top" data-section="hero">
      <div class="container company-hero__content">
        <p class="eyebrow">Extranet</p>
        <h1>Login</h1>
        <a class="button button--solid offer-hero__cta" href="#login-form">Zum Login</a>
      </div>
    </section>

    <section class="intro offer-page page-login__section" id="login-form" data-section="login-form">
      <div class="container offer-page__layout">
        <article class="section-copy offer-page__intro">
          <p class="eyebrow">KUNDENEXTRANET</p>
          <h2>Anmeldung f&uuml;r bestehende Kunden</h2>
          <div class="gradient-line"></div>
          <p>Im Igienair-Extranet finden Sie Gutachten, Dokumentationen und Projektunterlagen. Haben Sie noch keinen Zugang? Wenden Sie sich an Ihren Ansprechpartner oder fordern Sie Zugangsdaten &uuml;ber unser Kontaktformular an.</p>
          <a class="button button--solid" href="../kontakt/angebot-anfordern/index.html">Zugang anfragen</a>
        </article>

        <aside class="quote-card offer-page__form-card">
          <h3>Anmelden</h3>
          <form class="quote-form quote-form--offer page-login__form" action="#" method="post" novalidate>
            <label class="quote-form__field quote-form__field--full">
              <span class="sr-only">Benutzername oder E-Mail</span>
              <input type="text" name="username" placeholder="Benutzername oder E-Mail *" autocomplete="username" required>
            </label>
            <label class="quote-form__field quote-form__field--full">
              <span class="sr-only">Passwort</span>
              <input type="password" name="password" placeholder="Passwort *" autocomplete="current-password" required>
            </label>
            <button class="button button--solid quote-form__submit" type="submit" data-inert>Anmelden</button>
            <p class="page-login__hint">Die Anmeldung ist in der statischen Vorschau deaktiviert. F&uuml;r produktive Zug&auml;nge wenden Sie sich bitte an <a class="text-link" href="../kontakt/index.html">Igienair</a>.</p>
          </form>
        </aside>
      </div>
    </section>
`;

let loginHtml = head + loginMain + tail;
loginHtml = loginHtml
  .replace(
    "<title>Hygieneinspektion nach VDI 6022 - Die Hygienepr&uuml;fung L&uuml;ftung</title>",
    "<title>Login - Igienair GmbH</title>"
  )
  .replace(
    'content="VDI 6022 Hygieneinspektion Pflicht. Igienair ist Ihr Partner f&uuml;r die Hygieneinspektion nach VDI 6022."',
    'content="Login zum Igienair Kunden-Extranet f&uuml;r Gutachten und Projektunterlagen."'
  )
  .replace('class="page-hygiene-inspection"', 'class="page-offer page-login"')
  .replace("#hygiene-overview", "#login-form")
  .replace('aria-label="Hygieneinspektion"', 'aria-label="Login"');

fs.mkdirSync(path.join(root, "login"), { recursive: true });
fs.writeFileSync(path.join(root, "login/index.html"), loginHtml, "utf8");

const inspectionPath = path.join(root, "leistungen/inspektionundgutachten/index.html");
let inspectionHtml = fs.readFileSync(inspectionPath, "utf8");
inspectionHtml = inspectionHtml.replace(
  '<a class="inspection-card inspection-card--gefaehrdungsbeurteilung" href="#!" data-inert>',
  '<a class="inspection-card inspection-card--gefaehrdungsbeurteilung" href="../../gefaehrdungsbeurteilung-vdi-2047/index.html">'
);
fs.writeFileSync(inspectionPath, inspectionHtml, "utf8");

console.log("Seiten erstellt:");
console.log("- gefaehrdungsbeurteilung-vdi-2047/index.html");
console.log("- downloads/index.html");
console.log("- login/index.html");
console.log("- Link in leistungen/inspektionundgutachten aktualisiert");
