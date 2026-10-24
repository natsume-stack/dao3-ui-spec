const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = path.resolve(__dirname, '..');
const PORT = 9222;
const PROFILE = path.join(__dirname, 'edge-profile');

const PAGES = [
  { slug: 'home', url: 'https://dao3.fun/' },
  { slug: 'map-hall', url: 'https://dao3.fun/map' },
  { slug: 'model-hall', url: 'https://dao3.fun/exp/model' },
  { slug: 'exp-hall', url: 'https://dao3.fun/exp' },
  { slug: 'experience', url: 'https://dao3.fun/exp/experience' },
  { slug: 'create-center', url: 'https://dao3.fun/create' },
  { slug: 'live', url: 'https://dao3.fun/live' },
  { slug: 'search', url: 'https://dao3.fun/exp/search' },
  { slug: 'about', url: 'https://dao3.fun/about' },
  { slug: 'download', url: 'https://dao3.fun/download' },
  { slug: 'login', url: 'https://dao3.fun/login' },
  { slug: 'creator', url: 'https://dao3.fun/creator' },
  { slug: 'social', url: 'https://dao3.fun/social' },
  { slug: 'team-hall', url: 'https://dao3.fun/team-hall' },
  { slug: 'docs-user-agreement', url: 'https://dao3.fun/docs/userAgreement' },
  { slug: 'docs-privacy', url: 'https://dao3.fun/docs/privacyPolicy' },
  { slug: 'docs-cancel', url: 'https://dao3.fun/docs/accountCancellation' },
  { slug: 'customer-service', url: 'https://dao3.fun/customerService' },
  { slug: 'code-ladder', url: 'https://dao3.fun/codeLadder' },
  { slug: '404', url: 'https://dao3.fun/this-page-does-not-exist' },
  { slug: 'exp-detail', url: 'https://dao3.fun/exp/experience/detail/100460930' },
  { slug: 'model-detail', url: 'https://dao3.fun/exp/model/detail/383058888963395' },
  { slug: 'play', url: 'https://dao3.fun/play/fc867c204ff968f5ad52' },
  { slug: 'profile', url: 'https://dao3.fun/profile/9922976' },
  { slug: 'lab', url: 'https://box3lab.dao3.fun/' },
  { slug: 'settings-account', url: 'https://dao3.fun/settings/account' },
  { slug: 'msg-official', url: 'https://dao3.fun/msg/official' },
  { slug: 'avatar', url: 'https://dao3.fun/avatar' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpJSON(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
        if (this.events.length > 2000) this.events.shift();
      }
    });
  }
  static connect(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.addEventListener('open', () => resolve(new CDP(ws)));
      ws.addEventListener('error', reject);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout ' + method)); }
      }, 180000);
    });
  }
  close() { this.ws.close(); }
}

async function waitForLoad(cdp) {
  // wait for readyState complete
  for (let i = 0; i < 60; i++) {
    const r = await cdp.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
    if (r.result.value === 'complete') break;
    await sleep(500);
  }
  // wait for images + a quiet network window
  const start = Date.now();
  let lastCount = -1;
  let stable = 0;
  while (Date.now() - start < 20000) {
    const r = await cdp.send('Runtime.evaluate', {
      expression: `JSON.stringify({img: [...document.images].filter(i=>!i.complete).length, h: document.body.scrollHeight})`,
      returnByValue: true,
    });
    const st = JSON.parse(r.result.value);
    const net = cdp.events.filter((e) => e.method === 'Network.loadingFinished').length;
    if (st.img === 0 && net === lastCount) stable++; else stable = 0;
    lastCount = net;
    if (stable >= 3) break;
    await sleep(700);
  }
  await sleep(1200);
}

