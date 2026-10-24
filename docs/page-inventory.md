# dao3.fun 页面清单（31 个桌面页 / 28 个移动页）


- 桌面截图：`screenshots/desktop/<slug>.png`（1440 宽全页）与 `<slug>_fold.png`（1440×900 首屏）
- 移动截图：`screenshots/mobile/<slug>.png`（390 宽全页，2× DPR）与 `<slug>_fold.png`（390×844 首屏）
- 上述截图与 `data/` 快照、`reference/` 站点原件都不随仓库分发（原因见 [NOTICE.md](../NOTICE.md)），这里保留路径是为了让每个数值能对上采集时的原始记录。需要请照 [capture-method.md](capture-method.md) 重新跑一遍。
- 表内「页高」= 抓取时 `document.documentElement.scrollHeight`（CSS px），可判断页面体量与是否空壳
- 状态标记：✅ 有完整内容 / 🟡 关服后空壳或仅外壳 / 🔒 需登录（自动跳 `/login?referrer=` 或弹登录框）

---

## A. 主展厅

### A1 首页 / 地图展厅　`/`、`/exp`、`/exp/experience`　✅

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 5784 | `screenshots/desktop/home.png` · `screenshots/desktop/home_fold.png` |
| 移动 | 11248 | `screenshots/mobile/home.png` · `screenshots/mobile/home_fold.png` |

三条路由渲染结果完全一致（页高同为 5784），说明关服后展厅首页与 `/exp/experience` 复用同一组件树。

自上而下结构（1440 实测）：

1. 停服公告条 1039×52 @ y=105，标题 16/700 `#FFF2CF`
2. 右上登录引导气泡 332×160，`#FFDB00` 底 + 吉吉喵插画
3. 搜索框（input 272×21 @ x=236 y=260）+「组队一起玩」活动入口
4. Banner 轮播（容器 1137×764 @ y=238，含右侧 5 条更新列表）
5. 12 分类磁贴：`grid-cols-5 grid-rows-2 gap-3`
6. 潜力新作：4 列地图卡（卡 276×378）
7. 模型新作：4 列模型卡（卡 260 宽）
8. 热门地图（最热 / 最新 切换 + 瀑布流地图卡，含播放·赞·评论·浏览四项统计）
9. 页脚 1360×188

设计要点：整页背景 = 当前 banner 封面 + `rgba(0,0,0,.4)` 压暗 + `blur(64px)`；卡片信息 hover 才展开简介（`max-height` 0→48px，300ms）。

### A2 模型展厅　`/exp/model`　✅

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 10427（滚动加载后；截图上限 16000） | `screenshots/desktop/model-hall.png` · `screenshots/desktop/model-hall_fold.png` |
| 移动 | 88635（无限滚动） | `screenshots/mobile/model-hall.png` · `screenshots/mobile/model-hall_fold.png` |

- 顶部：分类图标 + 「模型」大标题（`text-4xl` 32/48 700）
- 精选区（choiceness tab）+ 「模型展厅」列表区，右侧「最热 / 最新」切换
- 布局为 **masonry 4 列**：列容器 284（`px-2`=12px 内边距），卡片 260，卡间距 `mb-8`=32px
- 卡片：预览图按模型原始比例（非固定比例，黑底透明 PNG 居多）→ 标题 16/24 700 → 作者 12px 白 60% → `40.87K 浏览` 12px
- 数据来自 SSR `__NEXT_DATA__`：`props.pageProps.contents[]`，每项含 `tabKey / tabName / modelList[{id,title,previewUrl,animated,viewCount}]`
- 预览图地址规律：`https://assets.box3.fun/engine/m/<hash>`（无扩展名，经 `/_next/image` 代理）

### A3 地图展厅旧路由　`/map`　🟡

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 1088 | `screenshots/desktop/map-hall.png` · `screenshots/desktop/map-hall_fold.png` |
| 移动 | 844 | `screenshots/mobile/map-hall.png` · `screenshots/mobile/map-hall_fold.png` |

`<main>` 内只有一个空 div（`<div class="nIK1gL">`），即路由保留但内容已下线。侧栏「地图展厅」实际指向 `/exp/experience`。

### A4 搜索页　`/exp/search`　🟡

