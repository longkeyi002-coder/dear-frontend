# Hermes Agent 前端代码审查报告

> 审查对象：`_hermes-src/web/`（NousResearch/hermes-agent main 分支 `cd2bd16`）  
> 审查日期：2026-08-31  
> 模式：**只读分析，未修改任何代码**



---

## 审查方法与覆盖范围（请先读这段）

坦白说明覆盖范围，避免你误判这份清单的完整性：

| 范围                                   | 覆盖程度                                                |
| ------------------------------------ | --------------------------------------------------- |
| `App.tsx`（1395 行）                    | **逐行通读**                                            |
| `lib/api.ts`（2667 行）                 | 前 130 行逐行 + 全部方法签名扫描（接口族、token/profile 注入机制）        |
| `plugins/usePlugins.ts`（193 行）       | **逐行通读**                                            |
| `lib/events-reconnect.ts`（85 行）      | **逐行通读**                                            |
| `themes/types.ts`、`plugins/types.ts` | 全文                                                  |
| 全量模式扫描（覆盖 `src/` 所有文件）               | XSS 面、空 catch、定时器、危险操作确认、i18n 键对齐                   |
| 关键片段核实                               | ConfigPage、EnvPage、SessionsPage、ChannelsPage 的具体实现段 |
| **构建 / 依赖 / i18n 层（主 agent 自审）**      | ✅ `package.json` / `tsconfig` / `eslint.config` 全文 + i18n 全量解析比对 + 依赖图核实 |
| **19 个页面**                           | **未全部逐行通读**，仅扫描 + 抽查（见下方失败声明）                         |
| components / lib 其余 / contexts / hooks 层    | ⚠️ 原计划由 3 个并行 subagent 深审，本次**因限流失败未产出**（见下方）        |

> ⚠️ **关于 subagent 审查失败（需向你坦白）**：上一轮我派了 3 个并行审查 agent
> （分别负责 lib+contexts+hooks / pages / components+themes+plugins）。本次它们全部返回
> `429 频率限制`（预计 2026-08-31 17:37 重置），**没有产出任何有效结论**。因此：
> - 本报告**严重 / 中等 / 轻微清单中的页面层与组件层条目，仍是「扫描+抽查」级**，并非逐行深审。
> - 我**没有**用它们的名义编造结论。所有带具体行号的内容，都是我（主 agent）亲自读到的。
> - 等限流解除后，可重跑这三路深审补全 pages / components 层的逐行结论。

**结论可信度**：标了具体行号的都是我实际读到的。页面层（尤其 ChatPage 1988 行、  
SkillsPage 1634 行、SystemPage 1540 行）如果后续要动，建议再单独深审一遍。

---

## 一、严重问题

### S1. ConfigPage 全量覆盖保存 + 初始化静默失败 → 配置损坏风险

**位置**：`pages/ConfigPage.tsx:164-203`（初始化）、`279-290`（保存）、`292-301`（YAML 保存）

**成因**：

```tsx
// 初始化：5 个并发请求，全部静默失败（确认：ConfigPage.tsx:164-203）
api.getConfig().then(setConfig).catch(() => {});
api.getSchema().then(...).catch(() => {});      // ← 关键
api.getDefaults().then(setDefaults).catch(() => {});
api.getConfigRaw().then(...).catch(() => {});
api.getStatus().then(...).catch(() => {});

// 保存：提交整个 config 对象（确认：ConfigPage.tsx:279-290）
const handleSave = async () => {
  if (!config) return;                  // 只挡 config 为 null 的情况
  await api.saveConfig(config);         // ← 全量覆盖 config.yaml
```

**确认后的精确风险**（比初版描述更准）：

1. **静默初始化失败（实测确认）**：`getSchema()` 失败时 `schema` 为 `null` → 表单渲染不出
   任何字段（见 `categories` 的 `if (!schema) return []`），但 `getConfig()` 可能已成功，
   `config` 非空。此时页面看起来"加载了"却是一片空白、无错误提示，用户困惑。
   更糟的是 `getDefaults()` 静默失败会让「重置默认值」按钮失效（`handleReset` 有
   `if (!defaults ...) return` 守卫），用户点没反应。**这是与 M2（EnvPage）同一类反模式。**

