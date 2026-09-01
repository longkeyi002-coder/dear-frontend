# Our Home MCP

独立的 Our Home 生活系统 MCP，供 Hermes Agent 调用。它不修改 Hermes 核心，也不包含前端。

当前版本使用本地 JSON 数据层，目的是先固定 MCP 工具契约和数据真实性边界。真实 Home Backend 接入后，可以替换 `JsonStore`，不需要改变 Hermes 侧工具名称。

## 能力

读取：

- `home.get_today`
- `home.get_status`
- `home.list_diary`
- `home.list_messages`
- `home.list_actions`
- `home.list_relationship_events`
- `home.list_activity`

写入：

- `home.write_diary`
- `home.leave_message`
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
