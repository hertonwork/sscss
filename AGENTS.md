# Working in this repository (for agents and people)

sscss is a vocabulary of short CSS utility classes and a generator that inlines only what a page uses. One package,
one site, one skill.

## Layout

| Path | What | Edit? |
|---|---|---|
| `src/vocab.mjs` | the vocabulary, tokens, scales, variants, and the generator (`ruleFor`, `cssFor`, `fullCss`, `classesIn`) | yes |
| `src/motion.mjs` | the motion package: the `an-*` utilities and their once-per-page globals | yes |
| `bin/sscss.mjs` | the CLI (`--write`, `--check`, `--full`, `--core`, `--list`) | yes |
| `dist/` | `sscss.css`, `sscss.base.css`, `sscss.core.css` — the "just load it" stylesheets | no — `npm run build` |
| `docs/index.template.html` | the site; `index.html` is built from it with Minim, the hero's flow-field shader (`docs/flow.js`, minified by esbuild), the cheat sheet, the playground's full vocabulary and the page's generated CSS inlined | yes (never `index.html` directly) |
| `docs/flow.js` | the hero's WebGL flow field: starts after load, GPU only (software renderers bow out), adaptive resolution, still under reduced motion | yes |
| `docs/og.png`, `scripts/og.mjs` | the link-preview card, rendered with Playwright; committed, re-run `node scripts/og.mjs` when the numbers change | yes |
| `README.md` | the sizes table and the cheat sheet between `<!-- sizes -->` / `<!-- cheatsheet -->` markers are generated | yes, outside the markers |
| `skills/sscss/` | the agent skill. `SKILL.md`, `assets/starter.html` are sources; `scripts/sscss.mjs`, `references/vocab.md`, `assets/sscss.*.css` are built | yes / no — `npm run build` |
| `scripts/build.mjs` | builds all of the above and prints the sizes | yes |
| `scripts/tailwind-equivalent.mjs` | translates the site to Tailwind v4 classes to reproduce the comparison number | yes |
| `test/` | `sscss.test.mjs` (node:test) and `browser.test.mjs` (Playwright: the site's live parts, overflow, dark mode, strict CSP) | yes |

## Commands

```sh
npm install
npm test                # build, then the node tests (they run on the built output)
npm run test:browser    # Playwright checks on index.html (npm i -D playwright && npx playwright install chromium)
npm run size            # the three numbers
npx sscss page.html --write   # use the generator on any page
```

Lighthouse: the minim-page skill's checker (`node <minim>/skills/minim-page/scripts/check.mjs index.html --lighthouse`)
runs the static preflight and Lighthouse mobile + desktop; the site and the skill's starter both score 100/100/100/100
and must keep doing so.

## Rules that keep this project what it is

- **Names are short because they are read by browsers, not people.** 1–3 letters plus a scale digit; one declaration
  (or one tight pattern) per class; values reference tokens. A new utility must be something many pages need — the
  page's own `<style>` exists for everything else.
- **The generator ships only what is used.** Rules sorted, media queries grouped, globals once. Any new kind of rule
  (a global, a pseudo-element pattern) goes through `ruleFor`'s decl forms: `a:b`, `>*{…}`, `{…}&…`, or a motion-style
  `{ css(sel), global }` object.
- **Dark mode is automatic.** Every color is a token with a dark value; no utility hardcodes a color.
- **Motion is transform/opacity only and reduced-motion safe.** Entrances are transform-only (opacity fades fail
  Lighthouse's contrast audit off-screen). No responsive variants of `an-*`.
- **Size claims are measured, not typed.** `npm run build` regenerates every number in the README and the site's hero
  chart from the actual output; the Tailwind row comes from `scripts/tailwind-equivalent.mjs`. Keep the comparison
  fair: same minifier, same gzip, generated-for-the-page on both sides.
- **The site is one file with one request** and runs under a strict CSP (the browser test enforces it). The hero shader is
  inlined and starts after load on real GPUs only, so Lighthouse (GPU-less Chrome) measures the page without it — and
  that is the page those visitors get. Keep it that way: no shader may run on a software renderer.
- Commits are plain; PRs explain what changed and why in the body.

## Building a page with sscss

Use the skill in `skills/sscss/` (`npx skills add hertonwork/sscss`, or read `skills/sscss/SKILL.md`), and
`minim-page` from [hertonwork/minim](https://github.com/hertonwork/minim) for the reactive side.
