// The hero chart's Tailwind row, reproducibly: translates the site's classes one-for-one to Tailwind v4 (with dark:
// variants, since sscss colors are automatically dark-mode aware) and writes it next to a Tailwind input file.
//
//   node scripts/tailwind-equivalent.mjs /tmp/tw      # writes /tmp/tw/page.html and /tmp/tw/in.css
//   cd /tmp/tw && npm i tailwindcss @tailwindcss/cli && npx tailwindcss -i in.css -o out.css --minify
//   gzip -9c out.css | wc -c                           # 3,813 B on 2026-11-03 (sscss: 1,071 B for the same page)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const outDir = process.argv[2] || '/tmp/tw';
mkdirSync(outDir, { recursive: true });
const sp = { 0:'0',1:'1',2:'2',3:'3',4:'4',5:'6',6:'8',7:'12',8:'16',9:'24',10:'32' };
const ty = { 0:'xs',1:'sm',2:'base',3:'lg',4:'xl',5:'2xl',6:'3xl',7:'4xl',8:'5xl',9:'6xl' };
const map = {
  ac:'items-center', ae:'items-end', jc:'justify-center', jb:'justify-between', f:'flex', fw:'flex-wrap', gr:'grid',
  'm-c2':'md:grid-cols-2', 'm-c3':'md:grid-cols-3', bk:'block', ib:'inline-block', hf:'h-full', oh:'overflow-hidden',
  mx:'mx-auto', x:'flex-1', w5:'max-w-6xl', w6:'max-w-prose',
  b:'font-bold', sb:'font-semibold', md:'font-medium', tt:'tracking-tight', nu:'no-underline', tn:'tabular-nums',
  ctr:'text-center', rt:'text-right', nw:'whitespace-nowrap',
  ci:'text-gray-900 dark:text-gray-100', cm:'text-gray-600 dark:text-gray-400', ca:'text-green-700 dark:text-green-400',
  cw:'text-white', bg:'bg-white dark:bg-gray-950', bs:'bg-gray-100 dark:bg-gray-900', bs2:'bg-gray-200 dark:bg-gray-800',
  ba:'bg-green-700 dark:bg-green-600', 'h-bs2':'hover:bg-gray-200 dark:hover:bg-gray-800', 'h-cm':'hover:text-gray-600 dark:hover:text-gray-400',
  r:'rounded-lg', r2:'rounded-2xl', rp:'rounded-full',
  'an-fx':'transition active:scale-[.97]', 'an-grow':'w-[calc(var(--pct)*1%)] transition-[width] duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)]',
};
const tw = (c) => {
  if (map[c]) return map[c];
  let m;
  if ((m = c.match(/^(p|px|py|pt|pb|m|mt|mb|my|g|sy)(\d+)$/))) {
    const p = { g:'gap', sy:'space-y' }[m[1]] || m[1];
    return `${p}-${sp[m[2]]}`;
  }
  if ((m = c.match(/^t(\d)$/))) return `text-${ty[m[1]]}`;
  return c; // page-own
};
let html = readFileSync(new URL('../docs/index.template.html', import.meta.url), 'utf8');
html = html.replace(/(?<![\w-])class="([^"]*)"/g, (_, cls) => `class="${cls.split(/\s+/).filter(Boolean).map(tw).join(' ')}"`);
writeFileSync(path.join(outDir, 'page.html'), html);
writeFileSync(path.join(outDir, 'in.css'), '@import "tailwindcss";\n@source "./page.html";\n');
console.log(`wrote ${outDir}/page.html and in.css`);