2. **全量覆盖的潜在字段丢失（需后端佐证）**：`saveConfig(config)` 把整份 `config` 对象回写。
   若 `getConfig()` 的响应因 schema 版本漂移、分段序列化等原因**漏了某些键**，保存会把
   服务端原本存在的那些键一并抹掉（除非后端做 merge）。这比"陈旧写回"更隐蔽——
   表现是正常的保存成功，但 config.yaml 悄悄变瘦。

**影响**：config.yaml 是 Hermes 核心配置。最坏情况是模型/网关/记忆配置被不完整数据覆盖，
导致 agent 起不来。代价很高。

**改造建议**：
- 初始化任一请求失败时**显式报错**（至少 toast + 重试入口），别 `.catch(() => {})`
- 保存前校验 `schema` 已加载；若未加载则禁用保存按钮
- 确认后端 `saveConfig` 是 merge 还是 replace；若是 replace，前端应保留响应里未建模的未知键
- 进阶：改成只提交 dirty 字段（PATCH 语义）+ 保存前展示 diff 让用户确认

---

### S2. 插件 JS/CSS 加载无强制完整性校验

**位置**：`plugins/usePlugins.ts:136-139`（JS）、`104-112`（CSS）

**成因**：

```tsx
// SRI 是 opt-in，manifest 不声明就不校验
if (manifest.integrity && typeof manifest.integrity === "string") {
  script.integrity = manifest.integrity;
  script.crossOrigin = "anonymous";
}
```

代码注释自己承认：*"Opt-in: when no integrity is declared in the manifest, behavior is  
unchanged."* 而 `PluginManifest.integrity` 在 `plugins/types.ts:30` 是**可选字段**。

CSS 那边更彻底——`link` 标签完全没有 integrity 机制。

**影响**：插件 bundle 从 `/dashboard-plugins/<name>/<entry>` 加载，若插件分发链路被篡改  
（MITM、插件源被攻陷、服务器上被替换文件），可静默执行任意 JS。而 dashboard 是**管理  
控制台**，能读 API 密钥、改配置、操作文件系统——插件执行的权限等于整个 dashboard 的权限。

**改造建议**：自研插件强制要求 manifest 带 integrity；后端下发 manifest 时对未签名插件  
标记为 untrusted 并在 UI 上警示；对插件 bundle 走同源 + CSP 限制。

---

## 二、中等严重问题

### M1. SidebarTooltip 在 render 期间同步读 DOM

**位置**：`App.tsx:1296-1298`

**成因**：

```tsx
function SidebarTooltip({ anchor, label, warmRef }: SidebarTooltipProps) {
  const rect = anchor.getBoundingClientRect();           // ← render 阶段读布局
  const sidebar = document.getElementById("app-sidebar"); // ← render 阶段查 DOM
  const sidebarRight = sidebar?.getBoundingClientRect().right ?? rect.right;
```

**影响**：

1. 每次 render 强制同步布局（layout thrashing），hover 时尤其明显
2. React 19 并发渲染下 render 可能被中断重放，读到的坐标可能是过期的
3. 侧边栏有 300ms 展开/收起动画（`App.tsx:590`），动画期间 rect 持续变化，  
   但 tooltip 只在 render 时算一次，位置会飘

**改造建议**：改到 `useLayoutEffect` 里读，用 state 存 rect；或直接用 CSS anchor positioning /  
Popover API 让浏览器托管定位。

---

### M2. EnvPage 加载失败永久卡在 loading

**位置**：`pages/EnvPage.tsx:619-624`

```tsx
useEffect(() => {
  api.getEnvVars().then(setVars).catch(() => {});
}, []);
```

API 密钥页加载失败后 `vars` 永远是 `null`，页面无错误提示、无重试入口，用户看到永久空白。  
密钥是核心功能页，失败静默的体验很差。

同类问题：`hooks/useSidebarStatus.ts:19`、`contexts/ProfileProvider.tsx:104`、  
`themes/context.tsx:508/512/536/556/567`。

---

### M3. 全项目 23 处空 catch，错误完全不可见

**分布**（按文件统计）：

| 文件                  | 处数 |
| ------------------- | -- |
| ConfigPage.tsx      | 6  |
| SessionsPage.tsx    | 5  |
| themes/context.tsx  | 5  |
| EnvPage.tsx         | 1  |
| ModelsPage.tsx      | 1  |
| SkillsPage.tsx      | 2  |
| ProfileProvider.tsx | 1  |
| useSidebarStatus.ts | 1  |
| OAuthLoginModal.tsx | 1  |

