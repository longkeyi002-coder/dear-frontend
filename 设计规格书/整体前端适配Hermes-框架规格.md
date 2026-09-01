# 整体前端适配 Hermes · 框架规格书（给 AI 实现用）

> 适用对象：负责 DEAR 前端重建 / 大改的 AI / 开发者
> 配套文档：`开屏页-前端规格书.md`（只管进门那一刻）
> 本文管"门里的世界"——**前端整体功能如何适配 Hermes**，以及 DEAR 现有架构的系统性问题与改造原则。

> **修订（2026-08-31 用户更正）**：Hermes 本身就带 dashboard（含 skills / mcp / kanban / system / chat 等页面，官方前端 `_hermes-src/web` 已审）。所以本文**不是**"DEAR 缺这些能力要补"——用户要**自己做一套 dashboard**（移动端优先、符合用户个人审美），把 Hermes 已有的能力通过接口接进来、用用户自己的壳重新呈现，**不重造 Hermes 的逻辑**。§2.3 已据此重写；全篇以"移动端优先 + 用户审美"为最高设计约束。

---

## 0. 给龙龙读的执行摘要

你纠正过我一句话，我记牢了：**不是"开屏页适配 Hermes"，是"前端整体功能适配 Hermes"**。开屏页是纯展示层（另一份文件管），这份文件管的是：DEAR 这套前端，怎么能真正接住你已经在顺手用的 Hermes 的能力，而不是只做一个能聊天的壳。

本文件包含四块：
1. **Hermes 真实能力全景**（我这次联网核实过的，不是凭记忆）——让你看清"可适配的面"有多大。
2. **DEAR（你的自定义 dashboard）现状 vs Hermes 能力**——Hermes 已有能力中，哪些你的 dashboard 还没接进来（以移动端优先、你的审美重新呈现）。
3. **核心架构原则**——修掉你提的第 2/4/5 条（页面覆盖、双击回不去、字体颜色没预设、动线乱），以及我审计出的性能/安全/正确性坑。
4. **清理清单 + 实施优先级**——把演示残留、硬编码 IP、死代码一次性清掉。

> 一个前提：DEAR 是你的**自有前端 + 自有后端**（`backend.py`），不是 Hermes 的官方客户端。所以"适配 Hermes"= 让 DEAR 通过 Hermes 提供的接口（OpenAI 兼容代理 / API / MCP）把它的能力用起来，并在 UI 上**恰当地呈现**这些能力，而不是在 DEAR 里重造一个 Hermes。

---

## 1. Hermes 真实能力全景（已联网核实）

> 来源：Nous Research 官方与社区文档，本次 WebSearch 核实。Hermes 是 MIT 协议开源自主智能体框架。

### 1.1 对话与模型
- **200+ 模型**接入：OpenRouter / OpenAI / Nous Portal / Anthropic，以及本地 Ollama、LM Studio、llama.cpp。
- **零模型锁定**（zero model lock-in）：随时换模型，不绑架。
- **OpenAI 兼容代理**（`hermes proxy`）：把 Hermes 的能力包装成标准 OpenAI 接口，第三方前端可直接当 Chat Completions 用——**这是 DEAR 接入的最顺路径**。

### 1.2 工具与执行
- **40+ 内置工具**（文件、shell、搜索、代码执行等）。
- **6 种终端后端**：Local / Docker / SSH / Daytona / Singularity / Modal（另有来源提到含 Vercel Sandbox 共 7 种）。
- **MCP 原生**：可挂载 MCP 服务器扩展能力，有 MCP 目录（catalog）。

### 1.3 消息平台（18+ 连接器）
Telegram / Discord / Slack / WhatsApp / Signal / Email / CLI / 飞书 / 企业微信 / 钉钉 / Matrix / Mattermost / QQ Bot / iMessage / Home Assistant / SMS / LINE / Web UI。
> DEAR 目前只做了"自己的 Web UI 聊天"——Hermes 的多平台入口 DEAR 一个都没接。

### 1.4 自主与编排
- **并行子代理**（parallel subagents）：可同时跑多个子任务。
- **`/goal` 自主循环**：给定目标后自主推进。
- **`/handoff` 会话迁移**：把当前会话交接 / 转移。
- **定时 cron 自动化**：按计划自动执行任务。
- **5 级权限控制**：从"全自动"到"每步确认"的细粒度授权。

