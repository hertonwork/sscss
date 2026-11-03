#!/usr/bin/env node
// sscss — generate only the CSS a page uses and inline it.
//
//   sscss page.html            print the CSS for the classes page.html uses
//   sscss page.html --write    inline it as <style data-sscss> in <head> (replacing an earlier one)
//   sscss page.html --check    exit 1 if the page uses classes the vocabulary doesn't have
//   sscss --full               print the whole vocabulary as one stylesheet (with m-/l- variants)
//   sscss --core               print only the reset + tokens
//   sscss --list               print the cheat sheet
//
// Classes inside <style> blocks are ignored; rules in a plain <style> are the page's own and are left alone —
// that is where you write what the vocabulary doesn't cover.
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { cssFor, fullCss, core, groups, variants, classesIn } from '../src/vocab.mjs';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const file = args.find((a) => !a.startsWith('--'));
const gz = (s) => gzipSync(s, { level: 9 }).length;

if (flag('--full')) { process.stdout.write(fullCss()); process.exit(0); }
if (flag('--core')) { process.stdout.write(core); process.exit(0); }
if (flag('--list')) {
  for (const [group, items] of Object.entries(groups)) {
    console.log(`\n${group}`);
    for (const [name, , doc] of items) console.log(`  ${name.padEnd(7)} ${doc}`);
  }
  console.log('\nVariants'); for (const [p, v] of Object.entries(variants)) console.log(`  ${(p + '-').padEnd(5)} ${v.doc}`);
  process.exit(0);
}
if (!file) { console.error('usage: sscss page.html [--write] [--check] | --full | --core | --list'); process.exit(2); }

let html = await readFile(file, 'utf8');
const used = classesIn(html);
// classes the page styles itself (any <style> that isn't ours) are its own, not unknown
const own = new Set();
for (const s of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<style(?![^>]*data-sscss)[^>]*>([\s\S]*?)<\/style>/g))
  for (const m of s[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) own.add(m[1]);

const { css, unknown: notVocab } = cssFor([...used]);
const unknown = notVocab.filter((c) => !own.has(c)), pageOwn = notVocab.filter((c) => own.has(c));
console.error(`${file}: ${used.size} classes, ${used.size - notVocab.length} from the vocabulary${pageOwn.length ? `, ${pageOwn.length} the page's own` : ''} → ${css.length} B, ${gz(css)} B gzipped`);
if (unknown.length) console.error(`  not in the vocabulary and not styled by the page: ${unknown.join(' ')}`);
if (flag('--check') && unknown.length) process.exit(1);

if (flag('--write')) {
  const tag = `<style data-sscss>${css}</style>`;
  // find our block or </head> on a copy with comments blanked out, so a comment that mentions a tag can't mislead us
  const masked = html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
  const old = masked.match(/<style data-sscss>[^<]*<\/style>/), head = masked.search(/<\/head>/i);
  if (old) html = html.slice(0, old.index) + tag + html.slice(old.index + old[0].length);
  else if (head !== -1) html = html.slice(0, head) + `  ${tag}\n` + html.slice(head);
  else { console.error(`  ${file} has no </head> to inline into`); process.exit(1); }
  await writeFile(file, html);
  console.error(`  inlined into ${file}`);
} else if (!flag('--check')) {
  process.stdout.write(css);
}