绝大多数数据获取失败用户都看不到任何反馈。项目里有用 `showToast` 的成熟机制  
（ConfigPage 保存失败就用了），但读取路径基本没用上。

**影响**：排查问题时无迹可寻；用户以为"功能坏了"而非"请求失败了"。

---

### M4. i18n 翻译滞后 + 设计性隐患（结论已实测修正）

**位置**：`i18n/zh.ts`、`i18n/types.ts`、`i18n/context.tsx`

> ⚠️ 本报告上一版写「中文界面会混看中英文、缺 73 健」，经不起细查，**已更正**：
> 用解析器精确比对（`en.ts` 714 键 / `zh.ts` 635 键，**缺 79 个**），并逐一核对了这 79 个键在
> 代码里的引用方式，结论是——**简体中文界面下实际零空白渲染**。原因在下面第 3 点。

**1. 缺失键的分布（实测）**

| 段 | en | zh | 缺 |
|----|----|----|----|
| profiles | 58 | 28 | 30 |
| kanban | 168 | 147 | 21 |
| app | 43 | 34 | 9 |
| common | 45 | 43 | 2 |
| cron | 54 | 52 | 2 |
| skills | 20 | 17 | 3 |
| status | 36 | 30 | 6 |
| theme | 8 | 2 | 6 |
| **合计** | **714** | **635** | **79** |

**2. 为什么编译不报错**：`types.ts` 里有 **82 个字段被标成 `?:` 可选**（如 `profiles.actions?`、`profiles.activeBadge?`）。
新增英文文案时把类型标可选，其余 15 种语言不必同步改也能过 `tsc`。代价是这些键在翻译文件里**可以不存在**。

**3. 运行期为什么没空白**：`context.tsx:124` 把 `t` 直接设成整个 `Translations` 对象（`t: TRANSLATIONS[locale]`），
**不是函数、没有回退层**。所以 `t.profiles.actions` 在中文下就是 `undefined`。但实测发现，那 79 个缺失键里**被代码引用的只有 19 个，且这 19 个全部带 `??` 英文兜底**：

```tsx
// components/MemoryPressureBanner.tsx:147
t.app.diskCriticalBanner ?? "Your agent's disk is almost full..."   // 磁盘告警，有兜底
// components/PlatformsCard.tsx:16
disabled: { label: t.status.disabled ?? "Disabled" }               // 有兜底
```

其余 60 个缺失键**在 `src/` 中零引用**（见 N1，基本是 kanban 死功能）。

**4. 真正的风险（系统性的）**：整个 i18n 没有运行期回退层，完全依赖开发者手写 `??`。
全仓 `t.xxx` 访问约 **556 处，只有 21 处（3.8%）带兜底**，集中在 7 个文件。
现状没炸，只是因为开发者碰巧给最关键的几条加了 `??`。**下一次有人新增英文串并在中文外用 `t.xxx` 直接引用——15 种语言会同时静默空白。**

**改造建议**：

- 若要长期做多语言，把 `t` 改成带回退的函数：`t('profiles.actions') ?? en['profiles.actions']`，
  或在 `context.tsx` 用 `mergeTranslations(en, locale)`（库里 `defineLocale` 已实现，只有 `ar` 在用）。
- 短期若只做中文版：补 79 个键是低投入，但**优先级低于 N1**（那些是纯死重）。

---

### M5. ChannelsPage 每秒强制重渲染

**位置**：`pages/ChannelsPage.tsx:741`、`1128`

```tsx
useEffect(() => {
  if (!setup) return;
  const timer = setInterval(() => setTick((value) => value + 1), 1000);
  return () => clearInterval(timer);   // 清理是对的
}, [setup]);
```

两处相同逻辑。清理正确，但 `setTick` 触发的是**整个 1446 行组件**的重渲染，  
每秒一次，在 WhatsApp/Telegram 配对等待期间持续跑。

**影响**：配对流程期间 CPU 持续占用，低端设备或手机浏览器上明显发热掉帧。  
倒计时用 CSS animation 或独立的小组件即可避免。

---

### M6. App.tsx 组件拆分严重不足

**位置**：`App.tsx`（1395 行）

单文件内塞了 **12+ 个组件与工具函数**：