const EXTRACT = `(() => {
  const uniq = (a) => [...new Set(a)];
  const colorCount = new Map(), fontCount = new Map(), radiusCount = new Map(), shadowCount = new Map(), sizeCount = new Map();
  const add = (m, k, sel) => { if (!k) return; const o = m.get(k) || { count: 0, samples: [] }; o.count++; if (o.samples.length < 6 && sel && !o.samples.includes(sel)) o.samples.push(sel); m.set(k, o); };
  const selOf = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0,3).join('.') : '');
  const els = [...document.querySelectorAll('body *')].slice(0, 5000);
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const s = selOf(el);
    if (el.childElementCount === 0 && el.textContent.trim()) {
      add(colorCount, cs.color, s);
      add(fontCount, cs.fontFamily + ' | ' + cs.fontWeight + ' | ' + cs.fontSize + ' | ' + cs.lineHeight, s);
      add(sizeCount, cs.fontSize, s);
    }
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') add(colorCount, 'bg:' + cs.backgroundColor, s);
    if (cs.backgroundImage && cs.backgroundImage !== 'none' && cs.backgroundImage.includes('gradient')) add(colorCount, 'grad:' + cs.backgroundImage, s);
    add(radiusCount, cs.borderRadius, s);
    if (cs.boxShadow && cs.boxShadow !== 'none') add(shadowCount, cs.boxShadow, s);
  }
  const top = (m, n=40) => [...m.entries()].sort((a,b)=>b[1].count-a[1].count).slice(0,n).map(([value,o])=>({value, count:o.count, samples:o.samples}));
  const vars = {};
  const sheets = [...document.styleSheets];
  for (const sheet of sheets) {
    try { for (const rule of sheet.cssRules) { if (rule.style) for (const p of rule.style) if (p.startsWith('--')) vars[p] = rule.style.getPropertyValue(p).trim(); } } catch(e) {}
  }
  const imgSet = new Set();
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.backgroundImage && cs.backgroundImage.includes('url(')) { for (const u of cs.backgroundImage.matchAll(/url\\(["']?([^"')]+)["']?\\)/g)) imgSet.add(u[1]); }
  }
  for (const img of document.images) imgSet.add(img.currentSrc || img.src);
  const layout = {};
  for (const sel of ['header','nav','main','footer','aside']) {
    const e = document.querySelector(sel); if (!e) continue;
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    layout[sel] = { rect: {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, position: cs.position, background: cs.backgroundColor, zIndex: cs.zIndex };
  }
  const headings = [...document.querySelectorAll('h1,h2,h3,h4')].slice(0,80).map(h=>({tag:h.tagName, text:h.textContent.trim().slice(0,80), fontSize:getComputedStyle(h).fontSize, color:getComputedStyle(h).color, weight:getComputedStyle(h).fontWeight}));
  const bodyCS = getComputedStyle(document.body);
  const htmlCS = getComputedStyle(document.documentElement);
  return {
    url: location.href, title: document.title,
    meta: { description: (document.querySelector('meta[name=description]')||{}).content, themeColor: (document.querySelector('meta[name=theme-color]')||{}).content },
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, scrollH: document.body.scrollHeight, docH: document.documentElement.scrollHeight },
    colors: top(colorCount, 60), fonts: top(fontCount, 30), sizes: top(sizeCount, 20), radii: top(radiusCount, 15), shadows: top(shadowCount, 15),
    cssVars: vars,
    body: { fontFamily: bodyCS.fontFamily, fontSize: bodyCS.fontSize, fontWeight: bodyCS.fontWeight, lineHeight: bodyCS.lineHeight, color: bodyCS.color, background: bodyCS.backgroundColor, backgroundImage: bodyCS.backgroundImage, letterSpacing: bodyCS.letterSpacing },
    html: { background: htmlCS.backgroundColor, fontSize: htmlCS.fontSize, colorScheme: htmlCS.colorScheme },
    layout, headings,
    images: [...imgSet].slice(0, 200),
    fontFaces: [...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})),
    stylesheets: sheets.map(s=>s.href).filter(Boolean),
    navLinks: [...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent.trim().slice(0,30), href:a.href})).filter((v,i,a)=>a.findIndex(x=>x.href===v.href)===i).slice(0,120),
    bodyHtmlSnippet: document.body.innerHTML.slice(0, 200000)
  };
})()`;

async function autoscroll(cdp) {
  await cdp.send('Runtime.evaluate', {
    expression: `(async () => {
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      const step = Math.round(innerHeight * 0.6);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await wait(300);
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await wait(1500);
      const imgs = [...document.images];
      for (const img of imgs) {
        if (!img.complete || img.naturalWidth === 0) {
          img.scrollIntoView({ block: 'center' });
          await wait(120);
        }
      }
      window.scrollTo(0, 0);
      await wait(1200);
      for (let i = 0; i < 20; i++) {
        if (![...document.images].some(img => !img.complete || img.naturalWidth === 0)) break;
        await wait(500);
      }
    })()`,
    awaitPromise: true,
  });
}

