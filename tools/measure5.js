const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = path.resolve(__dirname, '..', 'data');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function httpJSON(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{resolve(JSON.parse(d))}catch(e){reject(new Error(d.slice(0,200)))}}); });
    req.on('error', reject); req.end();
  });
}
class CDP {
  constructor(ws){this.ws=ws;this.id=0;this.pending=new Map();ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id&&this.pending.has(m.id)){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}});}
  static connect(u){return new Promise((res,rej)=>{const ws=new WebSocket(u);ws.addEventListener('open',()=>res(new CDP(ws)));ws.addEventListener('error',rej);});}
  send(method,params={}){const id=++this.id;this.ws.send(JSON.stringify({id,method,params}));return new Promise((res,rej)=>{this.pending.set(id,{resolve:res,reject:rej});setTimeout(()=>{if(this.pending.has(id)){this.pending.delete(id);rej(new Error('timeout '+method))}},120000);});}
}

const PROBE = `(() => {
  const cs = getComputedStyle;
  const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; if (r.bottom < 0 || r.top > innerHeight) return false; let n = el; while (n) { const s = cs(n); if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false; n = n.parentElement; } return true; };
  function st(el, note) {
    if (!el) return null;
    const s = cs(el); const r = el.getBoundingClientRect();
    return { note: note || el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 110),
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, color: s.color,
      bg: s.backgroundColor, bgImage: s.backgroundImage === 'none' ? null : s.backgroundImage.slice(0, 140),
      radius: s.borderRadius, border: s.borderTopWidth + ' ' + s.borderTopStyle + ' ' + s.borderTopColor,
      padding: s.padding, margin: s.margin, gap: s.rowGap === s.columnGap ? s.rowGap : (s.rowGap + ' / ' + s.columnGap),
      shadow: s.boxShadow === 'none' ? null : s.boxShadow.slice(0, 110), position: s.position,
      transition: s.transitionDuration + ' ' + s.transitionTimingFunction };
  }
  const all = (sel) => [...document.querySelectorAll(sel)].filter(vis);
  const txt = (t) => all('*').filter(e => e.textContent.trim() === t);
  function boxAround(el, minW, maxW, minH, maxH) { let n = el; for (let i = 0; i < 10 && n; i++) { const r = n.getBoundingClientRect(); if (r.width >= minW && r.width <= maxW && r.height >= minH && r.height <= maxH) return n; n = n.parentElement; } return null; }

  const searchInput = all('input').find(i => (i.placeholder || '').includes('搜索'));
  const banner = all('div').filter(e => { const r = e.getBoundingClientRect(); return r.y > 120 && r.y < 400 && r.width > 900 && r.height > 300; })[0];
  const announce = txt('关于神奇代码岛停止运营的公告')[0];
  const catTile = txt('跑酷')[0];
  const startBtn = txt('开始')[0];
  const modal = all('div').find(e => { const s = cs(e); const r = e.getBoundingClientRect(); return s.position === 'fixed' && r.width > 320 && r.width < 900 && r.height > 350 && s.backgroundColor !== 'rgba(0, 0, 0, 0)' && e.textContent.includes('验证码登录'); });
  return {
    url: location.href, vw: innerWidth, vh: innerHeight,
    search: { input: st(searchInput, '输入框'), box: st(searchInput ? boxAround(searchInput, 150, 700, 30, 70) : null, '搜索框') },
    banner: st(banner, 'banner'),
    bannerTitle: (() => { if (!banner) return null; const h = [...banner.querySelectorAll('div,h2,h3,h4')].filter(e => vis(e) && parseFloat(cs(e).fontSize) >= 20 && e.textContent.trim().length > 3 && e.textContent.trim().length < 30)[0]; return st(h, '标题'); })(),
    bannerButton: st(startBtn ? boxAround(startBtn, 60, 260, 28, 64) : null, '开始按钮'),
    announce: st(announce ? boxAround(announce, 400, 1440, 40, 200) : null, '公告条'),
    announceTitle: st(announce, '公告标题'),
    categoryTile: st(catTile ? boxAround(catTile, 100, 400, 36, 90) : null, '分类块'),
    categoryLabel: st(catTile, '分类文字'),
    categoryRow: (() => { if (!catTile) return null; const t = boxAround(catTile, 100, 400, 36, 90); const row = t ? t.parentElement : null; const s = st(row, '分类行'); return s; })(),
    modal: st(modal, '登录弹窗'),
    modalInputs: modal ? [...modal.querySelectorAll('input')].filter(vis).slice(0, 3).map(i => st(i, '输入框')) : [],
    modalButtons: modal ? [...modal.querySelectorAll('button')].filter(vis).slice(0, 4).map(b => st(b, '按钮')) : [],
    modalTab: modal ? st([...modal.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === '验证码登录'), 'tab') : null,
    overlay: st(all('div').find(e => { const s = cs(e); const r = e.getBoundingClientRect(); return s.position === 'fixed' && r.width > innerWidth - 4 && r.height > innerHeight - 4 && s.backgroundColor.startsWith('rgba(0, 0, 0') && parseFloat(s.backgroundColor.split(',')[3]) > 0.1; }), '遮罩'),
  };
})()`;

const PAGES = [
  { slug: 'home', url: 'https://dao3.fun/', w: 1440, h: 900, mobile: false },
  { slug: 'creator', url: 'https://dao3.fun/creator', w: 1440, h: 900, mobile: false },
  { slug: 'home-mobile', url: 'https://dao3.fun/', w: 390, h: 844, mobile: true },
];

(async () => {
  const profile = path.join(__dirname, 'm5-profile-' + process.pid);
  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(EDGE, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--force-device-scale-factor=1','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1440,900','about:blank'], { stdio: 'ignore' });
  let port = null;
  for (let i = 0; i < 60; i++) { try { port = Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]); if (port) break; } catch(e) {} await sleep(300); }
  const created = await httpJSON(`http://127.0.0.1:${port}/json/new?about:blank`, 'PUT');
  const cdp = await CDP.connect(created.webSocketDebuggerUrl);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  const results = {};
  for (const p of PAGES) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: p.w, height: p.h, deviceScaleFactor: p.mobile ? 2 : 1, mobile: p.mobile });
    await cdp.send('Page.navigate', { url: p.url });
    await sleep(9000);
    try {
      const r = await cdp.send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
      if (r.exceptionDetails) console.log('EXC', p.slug, JSON.stringify(r.exceptionDetails).slice(0, 250));
      else { results[p.slug] = r.result.value; console.log('probed', p.slug); }
    } catch (e) { console.log('skip', p.slug, e.message); }
  }
  fs.writeFileSync(path.join(OUT, 'components-detail3.json'), JSON.stringify(results, null, 2));
  child.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