```
App / ProfileKeyedRoutes / SidebarNavLink / SidebarSystemActions /
SystemActionButton / SidebarIconWithTooltip / GatewayDot / SidebarTooltip /
RouteFallback / RootRedirect / UnknownRouteFallback / ChatRouteSink
buildNavItems / partitionSidebarNav / buildRoutes / resolveIcon
```

**影响**：这是改造时最先撞上的墙。想改侧边栏样式要在 1395 行里翻找；  
`App.tsx` 的任何改动都会牵动全局重渲染。

**改造建议**：拆分优先级最高——`Sidebar/`、`SidebarNav/`、`SystemActions/`、  
`routing/`（路由与插件 tab 合并逻辑）。

---

### M7. 插件图标被硬编码白名单限制

**位置**：`App.tsx:226-250`

```tsx
const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Activity, BarChart3, Clock, Cpu, FileText, FolderOpen, KeyRound,
  MessageSquare, Package, Settings, Puzzle, Sparkles, Terminal, Globe,
  Database, Shield, Users, Wrench, Zap, Heart, Star, Code, Eye,
};
function resolveIcon(name: string) {
  return ICON_MAP[name] ?? Puzzle;   // 不在表里就 fallback
}
```

**影响**：插件 manifest 的 `icon` 字段是字符串，但只有这 23 个名字有效，  
写错的**静默 fallback 成 Puzzle**，插件作者不知道自己做错了什么。  
如果你要开发自定义插件 tab，这是个实实在在的坑。

---

### M8. 响应式断点 1024px 三处硬编码

**位置**：`App.tsx:396`（`useBelowBreakpoint(1024)`）、`App.tsx:504`（`matchMedia("(min-width: 1024px)")`）、  
以及全项目 CSS 里的 Tailwind `lg:` 断点

**成因**：JS 侧两处独立判断 + CSS 侧 Tailwind 默认 lg=1024px，三处没有任何关联。

**影响**：改断点要同步改三处，漏一处就出现"CSS 已切桌面布局但 JS 仍认为是移动端"的  
状态错位（侧边栏行为、tooltip 逻辑都会错）。

---

### M9. 插件加载用 2 秒固定超时兜底

**位置**：`plugins/usePlugins.ts:158`

```tsx
const timeout = setTimeout(() => setLoading(false), 2000);
```

**影响**：网络慢或插件 bundle 大时，2 秒到了就判定"加载完成"，但插件可能还没  
`register()`。结果是插件 tab 不出现，或者出现了但内容是空的——没有重试、没有报错提示。  
（`onload` 里虽有 `NO_REGISTER` 错误处理，但超时路径不触发它。）

---

### M10. 生产环境不清理插件 script 标签

**位置**：`plugins/usePlugins.ts:159-166`

```tsx
return () => {
  clearTimeout(timeout);
  if (import.meta.env.DEV) {        // ← 只有 dev 才移除
    for (const el of injectedScripts) el.remove();
  }
};
```

生产环境插件 script 常驻 DOM。这是有意为之（避免重复加载），但意味着插件更新后  
旧代码仍在内存中，`loadedScripts` ref 也会阻止重新加载。

---

### M11. App.tsx analytics 开关请求无取消

**位置**：`App.tsx:417-427`

```tsx
useEffect(() => {
  api.getConfig().then((cfg) => { ... }).catch(() => setShowTokenAnalytics(false));
}, []);
```

无 AbortController。虽然 App 是根组件很少卸载，但 profile 切换会重建页面树，  
存在卸载后 setState 的隐患。

---

### M12. 整段 kanban 翻译是死代码（~24% locale 体积）

**位置**：`i18n/*.ts` 的 `kanban:` 段

**实测**：

- 前端**没有任何 kanban 文件**，`grep -r "t.kanban"` 全仓命中 **0 次**，路由/页面/lazy 均无接线
- 但 `en.ts` 有 **168** 个 kanban 键、`zh.ts` 有 **147** 个，且 **16 种语言各自都带一份**
- 体积占比：en.ts 中 kanban 段 **8080 / 32998 字节 ≈ 24.5%**；zh.ts 中 **6662 / 28200 ≈ 23.6%**

**影响**：每个用户都下载了约 25% 的「不存在的功能」翻译。16 语言全量静态导入（见 M13），
这部分死重随语言数线性放大。对想做精简改造的你来说，这是第一个该砍的地方。

