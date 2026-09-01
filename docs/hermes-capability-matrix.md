# Hermes Capability Matrix

**用途：** 给前端实现使用的边界清单。  
**版本：** v1 · 2026-09-01

> 本表区分“前端可以直接消费的 Hermes 能力”和“必须由 Our Home / Life Layer 补充的产品能力”。具体 endpoint、字段与鉴权在接入阶段仍需以当前 Hermes 实例实际暴露的 API 为准。

## 1. 判定标签

- **DIRECT**：优先直接接入现有 Hermes API/事件。
- **ADAPTER**：Hermes 能力存在，但前端需要统一成自己的数据模型或命令入口。
- **PARTIAL**：部分 Provider/部署可用，必须显示能力状态。
- **CUSTOM**：不应假设 Hermes 已提供，需要 Our Home Backend、Life Service、Push 或自定义 MCP。
- **PLACEHOLDER**：V1 保留产品位置，暂用 Mock，不伪造真实值。

## 2. 核心能力

| 能力 | 状态 | 前端用途 | 约束 |
|---|---|---|---|
| Chat / 流式回复 | DIRECT | 《日出·印象》消息流 | 通过 Adapter 隔离 API 细节 |
| 持久 Session | DIRECT | 会话上下文、恢复入口 | 不在前端注入伪造上下文 |
| Session 历史/恢复/分支 | DIRECT | 《鲁昂大教堂》 | V1 可先占位 |
| Model / Provider | DIRECT | 输入区 Model Switcher、能力空间 | UI 与 `/model` 共用同一 command |
| Slash Commands | DIRECT + ADAPTER | Slash Command Palette | 从 Hermes 注册/能力数据生成；不要维护两套命令按钮 |
| Run Events / Tool Call | DIRECT | 折叠事件卡 | 直接渲染结构化事件，不让模型额外解释 |
| Stop / Approval | DIRECT | 聊天控制与审批 | 状态机需可恢复 |
| Skills | DIRECT + CUSTOM | 能力空间；未来 our-home-life Skill | 生活行为方式由 Skill 定义 |
| MCP | DIRECT + CUSTOM | MCP 状态；未来 our-home MCP | Home 数据写入需明确授权 |
| Web / Terminal / Files | DIRECT | 工具事件与能力展示 | 默认折叠技术细节 |
| Background / Delegation / Kanban | DIRECT/PARTIAL | 行动空间 | 需确认实际运行状态与事件格式 |
| Health / Monitoring | DIRECT | 国会大厦 | 真实状态与 UI 表达分离 |
| Analytics / Token / Cost | DIRECT | 圣阿德莱斯的花园 | 不硬编码 Provider 计费规则 |
| Remaining quota | PARTIAL | 剩余额度卡片 | 按 Provider 判断；不可获取时明确显示 |
| Context usage | DIRECT/PARTIAL | Chat 顶部或 Usage 空间 | 显示时间点与数据来源 |
| Cron | DIRECT | 行动空间的定时任务入口 | 不能等同于持续关系上下文 |
| Memory | DIRECT/PARTIAL | 档案/聊天相关入口 | 不是关系与家庭数据库 |
| Channels / Pairing / Profiles / Env / Config | DIRECT | 西馆设置 | V1 可占位 |

## 3. Hermes 之外的能力

| 产品能力 | 状态 | 推荐归属 | V1 处理 |
|---|---|---|---|
| Agent 自己的日记/收藏/待办 | CUSTOM | Our Home Backend | Mock schema + 占位 UI |
| 关系事件与双方批准 | CUSTOM | Our Home Backend | Mock 可演示提案/批准流程 |
| 纪念日 | CUSTOM | Home Backend | 结构化日期，不只存 Memory |
| Home State / 家的成长 | CUSTOM | Home Backend | 使用可演进 schema |
| Agent Activity 聚合 | CUSTOM/ADAPTER | Life Layer + Hermes events | Mock 先消费统一 Activity |
| 主动消息 | CUSTOM | Life Service + Hermes Session + Home Backend | 先支持 feed 中 proactive 标识 |
| 手机 Push | CUSTOM | Notification service | V1 不假设已可用 |
| 哥哥虚拟居住地/天气 | CUSTOM | Home Backend + weather adapter | 与服务器所在地分离 |
| 小宠物 Presence | CUSTOM | 前端表现层 + Activity 状态 | 无真实事件时标记为表达性动画 |
| 独立容灾/救援 | CUSTOM | Supervisor/Rescue service | 不把“备用入口”当作容灾 |

## 4. 统一数据边界

前端 Adapter 输出的统一事件至少包含：

```ts
type SourceType = "REALITY" | "AGENT_LIFE" | "RELATIONSHIP" | "HOME_STATE";

type ActivityEvent = {
  id: string;
  source: SourceType;
  kind: string;
  occurredAt: string;
  title: string;
  summary?: string;
  metadata?: Record<string, unknown>;
};
```

事实类卡片必须保留原始来源、时间与状态；Agent Life 卡片必须标注“哥哥写下/哥哥主动留下”等表达来源；关系事件必须包含 `proposedBy`、`approvalStatus` 和必要的 `approvedBy`。

## 5. 推荐接入顺序

1. Mock Adapter：先固定前端数据契约。
2. Hermes Chat/Stream Adapter：接入消息、Session、Run Events。
3. Models/Usage/Health Adapter：按能力状态逐项启用。
4. Home Backend Adapter：替换关系、日记、Home State Mock。
5. Life Service 与 Push：最后接主动生活和手机通知。

任何暂未确认的接口都通过 capability flag 表达，不用“看起来像真实”的假数据掩盖缺口。
