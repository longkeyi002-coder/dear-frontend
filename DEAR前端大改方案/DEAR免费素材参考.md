# DEAR · 免费/可商用 素材参考（魔法阵 + 图标 + 小组件）

> 用途：给低保真原型与后续实现提供**真正能拿来用**的素材——魔法阵图形、小图标 sigil、卡牌/小组件代码。
> 授权原则（你强调过版权敏感）：只收 **CC0 / 公有领域 / MIT / ISC / CC BY(可商用)** 的来源；CLAMP 原版图一律不碰。
> 你的许可边界：**自用 + 可以尽量还原 CLAMP 卡面味道，但不做像素级一模一样**。→ 见 §四「手画 SVG 还原语法」，按结构重画、不描原图。

---

## 一、魔法阵 / 圆形装饰（卡背、中央底、浮层装饰）

| 来源 | 授权 | 内容 | 怎么用 |
|---|---|---|---|
| **OpenClipart** (openclipart.org) | **CC0 公有领域** | 18 万+ SVG，搜 "magic circle" / "summoning circle" 有现成矢量 | **最安全**。卡背魔法阵、卡面中央底纹直接拿，可改色 |
| **ClipSafari** (clipsafari.com/tags/magic%20circle) | **CC0** | "Circle of Power" / "Arcane Device" 等多张魔法阵，SVG+PNG | 卡背圆环、装饰环 |
| **SVGDuck** (svgduck.com) | **CC0** | 通用 circle / ring / sparkle SVG（2048×2048，可改色） | 卡面外圈、星芒、光点 |
| **publicdomainvectors** | **CC0 / 公有领域** | 各类几何/符文圆环矢量 | 备用 |
| Wikimedia 数学魔法阵 (Yang Hui 等) | **CC BY-SA 4.0 / CC BY 3.0** | 古风同心圆魔法阵 | 需署名+同协议，**不优先**，除非愿意标来源 |

> 实操：下 2~3 张 CC0 魔法阵 SVG，在原型里当「卡背」和「牌册背景水印」，用 CSS `filter` 改金/粉色，叠在紫底上。

---

## 二、小图标 / sigil（35 张功能卡的中央符号）

> 功能卡的「中央 sigil」需要一套统一描边/风格的图标。两套搭配：
> - **魔法感 sigil** → game-icons（巫师/星辰/卷轴风，最贴主题）
> - **UI 骨架图标** → Lucide / Tabler（导航、设置、状态点，干净一致）

| 图标库 | 授权 | 量 | 风格 | 适合 |
|---|---|---|---|---|
| **game-icons.net** | **CC BY 3.0**（部分 CC0） | 4180 | 手绘游戏/奇幻：巫师帽、魔杖、星、卷轴、盾、剑、沙漏、钟、镜、双子… | **35 张功能卡的 sigil 首选**（魔法主题最对口）；商用免费但**需署名作者**（自用无所谓） |
| **Lucide** (lucide.dev) | **ISC**（≈MIT） | 1400+ | 极简 2px 描边，统一网格 | 导航/设置/状态点/工具类图标 |
| **Tabler Icons** (tabler-icons.io) | **MIT** | 5000+ | 描边/填充/双色 | 大项目全覆盖，找特定图标 |
| **Heroicons** (heroicons.com) | **MIT** | 292 | Tailwind 团队，outline/solid | 界面主图标 |
| **Phosphor** (phosphoricons.com) | **MIT** | 1200+ | 6 种字重，含 Duotone | 需要字重变化 |
| **Majesticons** | **MIT** | 1045 | 现代描边 | 备选 |
| **Iconoir** | **MIT** | 1600+ | 描边，分类广 | 备选 |
| **FreeSVG / OpenIconLibrary** "shiny star" | **CC0** | — | 填充星 | 四角星/闪光点（卡面角饰） |

> 推荐组合：**game-icons 当功能 sigil（魔法味）** + **Lucide 当系统/导航图标（干净）**。game-icons 的 `star`、`crystal-ball`、`book`、`sword`、`shield`、`hourglass`、`scroll`、`mirror`、`twins`、`lock`、`cloud`、`dream`（sleeping mask）等直接对应 §三 的库洛牌配对。

---

## 三、小组件 / 卡牌组件（直接抄代码的魔法感 UI）