**改造建议**：如果确定不做看板功能，删掉 `kanban:` 段（16 个文件 × 约 200 行）即可瘦身 ~24%。

---

### M13. 16 种 locale 全部静态导入，无按需懒加载

**位置**：`i18n/context.tsx:3-39`

**实测**：`context.tsx` 顶部用 17 行 `import` 把 `en/zh/zh-hant/ja/de/es/fr/tr/uk/af/ko/it/ga/pt/ru/hu/ar`
**全部静态引入**，再放进 `TRANSLATIONS` 常量对象。无任何 `import()` 动态加载。

**影响**：即使用户只选「简体中文」，首屏也要把 **16 份完整翻译字典** 全部下载、解析、常驻内存。
以单字典 ~30KB 计，约 **480KB 原始文本**（gzip 后仍可观）随主包下发。

**改造建议**：改成 `Record<Locale, () => Promise<...>>` + `React.lazy`/`Suspense` 按需加载当前语言。
这是纯性能优化，不碰功能逻辑，改造风险低。

---

### M14. 6 个重型依赖 web/src 零直接引用，疑似历史遗留

**位置**：`web/package.json:17-41`

**实测**：`three`、`@react-three/fiber`、`leva`、`gsap`、`motion`、`@observablehq/plot`
在 `web/src/**` 中**直接 import 次数为 0**（仅出现在注释/英文散文里）。

**澄清（重要）**：这 6 个库是 `@nous-research/ui` 的 **peerDependencies**（已用 `npm view` 核实），
web 列它们是为满足 peer 要求，**非死依赖本身**——UI 库内部会用它们。但问题在：

1. `vite.config.ts:126-137` 已经**预先留了** `three`/`plot`/`motion` 三个分包（codeSplitting groups）。
   切分规则存在却零引用，说明这是**上一代架构的遗留**，当前 web 实际没走到对应组件路径。
2. 若 UI 库真的用了，这 6 个库（three 600KB+ / gsap / plot / motion 两套动画库并存）会显著拉大包体。

**改造建议**：`npm install` 后跑 `npx vite build` + `rollup-plugin-visualizer`，
看这 6 个库到底进了哪个 chunk、占多大；再决定要不要让 web 只依赖 UI 库真正用到的子集，
把 `leva`（开发调试 GUI）这类明显不该进生产的东西剔除。

---

### M15. 无 lockfile 提交 + 本地 `file:` 依赖 → 构建不可复现

**位置**：`web/package.json:18`（`"@hermes/shared": "file:../apps/shared"`）、仓库根（无 `package-lock.json` / `pnpm-lock.yaml`）

**实测**：`_hermes-src/web/` 下 `ls` 无任何 lockfile；`package.json` 里 `@hermes/shared` 指向本地相对路径 `../apps/shared`。

**影响**：

1. 依赖版本靠 `^` 浮动，不同时间 `npm install` 可能拉到不同次版本，**构建结果不可复现**
2. 你后续要 fork 改造时，若没锁文件，每次 `npm ci` 行为都不一致，排障极难
3. `file:../apps/shared` 意味着构建强依赖 monorepo 兄弟目录存在——单独拷 `web/` 出去构建会失败

**改造建议**：提交 lockfile；fork 改造时把 `@hermes/shared` 改为你自己的版本源或 vendored 副本。

---

### M16. web 深度耦合 UI 库内部子路径（脆弱）+ UI 库自带 sanitize（正面）

**位置**：`web/src/**`（219 处）、`package.json`（`@nous-research/ui` 依赖 `sanitize-html`）

**实测**：

- web 不是从 `@nous-research/ui` **公共入口**导入，而是从**内部实现路径**导入：
  `@nous-research/ui/ui/components/*`（**219 处**）、`@nous-research/ui/hooks`（29 处）、
  `@nous-research/ui/ui/components/typography/*`（13 处）
- 同时核实 UI 库依赖 `sanitize-html@^2.17.4` —— 说明其 HTML/富文本渲染走 **sanitize 路径**，
  这正面呼应了「全仓 XSS 面干净」的结论（Markdown 等富文本大概率交给 UI 库的已净化组件）。

**影响（脆弱面）**：web 绑死了 UI 库的**内部文件结构**。一旦 `@nous-research/ui` 重构目录，
219 处 import 会集体失效。你想换 UI 风格时，这套内部耦合是最先绊住你的东西。

