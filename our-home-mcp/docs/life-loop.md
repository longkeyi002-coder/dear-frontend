# Our Home Life Loop

## 目标

让 Our Home 拥有一个独立于 Hermes Cron 的长期运行层：保存连续上下文、接收明确的生活观察、维持心跳、生成主动消息候选，并把候选交给通知通道。

## 为什么不是 Hermes Cron

Hermes Cron 适合一次性或周期性任务，但如果每次触发都开启一个新的 session，就不适合作为关系和生活状态的唯一上下文。Life Loop 把上下文放在 Our Home 的结构化数据层中，心跳只读取和更新这份长期状态。

```text
手机 / 用户填写 / 其他适配器
             ↓
      observations + routines
             ↓
       独立 Life Loop 心跳
             ↓
     读取持续上下文并评估候选
             ↓
    proactive message candidate
             ↓
     webhook / 手机通知适配器
```

Hermes 可以调用 MCP 工具参与推理和执行，但不是 Life Loop 的必需进程。

## 当前实现

- `home.record_observation`：保存带来源和置信级别的生活观察。
- `home.add_routine`：保存用户声明的生活时间段；不会创建 Hermes Cron。
- `home.get_life_context`：读取观察、时间表、心跳和待处理主动消息。
- `home.schedule_proactive_message`：创建待投递的主动消息候选。
- `src/worker.ts`：独立心跳、把生活上下文交给可替换的决策适配器、处理到期候选、调用通知适配器。
- `POST /v1/phone/heartbeat` 和 `POST /v1/observations`：接收手机端明确授权上报的状态与观察。
- JSON store：当前是原型持久化层，后续可替换数据库。

配置决策 Webhook 后，worker 会把结构化 `LifeContext` 发给外部决策服务；决策服务返回候选消息，worker 再负责去重、到期判断和投递。这样可以接入任意模型或已有 Agent，但本项目本身不假装内置了一个模型。

手机端只提供数据入口，不代表服务已经获得手机权限。真正的屏幕、日历、位置或通知能力，仍需要手机 companion/app 在系统授权后采集，并将摘要发送到这些接口。

## 自我唤醒的准确含义

这里的“自我唤醒”不是 MCP 服务在没有任何进程时自己运行，而是一个由系统管理器保持运行的常驻 worker：

1. worker 按心跳间隔醒来。
2. 读取 Our Home 的连续上下文。
3. 检查是否有到期或需要重试的候选消息。
4. 交给通知适配器；成功才标记为 `delivered`，失败保持 `pending`。

以后可以在第 2 步接入独立的模型决策器。决策器必须把“观察到的事实”和“推测”分开，并将自己的判断写成候选，而不是直接伪装成事实。

## 数据真实性

- 手机、屏幕、日历和天气只有在对应适配器实际提供数据后，才能写入 observation。
- `source` 和 `confidence` 必须随观察保存。
- `AGENT_LIFE` 是 AI 的日记、留言或表达，不等于现实事件。
- `RELATIONSHIP` 事件在双方确认前只能是提案。
- 没有数据时返回空、未知或 placeholder，不用默认值冒充真实状态。

## 后续阶段

1. **当前阶段**：JSON store + 独立 worker + 通用 webhook。
2. **持久化阶段**：SQLite/Postgres、迁移、并发锁、用户级鉴权。
3. **手机阶段**：手机 companion 只上传用户授权的状态摘要，不默认上传屏幕内容。
4. **决策阶段**：接入模型决策器、冷却时间、安静时段、每日上限和人工确认。
5. **渠道阶段**：分别实现 Telegram、系统推送或其他用户明确选择的渠道。

在完成身份、权限和通知确认前，不应把个人生活数据服务直接暴露到公网。