桌面 900 / 移动 972，仅外壳 + 导航，无结果（搜索词由前端状态驱动，直接访问 URL 无参数效果）。
截图：`screenshots/desktop/search.png` · `screenshots/mobile/search.png`
带 `?keyword=跑酷` 直接访问同样是空壳（见 `search-results`，页高 900）→ 说明搜索状态不走 URL。

### A5 分类页　`/exp/model/建筑`、`/exp/experience/竞速`　🟡

直接访问返回空壳（页高 900）。截图：`screenshots/desktop/model-category.png` · `screenshots/desktop/experience-category.png`

---

## B. 创作与赛事

### B1 创作中心落地页　`/create`　✅

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 3842 | `screenshots/desktop/create-center.png` · `screenshots/desktop/create-center_fold.png` |
| 移动 | 3667 | `screenshots/mobile/create-center.png` · `screenshots/mobile/create-center_fold.png` |

- 背景：`#0D0D0D` + 极淡的线框几何装饰（目视）
- 两张并列大卡（实测 424×484，`rounded-[32px]`，底 `#262626`，`padding: 44px 44px 128px`）：
  - **VOXA**：品牌黄 `#FFDB00` 六边形图标（截图取色 (345,265)，圆角 16），标题 48/72 700（`md:text-7xl`），简介 14px 白 60%，底部「使用VOXA ›」「学习更多 ›」
  - **ARENA**：橙色 `#FF7D00` 同款图标（截图取色 create-center_fold.png (890,260)）
- 下方「创作流程」大标题 + 步骤区
- 容器：`lg:w-[1136px] lg:mx-auto`，栅格 `grid-cols-12 gap-x-3`

### B2 创作者后台　`/creator`　🔒（未登录自动弹登录框）

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 1262 | `screenshots/desktop/creator.png` · `screenshots/desktop/creator_fold.png` |
| 移动 | 844 | `screenshots/mobile/creator.png` · `screenshots/mobile/creator_fold.png` |

可见外壳（弹窗之下）：
- 顶部迁移提示条：「迁移：你的创作，永不落幕」+ 引导导出文案
- 二级侧栏：地图 / 模型 / 数据中心（带图标，选中态白底渐变）
- 右上「+」新建按钮 128×32 胶囊 + 搜索地图输入框（实测 200×32，圆角 4，底 `rgba(255,255,255,.08)`）
- 两张营销卡：「学习中心」（黄底 `#FFDB00` 系）与「API」（青蓝底），右侧带插画
- 登录弹窗规格见 设计规范 §6.11

同类受保护路由：`/creator/models`、`/creator/datahub`、`/creator/datahub/[mapId]`、`/settings/account`、`/settings/wallet`、`/settings/cancelaccount`、`/avatar`、`/msg/*`。

### B3 代码天梯　`/codeLadder`　✅

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 2102 | `screenshots/desktop/code-ladder.png` · `screenshots/desktop/code-ladder_fold.png` |
| 移动 | 2407 | `screenshots/mobile/code-ladder.png` · `screenshots/mobile/code-ladder_fold.png` |

赛事专题页：赛季标题「S3 · 回响」+ 起止日期「2026.07.01 - 2026.08.31」+ S2/S4 翻页箭头 + 「立刻参赛」CTA + 四个 tab（赛事动态 / 活动背景 / 排位总榜 / 参赛指南 / 规则须知 / 段位体系）。
是全站少见的**内容型长页**，标题层级用到 32–48px。

### B4 直播中心　`/live`　✅

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 1184 | `screenshots/desktop/live.png` · `screenshots/desktop/live_fold.png` |
| 移动 | 2876 | `screenshots/mobile/live.png` · `screenshots/mobile/live_fold.png` |

- **无左侧导轨**，全宽布局；顶栏左上改为「神奇代码岛」艺术字 logo（`slogan.6a83ce79.png`）
- 背景：直播封面大图全幅铺开 + 压暗（无左侧导轨，hero 型页面）
- 中央提示「当前没有直播，敬请期待」16/700 白
- 「历史直播」3 列卡片：16:9 封面 + 标题 14/700 白 + 时间 `2025/11/8 20:00:00` 12px 白 60%，卡底 `rgba(255,255,255,.08)`，圆角 8

