// sscss — the vocabulary. Short class names → declarations.
import { motion, reduced } from './motion.mjs';
// Names are 1–3 letters plus an optional scale digit. Values reference the tokens in `core`, so a page sets its
// look (and dark mode) once in :root. Variants: `h-` hover, `m-` ≥ 768px, `l-` ≥ 1024px.

export const tokens = {
  ink: '#0b0f14', mut: '#4b5563', bg: '#fff', sf: '#f2f4f7', sf2: '#dfe3e9', acc: '#1a7a37', acci: '#fff', r: '8px',
};
export const darkTokens = {
  ink: '#e6edf3', mut: '#9ca3af', bg: '#0d1117', sf: '#161b22', sf2: '#2a313b', acc: '#3fb950', acci: '#0d1117',
};
const vars = (t) => Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';');

/** Reset + tokens + automatic dark mode. The only CSS a page always carries. */
export const core =
  `*,::before,::after{box-sizing:border-box;border:0 solid}` +
  `body{margin:0;font:16px/1.5 ui-sans-serif,system-ui,sans-serif;background:var(--bg);color:var(--ink)}` +
  `img,svg{max-width:100%;height:auto}` +
  `:root{${vars(tokens)}}` +
  `@media(prefers-color-scheme:dark){:root{${vars(darkTokens)}}}`;

export const scale = [0, .25, .5, .75, 1, 1.5, 2, 3, 4, 6, 8];                // 0–10, rem
export const type = [.75, .875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 3.75]; // t0–t9, rem
export const widths = ['20rem', '28rem', '36rem', '48rem', '60rem', '72rem', '65ch'];  // w0–w6 (w6 = prose measure)

const rem = (n) => (scale[n] === 0 ? '0' : scale[n] + 'rem');

/** name → declaration. A declaration starting with ">" is a child selector suffix (e.g. sy2). */
export const vocab = {};
export const groups = {};
const add = (group, name, decl, doc) => { vocab[name] = decl; (groups[group] ||= []).push([name, decl, doc]); };

// ---- layout ----
add('Layout', 'f', 'display:flex', 'flex row');
add('Layout', 'fc', 'display:flex;flex-direction:column', 'flex column');
add('Layout', 'fr', 'flex-direction:row', 'row (e.g. m-fr after fc)');
add('Layout', 'fw', 'flex-wrap:wrap', 'wrap');
add('Layout', 'gr', '{display:grid}&>*{min-width:0}', 'grid; children may shrink (code blocks don\'t overflow)');
for (let i = 1; i <= 6; i++) add('Layout', 'c' + i, `grid-template-columns:repeat(${i},minmax(0,1fr))`, i + ' equal columns');
add('Layout', 'bk', 'display:block', 'block');
add('Layout', 'ib', 'display:inline-block', 'inline-block');
add('Layout', 'hd', 'display:none', 'hidden');
add('Layout', 'ac', 'align-items:center', 'align center');
add('Layout', 'ae', 'align-items:end', 'align end');
add('Layout', 'jc', 'justify-content:center', 'justify center');
add('Layout', 'jb', 'justify-content:space-between', 'space between');
add('Layout', 'je', 'justify-content:end', 'justify end');
add('Layout', 'pc', 'place-items:center', 'center both axes (grid)');
add('Layout', 'x', 'flex:1', 'grow to fill');
add('Layout', 'fs0', 'flex-shrink:0', 'never shrink');
add('Layout', 'mx', 'margin-inline:auto', 'center horizontally');
add('Layout', 'rel', 'position:relative', 'relative');
add('Layout', 'abs', 'position:absolute', 'absolute');
add('Layout', 'stk', 'position:sticky;top:0', 'sticky to top');
add('Layout', 'ov', 'overflow:auto', 'scroll if needed');
add('Layout', 'oh', 'overflow:hidden', 'clip');
add('Layout', 'wf', 'width:100%', 'full width');
add('Layout', 'hf', 'height:100%', 'full height');
add('Layout', 'vh', 'min-height:100vh', 'at least the viewport');
for (let i = 0; i < widths.length; i++) add('Layout', 'w' + i, 'max-width:' + widths[i], 'max-width ' + widths[i]);

// ---- spacing ----
for (let i = 0; i < scale.length; i++) {
  const v = rem(i), d = (scale[i] + 'rem').replace('0rem', '0');
  add('Spacing', 'p' + i, 'padding:' + v, 'padding ' + d);
  add('Spacing', 'px' + i, 'padding-inline:' + v, 'padding left+right ' + d);
  add('Spacing', 'py' + i, 'padding-block:' + v, 'padding top+bottom ' + d);
  add('Spacing', 'pt' + i, 'padding-top:' + v, 'padding top ' + d);
  add('Spacing', 'pb' + i, 'padding-bottom:' + v, 'padding bottom ' + d);
  add('Spacing', 'm' + i, 'margin:' + v, 'margin ' + d);
  add('Spacing', 'mt' + i, 'margin-top:' + v, 'margin top ' + d);
  add('Spacing', 'mb' + i, 'margin-bottom:' + v, 'margin bottom ' + d);
  add('Spacing', 'my' + i, 'margin-block:' + v, 'margin top+bottom ' + d);
  add('Spacing', 'g' + i, 'gap:' + v, 'gap ' + d);
  add('Spacing', 'sy' + i, `>*+*{margin-top:${v}}`, 'space between children ' + d);
}

