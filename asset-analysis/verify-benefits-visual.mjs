/**
 * Visuelle Stichprobe: Vorteile-Abschnitt (karlsruhe-benefit-card + Icon)
 * Usage: node asset-analysis/verify-benefits-visual.mjs
 * Requires: npx playwright (chromium)
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'http://127.0.0.1:8765';
const PAGES = [
  { file: 'konstanz.html', label: 'Konstanz (Referenz)' },
  { file: 'wiesbaden.html', label: 'Wiesbaden (umgebaut)' },
  { file: 'regensburg.html', label: 'Regensburg (fix)' },
  { file: 'falkensee.html', label: 'Falkensee (fix)' },
];

const OUT = join(process.cwd(), 'asset-analysis', 'output', 'benefits-visual-check');

async function checkPage(page, { file, label }) {
  const url = `${BASE}/${file}`;
  await page.goto(url, { waitUntil: 'networkidle' });

  const section = page.locator('[data-section="benefits"], .karlsruhe-benefits, .cleanroom-benefits, .city-reference-benefits').first();
  await section.scrollIntoViewIfNeeded();

  const cards = section.locator('.karlsruhe-benefit-card');
  const cardCount = await cards.count();
  const icons = section.locator('.karlsruhe-benefit-card__icon');
  const iconCount = await icons.count();
  const legacyDots = await section.locator('.cleanroom-benefits__dot').count();
  const legacyItems = await section.locator('.cleanroom-benefits__item').count();
  const legacyBenefitCards = await section.locator('.benefit-card:not(.karlsruhe-benefit-card)').count();

  let iconStyleOk = true;
  let iconDetails = [];

  if (iconCount > 0) {
    const firstIcon = icons.first();
    const styles = await firstIcon.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        display: cs.display,
        width: cs.width,
        height: cs.height,
        borderRadius: cs.borderRadius,
        backgroundColor: cs.backgroundColor,
      };
    });
    iconDetails = styles;
    iconStyleOk =
      styles.display !== 'none' &&
      parseFloat(styles.width) >= 10 &&
      parseFloat(styles.height) >= 10 &&
      styles.borderRadius.includes('999') || parseFloat(styles.borderRadius) >= 50;
  }

  const screenshotPath = join(OUT, `${file.replace('.html', '')}-benefits.png`);
  await section.screenshot({ path: screenshotPath });

  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await section.scrollIntoViewIfNeeded();
  const mobileScreenshotPath = join(OUT, `${file.replace('.html', '')}-benefits-mobile.png`);
  await section.screenshot({ path: mobileScreenshotPath });
  await page.setViewportSize(viewport);

  const ok =
    cardCount > 0 &&
    iconCount === cardCount &&
    legacyDots === 0 &&
    legacyItems === 0 &&
    legacyBenefitCards === 0 &&
    iconStyleOk;

  return {
    label,
    file,
    ok,
    cardCount,
    iconCount,
    legacyDots,
    legacyItems,
    legacyBenefitCards,
    iconDetails,
    screenshotPath,
    mobileScreenshotPath,
  };
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = [];

for (const entry of PAGES) {
  try {
    results.push(await checkPage(page, entry));
  } catch (err) {
    results.push({ label: entry.label, file: entry.file, ok: false, error: String(err) });
  }
}

await browser.close();

console.log('\n=== Vorteile – visuelle Stichprobe ===\n');
for (const r of results) {
  if (r.error) {
    console.log(`❌ ${r.label} (${r.file}): ${r.error}`);
    continue;
  }
  const mark = r.ok ? '✅' : '❌';
  console.log(`${mark} ${r.label} (${r.file})`);
  console.log(`   Karten: ${r.cardCount}, Icons: ${r.iconCount}`);
  if (r.legacyDots || r.legacyItems || r.legacyBenefitCards) {
    console.log(`   Legacy: dots=${r.legacyDots}, items=${r.legacyItems}, benefit-card=${r.legacyBenefitCards}`);
  }
  if (r.iconDetails?.backgroundColor) {
    console.log(`   Icon-Stil: ${r.iconDetails.width}×${r.iconDetails.height}, bg=${r.iconDetails.backgroundColor}`);
  }
  console.log(`   Screenshot: ${r.screenshotPath}`);
  console.log(`   Mobile:     ${r.mobileScreenshotPath}`);
  console.log('');
}

const allOk = results.every((r) => r.ok);
process.exit(allOk ? 0 : 1);