---

## C. 账号与登录

### C1 登录页　`/login`　✅

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 900 | `screenshots/desktop/login.png` · `screenshots/desktop/login_fold.png` |
| 移动 | 844 | `screenshots/mobile/login.png` · `screenshots/mobile/login_fold.png` |

- 独立底色 `#383838`（截图取色），无导轨、无页脚导航，仅居中表单 + 版权行
- 顶部艺术字 logo（`slogan.6a83ce79.png`）
- Tab「验证码登录 / 密码登录」24/700，选中带 4px `#FFDB00` 下划线
- 输入框 480×60，圆角 8，底 `#404040`，左侧图标 + `+86` 国家码
- 「获取验证码」为输入框内右侧文字按钮，禁用态 `rgba(255,255,255,.35)`
- 主按钮 496×56（实测），圆角 999，白底黑字
- 协议行 12px 白 60%，链接带下划线
- 「其他方式登录」分割线 + 微信 / QQ 两个白底胶囊

### C2 受保护路由的跳转形态　🔒

| 路由 | 实测结果 | 截图 |
|---|---|---|
| `/play/fc867c204ff968f5ad52` | 302 到 `/login?referrer=…` | `screenshots/desktop/play.png` |
| `/settings/account` | 同上 | `screenshots/desktop/settings-account.png` · `screenshots/mobile/settings-account.png` |
| `/avatar` | 渲染出「套装 (17) / 站立 / 保存」外壳但需登录 | `screenshots/desktop/avatar.png` · `screenshots/mobile/avatar.png` |
| `/msg/official` | 渲染「消息中心 / 评论我的 / 赞和收藏 / 系统通知」空列表 | `screenshots/desktop/msg-official.png` · `screenshots/mobile/msg-official.png` |

> 两种保护策略并存：**整页重定向**（游戏、设置）与**外壳可见 + 弹窗拦截**（创作中心、消息）。复刻时需统一。

### C3 用户主页　`/profile/9922976`　✅

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 984 | `screenshots/desktop/profile.png` · `screenshots/desktop/profile_fold.png` |
| 移动 | 1285 | `screenshots/mobile/profile.png` · `screenshots/mobile/profile_fold.png` |

结构：头像 + 昵称「MOYO的个人资料」+ `@MOYO` + `ID: 9922976` → 资料网格（MBTI / 星座 / 性别 / 出生年份 / 地区 / 关于我）→ 关注 4,260 / 粉丝 4,430 → 「关注」按钮 → tab（地图 (5) / 模型）→ 复用首页地图卡。
背景 `#0D0D0D`，头像背景图 `/activities/profile/avatar-bg.png`。

---

## D. 详情页

### D1 模型详情　`/exp/model/detail/383058888963395`　✅

| 视口 | 页高 | 截图 |
|---|---|---|
| 桌面 | 4584 | `screenshots/desktop/model-detail.png` · `screenshots/desktop/model-detail_fold.png` |
| 移动 | 1986 | `screenshots/mobile/model-detail.png` · `screenshots/mobile/model-detail_fold.png` |

- **全宽骨架**（main x=0 w=1440，无导轨），顶栏 `#0D0D0D`
- 主体：3D 模型预览区（黑底）+ 标题 24–32px 700 + `40.88K` 浏览统计
- 评论区：「评论 (20)」+ 热度/时间切换 + 「请先 登录 后，再发表评论～」+ 评论列表（头像 + 昵称 + 「作者」黄标 + 内容 + 日期 + 回复/点赞）
- 页脚全宽 188

### D2 地图详情　`/exp/experience/detail/100460930`　🟡

桌面页高 1088（主体空），移动 2046（移动端渲染出更多内容）。
截图：`screenshots/desktop/exp-detail.png` · `screenshots/mobile/exp-detail.png`
关服后该详情路由的内容接口不再返回有效数据，仅保留外壳与页脚。**地图详情的完整形态未能采集。**

---

## E. 法务与帮助

