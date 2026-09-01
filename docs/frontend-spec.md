# 莫奈画廊·我们的家 — Frontend Spec

**开发基线：** v1 Phase 1  
**目标：** 先完成可运行的前端壳、响应式画廊、Theme System 与 Mock 数据层；暂不接真实 Hermes。

## 1. 技术与工程约束

- 保持仓库现有 Vite + TypeScript 结构，不修改 Hermes 源码。
- 前端通过 Adapter 访问后端，组件不直接拼接 Hermes endpoint。
- 所有服务地址由环境变量提供；未来阿里云部署建议由 Nginx 将 `/api/hermes` 反代到 Hermes Gateway。
- Mock 与真实实现必须实现相同的 TypeScript 接口。
- 不把 Token、Provider 剩余额度、Agent 心情或生活事件写死成“事实”。
- 移动端优先，桌面端增强；支持键盘、触摸与可访问名称。

## 2. Phase 1 交付范围

### 必须完成

1. Gallery Shell：东馆/西馆切换、主题背景、画框、标签卡、返回画廊。
2. 桌面端 Gallery Wall：多画框网格与 hover/focus 状态。
3. 手机端 Gallery Carousel：一次突出一幅，左右滑动或按钮切换。
4. 东馆五个空间的可进入页面：
   - 《睡莲》 Home
   - 《日出·印象》 Chat
   - 《撑阳伞的女人》 Our Corner
   - 《罂粟花田》 Goals
   - 《圣阿德莱斯的花园》 Usage
5. Chat UI：消息、输入框、模型选择、附件/搜索/语音入口、Slash Command Palette。
6. Tool Call 折叠卡、主动消息标识、来源标识。
7. Mock 数据层、加载/空状态/错误状态和 capability flags。
8. 基础响应式与可访问性验证。

### 暂不完成

真实 Hermes 鉴权、生产流式连接、Our Home Backend、Push Notification、真实天气、后台 Life Loop、完整西馆管理功能。为这些能力提供清晰的 placeholder 与接口边界即可。

## 3. 路由与空间模型

推荐空间模型：

```ts
type GalleryWing = "east" | "west";

type GallerySpace = {
  id: string;
  wing: GalleryWing;
  title: string;
  subtitle: string;
  paintingKey: string;
  status: "ready" | "placeholder";
  order: number;
};
```

路由可采用 `/`, `/space/:spaceId` 或等价方案。进入画作后，页面使用 `paintingKey` 选择 ThemePreset；不要为每一幅画复制一套全局 CSS 或业务组件。

## 4. Theme System

每幅画只改变视觉语言，不改变业务交互契约：

```ts
type ThemePreset = {
  painting: string;
  background: string;
  surface: string;
  surfaceRaised: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  frame: string;
  glow: string;
  texture?: string;
  motion: "calm" | "mist" | "warm" | "deep";
};
```

东馆默认：雾蓝、浅绿、柔粉、暖金、通透柔光。  
西馆默认：深褐、暗金、墨绿、暖灰、低亮度厚框。

主题必须满足对比度、焦点可见和 reduced-motion 需求；动效是氛围增强，不得阻塞导航或阅读。

## 5. 数据层契约

建议按领域拆分 Mock Adapter：

- `HomeAdapter)：关系持续时间、天气、最近活动、留言、Presence、Home State。
- `ChatAdapter)：消息、发送、流式片段、主动消息、Tool Events。
- `UsageAdapter)：Token、费用、模型占比、Context、Tool Call、capability。
- `RelationshipAdapter)：时间线、日记、纪念日、提案与批准。
- `GoalsAdapter)：Goal、Subgoal、Kanban、待办。

所有数据均可带：

```ts
type DataEnvelope<T> = {
  data: T;
  source: "mock" | "hermes" | "home-backend";
  fetchedAt: string;
  capability: "available" | "unavailable" | "placeholder";
};
```

缺失能力的组件使用“暂不可获取/即将接入/需要连接服务”等明确文案，不显示 0、空字符串或伪造日期来冒充真实数据。

## 6. Chat 交互规范

- 输入 `/` 后立即打开 Palette；输入更多字符实时过滤。
- Palette 展示命令名、简短说明、分类；支持最近使用。
- 桌面：上下键选择、Enter 确认、Esc 关闭。手机：点按选择。
- 命令参数采用第二步选择器，例如 `/model` 选择模型后再提交。
- Slash Command、顶部按钮和快捷按钮共用 command executor。
- 发送中显示可取消状态；Tool Call 默认折叠，展开时读取已返回结构化数据。
- proactive 消息与普通回复进入同一消息流，但有温和的视觉标记和来源标签。
- 组件文案不能把 Agent Life 推测写成 REALITY。

## 7. 页面验收标准

### Gallery

- 桌面能同时看到多幅画框，点击/键盘聚焦可进入。
- 手机一次突出一幅，滑动/按钮切换自然，不出现横向溢出。
- 东馆/西馆切换在两端都可发现，返回路径明确。

### Home

- 首屏能看见关系持续时间、天气、留言与最近活动。
- 真实活动与 Agent Life 视觉上可区分。
- Presence 状态无数据时显示等待/未知，不假装在做某件事。

### Chat

- `/` 面板可打开、筛选、关闭和选择。
- 消息发送、空状态、错误状态与发送中状态可演示。
- Tool Call 展开不会触发额外模型请求。
- 模型切换不要求离开聊天空间。

### Usage

- 能展示 Mock 的 Token、费用、模型占比、Context 与 Tool Call 构成。
- 剩余额度卡片支持 unavailable/placeholder 状态，并显示原因。
- 图表或进度展示旁边有单位、时间和来源。

### Data integrity

- 所有领域对象都有稳定 id。
- 时间使用 ISO 字符串，渲染统一处理时区。
- 关系事件有来源和审批状态。
- 前端测试优先验证行为与数据关系，不写会随模型目录变化而失效的快照式断言。

## 8. 后续阶段接口预留

真实接入可按以下顺序替换：

```
MockHome / MockChat / MockUsage
        ↓
HermesClient + HomeClient
        ↓
LifeService + NotificationService
        ↓
our-home MCP
```

前端不应依赖某一个 Hermes 端口或把服务器所在地当作哥哥居住地；部署时使用环境变量与反向代理隔离这些细节。
