# dao3-ui-spec

神奇代码岛（[dao3.fun](https://dao3.fun)）的界面规格整理：设计令牌、组件尺寸、配色与排版规范，以及 59 个页面的结构拆解。

站点已于 2026-09-30 停止运营，这里是关服后的一次性记录，数据不再更新。

## 怎么用

```bash
git clone https://github.com/natsume-stack/dao3-ui-spec.git
cd dao3-ui-spec
```

- 想了解规范：读 [docs/design-spec.md](docs/design-spec.md)
- 想看某个页面由哪些区块组成、尺寸多少：查 [docs/page-inventory.md](docs/page-inventory.md)
- 想直接用数值：把 [tokens/tokens.css](tokens/tokens.css) 拷进项目，或读 [tokens/tokens.json](tokens/tokens.json)
- 想看令牌的实际效果：浏览器打开 [preview/index.html](preview/index.html)，纯静态无构建

`tokens.css` 里是 `--dao-*` 变量加一组组件参考实现（`.dao-card-map`、`.dao-btn`、`.dao-rail__item`、`.dao-modal` 等），命名空间可以随意替换。

## 规范摘要

| 项目 | 值 |
|---|---|
| 页面底色 | `#0D0D0D`，页脚与侧栏 `#262626` |
| 卡片底 | `rgba(255,255,255,.08)`，实面 `#404040` |
| 主色 | `#FFDB00`，hover `#D9B500`，用量克制（每屏不超过两处） |
| 文字色 | 白色不透明度三档：100% / 60% / 35% |
| 字体 | MiSans，正文 500，标题 700（站点只注册这两档） |
| 字号 | 12/18 · 14/20 · 16/24 · 18/28 · 20/30 · 24/36 · 32/48 · 48/72 |
| 间距 | 8 / 12 / 16 / 24 / 32 / 48，注意 `.p-3` 是 16px 而不是 Tailwind 默认的 12px |
| 圆角 | 卡片 8px，输入框 4px，按钮全圆，营销大卡 32px |
| 分层 | 暗色下不用投影，用半透明白底 + `1px rgba(255,255,255,.2)` 描边 |
| 断点 | 577 / 900 / 961 / 1201 |
| 动效 | `cubic-bezier(.4,0,.2,1)`，150 / 200 / 300ms |

## 目录

```
docs/        design-spec.md 规范正文 · page-inventory.md 页面拆解 · asset-inventory.md 文件清单 · capture-method.md 采集方法
tokens/      tokens.css · tokens.json
preview/     index.html 令牌预览页
screenshots/ tokens-preview.png 预览页渲染结果
tools/       Node 采集与统计脚本，无第三方依赖
```

## 数据说明

每个数值来自两条途径之一：站点 CSS 里的定义值，或无头 Edge 渲染后 `getComputedStyle` / `getBoundingClientRect` 的实测值。推导出来的一律标注「估算」或「目视」。

口径限制：跨页频次统计每页只保留前 60 个颜色、前 30 个字体组合，所以出现次数是下限，覆盖页数准确。

没有记录到的部分：登录后的界面（后台、钱包、设置、形象编辑器）、`/edit/*` 编辑器本体、游戏内 UI。`/map`、`/exp/search`、`/social` 等路由关服后只剩空壳，文档按实际状态记录。

重新采集：`cd tools && node crawl.js`，需要 Node ≥ 22 与本机 Edge。步骤与踩过的坑见 [docs/capture-method.md](docs/capture-method.md)。

## 版权

界面、CSS、字体、图标、插画归深圳奇梦岛科技有限公司（编程猫系）。本仓库收录整理出的规格与文档，站点原件与含用户内容的页面截图不随仓库分发。边界见 [NOTICE.md](NOTICE.md)。
