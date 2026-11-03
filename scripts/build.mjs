// Builds dist/ (the "just load it" stylesheets), the README cheat sheet, and index.html (the site, built with sscss).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { core, cssFor, fullCss, groups, ruleFor, variants, vocab, classesIn, scale, type, widths, tokens, darkTokens } from '../src/vocab.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const gz = (s) => gzipSync(s, { level: 9 }).length;
const br = (s) => brotliCompressSync(s, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const fmt = (s) => `${s.length} B · ${gz(s)} B gzip · ${br(s)} B brotli`;

// 1. dist
await mkdir(path.join(root, 'dist'), { recursive: true });
const full = fullCss(), base = fullCss({ responsive: false });
await writeFile(path.join(root, 'dist/sscss.css'), full);
await writeFile(path.join(root, 'dist/sscss.base.css'), base);
await writeFile(path.join(root, 'dist/sscss.core.css'), core);
const sizes = { core: fmt(core), base: fmt(base), full: fmt(full), utilities: Object.keys(vocab).length };
console.log(`core  ${sizes.core}\nbase  ${sizes.base} (${sizes.utilities} utilities)\nfull  ${sizes.full} (+ m-/l- variants)`);

// 2. cheat sheet in README between markers
const sheet = Object.entries(groups).map(([group, items]) =>
  `### ${group}\n\n| class | does |\n|---|---|\n` + items.map(([n, , d]) => `| \`${n}\` | ${d} |`).join('\n')
).join('\n\n') + `\n\n### Variants\n\n| prefix | applies |\n|---|---|\n` + Object.entries(variants).map(([p, v]) => `| \`${p}-\` | ${v.doc} |`).join('\n');
const readmePath = path.join(root, 'README.md');
let readme = await readFile(readmePath, 'utf8');
readme = readme.replace(/<!-- cheatsheet -->[\s\S]*<!-- \/cheatsheet -->/, () => `<!-- cheatsheet -->\n${sheet}\n<!-- /cheatsheet -->`);

// 3. the site: docs/index.template.html → index.html, one request.
//    <!--minim-->       → Minim (module build, for data-class and CSS-variable bindings), inlined at the end of <body>
//    <!--sscss-full-->  → every utility the page's own generated CSS won't already carry, so the playground can use any class
//    then `sscss index.html --write` generates and inlines what the page itself uses, like on any other page.
const tpl = path.join(root, 'docs/index.template.html'), out = path.join(root, 'index.html');
let html = await readFile(tpl, 'utf8');
const minim = await readFile(path.join(root, 'node_modules/@labs_kai/minim/dist/minim.min.js'), 'utf8');
html = html.replace('<!--minim-->', () => minim.trim());
const used = classesIn(html);
const pageCss = cssFor([...used]).css;
let extra = cssFor(Object.keys(vocab).filter((n) => !used.has(n)), { withCore: false }).css;
for (const g of [...extra.matchAll(/@keyframes[^{]+\{[^}]*\}\}?|@media\(prefers-reduced-motion[\s\S]+?\}\}|::view-transition-group[^}]*\}/g)].map((m) => m[0]))
  if (pageCss.includes(g)) extra = extra.replace(g, '');
html = html.replace('<!--sscss-full-->', () => `<style data-sscss-full>${extra}</style>`);
// the hero chart's "this page" row: real numbers from the generator, not a claim
const pageN = [...used].filter((c) => ruleFor(c)).length, pageGz = gz(pageCss);
readme = readme.replace(/<!-- sizes -->[\s\S]*<!-- \/sizes -->/, () =>
  `<!-- sizes -->\n| | bytes | gzip | brotli |\n|---|---|---|---|\n` +
  [['core (reset + tokens + dark mode)', core], [`the site's page (${pageN} utilities, generated)`, pageCss], ['every utility', base], ['every utility + responsive variants', full]]
    .map(([l, s]) => `| ${l} | ${s.length.toLocaleString('en-US')} | ${gz(s).toLocaleString('en-US')} | ${br(s).toLocaleString('en-US')} |`).join('\n') + `\n<!-- /sizes -->`);
await writeFile(readmePath, readme);
html = html.replaceAll('__PAGE_N__', String(pageN)).replaceAll('__PAGE_GZ__', pageGz.toLocaleString('en-US')).replaceAll('__PAGE_W__', (pageGz / 13110 * 100).toFixed(1));
await writeFile(out, html);
execFileSync('node', [path.join(root, 'bin/sscss.mjs'), out, '--write'], { stdio: 'inherit' });
const page = await readFile(out, 'utf8');
console.log(`index.html  ${fmt(page)}  (playground extra ${gz(extra)} B gzip, Minim ${gz(minim)} B gzip)`);

// 4. the skill: a self-contained generator (motion + vocab + cli in one file), the cheat sheet, the full stylesheet
const skill = path.join(root, 'skills/sscss');
await mkdir(path.join(skill, 'scripts'), { recursive: true });
await mkdir(path.join(skill, 'references'), { recursive: true });
await mkdir(path.join(skill, 'assets'), { recursive: true });
const strip = (s) => s.replace(/^import .*\n/gm, '').replace(/^#!.*\n/, '');
const [motionSrc, vocabSrc, cliSrc] = await Promise.all(['src/motion.mjs', 'src/vocab.mjs', 'bin/sscss.mjs'].map((f) => readFile(path.join(root, f), 'utf8')));
await writeFile(path.join(skill, 'scripts/sscss.mjs'),
  `#!/usr/bin/env node\n// sscss ${JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version} — built from src/motion.mjs, src/vocab.mjs and bin/sscss.mjs by scripts/build.mjs. Do not edit; edit the sources.\n// Run it (node sscss.mjs page.html --write) or import it (import { cssFor, classesIn, fullCss, core, vocab } from './sscss.mjs').\n` +
  `import { readFile, writeFile } from 'node:fs/promises';\nimport { realpathSync } from 'node:fs';\nimport { pathToFileURL } from 'node:url';\nimport { gzipSync } from 'node:zlib';\n\n${strip(motionSrc)}\n${strip(vocabSrc)}\n${strip(cliSrc)}`);
await writeFile(path.join(skill, 'references/vocab.md'),
  `# sscss cheat sheet\n\nGenerated by \`scripts/build.mjs\` from \`src/vocab.mjs\`. Spacing scale 0–10 = ${scale.join(' ')} rem; type t0–t9 = ${type.join(' ')} rem; widths w0–w6 = ${widths.join(' ')}.\n\nTokens: \`${Object.keys(tokens).map((k) => '--' + k).join(' ')}\` (light: ${Object.entries(tokens).map(([k, v]) => `${k} ${v}`).join(', ')}; dark: ${Object.entries(darkTokens).map(([k, v]) => `${k} ${v}`).join(', ')}).\n\n${sheet}\n`);
await writeFile(path.join(skill, 'assets/sscss.base.css'), base);
await writeFile(path.join(skill, 'assets/sscss.core.css'), core);
console.log(`skill: scripts/sscss.mjs, references/vocab.md, assets/sscss.{base,core}.css`);
