/**
 * DearChat v3 — the conversation space rebuilt on assistant-ui.
 *
 * Why the library: the ChatGPT-shaped interaction (streamed text, visible
 * reasoning, tool-call rows, stop button, branching) is exactly what
 * @assistant-ui/react ships as primitives, so instead of hand-rolling
 * approximations we drive a local runtime with a mock adapter. When Phase 2
 * connects the real Hermes Gateway, only the adapter below is swapped.
 *
 * The adapter is an async generator: it streams reasoning first, then a
 * tool-call, then a data "plan" card, then the reply text — the same
 * plan-execute flow Codex uses.
 */

import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
  type ChatModelAdapter,
  type DataMessagePartComponent,
  type ReasoningMessagePartComponent,
  type TextMessagePartComponent,
  type ThreadAssistantMessagePart,
  type ThreadMessageLike,
  type ToolCallMessagePartComponent,
} from "@assistant-ui/react";
import { Brain, History, Mic, Paperclip, Search, Send, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";

import "@/dear/our-home.css";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const THINKING_KAOMOJI = ["(´･ω･`)", "(｀・ω・´)", "(´• ω •`)", "(˘•ω•˘)", "(｡･ω･｡)", "(￣ω￣)"];

const CHAT_MODELS = ["GPT-5.2 / Mock", "Claude Sonnet / Mock", "GLM-4.7 / Mock", "自动选择 / Mock"];

const CHAT_SESSIONS = [
  { id: "s1", title: "今天的生活整理", time: "23:17" },
  { id: "s2", title: "睡莲样板页讨论", time: "昨天" },
  { id: "s3", title: "our-home-mcp 接口设计", time: "昨天" },
  { id: "s4", title: "日记：一周的天气", time: "周一" },
];

type PlanStepStatus = "completed" | "in_progress" | "pending";
type PlanData = {
  explanation: string;
  steps: Array<{ text: string; status: PlanStepStatus }>;
};

const REASONING_TEXT =
  "龙龙回来了。先看一眼家里的状态：没有新消息，也没有急事。不用急着说话，把灯留在客厅就好。等他先开口，我再接话。";
const ANSWER_TEXT =
  "客厅留给你了。今天想先把骨架搭稳，你看这个顺序行不行，不行我们就换。";

const dearModel: ChatModelAdapter = {
  async *run({ abortSignal }) {
    const content: ThreadAssistantMessagePart[] = [];

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
    content.push({
      type: "tool-call",
      toolCallId: "home-get-life-1",
      toolName: "home.get_life_context",
      args: { scope: "today" },
      argsText: '{"scope":"today"}',
      result: { summary: "家里很安静，没有新消息。", ok: true },
    });
    yield { content: [...content] };

    // 3. plan card as a data part (plan-execute)
    await sleep(500);
    if (abortSignal.aborted) throw new Error("canceled");
    content.push({
      type: "data",
      name: "plan",
      data: {
        explanation: "先把骨架搭稳：先把状态和更新的路走通，再往上面放生活。",
        steps: [
          { text: "分析 store.ts 状态管理实现", status: "completed" },
          { text: "规划稳健的远程文件更新方案", status: "in_progress" },
          { text: "更新生命状态冷却逻辑", status: "pending" },
        ],
      } satisfies PlanData,
    });
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

const INITIAL_THREAD: readonly ThreadMessageLike[] = [
  { role: "user", content: [{ type: "text", text: "我回来了。" }] },
  {
    role: "assistant",
    content: [
      {
        type: "reasoning",
        text: "龙龙回来了。没有新消息，也没有急事。把灯留在客厅就好。",
      },
      {
        type: "tool-call",
        toolCallId: "home-get-life-0",
        toolName: "home.get_life_context",
        args: { scope: "today" },
        argsText: '{"scope":"today"}',
        result: { summary: "家里很安静。", ok: true },
      },
      {
        type: "text",
        text: "龙龙，欢迎回来。今天的生活系统还在用 Mock 数据，不过我已经把客厅留给你了。",
      },
    ],
  },
] as readonly ThreadMessageLike[];

function RunningKaomoji() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % THINKING_KAOMOJI.length);
    }, 700);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="oh-chat-kaomoji" aria-hidden="true">
      {THINKING_KAOMOJI[index]}
    </span>
  );
}

const DcText: TextMessagePartComponent = ({ text }) => (
  <p className="oh-dc-text">{text}</p>
);

const DcReasoning: ReasoningMessagePartComponent = ({ text }) => (
  <div className="oh-dc-reasoning">
    <span className="oh-dc-reasoning-icon">
      <Brain aria-hidden="true" />
    </span>
    <p>{text}</p>
  </div>
);