| 页面 | 路由 | 桌面页高 | 移动页高 | 截图 |
|---|---|---|---|---|
| 用户服务协议 | `/docs/userAgreement` | 3054 | 7994 | `screenshots/desktop/docs-user-agreement.png` · `screenshots/mobile/docs-user-agreement.png` |
| 隐私政策 | `/docs/privacyPolicy` | 4182 | 10849 | `screenshots/desktop/docs-privacy.png` · `screenshots/mobile/docs-privacy.png` |
| 账号注销 | `/docs/accountCancellation` | 979 | 923 | `screenshots/desktop/docs-cancel.png` · `screenshots/mobile/docs-cancel.png` |
| 联系客服 | `/customerService` | 904 | 844 | `screenshots/desktop/customer-service.png` · `screenshots/mobile/customer-service.png` |
| App 下载 | `/download` | 900 | 844 | `screenshots/desktop/download.png` · `screenshots/mobile/download.png` |

文档类共性：顶栏 56px（实测 `docs-user-agreement` header h=56，比展厅的 64 矮），底 `#262626`，标题居中 24px 700，正文 14–16px 白，段号「1.1 / 1.2」形式，重点条款加粗 + 下划线。
`/customerService`：二维码 + 「服务时间：10:00-19:00」。
`/download`：**全站唯一亮色页**（`#FFFFFF` 底），App 图标 + 艺术字 + slogan「我的 AI 元宇宙」（字距 `.1em`），底部两个大胶囊按钮「打开APP」（浅黄底 `#FFF6D9` 系 + 黄描边）与「立即下载」（`#FFDB00`），左下「版本号：1.3.1」右下「更新时间：2024-05-22」12px 灰。

---

## F. 空壳与外部子域

| 页面 | 路由 | 状态 | 截图 |
|---|---|---|---|
| 关于 | `/about` | 🟡 渲染成 404 空状态「哎呀……外星人拿走了这一页」 | `screenshots/desktop/about.png` |
| 404 | `/this-page-does-not-exist` | ✅ 空状态组件（插画 + 白底胶囊按钮） | `screenshots/desktop/404.png` · `screenshots/mobile/404.png` |
| 社区 | `/social` | 🟡 仅外壳（页高 900） | `screenshots/desktop/social.png` |
| 组队大厅 | `/team-hall` | 🟡 渲染出「组队大厅 / 刷新 / 全部 / 暂无岛民创建队伍 / 快速加入 / 创建队伍」空态 | `screenshots/desktop/team-hall.png` · `screenshots/mobile/team-hall.png` |
| 神岛实验室 | `https://box3lab.dao3.fun/` | ✅ 独立站点、独立设计语言 | `screenshots/desktop/lab.png` · `screenshots/mobile/lab.png` |

`/team-hall` 空态文案「暂无岛民创建队伍」+ 右上「刷新」+ 底部「快速加入 / 创建队伍」两个按钮，是**空列表**的标准范式。

**box3lab.dao3.fun（神岛实验室）**：不属于主站设计体系。暗底 `#0E0D0D`（截图取色）+ 主色蓝 `#1473E6`（实测 `bg:rgb(20,115,230)` 14 处），固定导航 80px，产品矩阵 ArenaNext / ArenaPro / Noda / AIChat吉PT / 文档共建，代码片段装饰（`world.createEntity()`、`TypeScript`）。移动端页高 6570，是滚动叙事长页。

---

## G. 采集失败与重试记录

| 页面 | 问题 | 处理 |
|---|---|---|
| 桌面 `/exp/model` | 首次全页截图撞 16000px 上限，计算样式遍历超时 | 提高 evaluate 超时至 180s + 启用 LITE 提取，重跑成功 |
| 桌面 `/exp/experience/detail/:id` | 计算样式遍历 180s 超时（页面含 WebGL 上下文） | 改用 `shot.js`（先截图、后做 400 元素轻量采样）成功出图 |
| 移动 `/settings/account` | 重定向到 `/login?referrer=` 后返回值 JSON 解析失败 | 桌面版已采集，形态一致，标记为不补 |
| 懒加载图片 | 首屏外封面为灰色占位 | 抓取前做 0.6 视口步长滚动 + 逐图 `scrollIntoView`，全部加载完成 |
| 视口仿真 | 早期截图实际渲染宽度 2160（连到了本机已开调试端口的 Edge） | 改为 `--remote-debugging-port=0` + 独立临时 profile，实测 `innerWidth=1440` 后重跑 |
