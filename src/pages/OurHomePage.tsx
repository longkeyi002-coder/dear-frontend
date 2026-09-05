import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  Heart,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { NavLink, Navigate, useLocation, useNavigate } from "react-router";
import { DearChat } from "./DearChat";
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
  return <div className="oh-space-label"><span className="oh-space-number">{space.number}</span><span className="oh-space-label-copy"><strong>{space.title}</strong><small>{space.subtitle}</small></span></div>;
}

function GalleryFrame({ space, featured = false }: { space: GallerySpace; featured?: boolean }) {
  return <NavLink to={`/gallery/space/${space.id}`} className={`oh-gallery-item oh-gallery-item-${space.id} ${featured ? "oh-gallery-item-featured" : ""}`} aria-label={`进入 ${space.englishTitle}：${space.subtitle}`} style={{ "--painting-accent": space.accent } as CSSProperties}>
    <span className="oh-gallery-frame" aria-hidden="true">
      <span className="oh-frame-void">
        <img className="oh-frame-painting" src={space.paintingImage} alt="" loading={featured ? "eager" : "lazy"} decoding="async" />
      </span>
    </span>
    <span className="oh-frame-label"><SpaceLabel space={space} /></span>
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
        wall.style.setProperty("--lamp-x", `${event.clientX}px`);
        wall.style.setProperty("--lamp-y", `${event.clientY}px`);
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
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="oh-page oh-wall-page">
    <GalleryHeader mode="wall" />
    <main className="oh-wall-main">
      <section ref={wallRef} className="oh-gallery-wall" aria-label="东馆画廊墙">
        <div className="oh-wall-topbar">
          <NavLink to="/directory" className="oh-directory-card"><BookOpen aria-hidden="true" /><span><strong>打开目录</strong><small>按功能快速进入</small></span><ArrowRight aria-hidden="true" /></NavLink>
        </div>
        <div className="oh-gallery-hang">
          <div className="oh-gallery-row oh-gallery-row-main">
            <GalleryFrame space={rest[0]} />
            <GalleryFrame space={home} featured />
            <GalleryFrame space={rest[1]} />
          </div>
          <div className="oh-gallery-row oh-gallery-row-sub">
            <GalleryFrame space={rest[2]} />
            <GalleryFrame space={rest[3]} />
          </div>
        </div>
        <span className="oh-wall-cornice" aria-hidden="true" /><span className="oh-wall-floor" aria-hidden="true" /><span className="oh-wall-spot" aria-hidden="true" /><span className="oh-wall-dim" aria-hidden="true" />
      </section>
    </main>
    <AmbientBackdrop />
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

function HomeSpace() {
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
  return <>
    <section className="oh-pond-hero">
      <div className="oh-pond-greeting">
        <p className="oh-pond-time">晚上 23:20 · 家里很安静</p>
        <h1>欢迎回来。</h1>
      </div>
      <div className="oh-home-presence-card">
        <span className="oh-home-presence-dot" />
        <strong>WAITING</strong>
        <p>我在等你回来。</p>
        <small>上次主动醒来 · 22:54 · Mock</small>
      </div>
    </section>
    <section className="oh-pond" aria-label="今天的生活">
      <span className="oh-pond-ripples" aria-hidden="true" />
      <article className="oh-pad oh-pad-now">
        <header className="oh-pad-head"><span>哥哥现在在做什么</span><em>AGENT_LIFE</em></header>
        <strong className="oh-pad-title">Waiting</strong>
        <p className="oh-pad-copy">暂时没有新的事情要处理，正在安静地留在这里。</p>
        <dl className="oh-pad-facts">
          <div><dt>正在处理</dt><dd>整理今天的生活片段</dd></div>
          <div><dt>是否等待你</dt><dd>是 · 等你说话</dd></div>
          <div><dt>上次主动醒来</dt><dd>22:54</dd></div>
        </dl>
      </article>
      <article className="oh-pad oh-pad-note">
        <blockquote>“我把灯留在客厅了。你回来时，不用先解释今天过得怎么样。”</blockquote>
        <small>22:54 · 主动留言 · Mock</small>
        <NavLink to="/gallery/space/chat" className="oh-text-link">去 Chat 找我 <ArrowRight /></NavLink>
      </article>
      <article className="oh-pad oh-pad-timeline">
        <header className="oh-pad-head"><span>哥哥今天经历了什么</span><em>LIFE · MOCK</em></header>
        <div className="oh-home-moments">{moments.map(([time, title, detail]) => <div className="oh-home-moment" key={time}><time>{time}</time><div><strong>{title}</strong><span>{detail}</span></div></div>)}</div>
      </article>
      <article className="oh-pad oh-pad-keeps">
        <header className="oh-pad-head"><span>哥哥最近留下的东西</span><em>3 ITEMS · MOCK</em></header>
        <div className="oh-home-keeps-list">{keeps.map(([kind, text, meta]) => <div className="oh-home-keep" key={kind}><span>{kind}</span><p>{text}</p><small>{meta}</small></div>)}</div>
      </article>
      <article className="oh-pad oh-pad-you">
        <header className="oh-pad-head"><span>你</span><em>轻量上下文</em></header>
        <strong className="oh-pad-subtitle">在家 · 大概安静</strong>
        <dl className="oh-pad-facts">
          <div><dt>手机</dt><dd>离线 / 未知</dd></div>
          <div><dt>最近变化</dt><dd>刚刚回到家 · Mock</dd></div>
        </dl>
        <span className="oh-home-you-note">只保留会影响哥哥判断的部分。</span>
      </article>
    </section>
  </>;
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
  const body = { home: <HomeSpace />, chat: <DearChat />, us: <UsSpace space={space} />, goals: <GoalsSpace space={space} />, usage: <UsageSpace space={space} /> } satisfies Record<SpaceId, ReactNode>;
  const themeVars = space.theme ? {
    "--st-background": space.theme.background,
    "--st-surface": space.theme.surface,
    "--st-raised": space.theme.surfaceRaised,
    "--st-text": space.theme.text,
    "--st-muted": space.theme.textMuted,
    "--st-accent": space.theme.accent,
    "--st-accent-soft": space.theme.accentSoft,
  } as CSSProperties : undefined;
  return <div className={`oh-page oh-space-page oh-space-${space.id}`} style={themeVars}><SpaceTopbar space={space} /><main className="oh-space-main">{body[space.id]}</main><AmbientBackdrop /></div>;
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
