/**
 * Visuelle Stichprobe via Chrome DevTools Protocol (ohne npm)
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const ROOT = process.cwd();
const PORT = 8765;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = join(ROOT, 'asset-analysis', 'output', 'benefits-visual-check');

const PAGES = [
  { file: 'konstanz.html', label: 'Konstanz (Referenz)' },
  { file: 'wiesbaden.html', label: 'Wiesbaden (umgebaut)' },
  { file: 'regensburg.html', label: 'Regensburg (fix)' },
  { file: 'falkensee.html', label: 'Falkensee (fix)' },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\//, '') || 'index.html';
        const filePath = join(ROOT, rel);
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404).end('Not found');
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForChrome(port, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(300);
  }
  throw new Error('Chrome debugging port not ready');
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function inspectPage(cdp, url, slug) {
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.navigate', { url });
  await sleep(2500);

  const evalResult = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector('[data-section="benefits"], .karlsruhe-benefits, .cleanroom-benefits, .city-reference-benefits');
      if (!section) return { error: 'Kein Vorteile-Abschnitt gefunden' };
      section.scrollIntoView({ block: 'center' });
      const cards = section.querySelectorAll('.karlsruhe-benefit-card');
      const icons = section.querySelectorAll('.karlsruhe-benefit-card__icon');
      const legacy = {
        dots: section.querySelectorAll('.cleanroom-benefits__dot').length,
        items: section.querySelectorAll('.cleanroom-benefits__item').length,
        benefitCards: section.querySelectorAll('.benefit-card:not(.karlsruhe-benefit-card)').length,
      };
      const icon = icons[0];
      let iconStyle = null;
      if (icon) {
        const cs = getComputedStyle(icon);
        iconStyle = {
          display: cs.display,
          width: cs.width,
          height: cs.height,
          borderRadius: cs.borderRadius,
          backgroundColor: cs.backgroundColor,
        };
      }
      const rect = section.getBoundingClientRect();
      return {
        cardCount: cards.length,
        iconCount: icons.length,
        legacy,
        iconStyle,
        clip: {
          x: Math.max(0, rect.x),
          y: Math.max(0, rect.y),
          width: rect.width,
          height: rect.height,
          scale: 1,
        },
      };
    })()`,
    returnByValue: true,
  });

  const data = evalResult.result.value;
  if (data.error) throw new Error(data.error);

  await sleep(400);

  const shot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: data.clip,
  });

  const desktopPath = join(OUT, `${slug}-benefits.png`);
  writeFileSync(desktopPath, Buffer.from(shot.data, 'base64'));

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(300);

  const mobileEval = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const section = document.querySelector('[data-section="benefits"], .karlsruhe-benefits, .cleanroom-benefits, .city-reference-benefits');
      section.scrollIntoView({ block: 'start' });
      const rect = section.getBoundingClientRect();
      return {
        clip: { x: Math.max(0, rect.x), y: Math.max(0, rect.y), width: rect.width, height: Math.min(rect.height, 1200), scale: 1 },
      };
    })()`,
    returnByValue: true,
  });

  await sleep(400);
  const mobileShot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: mobileEval.result.value.clip,
  });
  const mobilePath = join(OUT, `${slug}-benefits-mobile.png`);
  writeFileSync(mobilePath, Buffer.from(mobileShot.data, 'base64'));

  await cdp.send('Emulation.clearDeviceMetricsOverride');

  const iconStyleOk =
    data.iconStyle &&
    data.iconStyle.display !== 'none' &&
    parseFloat(data.iconStyle.width) >= 10 &&
    parseFloat(data.iconStyle.height) >= 10;

  const ok =
    data.cardCount > 0 &&
    data.iconCount === data.cardCount &&
    data.legacy.dots === 0 &&
    data.legacy.items === 0 &&
    data.legacy.benefitCards === 0 &&
    iconStyleOk;

  return { ...data, ok, desktopPath, mobilePath };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const server = await startServer();

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--remote-debugging-port=9333',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    const version = await waitForChrome(9333);
    const createRes = await fetch(`http://127.0.0.1:9333/json/new?about:blank`, { method: 'PUT' });
    const target = await createRes.json();
    const cdp = new CDP(target.webSocketDebuggerUrl);

    console.log('\n=== Vorteile – visuelle Stichprobe ===\n');
    let allOk = true;

    for (const { file, label } of PAGES) {
      const slug = file.replace('.html', '');
      const url = `http://127.0.0.1:${PORT}/${file}`;
      try {
        const result = await inspectPage(cdp, url, slug);
        allOk = allOk && result.ok;
        console.log(`${result.ok ? '✅' : '❌'} ${label} (${file})`);
        console.log(`   Karten: ${result.cardCount}, Icons: ${result.iconCount}`);
        if (result.iconStyle) {
          console.log(`   Icon: ${result.iconStyle.width}×${result.iconStyle.height}, bg=${result.iconStyle.backgroundColor}`);
        }
        console.log(`   Desktop: ${result.desktopPath}`);
        console.log(`   Mobile:  ${result.mobilePath}\n`);
      } catch (err) {
        allOk = false;
        console.log(`❌ ${label} (${file}): ${err.message}\n`);
      }
    }

    cdp.close();
    process.exit(allOk ? 0 : 1);
  } finally {
    chrome.kill();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