### 1.5 记忆系统（4 层，这是 DEAR 最该适配的部分）
- **L1 提示记忆**：`MEMORY.md` + `USER.md`，每次会话注入（约 3575 字符上限）。
- **L2 会话记忆**：SQLite FTS5 全文检索 + LLM 摘要，可跨会话检索历史。
- **L3 程序/技能记忆**：自动创建、自我进化的技能（agentskills.io 标准），有 **Curator 后台进程**对技能评分、改写。
- **L4 用户建模（Honcho 辩证式）**：维护用户画像（任务偏好、决策史、常见模式、反馈信号等约 12 个身份维度）。
- 记忆有**安全扫描**（提示注入检测）；默认每次查询加载约 1300 token 的记忆上下文（比同类省 30–40% 成本）。

### 1.6 安全与密钥
- **One-Token Secrets（Bitwarden）**：安全地管理密钥，不落地明文。
- 记忆与输入经过注入检测。

---

## 2. DEAR 现状 vs Hermes 能力差距分析

### 2.1 DEAR 现有页面清单（来自代码）
聊天主界面 + 侧栏入口打开的页面：
`soulPage`（人格）、`skillsPage`（技能）、`mcpPage`（MCP）、`diaryPage`（日记）、`systemPage`（系统）、`featurePage`（功能）、`memoryPage`（记忆）、`diaryDetailPage`、`calendarPage`（日历）、`periodPage`（周期）、`dbPage`（数据）。

### 2.2 映射与差距

| DEAR 页面 / 模块 | 对应 Hermes 能力 | 现状问题 | 适配方向 |
|---|---|---|---|
| 聊天主界面 | Hermes 核心对话 + 流式 | 手搓 SSE（`startRealFlow` 约 3054，`split('\n\n')` 脆弱）；**纯 `textContent +=` 不渲染 Markdown**；`buildHistory`（3037）每轮把**全部可见聊天重发**= 烧 token（与"Hermes 太费 token"同源） | 用成熟 SSE 解析；Markdown + DOMPurify 渲染；`messages[]` 单一数据源，只增量发新消息 |
| `skillsPage` | L3 自进化技能 + Curator | 只是静态 UI，不反映 Hermes 实际技能库，看不到评分/进化 | 接入 Hermes 技能列表，展示技能、评分、可触发"改进" |
| `mcpPage` | MCP 原生 + catalog | 有页面但不真正连接 Hermes 的 MCP | 接入 Hermes MCP 目录，可增删挂载的 MCP server |
| `memoryPage` | L1/L2/L4 记忆 | 本地只读，不呈现 Hermes 的 4 层记忆与用户建模 | 呈现记忆层（提示记忆/会话检索/用户画像），可查看与编辑 `USER.md` |
| `systemPage` | 模型/权限/终端后端/密钥 | 不暴露 200+ 模型选择、5 级权限、6 终端后端、One-Token Secrets | 做"Hermes 控制台"：选模型、调权限、选终端后端、管理密钥 |
| `soulPage` | USER.md 人格（L1） | 与 Hermes 的 USER.md 是两套，没打通 | 让 soul 编辑直接写入 Hermes 的 USER.md |
| `diary/calendar/period/db` | Hermes **无**对应（是 DEAR 自有业务） | 与 Hermes 无关，但数据层应干净 | 保留为自有功能，数据本地化、与 Hermes 解耦 |
| `featurePage` | — | 功能展示页，疑似冗余 | 评估是否并入 system 或删除 |

### 2.3 Hermes 已有能力 → 你的 dashboard 要重新呈现（移动端优先 + 你的审美）
以下能力 **Hermes 官方 dashboard 已经提供**（skills / mcp / kanban 等）。你的自定义 dashboard **不重造这些逻辑**，而是通过 Hermes 的接口把它们接进来，用**移动端优先 + 你的个人审美**重新呈现——这才是"适配"的真正重心：
- 6 种终端后端选择（Local/Docker/SSH/Daytona/Singularity/Modal）
- 18+ 消息平台连接器（飞书/企微/钉钉/Telegram…）
- 并行子代理的监控面板
- `/goal` 自主循环启停
- `/handoff` 会话迁移
- cron 定时自动化管理
- One-Token Secrets（Bitwarden）密钥管理
- 5 级权限的 UI 调节
- 200+ 模型的切换
- Honcho 用户画像查看/校正
- Curator 技能评分/进化视图

> 不是要求一次全做，而是**架构上预留这些入口**，按优先级（见 §7）逐步接。

