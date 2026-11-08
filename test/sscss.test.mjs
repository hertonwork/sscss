// node --test test/   (npm test builds first, so dist/ and index.html are fresh)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { core, cssFor, fullCss, ruleFor, vocab, groups, variants, scale, type, widths, classesIn, hiddenWins } from '../src/vocab.mjs';
import { motion, reduced } from '../src/motion.mjs';

const run = promisify(execFile);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bin = path.join(root, 'bin/sscss.mjs');
const gz = (s) => gzipSync(s, { level: 9 }).length;

test('vocabulary: names are a few letters plus an optional scale digit, and every utility is documented', () => {
  for (const name of Object.keys(vocab)) assert.match(name, /^(an-[a-z]+|[a-z]{1,4}\d{0,2})$/, name);
  const documented = new Set(Object.values(groups).flat().map(([n]) => n));
  for (const name of Object.keys(vocab)) assert.ok(documented.has(name), `${name} has no cheat-sheet entry`);
  assert.ok(Object.keys(vocab).length >= 200);
});

test('vocabulary: scales are the documented ones', () => {
  assert.equal(scale.length, 11); assert.equal(type.length, 10); assert.equal(widths.length, 7);
  assert.equal(ruleFor('p4').rule, '.p4{padding:1rem}');
  assert.equal(ruleFor('mt10').rule, '.mt10{margin-top:8rem}');
  assert.equal(ruleFor('sy2').rule, '.sy2>*+*{margin-top:0.5rem}');
  assert.equal(ruleFor('t0').rule, '.t0{font-size:0.75rem;line-height:1.5}');
  assert.equal(ruleFor('w6').rule, '.w6{max-width:65ch}');
  assert.equal(ruleFor('gr').rule, '.gr{display:grid}.gr>*{min-width:0}');
});