async function shoot(cdp, file, width, opts = {}) {
  const metrics = await cdp.send('Page.getLayoutMetrics');
  const cs = metrics.cssContentSize || metrics.contentSize;
  const height = Math.min(Math.ceil(cs.height), opts.maxHeight || 16000);
  const res = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  });
  fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
  return { width, height };
}

async function crawlOne(cdp, page, mode) {
  const mobile = mode === 'mobile';
  const width = mobile ? 390 : 1440;
  const height = mobile ? 844 : 900;
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Page.navigate', { url: page.url });
  await waitForLoad(cdp);
  const diag = await cdp.send('Runtime.evaluate', {
    expression: `JSON.stringify({iw:innerWidth,ih:innerHeight,dpr:devicePixelRatio,vvs:visualViewport.scale,vvw:visualViewport.width,ow:outerWidth,sw:screen.width,zoom:getComputedStyle(document.documentElement).zoom,meta:(document.querySelector('meta[name=viewport]')||{}).content})`,
    returnByValue: true,
  });
  console.log('DIAG', page.slug, diag.result.value);
  const cssWidth = width;
  await autoscroll(cdp);
  await waitForLoad(cdp);
  const ev = await cdp.send('Runtime.evaluate', { expression: process.env.LITE ? EXTRACT_LITE : EXTRACT, returnByValue: true, awaitPromise: true });
  const data = ev.result.value;
  const dir = path.join(OUT, 'screenshots', mode);
  fs.mkdirSync(dir, { recursive: true });
  const shot = await shoot(cdp, path.join(dir, page.slug + '.png'), cssWidth);
  const fold = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(dir, page.slug + '_fold.png'), Buffer.from(fold.data, 'base64'));
  fs.writeFileSync(path.join(OUT, 'data', `${mode}-${page.slug}.json`), JSON.stringify(data, null, 2));
  console.log(`[${mode}] ${page.slug} ${shot.width}x${shot.height} title="${data.title}" url=${data.url}`);
}

const EXTRACT_LITE = EXTRACT
  .replace('slice(0, 5000)', 'slice(0, 1200)')
  .replace('top(colorCount, 60)', 'top(colorCount, 25)')
  .replace('top(fontCount, 30)', 'top(fontCount, 12)')
  .replace(/,\s*bodyHtmlSnippet:[^\n]*/, '');

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
  const profile = path.join(__dirname, 'profile-' + process.pid);
  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(EDGE, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--disable-sync', '--disable-extensions',
    '--force-device-scale-factor=1',
    '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--window-size=1440,900', 'about:blank',
  ], { stdio: 'ignore' });

  const portFile = path.join(profile, 'DevToolsActivePort');
  let port = null;
  for (let i = 0; i < 60; i++) {
    try {
      const txt = fs.readFileSync(portFile, 'utf8').trim().split('\n');
      port = Number(txt[0]);
      if (port) break;
    } catch (e) {}
    await sleep(300);
  }
  if (!port) throw new Error('Edge CDP not ready');
  const version = await httpJSON(`http://127.0.0.1:${port}/json/version`);
  if (!version.webSocketDebuggerUrl) throw new Error('no browser ws');
  const created = await httpJSON(`http://127.0.0.1:${port}/json/new?about:blank`, 'PUT');
  const cdp = await CDP.connect(created.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });

  const only = process.argv[2];
  const modes = process.argv[3] ? process.argv[3].split(',') : ['desktop', 'mobile'];
  const list = only ? PAGES.filter((p) => only.split(',').includes(p.slug)) : PAGES;
  for (const mode of modes) {
    for (const page of list) {
      try { await crawlOne(cdp, page, mode); } catch (e) { console.error('FAIL', mode, page.slug, e.message); }
    }
  }
  cdp.close();
  try { await httpJSON(`http://127.0.0.1:${port}/json/close/${created.id}`); } catch (e) {}
  child.kill();
  await sleep(500);
  fs.rmSync(profile, { recursive: true, force: true });
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
