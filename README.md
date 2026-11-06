# sscss — super small css

**A vocabulary of 1–3 letter CSS utilities, and a generator that ships only the rules your page uses.**
300 bytes of core. 0 bytes per class you don't use. Dark mode included. The name reads the same backwards.

Site: [sscss.herton.work](https://sscss.herton.work/) · npm: [`@labs_kai/sscss`](https://www.npmjs.com/package/@labs_kai/sscss) · pairs with [Minim](https://github.com/hertonwork/minim) (reactivity in 1.2 KB)

```html
<header class="w5 mx px6 py4 f ac jb">
  <strong class="t4 tt">Acme</strong>
  <a href="#go" class="r ba cw px4 py2 nu an-fx">Start</a>
</header>
```

```sh
npx @labs_kai/sscss page.html --write
# page.html: 12 classes, 12 from the vocabulary → 611 B, 387 B gzipped
#   inlined into page.html
```

That is the whole workflow: write short classes, run one command, the page carries exactly the CSS it needs in
`<style data-sscss>` and makes no stylesheet request. Run it again after every edit — it replaces its own block and
nothing else.

## Size matters

Measured the same way for everyone: latest source, same minifier, `gzip -9`, `brotli -q 11`.

<!-- sizes -->
| | bytes | gzip | brotli |
|---|---|---|---|
| core (reset + tokens + dark mode) | 435 | 300 | 242 |
| the site's page (77 utilities, generated) | 2,747 | 1,163 | 968 |
| every utility | 6,187 | 2,106 | 1,742 |
| every utility + responsive variants | 16,904 | 3,538 | 2,154 |
<!-- /sizes -->

The number that matters is the one for **your page**: the second row is the [site](https://sscss.herton.work/)
itself. That same page translated class-for-class to Tailwind v4 (also generated for that page only, with `dark:`
variants to match the automatic dark mode) gets 3,813 B of CSS — and its markup is 11% bigger gzipped, because
`items-center justify-between` is longer than `ac jb`. `scripts/tailwind-equivalent.mjs` reproduces it.

| framework | every rule, gzip | note |
|---|---|---|
| **sscss core** | **300 B** | reset, tokens, dark mode |
| lit | 406 B | 7 classes |
| mu | 559 B | |
| **sscss, the site's page** | **~1.1 KB** | 74 utilities, generated |
| wing | 1,556 B | |
| skeleton | 1,613 B | |
| **sscss, every utility** | **2.1 KB** | 208 utilities, motion included |
| milligram | 2,177 B | |
| basscss | 2,468 B | |
| Tailwind v4, the same page | 3,813 B | generated for that page only |
| tachyons | 13,110 B | |

## Why unreadable class names

A utility class is written once and read by a browser a million times. `f ac jb` costs 7 bytes in the HTML and
exactly as much CSS as `flex items-center justify-between`; the difference is paid on every element, on every
page view, before compression and after it (short tokens compress to short tokens). Agents don't mind, and the
cheat sheet below fits on one screen — which is the real argument: a vocabulary this small is learned in an
afternoon and never consulted again.

## How it works

1. **Tokens.** Six color roles (`--ink --mut --bg --sf --sf2 --acc`, plus `--acci` for text on accent), one radius
   `--r`, and dark-mode values for all of them under `prefers-color-scheme`. Change them in your own `<style>` and
   every utility follows.
2. **Scales.** Spacing `0–10` → `0 .25 .5 .75 1 1.5 2 3 4 6 8rem`. Type `t0–t9` → `.75rem … 3.75rem`.
   Widths `w0–w6` → `20 28 36 48 60 72rem` and `65ch`.
3. **Variants.** `h-` hover, `m-` ≥768px, `l-` ≥1024px: `m-c2 l-c3`, `h-cm`, `l-f`.
4. **Generation.** `sscss page.html` scans `class="…"` and the toggles in Minim's `data-class="cls:key"` (ignoring
   `<style>` and `<script>`), emits core + one rule per used class, groups the media queries, and emits motion
   keyframes once. Anything the vocabulary doesn't
   have is reported; if the page styles it in its own `<style>`, it isn't an error.

## Use it

```sh
npm i -D @labs_kai/sscss
npx sscss page.html            # print the CSS this page needs
npx sscss page.html --write    # inline it as <style data-sscss> in <head>
npx sscss page.html --check    # exit 1 if a class is neither in the vocabulary nor styled by the page (CI)
npx sscss --list               # cheat sheet in the terminal
npx sscss --full               # every utility as one stylesheet; --core for the 300 B reset + tokens
```

From Node (build scripts, PHP/Twig template pipelines, anything):

```js
import { cssFor, classesIn, fullCss, core, vocab } from '@labs_kai/sscss';
const { css, unknown } = cssFor([...classesIn(html)]);   // core + exactly the rules the page uses
import { main } from '@labs_kai/sscss/cli';                 // the CLI as a function: await main(['page.html', '--write'])
```

The skill's `skills/sscss/scripts/sscss.mjs` is all of the above in one dependency-free file: copy it into a project and
run it (`node sscss.mjs page.html --write`) or import it — a build script needs nothing installed.

No build step? Load the whole thing — still smaller than one page of most frameworks:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@labs_kai/sscss@1/dist/sscss.base.css">   <!-- 2.1 KB gz -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@labs_kai/sscss@1/dist/sscss.css">        <!-- + m-/l- variants, 3.6 KB gz -->
```

### Your own classes

Anything beyond the vocabulary goes in the page's own `<style>`; the generator ignores it and `--check` counts
those classes as yours. Keep it to what no utility can do (type ramps with `clamp()`, keyframes, states):

```html
<style>
  h1 { font-size: clamp(2.4rem, 6vw, 5rem); letter-spacing: -.03em; line-height: .95 }
  .meter { height: .8rem; width: calc(var(--pct) * 1%) }
</style>
```

## Motion: the basic package

The animation utilities a [Minim](https://minim.herton.work/) page needs and nothing more.
Transform and opacity only, every one switched off under `prefers-reduced-motion`, keyframes emitted once per page.

| class | does | with Minim |
|---|---|---|
| `an-in` | fade + slide in when inserted (`@starting-style`) | items a `data-each` template adds |
| `an-rise` | rise as it scrolls into view (scroll-driven, `@supports` guarded) | section parts |
| `an-spin` | spin on the Y axis | `data-class="an-spin:busy"` |
| `an-grow` | `width: calc(var(--pct) * 1%)`, eased | `data-bind="--pct:level"` on the parent |
| `an-fx` | hover/press feedback for buttons | any `command` button |
| `an-tone` | eased color changes | theme switches |
| `an-vt` | View Transitions at .3s | `data-each` reorders |
| `an-sea` | an ocean: two wave layers from one 480 px SVG tile, parallax by speed and direction; `--sea` sets its color (accent by default) | the bottom of a hero |

`an-sea` is a hero decoration (0.5 KB gzipped): put the element first inside a `rel oh` parent and give the content
that follows `rel`, so it paints above. It is generated for pages that use it and left out of the "every utility"
stylesheets. The Minim page uses it as the no-WebGL fallback under its shader ocean.

Import only the map if you want to build on it: `import { motion } from '@labs_kai/sscss/motion'`.

## With Minim

sscss styles the page; [Minim](https://github.com/hertonwork/minim) makes it react — both inlined, one request,
both under the fold of a Lighthouse 100. The [site](https://sscss.herton.work/) is the example: the
playground is `<input data-model="cls">` and `<div data-bind="class:cls">`, nothing else.

```html
<head>
  <style data-sscss>/* npx sscss page.html --write */</style>
  <script type="application/json" data-state="app" data-root="root">{ "level": 60 }</script>
</head>
<body>
  <main id="root">
    <div class="bs2 rp oh" style="height:1rem" data-bind="--pct:level"><b class="bk hf ba rp an-grow"></b></div>
    <button type="button" commandfor="root" command="--inc" value="level" data-step="10" class="r ba cw px4 py2 an-fx">+10</button>
  </main>
  <script>/* Minim, inlined */</script>
</body>
```

## For agents

The repository ships a skill: `npx skills add hertonwork/sscss` (or copy `skills/sscss/`). It carries the
vocabulary, the rules that keep pages at Lighthouse 100, how to add page-own classes, and the check to run.
`AGENTS.md` is the guide for working in this repository.

## Cheat sheet

<!-- cheatsheet -->
### Layout

| class | does |
|---|---|
| `f` | flex row |
| `fc` | flex column |
| `fr` | row (e.g. m-fr after fc) |
| `fw` | wrap |
| `gr` | grid; children may shrink (code blocks don't overflow) |
| `c1` | 1 equal columns |
| `c2` | 2 equal columns |
| `c3` | 3 equal columns |
| `c4` | 4 equal columns |
| `c5` | 5 equal columns |
| `c6` | 6 equal columns |
| `bk` | block |
| `ib` | inline-block |
| `hd` | hidden |
| `ac` | align center |
| `ae` | align end |
| `jc` | justify center |
| `jb` | space between |
| `je` | justify end |
| `pc` | center both axes (grid) |
| `x` | grow to fill |
| `fs0` | never shrink |
| `mx` | center horizontally |
| `rel` | relative |
| `abs` | absolute |
| `stk` | sticky to top |
| `ov` | scroll if needed |
| `oh` | clip |
| `wf` | full width |
| `hf` | full height |
| `vh` | at least the viewport |
| `w0` | max-width 20rem |
| `w1` | max-width 28rem |
| `w2` | max-width 36rem |
| `w3` | max-width 48rem |
| `w4` | max-width 60rem |
| `w5` | max-width 72rem |
| `w6` | max-width 65ch |

### Spacing

| class | does |
|---|---|
| `p0` | padding 0 |
| `px0` | padding left+right 0 |
| `py0` | padding top+bottom 0 |
| `pt0` | padding top 0 |
| `pb0` | padding bottom 0 |
| `m0` | margin 0 |
| `mt0` | margin top 0 |
| `mb0` | margin bottom 0 |
| `my0` | margin top+bottom 0 |
| `g0` | gap 0 |
| `sy0` | space between children 0 |
| `p1` | padding 0.25rem |
| `px1` | padding left+right 0.25rem |
| `py1` | padding top+bottom 0.25rem |
| `pt1` | padding top 0.25rem |
| `pb1` | padding bottom 0.25rem |
| `m1` | margin 0.25rem |
| `mt1` | margin top 0.25rem |
| `mb1` | margin bottom 0.25rem |
| `my1` | margin top+bottom 0.25rem |
| `g1` | gap 0.25rem |
| `sy1` | space between children 0.25rem |
| `p2` | padding 0.5rem |
| `px2` | padding left+right 0.5rem |
| `py2` | padding top+bottom 0.5rem |
| `pt2` | padding top 0.5rem |
| `pb2` | padding bottom 0.5rem |
| `m2` | margin 0.5rem |
| `mt2` | margin top 0.5rem |
| `mb2` | margin bottom 0.5rem |
| `my2` | margin top+bottom 0.5rem |
| `g2` | gap 0.5rem |
| `sy2` | space between children 0.5rem |
| `p3` | padding 0.75rem |
| `px3` | padding left+right 0.75rem |
| `py3` | padding top+bottom 0.75rem |
| `pt3` | padding top 0.75rem |
| `pb3` | padding bottom 0.75rem |
| `m3` | margin 0.75rem |
| `mt3` | margin top 0.75rem |
| `mb3` | margin bottom 0.75rem |
| `my3` | margin top+bottom 0.75rem |
| `g3` | gap 0.75rem |
| `sy3` | space between children 0.75rem |
| `p4` | padding 1rem |
| `px4` | padding left+right 1rem |
| `py4` | padding top+bottom 1rem |
| `pt4` | padding top 1rem |
| `pb4` | padding bottom 1rem |
| `m4` | margin 1rem |
| `mt4` | margin top 1rem |
| `mb4` | margin bottom 1rem |
| `my4` | margin top+bottom 1rem |
| `g4` | gap 1rem |
| `sy4` | space between children 1rem |
| `p5` | padding 1.5rem |
| `px5` | padding left+right 1.5rem |
| `py5` | padding top+bottom 1.5rem |
| `pt5` | padding top 1.5rem |
| `pb5` | padding bottom 1.5rem |
| `m5` | margin 1.5rem |
| `mt5` | margin top 1.5rem |
| `mb5` | margin bottom 1.5rem |
| `my5` | margin top+bottom 1.5rem |
| `g5` | gap 1.5rem |
| `sy5` | space between children 1.5rem |
| `p6` | padding 2rem |
| `px6` | padding left+right 2rem |
| `py6` | padding top+bottom 2rem |
| `pt6` | padding top 2rem |
| `pb6` | padding bottom 2rem |
| `m6` | margin 2rem |
| `mt6` | margin top 2rem |
| `mb6` | margin bottom 2rem |
| `my6` | margin top+bottom 2rem |
| `g6` | gap 2rem |
| `sy6` | space between children 2rem |
| `p7` | padding 3rem |
| `px7` | padding left+right 3rem |
| `py7` | padding top+bottom 3rem |
| `pt7` | padding top 3rem |
| `pb7` | padding bottom 3rem |
| `m7` | margin 3rem |
| `mt7` | margin top 3rem |
| `mb7` | margin bottom 3rem |
| `my7` | margin top+bottom 3rem |
| `g7` | gap 3rem |
| `sy7` | space between children 3rem |
| `p8` | padding 4rem |
| `px8` | padding left+right 4rem |
| `py8` | padding top+bottom 4rem |
| `pt8` | padding top 4rem |
| `pb8` | padding bottom 4rem |
| `m8` | margin 4rem |
| `mt8` | margin top 4rem |
| `mb8` | margin bottom 4rem |
| `my8` | margin top+bottom 4rem |
| `g8` | gap 4rem |
| `sy8` | space between children 4rem |
| `p9` | padding 6rem |
| `px9` | padding left+right 6rem |
| `py9` | padding top+bottom 6rem |
| `pt9` | padding top 6rem |
| `pb9` | padding bottom 6rem |
| `m9` | margin 6rem |
| `mt9` | margin top 6rem |
| `mb9` | margin bottom 6rem |
| `my9` | margin top+bottom 6rem |
| `g9` | gap 6rem |
| `sy9` | space between children 6rem |
| `p10` | padding 8rem |
| `px10` | padding left+right 8rem |
| `py10` | padding top+bottom 8rem |
| `pt10` | padding top 8rem |
| `pb10` | padding bottom 8rem |
| `m10` | margin 8rem |
| `mt10` | margin top 8rem |
| `mb10` | margin bottom 8rem |
| `my10` | margin top+bottom 8rem |
| `g10` | gap 8rem |
| `sy10` | space between children 8rem |

### Type

| class | does |
|---|---|
| `t0` | font-size 0.75rem |
| `t1` | font-size 0.875rem |
| `t2` | font-size 1rem |
| `t3` | font-size 1.125rem |
| `t4` | font-size 1.25rem |
| `t5` | font-size 1.5rem |
| `t6` | font-size 1.875rem |
| `t7` | font-size 2.25rem |
| `t8` | font-size 3rem |
| `t9` | font-size 3.75rem |
| `b` | bold |
| `sb` | semibold |
| `md` | medium |
| `tt` | tight tracking (headlines) |
| `lt` | tight leading |
| `mono` | monospace |
| `up` | uppercase |
| `nu` | no underline |
| `tn` | tabular numbers |
| `ctr` | text center |
| `rt` | text right |
| `nw` | no wrap |
| `bal` | balanced headline wrapping |

### Color

| class | does |
|---|---|
| `ci` | ink |
| `cm` | muted |
| `ca` | accent |
| `cw` | text on accent |
| `bg` | ground |
| `bs` | surface |
| `bs2` | surface 2 (controls) |
| `ba` | accent |

### Shape

| class | does |
|---|---|
| `r` | radius |
| `r2` | double radius |
| `rp` | pill |
| `r0` | square |
| `bd` | hairline border |
| `bd2` | accent border |
| `sh` | floating shadow (dialogs) |
| `tr` | transition |
| `op` | dimmed |
| `cp` | pointer |
| `sr` | screen-reader only |

### Motion (sscss/motion)

| class | does |
|---|---|
| `an-in` | ease in when inserted |
| `an-rise` | rise as it scrolls into view |
| `an-spin` | spin (toggle with data-class) |
| `an-grow` | width = --pct %, eased |
| `an-fx` | press/hover feedback for buttons |
| `an-tone` | eased color changes |
| `an-sea` | an ocean at the bottom of a rel oh parent (--sea sets its color; accent by default) |
| `an-vt` | view transitions: .3s (data-each) |

### Variants

| prefix | applies |
|---|---|
| `h-` | on hover |
| `m-` | at ≥ 768px |
| `l-` | at ≥ 1024px |
<!-- /cheatsheet -->

## Development

```sh
npm test            # builds dist/, README tables and index.html, then runs the tests
npm run build       # just the build; prints the sizes
npm run size        # the three numbers
```

MPL-2.0 · made in Florida by [Herton](https://github.com/hertonwork)