| 组件库 | 授权 | 关键组件 | 给 DEAR 用 |
|---|---|---|---|
| **Aceternity UI** (ui.aceternity.com) | 免费核心 + 付费全量 | **3D Card**（鼠标倾斜浮起）、**Glowing Effect**（流光边框，Cursor 同款）、**Aurora Background**、**Shooting Stars / Stars Background**、**Card Spotlight**、**Moving Border** | **魔法感主力**：卡牌 3D 倾斜、流光金边、星空背景、回家浮层星光 → 极贴「百变小樱」 |
| **Magic UI** (magicui.design) | **MIT**（全免费） | Animated Beam、Spotlight、Shimmer、Retro Grid、Marquee | 连接态光束、文字微光、网格背景 |
| **shadcn/ui** (ui.shadcn.com) | 免费开源（你拥有代码） | Card / Dialog / Sheet / Tabs 等基础件 | 浮层/抽屉/设置页骨架 |
| **Flowbite React** | **MIT** | 60+ 预置块（Navbar/Table/Form） | 驾驶舱页（看板/监控/控制台）快速搭 |
| **Flipping-card-HTML-CSS** (abdiqafar-ai) | **MIT** | 纯 HTML/CSS 玻璃拟态翻牌（无 JS） | 翻牌卡直接参考 |
| **Flip-The-Card** (Kumarkodi) | **MIT** | 纯 HTML/CSS/JS 翻牌，可点击 | 翻牌交互参考 |
| **3d-rotating-card-ui** (9jastack) | **MIT** | 点击 3D 翻转卡 | 翻牌参考 |
| **html-css-javascript-card** (he-is-talha) | **MIT** | 15 种卡（展开/3D hover/内存卡…） | 卡效果灵感库 |
| **Interactive-Profile-Card** (FruatreMaou) | 开源 | 玻璃拟态+Aurora 流光边框+3D 倾斜+粒子背景 | 单卡「活」起来的完整范例 |

> 注意：Aceternity 的「付费全量」组件需订阅；**免费核心层已含 3D Card / Glowing Effect / Aurora / Stars 等够用的**。Magic UI 全 MIT 更无忧。react 系组件需 framer-motion；原型阶段可先用纯 CSS 翻牌（上面 MIT 仓库）跑通，再换 Aceternity 升级质感。

---

## 四、如何还原 CLAMP 卡面语法（自用、手画 SVG、不全抄）★

> 你允许「尽量还原味道但不完全一样」。最稳做法：**按库洛牌的视觉语法手画一套原创 SVG 组件**，不描 CLAMP 原图像素。这样既贴近味道，又零版权风险。

**卡面结构（原创重画，对应 `DEAR百变小樱素材参考.md` §一）**
1. **外框**：金色流动藤蔓/卷草描边（用 SVG `path` 贝塞尔曲线手画圆角卷边，≠ CLAMP 原线）。
2. **四角星**：4 角各放一个 4 角星（用 FreeSVG CC0 星 或 手画 `<path>`，旋转复用）。
3. **顶部**：金色太阳圆盘（内嵌该卡 sigil）+ 左右两弯残月弧（手画弧线）。
4. **中央**：紫色径向渐变底 + 该功能的 game-icons sigil。
5. **底部缎带**：一条 `<rect>` banner 写功能名（类别色）。
6. **背面**：深绯红圆 + 一张 CC0 魔法阵（§一）叠在中央 + 四角星。

**借 vs 不借**
- ✅ 借：金线外框/四角星/日月/翻牌/魔法阵「视觉语法」、通用 CC0 素材。
- ❌ 不借：CLAMP 原画图、库洛魔法阵原图、动画截图——这些有版权，重画不等于复制。

**落地**：原型里做一个 `<ClowFrame>` SVG 组件（参数：类别色 + sigil + 功能名），35 张卡只换中间内容——和 `amriikk/ClowCards-React`（SVG+data 驱动）同思路。

---

## 五、授权速查表

| 授权 | 可商用 | 需署名 | 可改 | 来源举例 |
|---|---|---|---|---|
| **CC0 / 公有领域** | ✅ | ❌ | ✅ | OpenClipart、ClipSafari、SVGDuck、FreeSVG |
| **MIT / ISC** | ✅ | ❌ | ✅ | Lucide、Tabler、Heroicons、Phosphor、Magic UI、Aceternity(免费层)、各 MIT 翻牌仓库 |
| **CC BY 3.0** | ✅ | ✅ | ✅ | game-icons（自用署名即可，或干脆只在代码注释留名） |
| **CC BY-SA** | ✅ | ✅ | ✅（同协议） | Wikimedia 数学魔法阵（不优先） |

---

## 六、下一步

1. 我从 §二 给 35 张卡挑好 game-icons sigil（已和库洛牌配对对齐），从 §一 下 2~3 张 CC0 魔法阵。
2. 做**可点击低保真 HTML 原型**（一加 12 视口）：聊天(家) + Dock 常看 + 上滑牌册抽屉 + 翻牌浮层；卡面用 §四 手画 `<ClowFrame>` SVG（金边/四角星/日月），背面叠 CC0 魔法阵。
3. 质感升级（可选）：把纯 CSS 翻牌换成 Aceternity 的 3D Card + Glowing Effect + Aurora/Stars 背景。
4. 之后进 P0 实现（BFF 骨架 + 认证 + 聊天打通 Hermes 代理）。

> 你定先后：① 直接做原型，还是 ② 先把素材再扩（比如找真实的卡面参考图给你看结构）？🍌