const DcTool: ToolCallMessagePartComponent = ({ toolName, result }) => (
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

const DcPlan: DataMessagePartComponent<PlanData> = ({ data }) => {
  const done = data.steps.filter((step) => step.status === "completed").length;
  return (
    <article className="oh-chat-plan">
      <div className="oh-chat-plan-head">
        <span>
          计划 · {done}/{data.steps.length}
        </span>
        <small>Mock</small>
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

const DcUserText: TextMessagePartComponent = ({ text }) => (
  <p className="oh-dc-user-text">{text}</p>
);

const DcUser = () => (
  <MessagePrimitive.Root className="oh-dc-user">
    <MessagePrimitive.Parts components={{ Text: DcUserText }} />
  </MessagePrimitive.Root>
);

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

const DcMessage = () => (
  <>
    <MessagePrimitive.If user>
      <DcUser />
    </MessagePrimitive.If>
    <MessagePrimitive.If assistant>
      <DcAssistant />
    </MessagePrimitive.If>
  </>
);

export function DearChat() {
  const runtime = useLocalRuntime(dearModel, { initialMessages: INITIAL_THREAD });
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState(CHAT_MODELS[0]);
  const [activeSession, setActiveSession] = useState("s1");
  const [showProcess, setShowProcess] = useState(true);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <section
        className={`oh-chat-viewport ${showProcess ? "" : "oh-hide-process"}`}
        aria-label="与哥哥的对话"
      >
        <img
          className="oh-chat-sun"
          src="/assets/decor/sunrise-sun.jpg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
        <img
          className="oh-chat-reflection"
          src="/assets/decor/sunrise-reflection.jpg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
        <div className="oh-chat-minibar">
          <button
            type="button"
            className="oh-chat-model-button"
            onClick={() => {
              setModelOpen((open) => !open);
              setSessionsOpen(false);
            }}
            aria-expanded={modelOpen}
            title="选择模型"
          >
            {model}
          </button>
          <button
            type="button"
            className={`oh-chat-model-button ${sessionsOpen ? "is-on" : ""}`}
            onClick={() => {
              setSessionsOpen((open) => !open);
              setModelOpen(false);
            }}
            aria-expanded={sessionsOpen}
            title="会话列表"
          >
            <History aria-hidden="true" />
            <span>会话</span>
          </button>
          <div>
            <strong>Chat</strong>
            <span>与你的生活对话</span>
          </div>
          <div className="oh-chat-minibar-status">
            <span className="oh-status-dot" />
            在线 · Mock
          </div>
          <button
            type="button"
            className={`oh-chat-toggle ${showProcess ? "is-on" : ""}`}
            onClick={() => setShowProcess((visible) => !visible)}
            aria-pressed={showProcess}
            title="显示 / 隐藏思考与工具活动"
          >
            {showProcess ? "思考与工具" : "已隐藏过程"}
          </button>
          <button
            type="button"
            className="oh-chat-new-button"
            onClick={() => runtime.thread.reset()}
          >
            新对话
          </button>
        </div>
        {sessionsOpen && (
          <aside className="oh-chat-sessions" aria-label="会话列表">
            <div className="oh-chat-sessions-head">
              <strong>会话</strong>
              <span>Mock</span>
            </div>
            {CHAT_SESSIONS.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`oh-chat-session-row ${session.id === activeSession ? "is-active" : ""}`}
                onClick={() => {
                  setActiveSession(session.id);
                  setSessionsOpen(false);
                }}
              >
                <strong>{session.title}</strong>
                <small>{session.time}</small>
              </button>
            ))}
          </aside>
        )}
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
        <ThreadPrimitive.Root className="oh-chat-root">
          <ThreadPrimitive.Viewport
            autoScroll="scroll-to-bottom"
            className="oh-chat-thread oh-chat-thread-v02"
          >
            <ThreadPrimitive.If empty>
              <div className="oh-chat-empty">
                <strong>这里还没有消息</strong>
                <span>从一句简单的话开始，Mock 对话会留在这条时间线上。</span>
              </div>
            </ThreadPrimitive.If>
            <ThreadPrimitive.Messages components={{ Message: DcMessage }} />
            <ThreadPrimitive.If running>
              <div className="oh-chat-streaming">
                <RunningKaomoji />
                <span>哥哥正在整理回复…</span>
              </div>
            </ThreadPrimitive.If>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
        <div className="oh-chat-composer-area">
          <ComposerPrimitive.Root className="oh-composer oh-composer-v02">
            <button
              type="button"
              className="oh-composer-icon"
              aria-label="添加附件"
              onClick={() => setComposerNotice("附件功能当前为 Mock，占位交互已保留。")}
            >
              <Paperclip aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`oh-composer-icon ${composerNotice ? "" : ""}`}
              aria-label="切换网页搜索"
              onClick={() => setComposerNotice("搜索当前为 Mock，占位交互已保留。")}
            >
              <Search aria-hidden="true" />
            </button>
            <ComposerPrimitive.Input
              className="oh-composer-input"
              placeholder="说点什么，或输入 / 查看命令"
              aria-label="输入消息"
              rows={1}
            />
            <button
              type="button"
              className="oh-composer-icon"
              aria-label="语音输入"
              onClick={() => setComposerNotice("语音输入当前为 Mock，占位交互已保留。")}
            >
              <Mic aria-hidden="true" />
            </button>
            <ThreadPrimitive.If running>
              <ComposerPrimitive.Cancel className="oh-stop-button">
                <X aria-hidden="true" />
                停止
              </ComposerPrimitive.Cancel>
            </ThreadPrimitive.If>
            <ThreadPrimitive.If running={false}>
              <ComposerPrimitive.Send className="oh-send-button" aria-label="发送消息">
                <Send aria-hidden="true" />
              </ComposerPrimitive.Send>
            </ThreadPrimitive.If>
          </ComposerPrimitive.Root>
          {composerNotice && (
            <div className="oh-composer-notice" role="status">
              {composerNotice}
            </div>
          )}
          <div className="oh-composer-hint oh-composer-hint-v02">
            <span>思考内容直接显示 · 过程可用右上角开关隐藏</span>
          </div>
        </div>
      </section>
    </AssistantRuntimeProvider>
  );
}
