const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = path.resolve(__dirname, '..');
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
  send(method,params={}){const id=++this.id;this.ws.send(JSON.stringify({id,method,params}));return new Promise((res,rej)=>{this.pending.set(id,{resolve:res,reject:rej});setTimeout(()=>{if(this.pending.has(id)){this.pending.delete(id);rej(new Error('timeout '+method))}},30000);});}
}

const PROBE = `(() => {
  const cs = getComputedStyle;
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const style = (el) => {
    const s = cs(el);
    return { tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 160), rect: rect(el),
      fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, color: s.color,
      bg: s.backgroundColor, bgImage: s.backgroundImage === 'none' ? null : s.backgroundImage.slice(0, 200),
      radius: s.borderRadius, border: s.border, padding: s.padding, margin: s.margin, gap: s.gap,
      shadow: s.boxShadow === 'none' ? null : s.boxShadow, opacity: s.opacity, position: s.position,
      transition: s.transition.slice(0, 120), maxWidth: s.maxWidth, zIndex: s.zIndex };
  };
  const findText = (t, all = false) => {
    const els = [...document.querySelectorAll('h1,h2,h3,h4,h5,p,span,div,button,a,li')].filter(e => e.textContent.trim() === t);
    const e = els.find(x => [...x.children].every(c => c.textContent.trim() !== t)) || els[0];
    return all ? els : e;
  };
  const ancestry = (t, levels = 5) => {
    const el = findText(t); if (!el) return null;
    const out = []; let n = el;
    for (let i = 0; i < levels && n; i++) { out.push(style(n)); n = n.parentElement; }
    return out;
  };
  const probeText = (t) => { const el = findText(t); return el ? style(el) : null; };
  const q = (sel) => { const el = document.querySelector(sel); return el ? style(el) : null; };
  const qa = (sel, n = 8) => [...document.querySelectorAll(sel)].slice(0, n).map(style);
  return {
    url: location.href, title: document.title, viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    htmlBg: cs(document.documentElement).backgroundColor, body: style(document.body),
    header: q('header') || q('#default_layout_header'),
    nav: q('nav'),
    navItems: qa('nav > *', 10),
    main: q('main'), footer: q('footer'),
    loginButton: (() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '登录'); return b ? style(b) : null; })(),
    searchInput: q('input'),
    texts: ['跑酷','潜力新作','更多','登录畅玩海量地图','模型展厅','地图展厅','创作中心','直播中心','神岛实验室','开始','浏览','最热','最新','下载APP','多人联机编程创作平台'].map(t => ({ t, s: probeText(t) })).filter(x => x.s),
    sections: [...document.querySelectorAll('h1,h2,h3')].slice(0, 30).map(h => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 40), ...style(h) })),
    cards: {
      map: ancestry('贪婪之岛', 6),
      model: ancestry('26新春 绳金塔', 6),
      mapDesc: probeText('地牢肉鸽冒险游戏，贪婪之岛正式上线！\\n第二章：娜迦遗迹'),
    },
    bigCards: ['VOXA','ARENA'].map(t => ({ t, chain: ancestry(t, 5) })),
    documentFont: cs(document.body).fontFamily,
    scrollbarWidth: innerWidth - document.documentElement.clientWidth
  };
})()`;

const PAGES = [
  { slug: 'home', url: 'https://dao3.fun/' },
  { slug: 'model-hall', url: 'https://dao3.fun/exp/model' },
  { slug: 'create-center', url: 'https://dao3.fun/create' },
  { slug: 'live', url: 'https://dao3.fun/live' },
  { slug: 'login', url: 'https://dao3.fun/login' },
  { slug: 'exp-detail', url: 'https://dao3.fun/exp/experience/detail/100460930' },
  { slug: 'model-detail', url: 'https://dao3.fun/exp/model/detail/383058888963395' },
  { slug: 'profile', url: 'https://dao3.fun/profile/9922976' },
  { slug: 'exp', url: 'https://dao3.fun/exp' },
];

(async () => {
  const profile = path.join(__dirname, 'measure-profile-' + process.pid);
  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(EDGE, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--force-device-scale-factor=1','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1440,900','about:blank'], { stdio: 'ignore' });
  let port = null;
  for (let i = 0; i < 60; i++) { try { port = Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]); if (port) break; } catch(e) {} await sleep(300); }
  const created = await httpJSON(`http://127.0.0.1:${port}/json/new?about:blank`, 'PUT');
  const cdp = await CDP.connect(created.webSocketDebuggerUrl);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  for (const p of PAGES) {
    await cdp.send('Page.navigate', { url: p.url });
    await sleep(6000);
    // scroll to load
    await cdp.send('Runtime.evaluate', { expression: `(async()=>{const w=(ms)=>new Promise(r=>setTimeout(r,ms));for(let y=0;y<document.documentElement.scrollHeight;y+=700){scrollTo(0,y);await w(200)}scrollTo(0,0);await w(800)})()`, awaitPromise: true });
    const r = await cdp.send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
    fs.writeFileSync(path.join(OUT, 'data', `components-${p.slug}.json`), JSON.stringify(r.result.value, null, 2));
    console.log('measured', p.slug);
  }
  cdp.close(); child.kill(); await sleep(300); fs.rmSync(profile, { recursive: true, force: true });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
