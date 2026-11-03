// sscss/motion — the animation utilities a Minim page needs, and nothing more. Transform and opacity only; every
// one of them is switched off under prefers-reduced-motion (the `reduced` rule is added once whenever any is used).
// An entry is { css(sel), global? } : css() returns the rules for one selector, global is emitted once per page.

export const reduced = `@media(prefers-reduced-motion:reduce){*,::before,::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}`;

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
  // tune the View Transitions API used by data-each
  'an-vt': { css: () => '', global: `::view-transition-group(*){animation-duration:.3s}`, doc: 'view transitions: .3s (data-each)' },
};
