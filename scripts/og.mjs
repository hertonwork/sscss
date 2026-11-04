// Renders docs/og.png (1200×630), the card link previews show. Needs playwright + a Chromium:
//   npm i -D playwright && npx playwright install chromium && node scripts/og.mjs
// It is committed, so the build does not depend on a browser; re-run it when the numbers or the look change.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { core, cssFor, classesIn, fullCss } from '../src/vocab.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const gz = (s) => gzipSync(s, { level: 9 }).length;
const page = await readFile(path.join(root, 'index.html'), 'utf8');
const pageGz = gz((page.match(/<style data-sscss>([^<]*)/) || [, ''])[1]);
const body = `
<header class="f ac jb px10 pt8" style="height:130px"><strong class="t7 tt">sscss</strong><span class="t3 cm">super small css</span></header>
<main class="rel oh f ac" style="height:500px"><div class="an-sea" aria-hidden="true"></div>
  <div class="rel px10 f g10 ac wf">
    <div>
      <p class="cm t3 m0">Minified + gzipped</p>
      <p class="b ca m0" style="font-size:9rem;line-height:1;letter-spacing:-.05em">300 B</p>
      <p class="t3 cm m0 mt2">core: reset, tokens, dark mode</p>
    </div>
    <div class="r2 bs p6 t3 sy2" style="min-width:420px">
      <p class="m0"><code>f ac jb</code> <span class="cm">flex, centered, space between</span></p>
      <p class="m0"><code>r2 bs p6</code> <span class="cm">card</span></p>
      <p class="m0"><code>r ba cw px5 py3</code> <span class="cm">button</span></p>
      <p class="m0 mt4 cm">a whole page: ${pageGz.toLocaleString('en-US')} B of CSS, one request</p>
    </div>
  </div>
</main>`;
const css = fullCss({ responsive: false });
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${css}
body{width:1200px;height:630px;overflow:hidden;font-size:22px}code{font-family:ui-monospace,Menlo,monospace;background:var(--sf2);padding:.1em .4em;border-radius:6px;font-size:.95em}
.an-sea::before,.an-sea::after{animation:none}</style></head><body>${body}</body></html>`;
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'light' });
await p.setContent(html); await p.waitForTimeout(200);
await p.screenshot({ path: path.join(root, 'docs/og.png') });
await browser.close();
console.log('docs/og.png written');
