const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
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
const PROBE = `(() => {
  const cs = getComputedStyle;
  const info = (el) => { const s = cs(el); const r = el.getBoundingClientRect();
    return { tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,120), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, bg: s.backgroundColor, bgImage: s.backgroundImage === 'none' ? null : s.backgroundImage.slice(0,120),
      radius: s.borderRadius, padding: s.padding, display: s.display, gap: s.columnGap, pos: s.position, opacity: s.opacity, vis: s.visibility }; };
  const labels = ['跑酷','休闲','竞速','竞技','创造'];
  const found = {};
  for (const t of labels) {
    found[t] = [...document.querySelectorAll('div,span,p,a')].filter(e => e.textContent.replace(/\\s+/g,'').endsWith(t) && e.textContent.replace(/\\s+/g,'').length <= t.length + 4).slice(0, 4).map(info);
  }
  const banner = [...document.querySelectorAll('div,section')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 1000 && r.width < 1200 && r.height > 400 && r.height < 620 && r.y > 150 && r.y < 320; }).slice(0, 3).map(info);
  const startBtn = [...document.querySelectorAll('button,div,span')].filter(e => e.textContent.trim() === '开始').slice(0, 4).map(info);
  const search = [...document.querySelectorAll('input')].map(e => ({ ph: e.placeholder, ...info(e.closest('div') ? e.closest('div').parentElement : e) })).slice(0, 4);
  const modal = [...document.querySelectorAll('div')].filter(e => e.textContent.includes('验证码登录') && e.textContent.includes('密码登录')).map(info).sort((a,b)=>a.w*b.h - b.w*a.h).slice(0, 3);
  return { url: location.href, vw: innerWidth, vh: innerHeight, found, banner, startBtn, search, modal };
})()`;
(async () => {
  const profile = path.join(__dirname, 'm6-profile');
  fs.rmSync(profile, { recursive: true, force: true });
  fs.mkdirSync(profile, { recursive: true });
  const child = spawn(EDGE, ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--force-device-scale-factor=1','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1440,900','about:blank'], { stdio: 'ignore' });
  let port = null;
  for (let i = 0; i < 60; i++) { try { port = Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]); if (port) break; } catch(e) {} await sleep(300); }
  const created = await httpJSON(`http://127.0.0.1:${port}/json/new?about:blank`, 'PUT');
  const cdp = await CDP.connect(created.webSocketDebuggerUrl);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: 'https://dao3.fun/' });
  await sleep(10000);
  const r = await cdp.send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
  fs.writeFileSync(path.resolve(__dirname, '..', 'data', 'components-detail4.json'), JSON.stringify(r.result.value || r.exceptionDetails, null, 2));
  console.log('done', r.result.value ? '' : JSON.stringify(r.exceptionDetails).slice(0, 200));
  child.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
