# 贡献

修文档、补页面、指出数值错误都欢迎。动手前请先看下面两条，它们决定了改动能不能合。

## 数据口径

这个仓库唯一值钱的地方是每个数字都能追溯到证据。新增或修改数值时请一并注明它是哪一类：

| 类型 | 要求 |
|---|---|
| CSS 定义值 | 给出选择器与所在文件 |
| 计算样式实测 | 给出视口尺寸与被测元素 |
| 几何实测 | 给出 `getBoundingClientRect` 的原始值 |
| 截图取色 | 给出文件名与像素坐标 |
| 推导或目视 | 必须显式写「估算」或「目视」，不要混进实测表格 |

改了规范请同步更新 `tokens/tokens.css` 与 `tokens/tokens.json`，两边保持一致。

## 边界

- 只采集公开页面，不绕过鉴权、不调用私有接口。
- 不新增站点原件（CSS、字体、图标、插画）到仓库。
- 不引入更多可识别到具体用户的内容：昵称、用户 ID、头像、群号。
- 权利人请求走 `takedown` Issue，流程见 [NOTICE.md](NOTICE.md)。

## 复跑采集

需要 Node ≥ 22 与本机 Edge，无需安装依赖。

```bash
cd tools
node crawl.js                          # 全站，桌面 1440×900 + 移动 390×844
node crawl.js home,login desktop       # 只跑指定页面
LITE=1 node crawl.js model-hall mobile # 重页面用轻量提取，避免超时
node shot.js                           # 读 shot-targets.json 单页出图
node analyze.js                        # 重新聚合跨页统计
node inventory.js                      # 重新生成 docs/asset-inventory.md
```

细节和坑在 [docs/capture-method.md](docs/capture-method.md)。

## Issue

- 数值有误：文档位置 + 现值 + 应为值 + 你的证据
- 缺页面：URL、是否需要登录、期望视口
- 合规请求：标题用 `takedown`

提交信息用 Conventional Commits：`docs:` `tokens:` `tools:` `fix:`。