**改造建议**：若长期维护 fork，考虑在 web 侧做一层薄 re-export（`@/ui` 统一再导出用到的组件），
把对 UI 库内部路径的依赖收敛到一处，降低升级时的破损面。

---

## 三、轻微问题

### L1. 移动端全屏遮罩用 Button 元素实现

**位置**：`App.tsx:557-567`

```tsx
<Button ghost aria-label={t.app.closeNavigation} onClick={closeMobile}
  className="lg:hidden fixed inset-0 z-40 p-0 block bg-black/70" />
```

语义上是个按钮，屏幕阅读器会读成"按钮"，但它实际是一块点击关闭的遮罩。  
建议改成 `div` + `onClick`，另配一个真正的关闭按钮。

### L2. 插件 tab 定位失败静默降级

**位置**：`App.tsx:277-282`  
`position: "after:skills"` 这类定位找不到目标路径时，静默 push 到末尾，不报错不警告。

### L3. 路由表用 Record 而非数组

**位置**：`App.tsx:156-176`  
`BUILTIN_ROUTES_CORE` 是 `Record<string, ComponentType>`，路由顺序依赖对象键的插入顺序。  
虽然 JS 里字符串键顺序可预测，但数组更直白、更不容易在重构中出错。

### L4. body overflow 保存/恢复脆弱

**位置**：`App.tsx:495-500`  
保存 `document.body.style.overflow` 字符串再恢复，若有第二个组件同时操作会互相覆盖。

### L5. YAML 保存前端无语法校验

**位置**：`pages/ConfigPage.tsx:292-301`  
`handleYamlSave` 直接把文本发给后端，前端不校验 YAML 语法。虽有后端兜底，  
但错误要等一个来回才反馈。

---

### L6. tsconfig 开启 `strict` 但缺 `noUncheckedIndexedAccess`

**位置**：`web/tsconfig.app.json:26-31`

`"strict": true` 已开，但**没有** `noUncheckedIndexedAccess`。意味着 `arr[i]`、`obj[key]`
的返回类型不带 `undefined`，数组越界 / 字典缺键在类型层面**完全静默**。
考虑到库里大量用 `PROFILE_SCOPED_PREFIXES`、`ICON_MAP[key]` 这类查表，漏开这一项是可避免的类型安全缺口。

**改造建议**：加上 `"noUncheckedIndexedAccess": true` 并重跑 `tsc`，按报错逐个补空值守卫。

---

### L7. 维护者自己在 eslint 配置里承认存在反模式

**位置**：`web/eslint.config.js:27-34`

```js
// TODO: upgrade these react-hooks v7 rules from 'warn' to 'error' after
// refactoring set-state-in-effect, ref-as-instance-var, and manual
// memoization patterns in the web codebase.
'react-hooks/set-state-in-effect': 'warn',
'react-hooks/refs': 'warn',
'react-hooks/preserve-manual-memoization': 'warn',
'react-hooks/static-components': 'warn',
```

这是**维护者亲笔留下的自证**：代码库确实存在「effect 里 setState」「ref 当实例变量」
「手动 memoization」等 React 反模式，且当前只能降级为 `warn` 才不报错。
你后续深审 pages 层时（尤其 ChatPage / SkillsPage / SystemPage），这几类问题会高频出现，
建议直接按 `react-hooks` 规则面去扫。

---

## 四、值得肯定的实现（改造时不要破坏）

这几块质量明显高于平均水准，重构时务必保留：

1. **`lib/events-reconnect.ts`** —— WebSocket 重连策略写得很规范：  
   指数退避 1s→30s、最多 15 次、区分正常关闭（1000）与认证失败（4401/4403）不重试、  
   用 `isEventsFeedMessage()` 避免误清其他组件写在同一个 banner 上的消息。可以直接抄。
2. **轮询清理规范** —— `SessionsPage.tsx:1160-1166` 的 `setInterval(loadOverview, 5000)`  
   配 `cancelled` 标记 + `clearInterval`；`ChannelsPage.tsx:732-736` 的递归 setTimeout  
   同样是 `cancelled` + `clearTimeout`。没有发现未清理的定时器。
3. **XSS 面干净** —— 全项目扫描**零** `dangerouslySetInnerHTML` / `innerHTML` /  
   `outerHTML` / `insertAdjacentHTML`。会话内容、日志、文件名这些用户可控数据的渲染  
   走的是 React 默认转义。
