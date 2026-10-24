# Changelog

遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-10-25

首个公开版本。数据采集于 2026-10-24 18:34 至 2026-10-25 00:35（北京时间），对应站点构建 `fC5BvXRxdKi7_GBL0GgYj`。

### Added

- `docs/design-spec.md`：色彩（含 12 组 WCAG 对比度计算）、字体、间距与栅格、圆角与分层、14 类组件、响应式、动效、落地建议、缺口清单。
- `docs/page-inventory.md`：59 个页面逐页拆解（31 桌面 + 28 移动），标注每页状态。
- `docs/asset-inventory.md`：采集文件清单与体积，由 `tools/inventory.js` 生成。
- `docs/capture-method.md`：采集流程、复现步骤与踩坑记录。
- `tokens/tokens.css`：`--dao-*` 设计令牌与组件参考实现。
- `tokens/tokens.json`：机器可读令牌，每项带来源字段。
- `preview/index.html`：令牌预览页，14 个分区。
- `tools/`：零依赖 Node + CDP 采集脚本。

### Fixed

- 采集脚本原本写死调试端口 `9222`，与本机日常浏览器冲突，导致截图实际以 2160 CSS px 宽度渲染。改为 `--remote-debugging-port=0` 加独立临时 profile，全部截图重跑。
- 懒加载封面在首屏外未触发，展厅卡片渲染为灰色占位。改为分步滚动并逐张 `scrollIntoView`。
- 模型展厅与地图详情页计算样式遍历超时。增加轻量提取模式与单页截图模式。

### Not covered

登录后的界面（后台、钱包、设置、形象编辑器）、`/edit/*` 编辑器本体、游戏内 UI。地图详情页 `/exp/experience/detail/:id` 关服后主体内容为空，只采到外壳。首页 hero 背景的实现方式未定位。

[1.0.0]: #100---2026-10-25
