// Opens the built site in headless Chromium and checks the live parts and the layout.  npm run test:browser
// Needs playwright with a Chromium (npx playwright install chromium). Run `npm run build` first.
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const html = await readFile(path.join(root, 'index.html'));
const srv = createServer((req, res) => {
  if (req.url !== '/') { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': 'text/html', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:" });
  res.end(html);
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;

let failed = 0, n = 0;
const check = (name, ok, extra = '') => { n++; console.log(`${ok ? 'ok' : 'FAIL'} ${n} - ${name}${extra ? ` (${extra})` : ''}`); if (!ok) failed++; };
const browser = await chromium.launch();
try {
  for (const [name, width, colorScheme] of [['desktop', 1280, 'light'], ['phone', 390, 'light'], ['dark', 1280, 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('request', (r) => { if (r.url() !== url) errors.push(`request: ${r.url()}`); });
    await page.goto(url);
    await page.waitForTimeout(300);
    check(`${name}: no errors, no requests beyond the page, strict CSP`, errors.length === 0, errors.join('; '));
    const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    check(`${name}: no horizontal overflow`, sw <= cw, `${sw} > ${cw}`);
    if (colorScheme === 'dark') {
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      check('dark: body uses the dark ground token', bg === 'rgb(13, 17, 23)', bg);
    }
    if (name === 'desktop') {
      // playground: input → state → class attribute
      await page.fill('#cls', 'p3 rp bs2 ci t1 sb ib');
      await page.waitForTimeout(30);
      check('playground: typed classes land on the box', (await page.getAttribute('[data-bind="class:cls"]', 'class')) === 'p3 rp bs2 ci t1 sb ib');
      check('playground: the code echo follows', (await page.textContent('[data-watch="cls"]')) === 'p3 rp bs2 ci t1 sb ib');
      await page.fill('#label', 'Changed');
      await page.waitForTimeout(30);
      check('playground: text follows the second input', (await page.textContent('[data-bind="class:cls"]')) === 'Changed');
      await page.click('button:has-text("pill")');
      await page.waitForTimeout(30);
      check('playground: preset buttons set the classes through --set', (await page.inputValue('#cls')) === 'p3 rp bs2 ci t1 sb ib');
      const radius = await page.evaluate(() => getComputedStyle(document.querySelector('[data-bind="class:cls"]')).borderRadius);
      check('playground: every utility is on the page, so a fresh class styles (rp = 999px)', radius === '999px', radius);
      // motion: toggle + inc through commands, CSS variable binding
      await page.click('button:has-text("toggle spin")');
      await page.waitForTimeout(30);
      check('motion: data-class toggles an-spin', (await page.getAttribute('[data-class]', 'class')).includes('an-spin'));
      await page.click('button:has-text("level +20")');
      await page.waitForTimeout(30);
      const [lvl, pct, w] = await page.evaluate(() => { const m = document.querySelector('[role=progressbar]'); return [document.querySelector('[data-watch="level"]').textContent, m.style.getPropertyValue('--pct'), m.firstElementChild.getBoundingClientRect().width / m.getBoundingClientRect().width]; });
      check('motion: --inc updates the level and the --pct variable', lvl === '80' && pct === '80', `${lvl} ${pct}`);
      await page.waitForTimeout(600);
      const w2 = await page.evaluate(() => { const m = document.querySelector('[role=progressbar]'); return m.firstElementChild.getBoundingClientRect().width / m.getBoundingClientRect().width; });
      check('motion: an-grow meter follows --pct (eased)', Math.abs(w2 - .8) < .02, `${w.toFixed(2)} → ${w2.toFixed(2)}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  srv.close();
}
console.log(`\n${n - failed}/${n} passed`);
process.exit(failed ? 1 : 0);
