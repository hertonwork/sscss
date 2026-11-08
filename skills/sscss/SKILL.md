---
name: sscss
description: >-
  Style a web page with sscss ("super small css"): a vocabulary of 1–3 letter utility classes (f ac jb, p4 mt6, t3 b,
  ci bs ba, r rp, h-/m-/l- variants) and a generator that inlines only the CSS the page uses — 300 B core, about 1 KB
  for a whole landing page, automatic dark mode, zero stylesheet requests, Lighthouse 100. Includes the motion package
  (an-in, an-rise, an-spin, an-grow, an-fx, an-tone, an-vt) built for Minim pages and a CSS-only ocean (an-sea) for a hero. Use this whenever a page must be
  tiny, fast, build-free, or pass PageSpeed; whenever someone asks for "utility classes but smaller than Tailwind", a
  page with no CSS framework request, or styling for a Minim page; and whenever an existing page's CSS should be
  replaced by generated, page-specific CSS. Pairs with the minim-page skill for state and events.
---

# sscss

sscss is two things: a **vocabulary** of short class names that map to one declaration each, and a **generator** that
reads a page and writes exactly the rules it uses into `<style data-sscss>` in `<head>`. The page carries no
stylesheet request and no unused rule. Everything is driven by seven tokens in `:root`, so a page's look — and its
dark mode — is set once. `references/vocab.md` is the full cheat sheet; read it once, it fits on a screen.

## Workflow

### 1. Write the markup with the vocabulary

Semantic HTML, classes from the cheat sheet, nothing else. Think in roles, not values: `ci` is "ink", `bs` is
"surface", `ba` is "accent background", `r` is "the radius". The scales are fixed so there is no number to choose:

| Need | Classes |
|---|---|
| Flex row, centered, space between | `f ac jb` (column: `fc`; wrap: `fw`; grow: `x`) |
| Grid, 2 columns from tablet up, 3 on desktop | `gr g6 m-c2 l-c3` |
| Page frame | `w5 mx px6` (max 72rem, centered, side padding 2rem) |
| Section rhythm | `py10` between sections, `mt8` inside, `sy3` to space children |
| Headline / body / note | `t7 b tt` / `t2` (default) / `t1 cm` |
| Card | `r2 bs p6` — a tone step, never a border |
| Primary button | `r ba cw px5 py3 nu sb an-fx` |
| Secondary button | `r bs2 ci px4 py2 an-fx` (hover: `h-bs2` on a `bs` background) |
| Pill label | `rp bs2 px3 py1 t1 sb ib` |
| Prose measure | `w6` (65ch) |

Spacing scale `0–10` → `0 .25 .5 .75 1 1.5 2 3 4 6 8rem`; type `t0–t9` → `.75rem … 3.75rem`; `w0–w6` → `20–72rem`
and `65ch`. Variants: `h-` hover, `m-` ≥768px, `l-` ≥1024px — prefix any utility (`m-c2`, `h-cm`, `l-py10`).

### 2. Put what the vocabulary can't do in the page's own `<style>`

Fluid type ramps, keyframes, states, a selector with structure: write them in a plain `<style>` in `<head>` and keep
it short. The generator ignores that block and counts the classes it defines as the page's own, so `--check` stays
clean. Override tokens there too — change the values, keep the roles:

```html
<style>
  :root { --acc: #7c3aed; --acci: #fff; --r: 12px }
  @media (prefers-color-scheme: dark) { :root { --acc: #a78bfa; --acci: #0d1117 } }
  h1 { font-size: clamp(2.6rem, 6.6vw, 5.4rem); letter-spacing: -.035em; line-height: .95; margin: 0; text-wrap: balance }
  .meter { height: .8rem }
</style>
```

Tokens: `--ink --mut --bg --sf --sf2 --acc --acci --r`. A new accent must keep 4.5:1 against `--sf` as small text
(Lighthouse audits every text/background pair, off-screen included) and `--acci` must keep 4.5:1 on it.

### 3. Generate and inline

```sh
npx @labs_kai/sscss page.html --write     # with the package (npm i -D @labs_kai/sscss)
node <skill>/scripts/sscss.mjs page.html --write   # self-contained copy in this skill, no install
```

`--write` puts `<style data-sscss>…</style>` before `</head>` and replaces it on every later run, so run it after
every edit to the markup — a class that isn't in the block is unstyled. `--check` exits 1 when a class is neither in
the vocabulary nor defined by the page; use it in CI. `--list` prints the cheat sheet.

Never link `sscss.css` on a page that can be generated for: the generated block is a fraction of it and is one fewer
request. The full stylesheet (`assets/sscss.base.css`, 2.1 KB gzipped) is for pages whose classes aren't known
ahead of time — a CMS, a playground, user content.

### 4. Motion: the basic package

Transform/opacity only, all switched off under `prefers-reduced-motion` (the generator adds that rule once when any
is used) and keyframes emitted once per page. They were written for Minim pages and cover what one needs:

