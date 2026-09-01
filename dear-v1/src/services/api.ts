export const dearApi = { mode: 'mock' as const, async sendMessage(text: string) { await new Promise(r => setTimeout(r, 500)); return `我收到啦：${text}\n\n这是 V1 的假数据回复。未来这里会接入 Hermes 的 SSE 对话接口。`; } };
