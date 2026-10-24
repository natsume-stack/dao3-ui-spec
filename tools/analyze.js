const fs = require('fs');
const path = require('path');
const DATA = path.resolve(__dirname, '..', 'data');

const files = fs.readdirSync(DATA).filter((f) => /^desktop-.*\.json$/.test(f));
const agg = { text: new Map(), bg: new Map(), grad: new Map(), type: new Map(), radius: new Map(), shadow: new Map(), pages: [] };
const bump = (m, k, page, n = 1) => { const o = m.get(k) || { count: 0, pages: new Set() }; o.count += n; o.pages.add(page); m.set(k, o); };

for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  const page = f.replace(/^desktop-/, '').replace(/\.json$/, '');
  agg.pages.push({ page, url: d.url, viewport: d.viewport, bodyColor: d.body.color, bodyFont: d.body.fontFamily, bodySize: d.body.fontSize });
  for (const c of d.colors) {
    if (c.value.startsWith('bg:')) bump(agg.bg, c.value.slice(3), page, c.count);
    else if (c.value.startsWith('grad:')) bump(agg.grad, c.value, page, c.count);
    else bump(agg.text, c.value, page, c.count);
  }
  for (const t of d.fonts) bump(agg.type, t.value.replace(/^[^|]*\|\s*/, '').replace(/\s*\|\s*/g, ' / '), page, t.count);
  for (const r of d.radii) bump(agg.radius, r.value, page, r.count);
  for (const s of d.shadows) bump(agg.shadow, s.value, page, s.count);
}

const dump = (m, n = 60) => [...m.entries()]
  .map(([value, o]) => ({ value, uses: o.count, onPages: o.pages.size, pages: [...o.pages].sort() }))
  .sort((a, b) => b.uses - a.uses)
  .slice(0, n);

const out = {
  generatedFrom: 'getComputedStyle of every visible element on each rendered page (headless Edge, 1440x900 desktop). Per page only the top 60 values are kept, so uses is a lower bound.',
  pages: agg.pages.map((p) => ({ page: p.page, url: p.url, pageHeight: p.viewport.scrollH })),
  textColors: dump(agg.text),
  backgroundColors: dump(agg.bg),
  gradients: dump(agg.grad, 25),
  typeRamp: dump(agg.type, 30),
  radii: dump(agg.radius, 20),
  shadows: dump(agg.shadow, 15),
};
fs.writeFileSync(path.join(DATA, 'usage-stats.json'), JSON.stringify(out, null, 2));
const show = (arr, n, cut = 60) => arr.slice(0, n).map(x => `${x.value.slice(0, cut)}=${x.uses}/${x.onPages}p`).join(' | ');
console.log('pages', out.pages.length);
console.log('TOP TEXT', show(out.textColors, 14));
console.log('TOP BG', show(out.backgroundColors, 14));
console.log('TOP TYPE', show(out.typeRamp, 12));
console.log('TOP RADIUS', show(out.radii, 10));
console.log('TOP SHADOW', show(out.shadows, 6, 80));
console.log('GRAD', show(out.gradients, 8, 70));