// ---- type ----
for (let i = 0; i < type.length; i++) add('Type', 't' + i, `font-size:${type[i]}rem;line-height:${type[i] >= 1.875 ? 1.1 : 1.5}`, `font-size ${type[i]}rem`);
add('Type', 'b', 'font-weight:700', 'bold');
add('Type', 'sb', 'font-weight:600', 'semibold');
add('Type', 'md', 'font-weight:500', 'medium');
add('Type', 'tt', 'letter-spacing:-.025em', 'tight tracking (headlines)');
add('Type', 'lt', 'line-height:1.2', 'tight leading');
add('Type', 'mono', 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace', 'monospace');
add('Type', 'up', 'text-transform:uppercase', 'uppercase');
add('Type', 'nu', 'text-decoration:none', 'no underline');
add('Type', 'tn', 'font-variant-numeric:tabular-nums', 'tabular numbers');
add('Type', 'ctr', 'text-align:center', 'text center');
add('Type', 'rt', 'text-align:right', 'text right');
add('Type', 'nw', 'white-space:nowrap', 'no wrap');
add('Type', 'bal', 'text-wrap:balance', 'balanced headline wrapping');

// ---- color roles (tokens) ----
add('Color', 'ci', 'color:var(--ink)', 'ink');
add('Color', 'cm', 'color:var(--mut)', 'muted');
add('Color', 'ca', 'color:var(--acc)', 'accent');
add('Color', 'cw', 'color:var(--acci)', 'text on accent');
add('Color', 'bg', 'background:var(--bg)', 'ground');
add('Color', 'bs', 'background:var(--sf)', 'surface');
add('Color', 'bs2', 'background:var(--sf2)', 'surface 2 (controls)');
add('Color', 'ba', 'background:var(--acc)', 'accent');

// ---- shape & feedback ----
add('Shape', 'r', 'border-radius:var(--r)', 'radius');
add('Shape', 'r2', 'border-radius:calc(var(--r)*2)', 'double radius');
add('Shape', 'rp', 'border-radius:999px', 'pill');
add('Shape', 'r0', 'border-radius:0', 'square');
add('Shape', 'bd', 'border:1px solid var(--sf2)', 'hairline border');
add('Shape', 'bd2', 'border:2px solid var(--acc)', 'accent border');
add('Shape', 'sh', 'box-shadow:0 24px 60px rgb(0 0 0/.3)', 'floating shadow (dialogs)');
add('Shape', 'tr', 'transition:.15s', 'transition');
add('Shape', 'op', 'opacity:.6', 'dimmed');
add('Shape', 'cp', 'cursor:pointer', 'pointer');
add('Shape', 'sr', 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)', 'screen-reader only');

// ---- motion (src/motion.mjs) ----
for (const [name, m] of Object.entries(motion)) add('Motion (sscss/motion)', name, m, m.doc);

export const variants = {
  h: { wrap: (rule) => rule, selector: (sel) => sel + ':hover', doc: 'on hover' },
  m: { wrap: (rules) => `@media(min-width:768px){${rules}}`, doc: 'at ≥ 768px' },
  l: { wrap: (rules) => `@media(min-width:1024px){${rules}}`, doc: 'at ≥ 1024px' },
};

const esc = (c) => c.replace(/[^a-zA-Z0-9_-]/g, (ch) => '\\' + ch);
/** The CSS rule for one class name (with or without a variant prefix), or null if not in the vocabulary. */
export function ruleFor(cls) {
  const m = cls.match(/^([hml])-(.+)$/);
  const name = m ? m[2] : cls, decl = vocab[name];
  if (!decl) return null;
  let sel = '.' + esc(cls);
  if (m && m[1] === 'h') sel += ':hover';
  const global = typeof decl === 'object' ? [reduced, decl.global].filter(Boolean) : [];
  // decl forms: 'a:b' → .x{a:b} · '>*{…}' → .x>*{…} · '{…}&…' → .x{…} with & standing for .x
  const rule = typeof decl === 'object' ? decl.css(sel) : decl[0] === '>' ? sel + decl : decl[0] === '{' ? sel + decl.replaceAll('&', sel) : `${sel}{${decl}}`;
  return { rule, variant: m && m[1] !== 'h' ? m[1] : null, global };
}

/** CSS for a set of class names: core + their rules, media queries grouped, motion globals once. */
export function cssFor(classes, { withCore = true } = {}) {
  const base = [], media = { m: [], l: [] }, unknown = [], globals = new Set();
  for (const c of [...new Set(classes)].sort()) {
    const r = ruleFor(c);
    if (!r) { unknown.push(c); continue; }
    if (r.rule) (r.variant ? media[r.variant] : base).push(r.rule);
    r.global.forEach((g) => globals.add(g));
  }
  let css = (withCore ? core : '') + base.join('');
  for (const v of ['m', 'l']) if (media[v].length) css += variants[v].wrap(media[v].join(''));
  return { css: css + [...globals].join(''), unknown };
}

/** The class names an HTML document uses: class="…" inside tags only, skipping <style> and <script> contents. */
export function classesIn(html) {
  const used = new Set();
  const markup = html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  for (const tag of markup.matchAll(/<[a-zA-Z][^>]*>/g))
    for (const m of tag[0].matchAll(/(?<![\w-])class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) used.add(c);
  return used;
}

/** Every utility, optionally with the responsive variants — the "just load it" stylesheet. Decorations marked
 *  generateOnly (an-sea, an-shade: a KB each) are left out; they are for pages that generate their CSS. */
export function fullCss({ responsive = true } = {}) {
  const names = Object.keys(vocab).filter((n) => !vocab[n].generateOnly), plain = names.filter((n) => !n.startsWith('an-'));   // no m-an-spin
  const all = [...names, ...(responsive ? plain.flatMap((n) => ['m-' + n, 'l-' + n]) : [])];
  return cssFor(all).css;
}
