/**
 * DearChat — the conversation space, built directly on the official
 * assistant-ui prebuilt components (Thread + ThreadList) over an in-memory
 * thread list adapter. No extra chrome: the official components render the
 * sidebar, thread, composer and message UI as upstream ships them. When
 * Phase 2 connects the real Hermes Gateway, the chatModel adapter is pointed
 * at the gateway and the in-memory thread list is swapped for the remote
 * adapter — the UI layer stays untouched.
 */

import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useRemoteThreadListRuntime,
  type ChatModelAdapter,
  type DataMessagePart,
  type ReasoningMessagePart,
  type TextMessagePart,
  type ToolCallMessagePart,
} from "@assistant-ui/react";
import {
  createLocalStorageAdapter,
  createSimpleTitleAdapter,
} from "@assistant-ui/core/react";

import { Thread } from "@/components/aui/thread.aui";
import { ThreadList } from "@/components/aui/thread-list.aui";

import "@/dear/our-home.css";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Official adapter: threads persist to localStorage across windows and the
// list titles come from the first message. Phase 2 swaps this for the
// remote Hermes adapter; the UI stays untouched.
const threadListAdapter = createLocalStorageAdapter({
  storage: {
    getItem: async (key) => localStorage.getItem(key),
    setItem: async (key, value) => localStorage.setItem(key, value),
    removeItem: async (key) => localStorage.removeItem(key),
  },
  prefix: "dear.chat",
  titleGenerator: createSimpleTitleAdapter(),
});

const REASONING_TEXT =
  "龙龙回来了。先看一眼家里的状态：没有新消息，也没有急事。不用急着说话，把灯留在客厅就好。等他先开口，我再接话。";
const ANSWER_TEXT =
  "客厅留给你了。今天想先把骨架搭稳，你看这个顺序行不行，不行我们就换。";

type DearPart =
  | TextMessagePart
  | ReasoningMessagePart
  | ToolCallMessagePart
  | DataMessagePart;

const dearModel: ChatModelAdapter = {
  async *run({ abortSignal }) {
    const content: DearPart[] = [];

    // 1. reasoning, streamed sentence by sentence so the content is visible.
    //    Update the last part in place instead of appending, or every yield
    //    renders as a separate block.
    const setLast = (part: DearPart) => {
      if (content.length > 0 && content[content.length - 1].type === part.type) {
        content[content.length - 1] = part;
      } else {
        content.push(part);
      }
    };
    let acc = "";
    for (const sentence of REASONING_TEXT.split(/(?<=。)/)) {
      await sleep(420);
      if (abortSignal.aborted) throw new Error("canceled");
      acc += sentence;
      setLast({ type: "reasoning", text: acc });
      yield { content: [...content] };
    }

    // 2. a tool call with its result
    await sleep(500);
    if (abortSignal.aborted) throw new Error("canceled");
    const toolPart: ToolCallMessagePart = {
      type: "tool-call",
      toolCallId: "home-get-life-1",
      toolName: "home.get_life_context",
      args: { scope: "today" },
      argsText: '{"scope":"today"}',
      result: { summary: "家里很安静，没有新消息。", ok: true },
    };
    content.push(toolPart);
    yield { content: [...content] };

    // 3. plan card as a data part (rendered by plan-card.aui.tsx)
    await sleep(500);
    if (abortSignal.aborted) throw new Error("canceled");
    const planPart: DataMessagePart = {
      type: "data",
      name: "plan",
      data: {
        explanation: "先把骨架搭稳：先把状态和更新的路走通，再往上面放生活。",
        steps: [
          { text: "分析 store.ts 状态管理实现", status: "completed" },
          { text: "规划稳健的远程文件更新方案", status: "in_progress" },
          { text: "更新生命状态冷却逻辑", status: "pending" },
        ],
      },
    };
    content.push(planPart);
    yield { content: [...content] };

    // 4. the reply text, streamed in small chunks
    let typed = "";
    for (const chunk of ANSWER_TEXT.match(/.{1,4}/g) ?? []) {
      await sleep(80);
      if (abortSignal.aborted) throw new Error("canceled");
      typed += chunk;
      setLast({ type: "text", text: typed });
      yield { content: [...content] };
    }
  },
};

export function DearChat() {
  const runtime = useRemoteThreadListRuntime({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    runtimeHook: () => useLocalRuntime(dearModel),
    adapter: threadListAdapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="oh-chat-layout">
        <aside className="oh-chat-sidebar" aria-label="会话列表">
          <ThreadList />
        </aside>
        <main className="oh-chat-main">
          <Thread />
        </main>
      </div>
    </AssistantRuntimeProvider>
  );
}
