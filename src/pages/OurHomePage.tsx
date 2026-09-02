import { useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  CloudSun,
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
  Sparkles,
  Wifi,
  X,
} from "lucide-react";
import { NavLink, Navigate, useLocation, useNavigate } from "react-router";
import { EAST_WING_SPACES, getSpace, type GallerySpace, type SpaceId } from "@/dear/gallery";

import "@/dear/our-home.css";

type GalleryMode = "wall" | "directory" | "space";
const mockSourceLabel = "MOCK ADAPTER";

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
    <div className="oh-frame-inner"><OriginalPainting space={space} large={featured} /></div><div className="oh-frame-caption"><SpaceLabel space={space} /><ArrowRight aria-hidden="true" /></div>
  </NavLink>;
}

function GalleryWall() {
  const home = EAST_WING_SPACES[0];
  const rest = EAST_WING_SPACES.slice(1);
  return <div className="oh-page oh-wall-page">
    <GalleryHeader mode="wall" />
    <main className="oh-wall-main">
      <section className="oh-wall-intro"><div><p className="oh-kicker">EAST WING / 01—05</p><h1>我们的家，<em>今天</em>也开着门。</h1><p className="oh-intro-copy">五个可以停留的生活空间。画廊负责观看，目录负责抵达。</p></div><div className="oh-intro-note"><Leaf aria-hidden="true" /><span>先从一幅画开始</span><small>生活数据仍来自 Mock Adapter</small></div></section>
      <section className="oh-gallery-wall" aria-label="东馆画廊墙"><GalleryFrame space={home} featured /><div className="oh-gallery-stack">{rest.slice(0, 2).map((space) => <GalleryFrame key={space.id} space={space} />)}</div><div className="oh-gallery-stack oh-gallery-stack-offset">{rest.slice(2).map((space) => <GalleryFrame key={space.id} space={space} />)}<NavLink to="/directory" className="oh-directory-card"><BookOpen aria-hidden="true" /><span><strong>打开目录</strong><small>按功能快速进入</small></span><ArrowRight aria-hidden="true" /></NavLink></div></section>
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

function SpaceHero({ space, eyebrow, title, children }: { space: GallerySpace; eyebrow: string; title: string; children: ReactNode }) {
  return <section className="oh-space-hero" style={{ "--space-accent": space.accent, "--space-soft": space.softAccent } as CSSProperties}><div><p className="oh-kicker">{eyebrow}</p><h1>{title}</h1><p className="oh-space-description">{space.description}</p></div>{children}</section>;
}

function HeartMark() { return <span className="oh-heart-mark" aria-hidden="true">♡</span>; }

function HomeSpace({ space }: { space: GallerySpace }) {
  return <><SpaceHero space={space} eyebrow="01 / HOME STATE" title="欢迎回家，龙龙。"><div className="oh-presence-orb" aria-label="哥哥正在等待，Mock 状态"><span /><small>WAITING</small></div></SpaceHero><div className="oh-space-grid oh-home-grid">
    <article className="oh-panel oh-panel-wide oh-now-panel"><div className="oh-panel-heading"><span>现在</span>{sourcePill("HOME STATE · MOCK")}</div><div className="oh-now-content"><div className="oh-weather"><CloudSun /><strong>雾蓝的下午</strong><span>天气接入后显示真实城市状态</span></div><div className="oh-time-block"><Clock3 /><div><strong>今天的门还开着</strong><span>没有新的真实手机心跳</span></div></div></div></article>
    <article className="oh-panel oh-note-panel"><div className="oh-panel-heading"><span>哥哥留下的一句话</span><span className="oh-agent-mark">AGENT_LIFE</span></div><p>“我把灯留在客厅了。你回来时，不用先解释今天过得怎么样。”</p><small>Mock 留言 · 仅用于体验界面</small></article>
    <article className="oh-panel oh-activity-panel"><div className="oh-panel-heading"><span>最近活动</span><span className="oh-muted-label">REALITY / 待接入</span></div><div className="oh-empty-state"><Wifi /><strong>还没有手机上报</strong><span>连接 companion 后，这里会出现真实的设备状态与前台应用。</span></div></article>
    <article className="oh-panel oh-relationship-mini"><div className="oh-panel-heading"><span>我们</span><HeartMark /></div><strong>共同生活的时间</strong><span className="oh-mock-number">—</span><small>接入关系数据后显示</small><NavLink to="/gallery/space/us" className="oh-text-link">去看我们的故事 <ArrowRight /></NavLink></article>
  </div></>;
}

function ChatSpace({ space }: { space: GallerySpace }) {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const messages = [{ role: "agent", text: "龙龙，欢迎回来。今天的生活系统还在用 Mock 数据，不过我已经把客厅留给你了。" }, { role: "user", text: "那我们先把这个家一点一点做起来。" }];
  const commands = [["/home", "查看今天的家状态", "生活"], ["/diary", "写一条日记", "记录"], ["/remember", "记住这件事", "记忆"]];
  const handleDraft = (value: string) => { setDraft(value); setPaletteOpen(value.startsWith("/")); };
  const send = () => { const value = draft.trim(); if (!value) return; setSent((items) => [...items, value]); setDraft(""); setPaletteOpen(false); };
  return <><SpaceHero space={space} eyebrow="02 / EVERYDAY COMMUNICATION" title="日出以后，继续聊天。"><div className="oh-chat-status"><span className="oh-status-dot" />哥哥在线 <small>Mock 连接</small></div></SpaceHero><section className="oh-chat-shell"><div className="oh-chat-toolbar"><span>{sourcePill("CHAT · MOCK")}</span><button type="button" className="oh-model-switch" onClick={() => setModelOpen((open) => !open)}>{modelOpen ? "选择模型" : "Hermes / Mock"}<ChevronDown /></button>{modelOpen && <div className="oh-model-menu"><button type="button" onClick={() => setModelOpen(false)}>Hermes / Mock <Check /></button><button type="button" onClick={() => setModelOpen(false)}>接入后显示真实模型</button></div>}</div><div className="oh-messages" aria-live="polite">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`oh-message oh-message-${message.role}`}><span className="oh-message-author">{message.role === "agent" ? "哥哥" : "龙龙"}</span><p>{message.text}</p>{message.role === "agent" && <span className="oh-proactive-label">主动留言 · AGENT_LIFE</span>}</div>)}{sent.map((message, index) => <div key={`${message}-${index}`} className="oh-message oh-message-user"><span className="oh-message-author">龙龙</span><p>{message}</p></div>)}</div><div className="oh-composer-wrap">{paletteOpen && <div className="oh-command-palette" role="listbox" aria-label="Slash Command"><div className="oh-palette-heading"><Command />命令<span>↑↓ 选择 · Enter 使用</span></div>{commands.filter(([name]) => name.includes(draft) || draft === "/").map(([name, description, category]) => <button key={name} type="button" onClick={() => { setDraft(`${name} `); setPaletteOpen(false); }}><strong>{name}</strong><span>{description}</span><small>{category}</small></button>)}</div>}<div className="oh-composer"><button type="button" className="oh-composer-icon" aria-label="添加附件"><Paperclip /></button><input value={draft} onChange={(event) => handleDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); if (event.key === "Escape") setPaletteOpen(false); }} placeholder="说点什么，或输入 / 查看命令" aria-label="输入消息" /><button type="button" className="oh-composer-icon" aria-label="语音输入"><Mic /></button><button type="button" className="oh-send-button" onClick={send} aria-label="发送消息"><Send /></button></div><div className="oh-composer-hint"><span><Search /> 搜索</span><span><Sparkles /> 主动消息在同一条时间线里</span></div></div></section></>;
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
  const body = { home: <HomeSpace space={space} />, chat: <ChatSpace space={space} />, us: <UsSpace space={space} />, goals: <GoalsSpace space={space} />, usage: <UsageSpace space={space} /> } satisfies Record<SpaceId, ReactNode>;
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