---

## 3. 核心架构原则（修掉你提的 2/4/5 条 + 审计坑）

### 3.1 单一数据源：`messages[]` 是真相
- 现状：`buildHistory`（3037）每轮从 **DOM 重新拼**消息数组 → 吞掉图片（无多模态）、刷新丢历史、重复烧 token。
- 原则：维护一个内存中的 `messages[]`（含 role / content / 可选 image），渲染由它驱动；发请求只带**增量**；刷新时用 `localStorage`/`IndexedDB` 持久化 `messages[]`（脱敏后）。
- 直接效果：token 消耗回到正常水平，多模态可进，历史不丢。

### 3.2 成熟的流式：别手搓 SSE
- 现状：`startRealFlow` 手搓 `buf.split('\n\n')` + `indexOf('data:')`，且工具事件靠 `'"tool"'` 子串猜（约 3096），极易误触发。
- 原则：用标准 `EventSource` 或 `fetch` + `ReadableStream` 的 SSE 解析；工具事件按**结构化字段**判断，不靠子串。

### 3.3 Markdown 渲染 + 安全消毒
- 现状：输出 `textContent += c`，Markdown 全变纯文本，且**无任何消毒库**（Grep 确认无 marked/markdown/DOMPurify/highlight.js）。
- 原则：引入 Markdown 渲染（如 `marked`）+ `DOMPurify` 消毒 + 代码高亮；**所有 AI 内容经 DOMPurify 后再 `innerHTML`**。离线优先用本地打包版本。

### 3.4 统一设计系统（解决"字体/颜色/大小/重点字没预设"）
- 现状：CSS `:root` 有 `--mg-*` / `--bubble` 等 token，但 JS `applyTheme` 又硬编码覆盖（双真相源）；`body` 用 `text-shadow` 糊弄对比度（约 833 行，小字发虚）。
- 原则：
  - **唯一真相源**：设计 token 只在 CSS 变量定义一次，JS 只改 CSS 变量值，不写死样式。
  - 建立**排版预设**：正文/标题/辅助文字字号、行高、字重、重点字（高亮/强调）样式，全部走 token。
  - 去掉 `text-shadow` 糊弄，靠真实配色对比度保证可读性。
  - 主题系统：内置多套**预设主题**（深色治愈/浅色干净/暗色霓虹/暖色柔和），且支持**自定义**（覆盖 CSS 变量）；切换只换变量。

### 3.5 统一 Modal 管理器（解决"页面覆盖 + 双击回不去"）
- 现状：`closeAllOverlays()`（2745）关的 ID 列表**漏 `dbPage`**，而 `openAgentPage()`（3805）却 toggle `dbPage` → 开 `dbPage` 后再开别的页，`dbPage` 残留重叠。两份硬编码列表不匹配是覆盖 bug 的根因。双击也没有"回聊天"的全局监听。
- 原则：
  - **单一 overlay 注册表**：所有可开页面在一个数组/配置里声明，**只维护一份列表**，开关都从它来，杜绝双列表漂移。
  - 任意时刻**至多一个** overlay 打开；开新页前统一关旧页（用同一份列表）。
  - 全局监听：聊天区**双击 / 点空白 / Esc** → 关掉当前 overlay 回到对话（解决"双击不能回对话"）。
  - 用 `data-overlay="id"` 属性声明页面，JS 不再散落 `getElementById('xxxPage')`。

### 3.6 离线优先（与开屏文件一致）
- 所有资源相对路径、随包分发；不引外部 CDN；第三方库（marked/DOMPurify）本地打包。
- `backend.py`（`0.0.0.0:8643`、CORS `*`）的地址**从设置读取**，不写死。

### 3.7 隐私与安全（你极度在意的点）
- **彻底删除硬编码服务器 IP** `43.108.101.95`（共 7 处：2530/2921/2924/4093/5118/5289/5292），改为设置项，且用户提示不暴露 IP。
- `localStorage` 键名避免直白（如 `dear_soul_md`），敏感内容脱敏/加密存储。
- `backend.py` 的 CORS `*` 收紧为指定源；绑定地址评估是否必须 `0.0.0.0`。
- 密钥（如 One-Token Secrets）绝不进前端明文。

---

## 4. API 契约（DEAR ↔ Hermes / 自有后端）

