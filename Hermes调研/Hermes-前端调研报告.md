# Hermes Agent 前端调研报告

> 调研对象：github.com/NousResearch/hermes-agent（MIT）
> 版本：main 分支 `cd2bd16`，提交日期 2026-08-30
> 调研日期：2026-08-31
> 本地源码：`C:\Users\lenovo\Desktop\前端\_hermes-src\`（sparse clone，含 .git）

---

## 一、项目定位

Hermes Agent 是 Nous Research 开源的**自改进 AI Agent**，核心卖点是「闭环学习」：

- 跨会话记忆（FTS5 全文检索 + LLM 摘要）
- 自主创建技能（skills），并在使用中自我改进
- 用户建模（Honcho dialectic）
- 6 种终端后端：local / Docker / SSH / Daytona / Singularity / Modal
- 20+ 消息平台网关（Telegram、Discord、Slack、WhatsApp、Signal、Feishu、WeCom 等）

**它不是 IDE 里的 coding copilot，而是一个长期驻留、可远程操控的 agent。** 这决定了它的 dashboard 是「运维控制台」而非「聊天窗口」。

### 仓库规模

共 10750 个文件，顶层分布：

| 目录 | 文件数 | 说明 |
|------|--------|------|
| tests | 3534 | 测试 |
| apps | 2265 | 应用（含 desktop、shared 等） |
| contributors | 864 | 贡献者数据 |
| website | 812 | 官网/文档站 |
| optional-skills | 718 | 可选技能包 |
| ui-tui | 475 | 终端 UI |
| plugins | 351 | 插件 |
| skills | 330 | 内置技能 |
| **hermes_cli** | 300 | **CLI + dashboard 后端** |
| agent | 209 | Agent 核心 |
| **web** | **184** | **dashboard 前端** |
| tools | 162 | 工具集 |
| gateway | 101 | 消息网关 |
| scripts | 82 | 脚本 |
| optional-mcps | 65 | 可选 MCP |
| cron | 14 | 定时任务 |
| acp_adapter | 11 | ACP 适配器 |

---

## 二、运行方式

### 2.1 安装

```bash
# Linux / macOS / WSL2 / Termux
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

```powershell
# Windows 原生
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

安装器会自动装 uv、Python 3.11、Node.js、ripgrep、ffmpeg、portable Git Bash。
代码检出到 `$HERMES_HOME/hermes-agent`（通常 `~/.hermes/hermes-agent`）。

之后建议跑 `hermes setup --portal` 走 OAuth 配好模型与工具网关。

### 2.2 常用命令

| 命令 | 作用 |
|------|------|
| `hermes` | 启动终端 TUI |
| `hermes dashboard` | 启动 Web dashboard，**端口 9119**，默认绑定 `127.0.0.1` |
| `hermes serve` | 无头后端（不服务 SPA，只暴露 API/WS） |
| `hermes dashboard --host 0.0.0.0 --port 8080 --no-open` | 自定义地址与端口 |
| `hermes dashboard --skip-build` | 跳过前端构建，直接用已有 dist |
| `hermes gateway` | 启动消息平台网关 |
| `hermes update` | 更新；若 npm 可用会自动重建前端 |

### 2.3 开发模式（双进程）

```bash
# 终端 1：后端 API
python -m hermes_cli.main web --no-open      # FastAPI @ 127.0.0.1:9119

# 终端 2：前端 dev server
cd web && npm install && npm run dev         # Vite @ localhost:5173
```

Vite 把 `/api` 和 `/dashboard-plugins` 代理到 9119（`vite.config.ts`）。
`vite.config.ts` 里有个 `hermesDevToken()` 插件：dev 模式下抓取后端 index.html 里的
`window.__HERMES_SESSION_TOKEN__` 重新注入，否则所有受保护接口都会 401。

### 2.4 生产模式

`npm run build` → 输出到 `../hermes_cli/web_dist/` → 由 FastAPI 以静态 SPA 托管（含 SPA fallback）。
`hermes update` 时若检测到 npm 会自动重建前端。

### 2.5 认证模型（重要）

后端 `hermes_cli/web_server.py` 有两种模式：

**A. 本地回环模式（默认）**
- 进程启动时生成一次性 session token：`secrets.token_urlsafe(32)`
- 通过 `<script>` 注入 index.html 的 `window.__HERMES_SESSION_TOKEN__`
- SPA 每次请求带 `X-Hermes-Session-Token` 头
- CORS 仅允许 `http(s)://localhost|127.0.0.1(:port)?`
- WebSocket 用 `?token=<token>`

**B. 门控模式（auth gate）**
触发条件（任一）：
- 绑定非回环地址（`0.0.0.0`、LAN IP、Tailscale IP 等）
- 配置了 `dashboard.public_url`（即使后端仍绑在回环上）

