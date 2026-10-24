const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules' || name.startsWith('.')) continue;
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else acc.push([p.replace(/\\/g, '/'), s.size]);
  }
  return acc;
}

const ROOT = path.resolve(__dirname, '..');
const all = walk(ROOT).map(([p, s]) => [p.replace(ROOT.replace(/\\/g, '/') + '/', ''), s]);
const groups = {};
for (const [rel, size] of all) {
  const top = rel.includes('/') ? rel.split('/')[0] : '(root)';
  (groups[top] = groups[top] || []).push([rel, size]);
}

let out = '# 素材与文件清单\n\n'
  + '本文件由 `node tools/inventory.js` 生成，列出仓库内每个文件的体积与来源类别。\n'
  + '抓取时间：2026-10-24 → 2026-10-25，站点构建 `fC5BvXRxdKi7_GBL0GgYj`。\n\n';

const SOURCE = {
  'reference': '⚠ 第三方原始资产（奇梦岛科技 / 编程猫系；字体另见 NOTICE §4）',
  'screenshots': '⚠ 界面截图（含 UGC 与用户信息，见 NOTICE §3）',
  'data': '◐ 实测数据快照（部分字段内嵌站点 DOM 与 UGC 文本）',
  'tokens': '✓ 本仓库原创整理（客观数值不受版权保护）',
  'docs': '✓ 本仓库原创文档',
  'tools': '✓ 本仓库原创脚本',
  'preview': '✓ 本仓库原创页面',
  '(root)': '✓ 仓库元文件',
};

const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const human = (n) => (n >= 1048576 ? mb(n) : kb(n));

let total = 0;
for (const top of Object.keys(groups).sort()) {
  const files = groups[top].sort((a, b) => b[1] - a[1]);
  const sum = files.reduce((a, b) => a + b[1], 0);
  total += sum;
  out += `\n## ${top}/  ·  ${files.length} 个文件 · ${human(sum)}\n\n`;
  out += `来源类别：${SOURCE[top] || '—'}\n\n`;
  out += `| 文件 | 体积 |\n|---|---|\n`;
  for (const [rel, size] of files) out += `| \`${rel}\` | ${human(size)} |\n`;
}

out += `\n---\n\n**合计 ${all.length} 个文件，${mb(total)}**\n`;
out += '\n> 单项最大文件为 `screenshots/mobile/experience.png`（15.9 MB，16000px 全页截图上限），远低于 GitHub 100 MB 单文件限制，未启用 Git LFS。\n';

fs.writeFileSync(path.join(ROOT, 'docs', 'asset-inventory.md'), out);
console.log('docs/asset-inventory.md written:', all.length, 'files,', mb(total));