| Class | Use with | Does |
|---|---|---|
| `an-fx` | every button | hover tone + press scale |
| `an-in` | items a `data-each` template inserts, fragments that arrive later | fade + slide in via `@starting-style` |
| `an-rise` | the parts of a section | translate up as it scrolls into view (`animation-timeline: view()`, `@supports`-guarded) |
| `an-spin` | `data-class="an-spin:busy"` | spin on the Y axis while a state key is true |
| `an-grow` | `data-bind="--pct:level"` on the parent | `width: calc(var(--pct) * 1%)`, eased: meters, gauges |
| `an-tone` | anything whose tokens change | eased color/background changes |
| `an-vt` | pages with `data-each` reorders | View Transitions at .3s |
| `an-sea` | a hero | an ocean at the bottom: two wave layers from one SVG tile, `--sea` sets the color |

The ocean is a hero background at zero requests (it also serves as the fallback under a WebGL one):

```html
<section class="rel oh">
  <div class="an-sea" aria-hidden="true"></div>        <!-- first, so it paints under -->
  <div class="w5 mx px6 py10 rel"> … hero content … </div>   <!-- rel: paints above -->
</section>
<style>:root { --sea: #1f6feb }</style>   <!-- an-sea in blue instead of the accent (page's own style) -->
```

Entrance motion is transform-only on purpose: an opacity fade on off-screen content makes Lighthouse read the faded
colors and fail the contrast audit. Don't add opacity-based entrances in the page's own `<style>` either.

### 5. With Minim

sscss styles the page; [Minim](https://github.com/hertonwork/minim) makes it react, in the same file, with one
request. Use the **minim-page** skill (`npx skills add hertonwork/minim`) for the state, the `data-*` bindings, the
commands and the Lighthouse checker; `assets/starter.html` here has both slots. The split of labor:

- state flips a class or a CSS variable → `data-class="an-spin:busy"`, `data-bind="--pct:level"`,
  `data-bind="class:cls"` for a whole class list;
- the stylesheet animates → the `an-*` utilities above;
- Minim lite (1.2 KB) is enough when the page has no list and no `data-class`; the module build (2.5 KB) when it does.

Build order: state JSON → markup with sscss classes and `data-*` bindings, initial values pre-rendered → page-own
`<style>` → `sscss --write` → inline Minim at the end of `<body>` → `check.mjs --lighthouse` from minim-page.

## Checklist

- Every class is in the cheat sheet or defined in the page's `<style>` (`--check` passes)
- `<style data-sscss>` is present and was regenerated after the last markup edit
- No `<link rel="stylesheet">`, no `@import`, no web font
- Grids that hold `<pre>` or long words use `gr` (its children get `min-width: 0`) — never `display: grid` by hand without it
- Accent text on surfaces ≥ 4.5:1 in both themes (the default `--acc` passes; a custom one must be checked)
- Entrances are transform-only; every `an-*` is reduced-motion safe by construction
- Headings: one `h1`, then `h2`; panel titles are `<p class="t4 sb">`, not `<h3>`
- Buttons: `type="button"`, `an-fx`, a visible label or `aria-label`; inputs have a `<label>`

## Pitfalls we hit building the site

- **`class="…"` inside text** was picked up as classes by a naive scanner. The generator only reads attributes inside
  tags; write `class=&quot;…&quot;` in prose anyway.
- **A class that only appears in `data-class="an-spin:busy"`** got no rule, because it is in no `class` attribute until
  the state flips — the Minim demo's spin stopped. The generator now counts `data-class` toggles as used. A class a
  script adds at runtime still needs to appear somewhere the generator reads: put it in a `data-class` or in the
  page's own `<style>`.
- **Small accent text on a surface** failed contrast at 4.1:1 with the original green. The default accent is now
  `#1a7a37` (4.9:1 on `--sf`, 5.4:1 with white on it). Changing the accent means re-checking both.
- **`<pre>` in a grid column** overflowed on phones until `gr` gave children `min-width: 0`.
- **Responsive variants of motion** (`m-an-spin`) are meaningless and are not generated.
- **Tag names in comments.** A head comment that said `<style data-sscss>` and `</head>` fooled an early `--write`
  into replacing the wrong block and inserting inside the comment. The generator now blanks comments before it
  looks; still, describe tags in comments ("the data-sscss style block") rather than writing them.
- **`hidden` lost to a display utility.** Minim's `data-show` toggles the `hidden` attribute, but `class="f …"` sets
  `display:flex`, which outranks the browser's `[hidden]{display:none}`, so a hidden flex row stayed visible (an
  "update ready" banner showed on every visit). Utilities that set a visible display (`f fc gr bk ib`) now bring
  `[hidden]{display:none!important}` with them, once per page; the core doesn't grow.
- **A playground that needs every class** can't be generated for: inline the full vocabulary in a second `<style>`,
  minus what the page's generated block already carries (the site's build does this).