此时：
- **不再注入 session token**，SPA 改用 cookie 认证 + `/api/auth/me`
- WebSocket 改用一次性 ticket（`?ticket=`）而非 `?token=`
- 必须至少注册一个 auth provider（OAuth 或 basic auth），**否则拒绝启动（fail closed）**
- `--insecure` 自 2026-06 起**不再绕过认证**（因 hermes-0day 攻击被滥用），只打印警告

配置密码认证：
```bash
python -c "from plugins.dashboard_auth.basic import hash_password; print(hash_password('你的密码'))"
# 写入 config.yaml: dashboard.basic_auth.username / password_hash
```

> **对你的场景的提醒**：你是在阿里云服务器上跑 Hermes Agent，如果要把 dashboard 绑到
> `0.0.0.0` 或配置 public_url，就必须配认证，否则进程起不来。想省事就绑 `127.0.0.1`
> 走 SSH 隧道 / Tailscale。

---

## 三、前端技术栈

`web/package.json`：

| 类别 | 依赖 |
|------|------|
| 框架 | React 19.2.7、react-dom 19.2.7 |
| 构建 | Vite 8.2.0（rolldown）、TypeScript 6.0.3 |
| 样式 | Tailwind CSS v4.3.3（`@tailwindcss/vite`） |
| 设计系统 | `@nous-research/ui` 0.18.2（Nous 自研 DS，shadcn 风格） |
| 路由 | react-router 8.3.0 |
| 终端 | @xterm/xterm 6.0.0 + addon-fit / webgl / unicode11 / web-links |
| 图表 | @observablehq/plot 0.6.17 |
| 3D | three 0.180.0、@react-three/fiber 9.6.1、leva 0.10.1 |
| 动画 | motion 12.42.2、gsap 3.15.0 |
| 图标 | lucide-react 0.577.0 |
| 其他 | qrcode、class-variance-authority、clsx、tailwind-merge、unicode-animations |
| 内部 | `@hermes/shared`（file:../apps/shared） |

脚本：`dev` / `build`(tsc -b && vite build) / `preview` / `lint` / `typecheck` / `test`(vitest) / `check`

### 工程约定（web/README.md 明确写了）

- 正文字号**不得小于 text-xs (12px)**；禁止 `text-[9px]` 之类
- 文字**透明度不得低于 0.7**，禁止 `text-muted-foreground/60` 这类叠加
- 品牌大写用 DS 的 `text-display` 工具类，不要直接写 `uppercase`
- 字体分档：品牌 chrome 用 Mondwest、页面标题用 `font-expanded`、技术内容用 mono
- 颜色优先语义 token（`text-text-primary/secondary/tertiary`、`bg-card`、`border-border`）

---

## 四、前端目录结构

```
web/
├── index.html
├── package.json / vite.config.ts / tsconfig*.json / eslint.config.js / vitest.config.ts
├── public/           # favicon.ico, fonts/ (Collapse, Mondwest, Rules*), fonts-terminal/ (JetBrains Mono)
└── src/
    ├── main.tsx              # 入口：I18nProvider > ThemeProvider > SystemActionsProvider > App
    ├── App.tsx               # 1395 行：侧边栏 + 路由 + 插件 tab 合并
    ├── index.css
    ├── pages/                # 19 个页面
    ├── components/           # 30+ 组件
    ├── contexts/             # Profile / PageHeader / SystemActions
    ├── hooks/                # useSidebarStatus / useModalBehavior
    ├── lib/                  # api.ts (2667 行) + 30 个工具/逻辑模块
    ├── i18n/                 # 19 种语言
    ├── plugins/              # 插件系统（manifest / registry / slots / sdk）
    └── themes/               # 主题系统（presets / context / fonts / types）
```

**源码规模：非测试代码 49795 行**。最大的几个文件：

| 文件 | 行数 |
|------|------|
| lib/api.ts | 2667 |
| pages/SessionsPage.tsx | 2198 |
| pages/ChatPage.tsx | 1988 |
| pages/SkillsPage.tsx | 1634 |
| pages/SystemPage.tsx | 1540 |
| pages/ChannelsPage.tsx | 1446 |
| pages/ProfilesPage.tsx | 1425 |
| App.tsx | 1395 |
| pages/ModelsPage.tsx | 1367 |
| pages/CronPage.tsx | 1233 |
| i18n/en.ts | 878 |

### 页面清单（19 个）

`/sessions`（默认首页）、`/chat`、`/files`、`/analytics`、`/models`、`/logs`、`/cron`、
`/skills`、`/plugins`、`/mcp`、`/channels`、`/webhooks`、`/pairing`、`/profiles`、
`/profiles/new`、`/config`、`/env`、`/system`、`/docs`