- **对话**：优先走 Hermes 的 **OpenAI 兼容代理**（`hermes proxy`），DEAR 的 `apiGet`/`apiWrite`（2963-2983）改为：请求失败**显式报错 + 可重试**，不再 `catch` 后静默 fallback（现状 `return fallback/false` 把错误吞了）。
- **技能 / MCP / 记忆 / 模型 / 权限 / 终端后端 / 密钥 / 自动化**：通过 Hermes 提供的对应接口拉取与下发；DEAR 只做展示与触发，不重造逻辑。
- **错误契约**：网络/鉴权/限流错误有统一错误态与重试入口；不把"演示已停用"当兜底（那是死代码遗留）。

---

## 5. UX 动线设计（解决"没有合理动线" · **移动端优先**）
> 最高约束：先为手机（一加 12，顶部居中挖孔）设计，桌面是放大版不是另一套。
- **主路径**：开屏（开屏文件）→ 聊天主界面 → 底部 Tab / 抽屉唤出功能页 → 双击/Esc/点遮罩/再点导航回聊天。
- **功能页是"浮层"不是"跳页"**：所有 `soul/skills/mcp/...` 都是覆盖在聊天之上的 overlay，关掉即回聊天，不丢对话上下文。
- **状态可见**：连接状态、当前模型、权限级别在常驻区可见（真实状态，非写死"已接入"）。
- **新手不迷路**：首次进入给一句引导（非演示文案），指向侧栏与设置里的 Hermes 控制台。

---

## 6. 清理清单（一次性清掉演示残留与死代码）

- [ ] 全局删 `43.108.101.95`（7 处：2530/2921/2924/4093/5118/5289/5292）→ 改为设置项。
- [ ] 删 `demoBar`（2274）"已接入 · 数据已同步到服务器"整块。
- [ ] 删 `syncDemoMode()`（3147）空壳，或接真实逻辑。
- [ ] 删 `if (false && addAiDiaryEntry)`（3129）死代码。
- [ ] `demoReply`（5413-5418）fallback"演示已停用，请接后端" → 改为真实错误态（后端未连接提示 + 重试）。
- [ ] `buildHistory`（3037）DOM 重拼 → 改为 `messages[]` 单一源（§3.1）。
- [ ] `startRealFlow`（3054）手搓 SSE → 标准解析（§3.2）+ Markdown 渲染（§3.3）。
- [ ] 双 overlay 列表 → 单一注册表（§3.5）。
- [ ] `applyTheme` 硬编码覆盖 → 改为只改 CSS 变量（§3.4）。
- [ ] `body` 的 `text-shadow` 糊弄 → 真实对比度（§3.4）。
- [ ] `apiGet/apiWrite` 静默 fallback → 显式错误 + 重试（§4）。
- [ ] `?reset=1`（4057）清配置无确认 → 加确认或改为显式"清空数据"按钮。

---

## 7. 实施优先级（给 AI 的落地顺序）

| 优先级 | 内容 | 对应你的问题 |
|---|---|---|
| **P0** | 开屏合并 + 立即可点 + 无白条（见开屏文件） | 问题 1 |
| **P0** | 单一 overlay 注册表 + 双击回聊天 | 问题 2 |
| **P0** | 清硬编码 IP / 演示残留 / 死代码 | 问题 3、5 |
| **P1** | `messages[]` 单一源 + 成熟 SSE + Markdown 渲染 | 性能/正确性/体验 |
| **P1** | 统一设计系统（排版/颜色/重点字预设） | 问题 4 |
| **P2** | Hermes 接入层：OpenAI 兼容代理对话打通 | 适配基础 |
| **P2** | Hermes 控制台 UI：模型/权限/终端后端/密钥 | §2.3 |
| **P3** | 技能/MCP/记忆/用户画像页面接真实数据 | 差距 §2.2 |
| **P3** | 子代理监控 / `/goal` / `/handoff` / cron UI | §2.3 |

---

## 8. 给实现 AI 的提醒
- 这两份文件是**规格**，不是让你一次全改完。先交 **P0（开屏 + overlay + 清理）** 这一刀，让"能进、不覆盖、不暴露 IP、没演示残留"先成立，再按 P1→P3 推进。
- 每一步都保证**离线可跑**、**不引入新依赖**（除非本地打包）。
- 改完用 §6 清单逐条勾，用开屏文件的 §6 验收清单交叉核对。
- 不要重造 Hermes——DEAR 是壳与自有业务层，Hermes 的能力通过它的接口"借"进来呈现。
