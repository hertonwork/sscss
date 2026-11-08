// sscss/motion — the animation utilities a minim page needs, and nothing more. Transform and opacity only; every
// one of them is switched off under prefers-reduced-motion (the `reduced` rule is added once whenever any is used).
// An entry is { css(sel), global? } : css() returns the rules for one selector, global is emitted once per page.

export const reduced = `@media(prefers-reduced-motion:reduce){*,::before,::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}`;

// one wave period, 480 wide: the ends share a tangent so the tile repeats without a seam
const wave = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 120' preserveAspectRatio='none'%3E%3Cpath d='M0 60C120 0 120 0 240 60S360 120 480 60V120H0z'/%3E%3C/svg%3E")`;

export const motion = {
  // fade+slide in when an element is inserted (data-each items, fragments that arrive later)
  'an-in': { css: (s) => `${s}{transition:opacity .35s,translate .35s;@starting-style{opacity:0;translate:0 -8px}}`, doc: 'ease in when inserted' },
  // scroll-driven entrance for the parts of a section: translate only (opacity fades fail contrast audits off-screen)
  'an-rise': { css: (s) => `@supports(animation-timeline:view()){${s}{animation:ss-rise linear both;animation-timeline:view();animation-range:entry 0% entry 22%}}`, global: `@keyframes ss-rise{from{transform:translateY(24px)}}`, doc: 'rise as it scrolls into view' },
  // a spinning mark, toggled by state (data-class="an-spin:spin")
  'an-spin': { css: (s) => `${s}{animation:ss-spin 1.4s cubic-bezier(.65,0,.35,1) infinite}`, global: `@keyframes ss-spin{to{transform:rotateY(1turn)}}`, doc: 'spin (toggle with data-class)' },
  // a width that follows a CSS variable with easing: meters, gauges (pair with data-bind="--pct:level")
  'an-grow': { css: (s) => `${s}{width:calc(var(--pct,0)*1%);transition:width .45s cubic-bezier(.2,.8,.2,1)}`, doc: 'width = --pct %, eased' },
  // control feedback: hover shade, press scale
  'an-fx': { css: (s) => `${s}{transition:background .15s,transform .12s,color .15s}${s}:active{transform:scale(.97)}`, doc: 'press/hover feedback for buttons' },
  // smooth color/background changes when tokens change (theme switches)
  'an-tone': { css: (s) => `${s}{transition:color .3s,background .3s,border-color .3s}`, doc: 'eased color changes' },
  // an ocean: two wave layers cut from one 480px SVG tile with mask-image, colored by the accent token (so dark mode
  // follows), moved by transform only, in opposite directions and at two speeds for parallax. Place it first inside a
  // `rel oh` parent; what follows it in the parent gets `rel` so it paints above the water.
  'an-sea': {
    css: (s) => `${s}{position:absolute;inset:auto 0 0 0;height:min(36%,200px);pointer-events:none;background:linear-gradient(transparent,color-mix(in srgb,var(--sea,var(--acc)) 10%,transparent))}` +
      `${s}::before,${s}::after{content:"";position:absolute;inset:0 -480px 0 0;--w:-480px;background:color-mix(in srgb,var(--sea,var(--acc)) 20%,transparent);-webkit-mask:${wave} repeat-x bottom/480px 72%;mask:${wave} repeat-x bottom/480px 72%;animation:ss-sea 24s linear infinite}` +
      `${s}::after{top:40%;--w:-320px;background:color-mix(in srgb,var(--sea,var(--acc)) 32%,transparent);-webkit-mask-size:320px 100%;mask-size:320px 100%;animation-duration:12s;animation-direction:reverse}`,
    global: `@keyframes ss-sea{to{transform:translateX(var(--w))}}`,
    doc: 'an ocean at the bottom of a rel oh parent (--sea sets its color; accent by default)',
    generateOnly: true,   // a hero decoration (~0.5 KB gz): generated for pages that use it, not in the "every utility" sheets
  },
  // tune the View Transitions API used by data-each
  'an-vt': { css: (s) => `${s}{}`, global: `::view-transition-group(*){animation-duration:.3s}`, doc: 'view transitions: .3s (data-each)' },
};