4. **localStorage 访问均包 try/catch** —— `App.tsx:380-395`（侧边栏折叠状态）、  
   `usePlugins.ts:23-39`（manifest 缓存），都考虑了隐私模式/存储满的情况。
5. **Chat 页持久化挂载** —— ChatPage 渲染在 `<Routes>` 外，用 `display:none` 切换，  
   切 tab 时 xterm、WebSocket、后端 PTY 子进程全都不销毁；再用 `latchChatActivation()`  
   延迟到首次访问 /chat 才挂载，避免无关页面下载 xterm chunk。这个设计很实用。
6. **profile 作用域防串数据** —— `ProfileKeyedRoutes` 用 `<div key={profile}>` 强制重建  
   页面树，配合 `fetchJSON` 自动注入 `?profile=`，避免"显示 A profile 数据、写入 B profile"。

7. **EnvPage 密钥处理规范**（实测确认）——
   - 密钥默认脱敏：`redacted_value` 只存 `前4…后4`（`EnvPage.tsx:696`），UI 不显示明文
   - `revealEnvVar` 需**显式点击**才取回明文（`EnvPage.tsx:755-770`），不是默认展开
   - 删除走 `useConfirmDelete` 二次确认（`EnvPage.tsx:719`）
   - 调试分享 `runDebugShare` 默认 `redact: true`（`api.ts:1289`），可手动关
   - 这跟 XSS 面干净（第 3 条）一起，说明安全基线在关键处是到位的。

8. **系统性观察：静默初始化失败是跨页反模式** —— 不只 M2（EnvPage）和 S1（ConfigPage），
   这种 `api.xxx().then(setX).catch(() => {})` 的写法在多个页面重复出现。
   它不是单点 bug，而是**没有统一的异步加载/错误状态层**导致的蔓延。改造时建议抽一个
   `useAsync`/`useResource` hook 统一管 loading/error/retry，从根上收掉这 23 处空 catch（M3）。

9. **危险删除操作确认覆盖完整（扫描确认）** —— 全仓调用 `api.delete*/remove*/kill*/purge*`
   的页面共 10 个（Cron/Env/Files/Mcp/Pairing/Plugins/Profiles/Sessions/System/Webhooks），
   **这 10 个全部引用了 `ConfirmDialog` / `useConfirmDelete`**。即「会删数据的页面」⊆
   「有确认弹窗的页面」，没有发现裸删。
   ⚠️ 扫描级结论：确认了"调用方都引入了确认机制"，但未逐一核对每个 call site 是否真的
   `await` 了用户确认结果（这部分要等 pages 层逐行深审时再钉死）。

---

## 五、改造优先级建议

结合你"在它基础上做更适配版本"的目标：

| 优先级 | 事项                                   | 理由                                |
| --- | ------------------------------------ | --------------------------------- |
| P0  | 拆分 `App.tsx`（M6）                     | 不动它就没法改任何 UI                      |
| P0  | 修 ConfigPage 保存逻辑（S1）                | 全量覆盖有配置损坏风险，你改造时必然会动配置页           |
| P1  | 补 zh.ts 79 个键（M4）                    | 优先级已下调：实测中文界面零空白（均有 `??` 兜底）；真正要修的是 i18n 回退层缺失，属长期项 |
| P1  | 插件图标白名单改成可扩展（M7）                     | 你要加自定义 tab 的话必踩                   |
| P1  | 统一错误处理机制（M2/M3）                      | 23 处空 catch 收敛成一个 `useAsync` hook |
| P2  | SidebarTooltip 改 useLayoutEffect（M1） | 交互细节，但 hover 卡顿很影响质感              |
| P2  | ChannelsPage 倒计时拆组件（M5）              | 性能，手机端明显                          |
| P2  | 插件 SRI 强制化（S2）                       | 若只用自己写的插件可后置                      |

---

## 附：审查命令备忘

```bash
# 重新拉取最新源码
cd _hermes-src && GIT_SSL_NO_VERIFY=1 git pull

# 自查 XSS 面（当前应为空）
grep -rn "dangerouslySetInnerHTML\|innerHTML\|outerHTML" web/src --include=*.tsx

# 自查空 catch
grep -rn "catch\s*(\([^)]*\))?\s*{\s*}" web/src

# i18n 键对齐检查（en vs zh）
python -c "..."
```
