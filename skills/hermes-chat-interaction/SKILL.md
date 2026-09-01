# Hermes Chat Interaction

Use this project skill for all chat, slash-command, model, tool-event, proactive-message, and reconnect interactions.

## Chat priority
Chat is the highest-frequency product space. Do not make the user return to the gallery to continue a conversation.

## Composer
Keep model switching, search, attachment/voice entry points, and slash commands close to the composer. Do not bury model switching in Settings.

## Slash Command Palette
- Typing `/` opens immediately.
- Further characters filter in real time.
- Show command name, concise description, and category; recent commands may be promoted.
- Desktop: ArrowUp/ArrowDown, Enter, Escape.
- Mobile: touch selection and scroll.
- Commands with parameters use a second selection step when appropriate rather than blindly sending incomplete commands.
- Visual controls and slash commands should call the same underlying capability/executor when they represent the same action.

## Tool calls
- Default to a compact, collapsible activity row/card such as “正在搜索网页”.
- Expanded state may show actual tool name, arguments, result, duration, and error state from Hermes data.
- Do not ask the model to narrate tool metadata merely for UI display.
- Never transform a failed tool call into a successful-looking lifestyle message.

## Streaming and recovery
- Streaming must expose stop/cancel when supported.
- The composer remains understandable while the Agent is working.
- Disconnect/reconnect and retry states are explicit.
- Switching model must not silently destroy the current session.

## Proactive messages
- Proactive Agent messages belong in the same conversational timeline but have a subtle source marker.
- Distinguish proactive message, reply, system notification, and tool/system event in data and UI.
- Do not style proactive messages like enterprise alerts.

## Data integrity
Respect source classes from the product spec: REALITY, AGENT_LIFE, RELATIONSHIP, HOME_STATE. UI copy may humanize a real event but may not invent facts.

## Before implementation
Read `docs/product-v3.md`, `docs/hermes-capability-matrix.md`, and `docs/frontend-spec.md`.
