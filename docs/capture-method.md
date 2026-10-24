# 采集方法与复现


本文说明本仓库所有数据是怎么来的，以及如何在自己的机器上复跑。

## 1. 技术选型：为什么不用 Playwright / Puppeteer

采集环境是一台 Windows 11 机器，npm 配置了 `http://127.0.0.1:7890` 代理而该代理未运行，`npm i puppeteer-core` 直接 `ECONNREFUSED`。

于是改成**零依赖方案**：Node 内置 `http` + 全局 `WebSocket`（Node ≥ 22）直接说 Chrome DevTools Protocol，浏览器用本机已装的 Microsoft Edge。

```
Node (http + WebSocket)  ──CDP──▶  msedge --headless=new
```

代价是要手写一小段 CDP 客户端（`tools/crawl.js` 里的 `class CDP`，约 20 行）；收益是完全不需要装包，任何有 Node 22+ 和 Edge/Chrome 的机器都能跑。

## 2. 采集流程

```
启动无头 Edge（--remote-debugging-port=0，独立临时 profile）
   └─ 从 profile/DevToolsActivePort 读实际端口
       └─ /json/new 建标签页 → 连接其 webSocketDebuggerUrl
           └─ Page.enable / Runtime.enable / Network.enable
               └─ Emulation.setDeviceMetricsOverride（1440×900 或 390×844@2x）
                   └─ 逐页：Page.navigate → 等就绪 → 触发懒加载 → 提取计算样式 → 截图 → 落盘
```

### 2.1 等待就绪

`document.readyState === 'complete'` 之后，再轮询「未加载完的图片数 + `Network.loadingFinished` 事件计数」，连续 3 次不变才算稳定，最后再等 1.2s。

### 2.2 懒加载（关键）

站点用 Next.js `/_next/image` + IntersectionObserver，不滚动的话展厅卡片全是灰色占位。做法：

1. 按 `0.6 × innerHeight` 步长滚到底，每步 300ms；
2. 对 `naturalWidth === 0` 的 `<img>` 逐个 `scrollIntoView({block:'center'})` + 120ms；
3. 回到顶部，最多再等 10s 让在途图片落地。

### 2.3 截图

| 类型 | 实现 |
|---|---|
| 首屏 | `Page.captureScreenshot({format:'png'})` → `<slug>_fold.png` |
| 全页 | `Page.captureScreenshot({captureBeyondViewport:true, fromSurface:true, clip:{x:0,y:0,width:视口宽,height:min(contentSize.height,16000),scale:1}})` → `<slug>.png` |

尺寸上限 16000px 是刻意设的：模型展厅无限滚动，实测页高可达 88635px（移动），不设上限会直接卡死。

### 2.4 样式提取

在页面里执行一段脚本，遍历 `body *` 前 5000 个元素，跳过 `display:none` / `visibility:hidden`，统计：

- 文字色（仅叶子且有文本的元素）
- 背景色、渐变背景
- `fontFamily | fontWeight | fontSize | lineHeight` 组合
- `borderRadius`、`boxShadow`
- 遍历所有 `document.styleSheets` 收集 `--*` 自定义属性（跨域表会抛错，已 try/catch）
- 布局：`header/nav/main/footer/aside` 的 rect + position + background
- 标题层级、图片 URL（`background-image` + `<img>`）、字体加载状态、样式表清单、页内链接
- `body.innerHTML` 前 200000 字符（**注意：这段含站点 DOM 与 UGC 文本**）

每页落盘为 `data/<mode>-<slug>.json`；`tools/analyze.js` 再把 20 个桌面页聚合成 `data/usage-stats.json`。

## 3. 复跑

依赖：Node ≥ 22、Microsoft Edge 或 Chrome（脚本里 `EDGE` 常量可改成 Chrome 路径）。

```bash
cd tools
node crawl.js                            # 全站，桌面 1440×900 + 移动 390×844
node crawl.js home,login desktop         # 只跑指定 slug 的桌面版
LITE=1 node crawl.js model-hall mobile   # 轻量提取：只遍历 1200 元素、不存 DOM 片段
node shot.js                             # 读 shot-targets.json，单页出图（重页面专用）
node measure.js                          # 组件几何 → data/components-<slug>.json
node measure6.js                         # 精细组件取样（含可见性过滤）
node analyze.js                          # 重新聚合 → data/usage-stats.json
node inventory.js                        # 重新生成 docs/asset-inventory.md
```

## 4. 踩过的坑（务必看）

| 坑 | 现象 | 正解 |
|---|---|---|
| **写死调试端口** | `--remote-debugging-port=9222` 时，本机日常 Edge 已占用 9222，脚本连到了**用户自己的浏览器**：截图实际渲染宽度变成 2160 CSS px（`devicePixelRatio 0.6667`，Windows 150% 缩放 + 页面缩放），并在用户浏览器里开了标签页 | `--remote-debugging-port=0` + 独立临时 `--user-data-dir`，从 `DevToolsActivePort` 文件读端口；跑完删 profile |
| 视口仿真不生效 | `setDeviceMetricsOverride` 后 `innerWidth` 仍是 2160 | 根因同上（连错浏览器）。确认方法：导航后回读 `innerWidth / devicePixelRatio / visualViewport.scale` |
| 隐藏元素污染统计 | 站点 DOM 里同时存在桌面与移动两套组件，未过滤时测到 `x=0 y=0 w=1440 h=6295` 这类假几何 | 遍历时校验 `getBoundingClientRect()` 与祖先链的 `display/visibility/opacity` |
| 重页面提取超时 | 模型展厅、地图详情页 `Runtime.evaluate` 超时 | 提高超时至 180s；或 `LITE=1`；或改用 `tools/shot.js`（先出图，再做 400 元素轻量采样） |
| 截图判读错误 | 深色页面截图在部分查看器里看起来像白底黑字 | 用像素采样确认，不要凭目视断言颜色（`docs/design-spec.md` 里所有底色都给了采样坐标） |

## 5. 边界与合规

- 只访问公开页面，**未登录、未携带任何凭据、未绕过鉴权、未调用私有接口**。
- 遇到需要登录的路由（`/play/*`、`/settings/*`），记录其重定向形态即止。
- 抓取限速：逐页串行，每页之间自然间隔数秒，未做并发压站。
- 完整权利归属与使用边界见 [../NOTICE.md](../NOTICE.md)。
