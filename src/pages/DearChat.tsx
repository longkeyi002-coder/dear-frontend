/**
 * DearChat v4 — the conversation space, built directly on the official
 * assistant-ui prebuilt components (Thread + ThreadList) over an in-memory
 * thread list adapter. When Phase 2 connects the real Hermes Gateway, the
 * chatModel adapter is pointed at the gateway and the in-memory thread list
 * is swapped for the remote adapter — the UI layer stays untouched.
 */

import {
  InMemoryThreadListAdapter,
  AssistantRuntimeProvider,
  MessagePrimitive,
  useLocalRuntime,
  useRemoteThreadListRuntime,
  type ChatModelAdapter,
  type DataMessagePart,
  type ReasoningMessagePart,
  type TextMessagePart,
  type ToolCallMessagePart,
} from "@assistant-ui/react";
import { Brain, Wrench, X } from "lucide-react";
import { useState } from "react";

import { Thread } from "@/components/aui/thread.aui";
import { ThreadList } from "@/components/aui/thread-list.aui";

import "@/dear/our-home.css";

const CHAT_MODELS = [
  "GPT-5.2",
  "GPT-5 mini",
  "Claude Opus 4.5",
  "Claude Sonnet 4.5",
  "Gemini 3 Pro",
  "DeepSeek V4",
  "GLM-5",
  "Kimi K2",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    // 1. reasoning, streamed sentence by sentence so the content is visible
    let acc = "";
    for (const sentence of REASONING_TEXT.split(/(?<=。)/)) {
      await sleep(420);
      if (abortSignal.aborted) throw new Error("canceled");
      acc += sentence;
      content.push({ type: "reasoning", text: acc });
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

    // 3. plan card as a data part (plan-execute)
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
      content.push({ type: "text", text: typed });
      yield { content: [...content] };
    }
  },
};

const DcText = ({ text }: TextMessagePart) => <p className="oh-dc-text">{text}</p>;

const DcReasoning = ({ text }: ReasoningMessagePart) => (
  <div className="oh-dc-reasoning">
    <span className="oh-dc-reasoning-icon">
      <Brain aria-hidden="true" />
    </span>
    <p>{text}</p>
  </div>
);

const DcTool = ({ toolName, result }: ToolCallMessagePart) => (
  <div className="oh-chat-process-row">
    <span className="oh-chat-process-icon">
      <Wrench aria-hidden="true" />
    </span>
    <span className="oh-chat-process-text">
      {toolName}
      {result ? " · 已完成" : " · 运行中"}
    </span>
  </div>
);

type PlanData = {
  explanation: string;
  steps: Array<{ text: string; status: "completed" | "in_progress" | "pending" }>;
};

const DcPlan = ({ data }: { data: PlanData }) => {
  const done = data.steps.filter((step) => step.status === "completed").length;
  return (
    <article className="oh-chat-plan">
      <div className="oh-chat-plan-head">
        <span>
          计划 · {done}/{data.steps.length}
        </span>
      </div>
      <p className="oh-chat-plan-explanation">{data.explanation}</p>
      {data.steps.map((step) => (
        <div key={step.text} className={`oh-plan-step ${step.status}`}>
          <span className="oh-plan-glyph" aria-hidden="true">
            {step.status === "completed" ? "✔" : "□"}
          </span>
          <span className="oh-plan-step-text">{step.text}</span>
        </div>
      ))}
    </article>
  );
};

const DcAssistant = () => (
  <MessagePrimitive.Root className="oh-dc-assistant">
    <div className="oh-dc-meta">
      <span>哥哥</span>
    </div>
    <MessagePrimitive.Parts
      components={{
        Text: DcText,
        Reasoning: DcReasoning,
        tools: { by_name: { "home.get_life_context": DcTool } },
        data: { by_name: { plan: DcPlan } },
      }}
    />
  </MessagePrimitive.Root>
);

export function DearChat() {
  const runtime = useRemoteThreadListRuntime({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    runtimeHook: () => useLocalRuntime(dearModel),
    adapter: new InMemoryThreadListAdapter(),
  });
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState(CHAT_MODELS[0]);
  const [showProcess, setShowProcess] = useState(true);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className={`oh-chat-layout ${showProcess ? "" : "oh-hide-process"}`}>
        <aside className="oh-chat-sidebar" aria-label="会话列表">
          <div className="oh-chat-sidebar-head">DEAR</div>
          <ThreadList />
        </aside>
        <main className="oh-chat-main">
          <div className="oh-chat-header">
            <button
              type="button"
              className="oh-chat-model-button"
              onClick={() => setModelOpen((open) => !open)}
              aria-expanded={modelOpen}
              title="选择模型"
            >
              {model}
            </button>
            <div className="oh-chat-header-status">
              <span className="oh-status-dot" />
              在线
            </div>
            <button
              type="button"
              className={`oh-chat-toggle ${showProcess ? "is-on" : ""}`}
              onClick={() => setShowProcess((visible) => !visible)}
              aria-pressed={showProcess}
              title="显示 / 隐藏思考与工具活动"
            >
              {showProcess ? <Wrench aria-hidden="true" /> : <X aria-hidden="true" />}
            </button>
          </div>
          {modelOpen && (
            <div className="oh-model-menu oh-model-menu-v02">
              {CHAT_MODELS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setModel(option);
                    setModelOpen(false);
                  }}
                >
                  <span>{option}</span>
                  {option === model && "✓"}
                </button>
              ))}
            </div>
          )}
          <Thread components={{ AssistantMessage: DcAssistant }} />
        </main>
      </div>
    </AssistantRuntimeProvider>
  );
}
