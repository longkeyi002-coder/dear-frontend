# Our Home MCP

独立的 Our Home 生活系统 MCP 和 Life Loop，既可以供 Hermes Agent 调用，也可以独立运行。它不修改 Hermes 核心，也不包含前端。

当前版本使用本地 JSON 数据层，目的是先固定 MCP 工具契约、持续上下文和数据真实性边界。真实 Home Backend 接入后，可以替换 `JsonStore`，不需要改变 Hermes 侧工具名称。

## 重要边界

MCP 是工具接口；它本身不会凭空产生意识，也不会在没有进程运行时唤醒 AI。`src/worker.ts` 是独立的常驻 Life Loop：它用自己的心跳读取数据、处理主动消息候选，不依赖 Hermes Cron，也不会为每次心跳创建 Hermes session。

当前 worker 能独立投递“已经生成的主动消息候选”。它不会凭空推断你在做什么；手机状态、屏幕使用情况、日历和天气必须由明确的数据适配器写入 observation，并带来源与置信级别。

## 能力

读取：

- `home.get_today`
- `home.get_status`
- `home.get_life_context`
- `home.record_observation`
- `home.list_observations`
- `home.add_routine`
- `home.list_routines`
- `home.list_diary`
- `home.list_messages`
- `home.list_actions`
- `home.list_relationship_events`
- `home.list_activity`

写入：

- `home.write_diary`
- `home.leave_message`
- `home.schedule_proactive_message`
- `home.list_proactive_messages`
- `home.dismiss_proactive_message`
- `home.create_action`
- `home.update_action`
- `home.propose_relationship_event`
- `home.approve_relationship_event`
- `home.mark_message_read`

所有返回都带 `dataSource: local-mock`。示例数据不是 Hermes 真实活动，关系提案在批准前也不是已确认事实。

## 安装与检查

```bash
npm install
npm run check
```

## 独立 Life Loop

先构建，再启动一个长期运行的独立 worker：

```bash
npm run build
OUR_HOME_DATA_FILE=./data/our-home.json \
OUR_HOME_WORKER_INTERVAL_MS=60000 \
npm run worker
```

这个 worker 只做几件事：记录心跳、读取生活上下文、可选地调用独立决策适配器生成候选、查找已到期的候选并交给通知适配器。它不调用 Hermes，也不创建 Hermes session。

如果配置 `OUR_HOME_DECISION_WEBHOOK_URL`，worker 会把 `home.get_life_context` 同样的结构化上下文 POST 给决策服务。决策服务必须返回 `{"candidates": [...]}`；返回内容会经过 schema 校验并进入主动消息队列。这样模型可以根据真实 observation 做判断，但模型本身仍然是可替换的，不绑定 Hermes。

没有配置通知地址时，候选消息会保持 `pending` 并重试，不会被假装成“已发送”。配置一个接收 JSON POST 的通知适配器：

```bash
OUR_HOME_NOTIFY_WEBHOOK_URL='https://your-notifier.example/webhook' \
OUR_HOME_NOTIFY_WEBHOOK_TOKEN='optional-token' \
OUR_HOME_RUN_WORKER=true \
npm run dev:worker
```

发送出去的事件类型是 `our_home.proactive_message`。它是通用 Webhook，不绑定 Telegram、微信或其他具体渠道；后续可以单独增加手机通知适配器。

手机端可以通过受保护的 HTTP API 上报状态：

```http
POST /v1/phone/heartbeat
Authorization: Bearer <OUR_HOME_INGEST_TOKEN>
Content-Type: application/json

{"deviceId":"android-main","status":"screen_on","batteryPercent":82}
```

也可以批量上报 `POST /v1/observations`，例如 `screen_app`、`device_presence` 或 `calendar`。服务端会强制把这些记录标为 `source=phone`、`confidence=observed`，不会接受手机端把它们伪装成其他来源。

## 给 Hermes 使用：stdio

stdio 是本机 Hermes 最简单的方式：MCP 作为独立子进程运行，但数据和 Hermes 进程分开。

```bash
npm run build
```

在 Hermes 的 MCP 配置中添加类似配置：

```json
{
  "name": "our-home",
  "command": "node",
  "args": ["/absolute/path/to/our-home-mcp/dist/index.js"],
  "env": {
    "OUR_HOME_DATA_FILE": "/absolute/path/to/our-home-data.json"
  }
}
```

## 给 Hermes 使用：Streamable HTTP

HTTP 模式适合 MCP 与 Hermes 不在同一进程或未来部署为独立服务：

```bash
OUR_HOME_MCP_TRANSPORT=http \
OUR_HOME_MCP_TOKEN='replace-with-a-long-random-token' \
OUR_HOME_MCP_HOST=127.0.0.1 \
npm run dev
```

地址：`http://127.0.0.1:8787/mcp`

进程检查地址：`http://127.0.0.1:8787/healthz`

如果绑定到非本机地址，服务会强制要求 `OUR_HOME_MCP_TOKEN`；生产环境还应放在 HTTPS 或受保护的反向代理后面。不要把个人生活数据服务裸露到公网。

默认不开放跨域；只有浏览器客户端确实需要调用时，才设置 `OUR_HOME_MCP_CORS_ORIGIN`。

当前 Token 是服务级别的共享密钥，不是完整的用户级鉴权；在接入真实个人数据或公网部署前，必须再增加用户身份、权限范围和写入审批。

## 数据边界

- `REALITY` 只能由真实系统适配器写入；当前没有 REALITY 适配器。
- Agent 日记和主动留言是 `AGENT_LIFE`。
- 关系事件包含 `proposedBy`、`approvedBy`、`approvalStatus`。
- 家的 Presence 当前是 `HOME_STATE`，无真实数据时使用 `unknown` 或 `waiting`。
- Hermes Memory 不替代结构化日记、关系事件和行动数据。

## 后续替换点

1. 用真实数据库替换 `src/store.ts` 的 `JsonStore`。
2. 增加 Hermes 事件只读适配器，将 Tool Call、Session、任务活动归类为 `REALITY`。
3. 给写工具增加用户级鉴权和更细粒度审批。
4. 再决定是否加入 MCP Apps UI；当前不需要可视化组件。
