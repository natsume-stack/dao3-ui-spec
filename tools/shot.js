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
  send(method,params={}){const id=++this.id;this.ws.send(JSON.stringify({id,method,params}));return new Promise((res,rej)=>{this.pending.set(id,{resolve:res,reject:rej});setTimeout(()=>{if(this.pending.has(id)){this.pending.delete(id);rej(new Error('timeout '+method))}},60000);});}
}

const LIGHT = `(() => {
  const cs = getComputedStyle;
  const colorCount = new Map(), typeCount = new Map(), radiusCount = new Map();
  const add = (m, k) => { if (!k) return; m.set(k, (m.get(k) || 0) + 1); };
  const els = [...document.querySelectorAll('body *')].slice(0, 400);
  for (const el of els) {
    const s = cs(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    if (el.childElementCount === 0 && el.textContent.trim()) { add(colorCount, s.color); add(typeCount, s.fontWeight + ' / ' + s.fontSize + ' / ' + s.lineHeight); }
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') add(colorCount, 'bg:' + s.backgroundColor);
    if (s.borderRadius !== '0px') add(radiusCount, s.borderRadius);
  }
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));
  return { url: location.href, title: document.title, viewport: { w: innerWidth, h: innerHeight, scrollH: document.documentElement.scrollHeight },
    colors: top(colorCount, 25), fonts: top(typeCount, 12), radii: top(radiusCount, 10),
    headings: [...document.querySelectorAll('h1,h2,h3,h4')].slice(0, 40).map(h => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 60), fontSize: cs(h).fontSize, weight: cs(h).fontWeight, color: cs(h).color })),
    text: document.body.innerText.slice(0, 4000) };
})()`;

const TARGETS = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'shot-targets.json'), 'utf8'));

(async () => {
  const profile = path.join(__dirname, 'shot-profile-' + process.pid);
  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(EDGE, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--force-device-scale-factor=1','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1440,900','about:blank'], { stdio: 'ignore' });
  let port = null;
  for (let i = 0; i < 60; i++) { try { port = Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]); if (port) break; } catch(e) {} await sleep(300); }
  const created = await httpJSON(`http://127.0.0.1:${port}/json/new?about:blank`, 'PUT');
  const cdp = await CDP.connect(created.webSocketDebuggerUrl);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  for (const t of TARGETS) {
    const mobile = t.mode === 'mobile';
    const w = mobile ? 390 : 1440, h = mobile ? 844 : 900;
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await cdp.send('Page.navigate', { url: t.url });
    await sleep(t.wait || 12000);
    const dir = path.join(OUT, 'screenshots', t.mode);
    fs.mkdirSync(dir, { recursive: true });
    const fold = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(dir, t.slug + '_fold.png'), Buffer.from(fold.data, 'base64'));
    try {
      const lm = await cdp.send('Page.getLayoutMetrics');
      const cs = lm.cssContentSize || lm.contentSize;
      const full = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true, clip: { x: 0, y: 0, width: w, height: Math.min(Math.ceil(cs.height), 16000), scale: 1 } });
      fs.writeFileSync(path.join(dir, t.slug + '.png'), Buffer.from(full.data, 'base64'));
    } catch (e) { console.log('full failed', t.slug, e.message); }
    let info = null;
    try { const r = await cdp.send('Runtime.evaluate', { expression: LIGHT, returnByValue: true, timeout: 25000 }); info = r.result && r.result.value; } catch (e) { console.log('light failed', t.slug, e.message); }
    if (info) fs.writeFileSync(path.join(OUT, 'data', `${t.mode}-${t.slug}.json`), JSON.stringify(info, null, 2));
    console.log('shot', t.mode, t.slug, info ? `h=${info.viewport.scrollH}` : '(no json)');
  }
  child.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