全部通过 `React.lazy()` 懒加载，配合 vite 的 manual chunk 分组（react-vendor / xterm / three / plot / motion / ui / vendor）。

---

## 五、关键实现机制

### 5.1 状态管理：没有 Redux/Zustand，全靠 Context

| Provider | 职责 |
|----------|------|
| `ProfileProvider` | 全局 management profile（多 profile 管理作用域） |
| `PageHeaderProvider` | 页面标题（供各页面注入 header） |
| `SystemActionsProvider` | 网关重启 / Hermes 更新等系统级动作 |
| `ThemeProvider` | 主题应用与切换 |
| `I18nProvider` | 国际化 |

**最有意思的两个设计：**

**(1) profile 作用域自动注入**
`api.ts` 里维护一个模块级变量 `_managementProfile`，`fetchJSON()` 会对
`PROFILE_SCOPED_PREFIXES` 白名单内的接口族自动追加 `?profile=<name>`：

```
/api/status, /api/gateway, /api/analytics, /api/skills, /api/tools/toolsets,
/api/config, /api/env, /api/mcp, /api/messaging/*, /api/providers/oauth,
/api/model/*, /api/pairing
```

显式带 `profile=` 的请求优先，不被覆盖。

**(2) 切 profile 强制重挂载页面树**
`ProfileKeyedRoutes` 用 `<div key={profile}>` 包住路由，切换时整个页面树重建，
避免「页面显示 A profile 的数据，写操作却打到 B profile」的脏状态。

### 5.2 接口层 `lib/api.ts`

- `BASE = window.__HERMES_BASE_PATH__`：支持反向代理路径前缀（读 `X-Forwarded-Prefix`）
- 自动注入 `X-Hermes-Session-Token` 头
- `credentials: 'include'`（为 cookie 认证路径留口）
- 401 处理：解析结构化错误信封，仅对已知错误码整页跳转 `/login`
- WebSocket：`window.__HERMES_AUTH_REQUIRED__` 为真则用一次性 ticket，否则用 `?token=`

### 5.3 Chat 页的持久化挂载（PTY 存活技巧）

ChatPage 不是普通路由，而是**渲染在 `<Routes>` 之外**，用 `display:none` 切换显示。
这样 xterm 实例、WebSocket、以及后端 PTY 子进程在切换 tab 时都不会被销毁。
同时用 `latchChatActivation()` 延迟到用户首次访问 /chat 才挂载，避免无关页面下载 xterm chunk。

### 5.4 后端 API（130+ 路由，`web_server.py` 19905 行）

| 分组 | 代表端点 |
|------|----------|
| 状态 | `/api/status`、`/api/health`、`/api/system/stats` |
| 配置 | `/api/config`、`/api/config/schema`、`/api/config/defaults`、`/api/config/raw` |
| 密钥 | `/api/env`、`/api/env/reveal`（有速率限制：30 秒窗口 5 次） |
| 会话 | `/api/sessions`*（含消息、导出、导入、剪枝、批量删除） |
| 模型 | `/api/model/info`、`/api/model/set`、`/api/model/options`、`/api/model/auxiliary`、`/api/model/moa` |
| 文件 | `/api/files`、`/api/fs/*` |
| 分析 | `/api/analytics/usage`、`/api/analytics/models` |
| 定时任务 | `/api/cron/*`、`/api/curator` |
| 技能/MCP | `/api/skills`、`/api/mcp`、`/api/tools/toolsets` |
| 渠道 | `/api/messaging/platforms`、`/api/messaging/{telegram,whatsapp}/onboarding/*` |
| 配对 | `/api/pairing`、`/api/pairing/approve`、`/api/pairing/revoke` |
| Webhook | `/api/webhooks`、`/api/webhooks/enable` |
| 凭证 | `/api/credentials/pool`、`/api/providers/oauth/*`、`/api/providers/custom-endpoints/*` |
| 记忆 | `/api/memory`、`/api/memory/providers/{name}/config`、`/api/learning/graph` |
| 运维 | `/api/ops/*`（backup / doctor / dump / import / security-audit / checkpoints / debug-share） |
| 网关 | `/api/gateway/{start,stop,restart,drain}` |
| 更新 | `/api/hermes/update`、`/api/hermes/update/check` |
| 仪表盘 | `/api/dashboard/themes`、`/api/dashboard/plugins`、`/api/dashboard/font` |
| 语音 | `/api/audio/speak`、`/api/audio/transcribe`、`/api/audio/elevenlabs/voices` |

WebSocket 端点：`/api/pty`（终端）、`/api/events`、`/api/ws`、`/api/console`、`/api/pub`、`/api/audio/speak-stream`

---

## 六、扩展点（改造时最该关注的三块）

### 6.1 主题系统 `src/themes/`

`DashboardTheme` 接口支持：

