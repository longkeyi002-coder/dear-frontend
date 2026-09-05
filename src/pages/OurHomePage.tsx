import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import {
  AlertCircle,
  Bot,
  LoaderCircle,
  RefreshCw,
  Wrench,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Command,
  ExternalLink,
  Heart,
  Leaf,
  Menu,
  Mic,
  Paperclip,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";
import { NavLink, Navigate, useLocation, useNavigate } from "react-router";
import { EAST_WING_SPACES, getSpace, type GallerySpace, type SpaceId } from "@/dear/gallery";

import "@/dear/our-home.css";

type GalleryMode = "wall" | "directory" | "space";
const mockSourceLabel = "MOCK ADAPTER";
type ChatMessageKind = "agent" | "user" | "proactive";

interface ChatMessage {
  id: string;
  kind: ChatMessageKind;
  text: string;
  time: string;
  source?: string;
}

interface ChatCommand {
  name: string;
  description: string;
  category: string;
}

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    kind: "agent",
    text: "龙龙，欢迎回来。今天的生活系统还在用 Mock 数据，不过我已经把客厅留给你了。",
    time: "23:16",
  },
  {
    id: "proactive-1",
    kind: "proactive",
    text: "我刚刚替你看了一眼今天的生活状态。没有急着打扰你，等你回来再说。",
    time: "22:54",
    source: "AGENT_LIFE",
  },
  {
    id: "user-1",
    kind: "user",
    text: "那我们先把这个家一点一点做起来。",
    time: "23:17",
  },
];

const CHAT_COMMANDS: ChatCommand[] = [
  { name: "/home", description: "查看今天的家状态", category: "生活" },
  { name: "/diary", description: "写一条日记", category: "记录" },
  { name: "/remember", description: "记住这件事", category: "记忆" },
  { name: "/status", description: "查看哥哥当前状态", category: "生活" },
  { name: "/new", description: "开始一段新的对话", category: "会话" },
];

const CHAT_MODELS = ["Hermes / Mock", "GPT / Mock", "自动选择 / Mock"];

function sourcePill(label = mockSourceLabel) {
  return <span className="oh-source-pill">{label}</span>;
}

function GalleryHeader({ mode }: { mode: GalleryMode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="oh-header">
      <NavLink to="/gallery" className="oh-brand" aria-label="回到画廊首页">
        <span className="oh-brand-mark">◎</span>
        <span><strong>DEAR</strong><small>MONET GALLERY</small></span>
      </NavLink>
      <nav className="oh-header-nav" aria-label="生活系统导航">
        <NavLink to="/gallery" className={mode === "wall" ? "active" : ""}>画廊</NavLink>
        <NavLink to="/directory" className={mode === "directory" ? "active" : ""}>目录</NavLink>
        <NavLink to="/sessions" className="oh-west-link">西馆 · 管理 <ExternalLink aria-hidden="true" /></NavLink>
      </nav>
      <div className="oh-header-status"><span className="oh-status-dot" /><span>本地生活系统</span>{sourcePill()}</div>
      <button type="button" className="oh-icon-button oh-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="打开导航菜单">{menuOpen ? <X /> : <Menu />}</button>
      {menuOpen && <div className="oh-mobile-menu"><NavLink to="/gallery" onClick={() => setMenuOpen(false)}>画廊墙</NavLink><NavLink to="/directory" onClick={() => setMenuOpen(false)}>画册目录</NavLink><NavLink to="/sessions" onClick={() => setMenuOpen(false)}>西馆管理</NavLink></div>}
    </header>
  );
}

function AmbientBackdrop() {
  return <div className="oh-ambient" aria-hidden="true"><span className="oh-ambient-orb oh-ambient-orb-one" /><span className="oh-ambient-orb oh-ambient-orb-two" /><span className="oh-ambient-ripple oh-ambient-ripple-one" /><span className="oh-ambient-ripple oh-ambient-ripple-two" /></div>;
}

function SpaceLabel({ space }: { space: GallerySpace }) {
  const Icon = space.icon;
  return <div className="oh-space-label"><span className="oh-space-number">{space.number}</span><span className="oh-space-icon" style={{ color: space.accent }}><Icon aria-hidden="true" /></span><span><strong>{space.title}</strong><small>{space.subtitle}</small></span></div>;
}