test('core: reset, tokens, dark mode, and the 300 B promise', () => {
  assert.match(core, /box-sizing:border-box/);
  assert.match(core, /:root\{--ink:/);
  assert.match(core, /@media\(prefers-color-scheme:dark\)\{:root\{--ink:/);
  assert.ok(gz(core) <= 320, `core is ${gz(core)} B gzipped`);
});

test('[hidden] beats display utilities: once per page that uses one, never in the core', () => {
  const count = (css) => css.split(hiddenWins).length - 1;
  assert.equal(count(cssFor(['f', 'gr', 'bk', 'ib', 'fc', 'm-f', 'l-gr']).css), 1, 'once, however many display utilities');
  assert.ok(cssFor(['f']).css.endsWith(hiddenWins), 'after the utilities');
  assert.equal(count(cssFor(['p4', 't3', 'ci', 'c2', 'hd']).css), 0, 'no display utility (hd sets display:none itself), no rule');
  assert.equal(count(core), 0, 'the 300 B core stays 300 B');
  assert.equal(count(fullCss()), 1);
});

test('variants: h- adds :hover, m-/l- wrap in media queries, grouped once each', () => {
  assert.equal(ruleFor('h-cm').rule, '.h-cm:hover{color:var(--mut)}');
  assert.equal(ruleFor('m-c2').variant, 'm');
  assert.equal(ruleFor('l-f').variant, 'l');
  const { css } = cssFor(['m-c2', 'm-f', 'l-c3', 'f'], { withCore: false });
  assert.equal(css, '.f{display:flex}@media(min-width:768px){.m-c2{grid-template-columns:repeat(2,minmax(0,1fr))}.m-f{display:flex}}@media(min-width:1024px){.l-c3{grid-template-columns:repeat(3,minmax(0,1fr))}}' + hiddenWins);
  assert.equal((fullCss().match(/@media\(min-width:768px\)/g) || []).length, 1, 'one 768px query in the full sheet');
  assert.equal(variants.m.doc, 'at ≥ 768px');
});

test('classesIn: tags only, no <style>/<script>, no text; data-class toggles count as used', () => {
  assert.deepEqual([...classesIn('<style>.a{}</style><p class="f ac" data-class="an-spin:busy done:$.done">class="t"</p><script>"class=\\"z\\""</script>')], ['f', 'ac', 'an-spin', 'done']);
});

test('generator: only used rules, sorted, deduplicated, unknown reported, core optional', () => {
  const { css, unknown } = cssFor(['p4', 'f', 'p4', 'nope', 'ac', 'x-y'], { withCore: false });
  assert.equal(css, '.ac{align-items:center}.f{display:flex}.p4{padding:1rem}' + hiddenWins, 'f brings the [hidden] rule');
  assert.deepEqual(unknown, ['nope', 'x-y']);
  assert.ok(cssFor(['f']).css.startsWith(core));
});

test('motion: every utility is reduced-motion safe and globals are emitted once', () => {
  for (const [name, m] of Object.entries(motion)) { assert.ok(vocab[name], name); assert.ok(m.doc); }
  const { css } = cssFor(['an-spin', 'an-rise', 'an-fx', 'h-an-fx'], { withCore: false });
  assert.equal(css.split(reduced).length - 1, 1, 'reduced-motion rule once');
  assert.equal(css.split('@keyframes ss-spin').length - 1, 1, 'spin keyframes once');
  assert.match(css, /\.an-rise\{animation:ss-rise/);
  assert.match(css, /\.an-grow|\.an-fx\{transition/);
  assert.doesNotMatch(fullCss(), /\.m-an-/, 'no responsive variants of motion utilities');
  assert.doesNotMatch(fullCss(), /\.an-sea/, 'hero decorations are generate-only');
  assert.match(cssFor(['an-sea'], { withCore: false }).css, /\.an-sea::before/, 'but they generate');
  assert.equal(cssFor(['f'], { withCore: false }).css.includes('prefers-reduced-motion'), false, 'no motion, no reduced-motion rule');
});

test('dist: the three stylesheets are what the API returns, within budget', async () => {
  const [full, base, c] = await Promise.all(['sscss.css', 'sscss.base.css', 'sscss.core.css'].map((f) => readFile(path.join(root, 'dist', f), 'utf8')));
  assert.equal(full, fullCss()); assert.equal(base, fullCss({ responsive: false })); assert.equal(c, core);
  assert.ok(gz(base) <= 2300, `base ${gz(base)} B gz`); assert.ok(gz(full) <= 3800, `full ${gz(full)} B gz`);
});

test('cli: generates, --write inlines idempotently, page-own classes are not unknown, --check fails on real unknowns', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'sscss-'));
  const page = path.join(dir, 'page.html');
  const src = `<!DOCTYPE html><html><head><title>t</title><!-- a comment that mentions <style data-sscss>, <style> and </head> --><style>.hero{font-size:3rem}</style></head>
<body><div class="f ac m-c2 hero"><p class="p4" data-class="an-spin:busy">hi</p><code>class="not-a-class"</code></div></body></html>`;
  await writeFile(page, src);
  const { stdout, stderr } = await run('node', [bin, page]);
  assert.match(stderr, /6 classes, 5 from the vocabulary, 1 the page's own/);
  assert.doesNotMatch(stderr, /not in the vocabulary/);
  assert.ok(stdout.startsWith(core) && stdout.includes('.m-c2{') && stdout.includes('.an-spin{') && !stdout.includes('not-a-class'), 'data-class toggles are generated, text is not markup');
  await run('node', [bin, page, '--write']);
  const once = await readFile(page, 'utf8');
  assert.match(once, /<style data-sscss>[^<]+<\/style>\n<\/head>/);
  assert.match(once, /<style>\.hero\{font-size:3rem\}<\/style>/, 'the page-own style survives a comment that mentions the tag');
  await run('node', [bin, page, '--write']);
  assert.equal(await readFile(page, 'utf8'), once, 'second --write changes nothing');
  await writeFile(page, src.replace('class="f ac', 'class="f ac zz'));
  await assert.rejects(run('node', [bin, page, '--check']), (e) => /not in the vocabulary and not styled by the page: zz/.test(e.stderr) && e.code === 1);
  const list = await run('node', [bin, '--list']);
  assert.match(list.stdout, /^\nLayout\n  f {7}flex row/);
});

test('site: one file, no requests, built from the template with minim and the full vocabulary', async () => {
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+stylesheet/);
  assert.doesNotMatch(html, /<!--minim-->|<!--sscss-full-->|__PAGE_/);
  assert.match(html, /<style data-sscss>/); assert.match(html, /<style data-sscss-full>/);
  assert.match(html, /globalThis\.minim|minim=/);
  assert.ok(gz(html) < 16_000, `index.html ${gz(html)} B gz`);
});

test('skill: the bundled generator and cheat sheet are built from the sources and agree with them', async () => {
  const skill = path.join(root, 'skills/sscss');
  const sheet = await readFile(path.join(skill, 'references/vocab.md'), 'utf8');
  for (const name of Object.keys(vocab)) assert.ok(sheet.includes(`| \`${name}\` |`), `${name} missing from references/vocab.md`);
  const dir = await mkdtemp(path.join(tmpdir(), 'sscss-skill-'));
  const page = path.join(dir, 'p.html');
  await writeFile(page, '<!DOCTYPE html><html><head><title>t</title></head><body><p class="f m-c2 an-fx">x</p></body></html>');
  const [a, b] = await Promise.all([run('node', [bin, page]), run('node', [path.join(skill, 'scripts/sscss.mjs'), page])]);
  assert.equal(a.stdout, b.stdout, 'skill generator output differs from bin/sscss.mjs');
  assert.equal(a.stdout, cssFor(['f', 'm-c2', 'an-fx']).css);
  const bundle = await import(path.join(skill, 'scripts/sscss.mjs'));
  assert.equal(bundle.cssFor(['f', 'm-c2', 'an-fx']).css, cssFor(['f', 'm-c2', 'an-fx']).css, 'the bundle is importable and agrees');
  assert.equal(typeof bundle.main, 'function');
  const starter = await readFile(path.join(skill, 'assets/starter.html'), 'utf8');
  assert.deepEqual(cssFor([...classesIn(starter)]).unknown, [], 'starter uses only vocabulary classes');
  assert.match(starter, /<script><!--minim--><\/script>\s*<\/body>/);
});