- `palette`：三层色（background / midground / foreground），各带 hex + alpha
- `typography`：fontSans / fontMono / fontDisplay / **fontUrl（外部字体链接）** / baseSize / lineHeight / letterSpacing
- `layout.radius`（圆角）+ `layout.density`（compact 0.85 / comfortable 1.0 / spacious 1.2）
- `layoutVariant`：`standard` / `cockpit`（预留左侧栏给插件 HUD）/ `tiled`（内容铺满视口）
- `assets`：bg / hero / logo / crest / sidebar / header + 自定义命名资源（都会变成 CSS 变量）
- `componentStyles`：card / header / footer / sidebar / tab / progress / badge / backdrop / page 的 CSS 变量覆盖
- `colorOverrides`：直接钉住具体 shadcn token
- `customCSS`：注入 scoped `<style>`，支持伪元素、动画、媒体查询
- `seriesColors`：图表数据系列色
- `terminalBackground` / `terminalForeground`：内嵌终端配色

内置 8 套主题（Hermes Teal、Nous Blue、Midnight、Ember、Mono、Cyberpunk、Rosé 等）。
**用户主题放 `~/.hermes/dashboard-themes/*.yaml`，drop-in 即可，不用重新构建前端。**
主题选择持久化到 `config.yaml` 的 `dashboard.theme`。

### 6.2 插件系统 `src/plugins/`

`PluginManifest`：

```ts
{
  name, label, description, icon, version,
  tab: {
    path,                              // 新 tab 路径
    position?: "end" | "after:skills" | "before:config",
    override?: "/chat",                // 顶替内置页面
    hidden?: boolean                   // 只注册 slot，不加 tab
  },
  slots?: string[],
  entry: string,                       // 插件 bundle
  css?: string | null,
  has_api: boolean,                    // 是否带后端 FastAPI 路由
  integrity?: string,                  // SRI 哈希，防篡改
  source: string
}
```

可注册的内置 slot：`backdrop`、`header-banner`、`header-left`、`header-right`、
`pre-main`、`post-main`、`overlay`

插件能力：新增 tab、顶替任意内置页面、往内置页面注入挂件、注册自己的后端 REST 路由。
插件通过 `<script>` 标签加载，`main.tsx` 里先调 `exposePluginSDK()` 暴露 React 等依赖。
支持 SRI 校验。

### 6.3 国际化 `src/i18n/`

19 种语言：en、zh、zh-hant、ja、ko、de、fr、es、pt、ru、uk、ar、tr、it、hu、ga、af 等。
`en.ts` 878 行，是基准文件；`types.ts` 定义 `Translations` 类型保证各语言键一致。

---

## 七、与「改造为更适配版本」相关的要点

1. **前后端契约不能动**：SPA 依赖后端注入的三个全局变量——
   `window.__HERMES_SESSION_TOKEN__`、`window.__HERMES_BASE_PATH__`、
   `window.__HERMES_DASHBOARD_EMBEDDED_CHAT__`。改前端时这几个钩子要保留。

2. **最低成本的定制路径是主题 + 插件，不是 fork 前端：**
   - 只改视觉 → 写 `~/.hermes/dashboard-themes/xxx.yaml`（palette / typography / radius / density / customCSS）
   - 加功能页面 → 写插件（manifest + entry bundle + 可选后端路由）
   - 改布局骨架 → 主题支持 `layoutVariant: cockpit | tiled`
   - 只有改内置页面逻辑才需要动 `web/src`，那就必须 `npm run build`

3. **改 `web/src` 的成本**：必须 `npm run build` 输出到 `hermes_cli/web_dist/` 并重启 dashboard；
   且 `hermes update` 会覆盖仓库，自定义改动需要独立维护分支或 fork。

4. **你的部署形态决定认证方案**：公网/局域网暴露必须配 auth provider，
   否则 dashboard 进程拒绝启动（这是硬约束，不是警告）。

5. **重依赖集中在少数路由**：xterm（Chat）、three（部分可视化）、plot（Analytics）、
   3D 相关。如果做精简版 dashboard，砍掉这些路由能显著减小体积。

---

## 附：本地源码位置

| 路径 | 内容 |
|------|------|
| `_hermes-src/web/` | 官方前端完整源码（184 文件） |
| `_hermes-src/web_server.py` | 后端 FastAPI（19905 行） |
| `_hermes-src/main_cli.py` | CLI 主入口（605 KB） |
| `_hermes-src/cli.py` | CLI 实现（1.03 MB） |
| `_hermes-src/_filetree.txt` | 全仓库 10750 个文件路径清单 |
| `_hermes-src/README.zh-CN.md` | 中文 README |

更新源码：
```bash
cd _hermes-src && GIT_SSL_NO_VERIFY=1 git pull
```