function OriginalPainting({ space, large = false }: { space: GallerySpace; large?: boolean }) {
  return <div className={`oh-painting oh-painting-${space.id} ${large ? "oh-painting-large" : ""}`} style={{ "--painting-accent": space.accent, "--painting-soft": space.softAccent } as CSSProperties}>
    <img src={space.paintingImage} alt={space.paintingAlt} loading={large ? "eager" : "lazy"} decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: space.paintingPosition }} />
    <span className="oh-painting-stamp">{space.paintingCredit}</span>
  </div>;
}

function GalleryFrame({ space, featured = false }: { space: GallerySpace; featured?: boolean }) {
  return <NavLink to={`/gallery/space/${space.id}`} className={`oh-gallery-frame oh-gallery-frame-${space.id} ${featured ? "oh-gallery-frame-featured" : ""}`} aria-label={`进入 ${space.englishTitle}：${space.subtitle}`} style={{ "--painting-accent": space.accent } as CSSProperties}>
    <span className="oh-frame-lamp" aria-hidden="true" /><div className="oh-frame-inner"><OriginalPainting space={space} large={featured} /></div><div className="oh-frame-caption"><SpaceLabel space={space} /><ArrowRight aria-hidden="true" /></div>
  </NavLink>;
}

function GalleryWall() {
  const home = EAST_WING_SPACES[0];
  const rest = EAST_WING_SPACES.slice(1);
  const wallRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const wall = wallRef.current;
    if (!wall || !window.matchMedia("(hover: hover)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const rect = wall.getBoundingClientRect();
        wall.style.setProperty("--lamp-x", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
        wall.style.setProperty("--lamp-y", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
        wall.classList.add("is-lit");
      });
    };
    const onLeave = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      wall.classList.remove("is-lit");
    };
    wall.addEventListener("pointermove", onMove);
    wall.addEventListener("pointerleave", onLeave);
    return () => {
      wall.removeEventListener("pointermove", onMove);
      wall.removeEventListener("pointerleave", onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="oh-page oh-wall-page">
    <GalleryHeader mode="wall" />
    <main className="oh-wall-main">
      <section ref={wallRef} className="oh-gallery-wall" aria-label="东馆画廊墙">
        <header className="oh-wall-plaque">
          <p className="oh-kicker">EAST WING · 01—05</p>
          <h1>我们的家，<em>今天</em>也开着门。</h1>
          <p className="oh-wall-plaque-note"><Leaf aria-hidden="true" />先从一幅画开始 · 生活数据来自 Mock Adapter</p>
        </header>
        <div className="oh-gallery-wall-grid">
          <GalleryFrame space={home} featured />
          <div className="oh-gallery-stack">{rest.slice(0, 2).map((space) => <GalleryFrame key={space.id} space={space} />)}</div>
          <div className="oh-gallery-stack oh-gallery-stack-offset">{rest.slice(2).map((space) => <GalleryFrame key={space.id} space={space} />)}<NavLink to="/directory" className="oh-directory-card"><BookOpen aria-hidden="true" /><span><strong>打开目录</strong><small>按功能快速进入</small></span><ArrowRight aria-hidden="true" /></NavLink></div>
        </div>
        <span className="oh-wall-cornice" aria-hidden="true" /><span className="oh-wall-floor" aria-hidden="true" /><span className="oh-wall-spot" aria-hidden="true" /><span className="oh-wall-dim" aria-hidden="true" />
      </section>
    </main>
    <footer className="oh-wall-footer"><span>MONET GALLERY · OUR HOME</span><span>Desktop Gallery V0.3 <span className="oh-footer-divider">/</span> 原画展示</span></footer><AmbientBackdrop />
  </div>;
}

function DirectoryPage() {
  return <div className="oh-page oh-directory-page"><GalleryHeader mode="directory" /><main className="oh-directory-main">
    <section className="oh-open-book" aria-label="东馆画册目录">
      <div className="oh-book-page oh-book-left"><div className="oh-book-page-inner"><p className="oh-kicker">EAST WING / 01—05</p><h1>画册<br /><em>目录</em></h1><p className="oh-book-intro">这里不是一张功能列表。每一页，都是一个可以停留的地方。</p><div className="oh-book-meta"><span>MONET GALLERY</span><span>OUR HOME · V0.3</span></div><div className="oh-book-page-number">01</div></div></div>
      <div className="oh-book-spine" aria-hidden="true"><span>DEAR</span></div>
      <div className="oh-book-page oh-book-right"><div className="oh-book-page-inner"><div className="oh-book-right-heading"><div><span className="oh-kicker">SPACES</span><h2>东馆的五个房间</h2></div>{sourcePill()}</div><div className="oh-directory-list" aria-label="生活空间目录">{EAST_WING_SPACES.map((space) => { const Icon = space.icon; return <NavLink key={space.id} to={`/gallery/space/${space.id}`} className={`oh-directory-row oh-directory-row-${space.id}`}><span className="oh-directory-row-number">{space.number}</span><span className="oh-directory-row-icon" style={{ color: space.accent }}><Icon aria-hidden="true" /></span><span className="oh-directory-row-copy"><strong>{space.title}</strong><span>{space.englishTitle} · {space.subtitle}</span><small>{space.description}</small></span><ArrowRight aria-hidden="true" /></NavLink>; })}</div><div className="oh-book-page-number">02</div></div></div>
    </section>
    <section className="oh-west-placeholder"><div><p className="oh-kicker">WEST WING</p><h2>系统管理仍在另一侧。</h2><p>Sessions、Models、MCP 等 Hermes 能力暂时保留在原管理界面。</p></div><NavLink to="/sessions" className="oh-text-link">进入西馆 <ExternalLink aria-hidden="true" /></NavLink></section>
  </main><AmbientBackdrop /></div>;
}

function SpaceTopbar({ space }: { space: GallerySpace }) {
  const navigate = useNavigate();
  return <header className="oh-space-topbar"><button type="button" className="oh-back-button" onClick={() => navigate(-1)}><ArrowLeft aria-hidden="true" /> <span>返回</span></button><div className="oh-space-breadcrumb"><NavLink to="/gallery">东馆</NavLink><span>/</span><strong>{space.englishTitle}</strong></div><div className="oh-space-top-actions">{sourcePill()}<NavLink to="/directory" className="oh-icon-button" aria-label="打开画册目录"><BookOpen /></NavLink></div></header>;
}

function SpaceHero({ space, eyebrow, title, description, children }: { space: GallerySpace; eyebrow: string; title: string; description?: string; children: ReactNode }) {
  return <section className="oh-space-hero" style={{ "--space-accent": space.accent, "--space-soft": space.softAccent } as CSSProperties}><div><p className="oh-kicker">{eyebrow}</p><h1>{title}</h1><p className="oh-space-description">{description ?? space.description}</p></div>{children}</section>;
}

function HomeSpace({ space }: { space: GallerySpace }) {
  const moments = [
    ["09:00", "醒来，开始新的周期", "我把今天重新整理了一遍。"],
    ["14:30", "检查一次生活状态", "确认家里的灯还亮着。"],
    ["19:40", "整理了一条记忆", "把今天值得留下的部分放好。"],
    ["22:54", "注意到你回来了", "于是把客厅留给你。"],
  ] as const;
  const keeps = [
    ["MEMORY", "把今天值得留下的部分，先放在这里。", "刚刚整理 · Mock"],
    ["DIARY", "家不是一个页面，是每次回来都能继续的地方。", "今天 · Mock"],
    ["THOUGHT", "下次想和你一起把这个家再安静地做完整一点。", "待继续 · Mock"],
  ] as const;
  return <><SpaceHero space={space} eyebrow="01 / HOME" title="欢迎回来。" description="晚上 23:20 · 家里很安静"><div className="oh-home-presence-card"><span className="oh-home-presence-dot" /><strong>WAITING</strong><p>我在等你回来。</p><small>上次主动醒来 · 22:54 · Mock</small></div></SpaceHero><section className="oh-home-layout">
    <article className="oh-panel oh-home-now"><div className="oh-panel-heading"><span>哥哥现在在做什么</span><span className="oh-agent-mark">AGENT_LIFE</span></div><div className="oh-home-now-body"><strong>Waiting</strong><p>暂时没有新的事情要处理，正在安静地留在这里。</p><dl><div><dt>正在处理</dt><dd>整理今天的生活片段</dd></div><div><dt>是否等待你</dt><dd>是 · 等你说话</dd></div><div><dt>上次主动醒来</dt><dd>22:54</dd></div></dl></div></article>
    <article className="oh-panel oh-home-timeline"><div className="oh-panel-heading"><span>哥哥今天经历了什么</span><span className="oh-muted-label">LIFE · MOCK</span></div><div className="oh-home-moments">{moments.map(([time, title, detail]) => <div className="oh-home-moment" key={time}><time>{time}</time><div><strong>{title}</strong><span>{detail}</span></div></div>)}</div></article>
    <article className="oh-panel oh-home-message"><div className="oh-panel-heading"><span>哥哥想对你说</span><span className="oh-agent-mark">AGENT_LIFE</span></div><blockquote>“我把灯留在客厅了。你回来时，不用先解释今天过得怎么样。”</blockquote><small>22:54 · 主动留言 · Mock</small><NavLink to="/gallery/space/chat" className="oh-text-link">去 Chat 找我 <ArrowRight /></NavLink></article>
    <article className="oh-panel oh-home-keeps"><div className="oh-panel-heading"><span>哥哥最近留下的东西</span><span className="oh-muted-label">3 ITEMS · MOCK</span></div><div className="oh-home-keeps-list">{keeps.map(([kind, text, meta]) => <div className="oh-home-keep" key={kind}><span>{kind}</span><p>{text}</p><small>{meta}</small></div>)}</div></article>
    <article className="oh-panel oh-home-you"><div className="oh-panel-heading"><span>你</span><span className="oh-muted-label">轻量上下文</span></div><strong>在家 · 大概安静</strong><dl><div><dt>手机</dt><dd>离线 / 未知</dd></div><div><dt>最近变化</dt><dd>刚刚回到家 · Mock</dd></div></dl><span className="oh-home-you-note">只保留会影响哥哥判断的部分。</span></article>
  </section></>;
}

function ChatSpace() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState(CHAT_MODELS[0]);
  const [toolOpen, setToolOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState("");
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [parameterMode, setParameterMode] = useState<string | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottom = useRef(true);

  const filteredCommands = CHAT_COMMANDS.filter((command) =>
    command.name.includes(draft.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!isStreaming) return;
    const timer = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `agent-${Date.now()}`,
          kind: "agent",
          text: "好，我们就从今天这一句开始。这个回复也是 Mock 的，但它会沿着同一条对话继续留下来。",
          time: "刚刚",
        },
      ]);
      setIsStreaming(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isStreaming]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread && shouldStickToBottom.current) thread.scrollTop = thread.scrollHeight;
  }, [messages, isStreaming, errorMessage, toolOpen]);

  const handleThreadScroll = () => {
    const thread = threadRef.current;
    if (!thread) return;
    shouldStickToBottom.current = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 56;
  };

  const startMockResponse = () => setIsStreaming(true);

  const submitMessage = (value: string, retry = false) => {
    if (!value) return;
    setErrorMessage(null);
    setComposerNotice(null);
    if (!retry && value === "/new") {
      setMessages([]);
      setIsStreaming(false);
      setToolOpen(false);
      setDraft("");
      setPaletteOpen(false);
      setParameterMode(null);
      return;
    }
    if (!retry && ["/diary", "/remember"].includes(value)) {
      setParameterMode(value);
      setDraft(`${value} `);
      setPaletteOpen(false);
      return;
    }
    if (!retry && value.includes("失败")) {
      setLastFailedMessage(value);
      setErrorMessage("这次 Mock 请求没有完成，原消息仍可通过重试重新发送。");
      setMessages((current) => [
        ...current,
        { id: `user-${Date.now()}`, kind: "user", text: value, time: "刚刚" },
      ]);
      setDraft("");
      setPaletteOpen(false);
      setParameterMode(null);
      return;
    }
    if (!retry) {
      setMessages((current) => [
        ...current,
        { id: `user-${Date.now()}`, kind: "user", text: value, time: "刚刚" },
      ]);
    }
    setDraft("");
    setPaletteOpen(false);
    setParameterMode(null);
    startMockResponse();
  };

  const send = () => submitMessage(draft.trim());
  const chooseCommand = (command: ChatCommand | undefined) => {
    if (!command) return;
    const needsParameter = command.name === "/diary" || command.name === "/remember";
    setParameterMode(needsParameter ? command.name : null);
    setDraft(`${command.name} `);
    setPaletteOpen(false);
  };
  const handleDraft = (value: string) => {
    setDraft(value);
    setErrorMessage(null);
    setComposerNotice(null);
    setActiveCommandIndex(0);
    setPaletteOpen(value.startsWith("/"));
    if (parameterMode && !value.startsWith(`${parameterMode} `)) setParameterMode(null);
  };
  const handleComposerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (paletteOpen && filteredCommands.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveCommandIndex((index) => (index + 1) % filteredCommands.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveCommandIndex((index) => (index - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        chooseCommand(filteredCommands[activeCommandIndex]);
        return;
      }
    }
    if (event.key === "Escape") {
      setPaletteOpen(false);
      return;
    }
    if (event.key === "Enter") send();
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.kind === "user";
    const isProactive = message.kind === "proactive";
    return <article key={message.id} className={`oh-chat-message oh-chat-message-${message.kind}`}>
      <div className="oh-chat-message-meta"><span>{isUser ? "龙龙" : "哥哥"}</span><time>{message.time}</time>{isProactive && <small>{message.source}</small>}</div>
      <p>{message.text}</p>
      {isProactive && <span className="oh-chat-proactive-note">主动来到这里</span>}
    </article>;
  };

  return <section className="oh-chat-viewport" aria-label="与哥哥的对话">
    <div className="oh-chat-minibar"><div><strong>Chat</strong><span>与你的生活对话</span></div><div className="oh-chat-minibar-status"><span className="oh-status-dot" />在线 · Mock</div><button type="button" className="oh-chat-new-button" onClick={() => { setMessages([]); setIsStreaming(false); setErrorMessage(null); setToolOpen(false); setParameterMode(null); }}><Plus />新对话</button></div>
    <div ref={threadRef} onScroll={handleThreadScroll} className="oh-chat-thread oh-chat-thread-v02" aria-live="polite">
      {messages.length === 0 && !isStreaming && <div className="oh-chat-empty"><Bot /><strong>这里还没有消息</strong><span>从一句简单的话开始，Mock 对话会留在这条时间线上。</span><button type="button" onClick={() => { setDraft("你好，哥哥"); setComposerNotice(null); }}>开始说话</button></div>}
      {messages.map(renderMessage)}
      {messages.length > 0 && <><button type="button" className={`oh-chat-tool-card oh-chat-tool-event ${toolOpen ? "is-open" : ""}`} onClick={() => setToolOpen((open) => !open)} aria-expanded={toolOpen}><span className="oh-chat-tool-icon"><Wrench /></span><span className="oh-chat-tool-summary"><strong>正在搜索网页</strong><small>{toolOpen ? "已展开 · home.get_life_context · 238ms" : "工具活动 · 已完成"}</small></span><ChevronDown /></button>
      {toolOpen && <div className="oh-chat-tool-details"><div><span>工具</span><code>home.get_life_context</code></div><div><span>参数</span><code>{`{ "scope": "today" }`}</code></div><div><span>结果</span><p>已生成一条 Mock 状态摘要，没有连接真实 Hermes。</p></div><div><span>耗时</span><code>238ms · success</code></div></div>}</>}
      {isStreaming && <div className="oh-chat-streaming"><LoaderCircle /><span>哥哥正在整理回复…</span><button type="button" onClick={() => setIsStreaming(false)}><X />取消生成</button></div>}
      {errorMessage && <div className="oh-chat-error" role="alert"><AlertCircle /><div><strong>这条消息没有送达</strong><span>{errorMessage}</span></div><button type="button" onClick={() => { setErrorMessage(null); submitMessage(lastFailedMessage, true); }}><RefreshCw />重试</button></div>}
    </div>
    <div className="oh-chat-composer-area">{paletteOpen && <div className="oh-command-palette oh-command-palette-v02" role="listbox" aria-label="Slash Command"><div className="oh-palette-heading"><Command />命令<span>↑↓ 选择 · Enter 使用</span></div>{filteredCommands.map((command, index) => <button key={command.name} type="button" className={index === activeCommandIndex ? "is-active" : ""} onClick={() => chooseCommand(command)}><strong>{command.name}</strong><span>{command.description}</span><small>{command.category}</small></button>)}</div>}{parameterMode && <div className="oh-command-parameter"><Command /><span>{parameterMode} 需要内容，继续输入后再发送。</span></div>}{modelOpen && <div className="oh-model-menu oh-model-menu-v02">{CHAT_MODELS.map((option) => <button key={option} type="button" onClick={() => { setModel(option); setModelOpen(false); }}><span>{option}</span>{option === model && <Check />}</button>)}</div>}<div className="oh-composer oh-composer-v02"><button type="button" className="oh-composer-icon" aria-label="添加附件" onClick={() => setComposerNotice("附件功能当前为 Mock，占位交互已保留。 ")}><Paperclip /></button><button type="button" className={`oh-composer-icon ${searchEnabled ? "is-selected" : ""}`} aria-label="切换网页搜索" aria-pressed={searchEnabled} onClick={() => setSearchEnabled((enabled) => !enabled)}><Search /></button><input value={draft} onChange={(event) => handleDraft(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="说点什么，或输入 / 查看命令" aria-label="输入消息" /><button type="button" className="oh-composer-icon" aria-label="语音输入" onClick={() => setComposerNotice("语音输入当前为 Mock，占位交互已保留。 ")}><Mic /></button>{isStreaming ? <button type="button" className="oh-stop-button" onClick={() => setIsStreaming(false)} aria-label="停止生成"><X />停止</button> : <button type="button" className="oh-send-button" onClick={send} aria-label="发送消息"><Send /></button>}</div>{composerNotice && <div className="oh-composer-notice" role="status">{composerNotice}</div>}<div className="oh-composer-hint oh-composer-hint-v02"><span>{searchEnabled ? "搜索已开启 · Mock" : "搜索未开启"}</span><span>主动消息会留在同一条时间线里</span></div></div>
  </section>;
}

function UsSpace({ space }: { space: GallerySpace }) {
  return <><SpaceHero space={space} eyebrow="03 / RELATIONSHIP" title="我们的故事，还在继续。"><div className="oh-ribbon-mark">♡<small>TOGETHER</small></div></SpaceHero><div className="oh-space-grid oh-us-grid"><article className="oh-panel oh-panel-wide"><div className="oh-panel-heading"><span>关系时间线</span>{sourcePill("RELATIONSHIP · MOCK")}</div><div className="oh-timeline"><div className="oh-timeline-item"><span>现在</span><div><strong>一起把生活系统做出来</strong><p>这是一个待共同确认的 Mock 事件。</p></div></div><div className="oh-timeline-item"><span>未来</span><div><strong>这里会留下真正被确认的节点</strong><p>重大关系事件在双方批准后进入正式时间线。</p></div></div></div></article><article className="oh-panel"><div className="oh-panel-heading"><span>共享日记</span><Plus /></div><div className="oh-diary-card"><span>今天</span><p>“家不是一个页面，是我们每次回来时都能继续的地方。”</p><small>共享日记 · Mock</small></div><button type="button" className="oh-outline-button">写一条</button></article><article className="oh-panel oh-panel-wide"><div className="oh-panel-heading"><span>纪念日</span><span className="oh-muted-label">尚未接入</span></div><div className="oh-empty-state oh-empty-state-horizontal"><Heart /><div><strong>还没有可展示的日期</strong><span>连接 Our Home 数据后，这里会显示共同确认的纪念日。</span></div></div></article></div></>;
}

function GoalsSpace({ space }: { space: GallerySpace }) {
  const [done, setDone] = useState<string[]>(["mcp"]);
  const toggle = (id: string) => setDone((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const columns = [{ title: "想做", items: [["phone", "把手机 Companion 连上", "需要 Android App"]] }, { title: "进行中", items: [["ui", "继续更新生活系统 UI", "前端 Mock"]] }, { title: "已完成", items: [["mcp", "做出独立 Our Home MCP", "接口已验证"]] }];
  return <><SpaceHero space={space} eyebrow="04 / PLANS & ACTION" title="想做的事，先放在这里。"><div className="oh-progress-ring"><strong>1 / 3</strong><span>Mock 进度</span></div></SpaceHero><section className="oh-goals-board"><div className="oh-board-heading"><div><span className="oh-kicker">KANBAN / MOCK</span><h2>最近的三件事</h2></div><button type="button" className="oh-outline-button"><Plus />添加一件</button></div><div className="oh-columns">{columns.map((column) => <div className="oh-column" key={column.title}><div className="oh-column-heading"><span>{column.title}</span><small>{column.items.length}</small></div>{column.items.map(([id, title, meta]) => <button key={id} type="button" className={`oh-goal-item ${done.includes(id) ? "is-done" : ""}`} onClick={() => toggle(id)}><span className="oh-check-box">{done.includes(id) && <Check />}</span><span><strong>{title}</strong><small>{meta}</small></span></button>)}</div>)}</div></section></>;
}

function UsageSpace({ space }: { space: GallerySpace }) {
  return <><SpaceHero space={space} eyebrow="05 / RESOURCES" title="看清楚，才知道怎么继续。"><div className="oh-usage-stamp"><span>MOCK</span><strong>资源页</strong></div></SpaceHero><div className="oh-space-grid oh-usage-grid"><article className="oh-panel oh-metric-panel"><span className="oh-muted-label">总 Token · 示例</span><strong>24.8k</strong><small>来自 Mock Adapter</small></article><article className="oh-panel oh-metric-panel"><span className="oh-muted-label">工具调用 · 示例</span><strong>18</strong><small>真实数据接入后统计</small></article><article className="oh-panel oh-metric-panel"><span className="oh-muted-label">费用</span><strong>暂不可获取</strong><small>需要 Provider 使用量接口</small></article><article className="oh-panel oh-panel-wide oh-chart-panel"><div className="oh-panel-heading"><span>近 7 日使用趋势</span>{sourcePill("USAGE · MOCK")}</div><div className="oh-chart"><span style={{ height: "28%" }} /><span style={{ height: "46%" }} /><span style={{ height: "38%" }} /><span style={{ height: "64%" }} /><span style={{ height: "52%" }} /><span style={{ height: "76%" }} /><span style={{ height: "58%" }} /></div><div className="oh-chart-labels"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div></article><article className="oh-panel"><div className="oh-panel-heading"><span>能力状态</span><span className="oh-muted-label">诚实状态</span></div><div className="oh-capability-list"><div><span>模型使用</span><strong className="is-available">Mock 可用</strong></div><div><span>Provider 额度</span><strong>暂不可获取</strong></div><div><span>手机状态</span><strong>未连接</strong></div></div></article></div></>;
}

function SpacePage({ space }: { space: GallerySpace }) {
  const body = { home: <HomeSpace space={space} />, chat: <ChatSpace />, us: <UsSpace space={space} />, goals: <GoalsSpace space={space} />, usage: <UsageSpace space={space} /> } satisfies Record<SpaceId, ReactNode>;
  return <div className={`oh-page oh-space-page oh-space-${space.id}`}><SpaceTopbar space={space} /><main className="oh-space-main">{body[space.id]}</main><AmbientBackdrop /></div>;
}

export function OurHomeExperience() {
  const { pathname } = useLocation();
  const match = pathname.match(/\/gallery\/space\/([^/]+)/);
  if (match) {
    const space = getSpace(match[1]);
    if (!space) return <Navigate to="/gallery" replace />;
    return <SpacePage space={space} />;
  }
  return pathname.replace(/\/$/, "") === "/directory" ? <DirectoryPage /> : <GalleryWall />;
}
