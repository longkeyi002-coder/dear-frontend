# Design Review Report: Static

**Scope**: Front-end source `dear-源码/` (single-file web app) — primary `DEAR.html` (5,588 lines) + secondary `开屏页.html` (splash, 558 lines)
**Date**: 2026-08-31
**Design system**: Custom single-file HTML/CSS, tokenized Morandi palette defined in `:root` (lines ~783–830). No build framework, no CSS-in-JS.
**Files reviewed**: 2  (with issues: 2)
**Dimensions audited**: all 8
**Total findings**: 22  (Critical 1 · High 7 · Medium 9 · Low 5)
**Mode note**: Static only. All contrast ratios were *computed* from the two hex/rgb values found in the CSS/tokens (WCAG relative-luminance formula), not estimated. Surfaces are glassmorphic (translucent white/green over a light gradient `html` background `#e8f8e2→#c8d8c0`, line 823), so text sits on a light substrate; white-based computation is a near-worst-case proxy.

---

## Executive Summary

The DEAR app is a polished, aesthetically coherent **glassmorphism chat UI** with a tasteful tokenized Morandi palette, tinted (non-black) shadows, and lively micro-interactions (43 `:active` states, ripple effects). The splash screen (`开屏页.html`) is notably well-built: it includes a semantic `<h1>` and a full `prefers-reduced-motion` guard.

However, the **main `DEAR.html` carries several blocking accessibility and contrast defects**:

- A **Critical** contrast failure on the selected nav item (white text on a light translucent background, ≈1.2:1 — effectively unreadable).
- **High-severity contrast** failures on the three secondary/danger text tokens (`--text-sub` 4.48:1, `--gray` 2.93:1, `--danger` 3.26:1) — all below WCAG AA on the light surfaces they're used on.
- **Keyboard focus is invisible** on every button and on the primary chat input (`outline:none` with no `:focus-visible` replacement), and **icon-only buttons lack accessible names**.
- **No `prefers-reduced-motion` guard** in the main app despite seven continuous infinite animations (petals, leaf spin, goal pulse, voice ripples/wave).
- Form inputs rely on `placeholder` / visual `<div>` labels instead of programmatic labels.

Layout/spacing is largely on an 8px-ish rhythm but contains off-grid one-offs (7/9/11/13px) and no enforced scale; typography is mostly sound (16px body, 1.5–1.7 line-heights) but uses many near-duplicate sizes and is entirely fixed-`px`.

---

### Severity Breakdown
- **Critical**: 1
- **High**: 7
- **Medium**: 9
- **Low**: 5

### Dimension Scores (applicable-only)
| Dimension | Score | Applicable criteria | Passed | Notes |
|-----------|-------|---------------------|--------|-------|
| 1. Visual Hierarchy & Layout | 5/7 | 7 (LY-03–06 need render) | 5 | Off-grid spacing; otherwise coherent |
| 2. Typography | 5/8 | 8 | 5 | Body ok; no modular scale; fixed-px |
| 3. Color & Theming | 6/8 | 8 (DM-01–05 N/A: no dark mode) | 6 | Tokenized & warm-tinted; contrast failures |
| 4. Depth & Elevation | 4/6 | 6 | 4 | One pure-black shadow; partly ad-hoc |
| 5. Components & Affordance | 6/8 | 8 | 6 | Good affordance; icon buttons unlabeled |
| 6. Feedback & States | 2/6 | 6 (FB-04/05/07/09 partial) | 2 | No hover/disabled; focus invisible |
| 7. Motion & Microinteractions | 6/7 | 7 | 6 | Missing reduced-motion guard |
| 8. Accessibility (WCAG 2.2 AA) | 4/12 | 12 | 4 | Multiple High failures |

> Dimensions marked N/A: **Dark Mode (DM-01–05)** — no dark theme exists in the source (`prefers-color-scheme`/`.dark`/`data-theme` all absent). **LY-03–06, FB-04/05/07/09, AC-09/AC-12** — not fully assessable from static source (render/runtime needed).

---

## Findings by Dimension

### Dimension 3: Color & Theming (Critical/High)

#### Finding C1 — Selected drawer item: white text on light background (unreadable)
- **Criterion**: CO-06 (also CO-07, AC-05)
- **Severity**: **Critical**
- **Evidence**: `dear-源码/DEAR.html:964`
  ```css
  .drawer-item.active { color: #fff; font-weight: 600; background: rgba(255,255,255,0.18); }
  /* drawer bg = --drawer-bg: rgba(229,255,222,0.22) over light page gradient */
  ```
  Also `.di-time { color: rgba(255,255,255,0.50); }` (line 966).
- **Measured value**: contrast ≈ **1.2:1** (white `#FFF` on the light-green translucent drawer). WCAG AA requires ≥ 4.5:1 (normal) / ≥ 3:1 (large).
- **Citation**: WCAG 2.2 SC 1.4.3 Contrast (Minimum), SC 1.4.11 Non-text Contrast.
- **Description**: The *selected* conversation item — the most important state to distinguish — renders near-invisible white text on a near-white surface. This is the inverse of good active-state design.
- **Fix**:
  1. Use a dark/saturated active background with white text, e.g. `background: var(--mg-500); color:#fff;` (white on `#787068` = **4.86:1** ✓), or
  2. Keep the light background but set `color: var(--mg-600)` (dark text, 7.85:1). Apply the same correction to `.di-time`.

#### Finding H1 — `--text-sub` fails AA by a hair
- **Criterion**: CO-06 (AC-05)
- **Severity**: High
- **Evidence**: `dear-源码/DEAR.html:807` (`--text-sub:#7A7580`) used at lines 1029, 1073, 1122, 1246, 1326, 1427, 2051, 2060, 2071, 4523, 4733 (message meta, captions, monospace subtitles).
- **Measured value**: **4.48:1** on `#FFF` (needs ≥ 4.5:1).
- **Citation**: WCAG 2.2 SC 1.4.3 (AA).
- **Description**: Secondary text token is 0.02 under the AA threshold; on the light glass surfaces it sits on, it does not pass.
- **Fix**: Darken to ≈ `#6E6973` (≥ 4.5:1). Keep it as a token so the change propagates.

#### Finding H2 — `--gray` auxiliary text fails both AA and large-text thresholds
- **Criterion**: CO-06 / CO-07 (AC-05)
- **Severity**: High
- **Evidence**: `dear-源码/DEAR.html:809` (`--gray:#9A959F`) used at 1083, 1094, 1096, 1310, 1345, 1692, 1700, 1713, 1714.
- **Measured value**: **2.93:1** on `#FFF` (needs ≥ 4.5 normal / ≥ 3 large).
- **Citation**: WCAG 2.2 SC 1.4.3.
- **Description**: The "auxiliary grey" is used for real text (timestamps, hints) but is below even the 3:1 large-text floor.
- **Fix**: If it carries normal text, darken to ≥ `#6F6A75` (≈4.6:1). If reserved for ≥18.66px bold only, document that constraint.

#### Finding H3 — `--danger` error text below AA
- **Criterion**: CO-06 (AC-05)
- **Severity**: High
- **Evidence**: `dear-源码/DEAR.html:808` (`--danger:#B88080`) at 1238, 3138; also `background: rgba(184,128,128,0.08)` at 1333.
- **Measured value**: **3.26:1** on `#FFF` (needs ≥ 4.5 for the small error/delete labels it styles).
- **Citation**: WCAG 2.2 SC 1.4.3.
- **Fix**: Darken to ≈ `#A65A5A` (≥ 4.5:1) for body-size error text, or use it only at ≥18.66px bold (3:1).

#### (Positive) CO-01/02/03/04/05 — tokenized, warm-tinted, balanced
The palette is tokenized (`:root` vars), applies a 60-30-10 neutral-dominant balance, uses semantic danger/active roles, avoids saturated text backgrounds, and tints its greys warm (brown-based `--mg-*`). These pass.

---

### Dimension 8: Accessibility (High)

#### Finding H4 — Icon-only buttons missing accessible names
- **Criterion**: AC-01 (also IC-01)
- **Severity**: High
- **Evidence**: `dear-源码/DEAR.html:2249,2255,2258` (`.rail-btn` openDrawer/openTheme/openSettings), `:2269` (`.tb-btn` new chat), `:2295` (`.slash-close`), `:2321` (`#btnPlus`), `:2328` (`#btnSend`) — all `<button>` containing only inline `<svg>`, with **no `aria-label` and no `title`**.
- **Measured value**: 0 accessible names on 7 icon controls.
- **Citation**: WCAG 2.2 SC 1.1.1 Non-text Content; Apple HIG icon guidance.
- **Description**: Screen-reader users hear nothing (or the SVG path data) for the primary send, new-chat, and sidebar actions.
- **Fix**: Add `aria-label="发送"` / `"新建对话"` / `"打开抽屉"` etc. (or `title`). Buttons that already have `title` — `btnFeat`, `btnPlan`, `btnVoice`, `vc-close`, `vcBtnMute`, `hangup`, cycle-engine — are acceptable but `aria-label` is preferable.

#### Finding H5 — Keyboard focus is invisible on buttons & primary input
- **Criterion**: AC-02 (also FB-03)
- **Severity**: High
- **Evidence**: `outline:none` at `dear-源码/DEAR.html:1160` (chat input `#chatInput`), `:1350`, `:1560`, `:1590`, `:1689`; only two `:focus` rules exist (`:1353 .set-input`, `:1562 .soul-editor`) and **zero `:focus-visible`** in the whole file.
- **Measured value**: 0 visible focus indicator on 5+ controls (incl. the main message input).
- **Citation**: WCAG 2.2 SC 2.4.7 Focus Visible; SC 2.4.11 Focus Not Obscured.
- **Description**: The primary text input and all action buttons suppress the outline with no replacement, so keyboard users cannot see where focus is.
- **Fix**:
  1. Add `:focus-visible { outline: 2px solid var(--mg-accent-deep); outline-offset: 2px; }` globally.
  2. Ensure the indicator meets ≥ 3:1 non-text contrast (SC 1.4.11). Keep the existing `:focus` border-color change for `.set-input`/`.soul-editor`.

#### Finding H6 — Form inputs lack programmatic labels
- **Criterion**: AC-06
- **Severity**: High
- **Evidence**: Settings inputs `setApiUrl`/`setApiKey`/`setModel`/`setApiBase` (`dear-源码/DEAR.html:2394–2406`) use a visual `<div class="set-label">` + `placeholder`, not `<label for>`; `#chatInput` (`:2327`) and `#slashSearch` (`:2294`) have only `placeholder`.
- **Measured value**: 0 associated `<label>`/`<aria-label>` on 6 text inputs.
- **Citation**: WCAG 2.2 SC 1.3.1 Info & Relationships; SC 3.3.2 Labels; SC 4.1.2 Name/Role/Value.
- **Description**: Placeholder is not a label; `set-label` is a non-semantic `<div>`. Screen readers announce nothing meaningful for these fields.
- **Fix**: Convert `.set-label` to `<label for="setApiUrl">` (matching `id`), and add `aria-label="消息内容"` to `#chatInput`, `aria-label="搜索命令"` to `#slashSearch`.

#### Finding M1 — No semantic heading / landmark structure
- **Criterion**: AC-08
- **Severity**: Medium
- **Evidence**: `dear-源码/DEAR.html` contains **zero** `<h1>`–`<h6>` and only one landmark (`:2253 <nav id="railNav">`); the chat root is `<div id="chatBox">` (not `<main>`), no `<header>`/`<footer>`/`<section>`.
- **Measured value**: 0 headings; 1/4 expected landmarks.
- **Citation**: WCAG 2.2 SC 1.3.1; SC 4.1.2.
- **Description**: Assistive-tech users get no document outline and no navigable regions.
- **Fix**: Add a visually-hidden or visible `<h1>` (e.g., "DEAR 对话"), wrap `#chatBox` in `<main>`, and add `<header>`/`<footer>` where appropriate. (The splash screen already does this correctly with `<h1>` at line 286 — mirror it.)

#### Finding M2 — Non-semantic interactive elements
- **Criterion**: AC-03
- **Severity**: Medium
- **Evidence**: `dear-源码/DEAR.html:2358` `<div class="vc-quote" onclick="VoiceCall.interrupt()">`; `:2349` avatar `<img … onerror=…>`; `:2274` `#demoBar onclick="openSettings()"`. These are clickable but have no `role`/`tabindex`/`keyboard handler`.
- **Measured value**: 3 interactive non-`<button>`/`<a>` elements.
- **Citation**: WCAG 2.2 SC 2.1.1 Keyboard; SC 4.1.2.
- **Fix**: Use `<button>` (already done for most controls) or add `role="button"` + `tabindex="0"` + keydown handling.

#### (Partial) AC-04 / AC-09 / AC-10 / AC-12 — not fully assessable statically
Color is generally paired with icons+text (e.g., active states use weight+background, not color alone). Reflow (AC-09) and drag/auth (AC-12) need a live viewport — see "What Was NOT Checked".

---

### Dimension 7: Motion & Microinteractions (High)

#### Finding H7 — No `prefers-reduced-motion` guard in the main app
- **Criterion**: MO-01 (also AC-11)
- **Severity**: High
- **Evidence**: `dear-源码/DEAR.html` — `grep prefers-reduced-motion` → **0 matches**, despite 7 infinite animations: `petalSway` (`:1107`), `leafSpin` (`:1115`), `goalPulse` (`:1719`), `petalFall` (`:1796`), `vcRipple` ×2 (`:2185,:2188`), `vcWave` (`:2199`).
- **Measured value**: 0 reduced-motion blocks; 7 continuous ambient animations always run.
- **Citation**: WCAG 2.2 SC 2.3.3 Animation from Interactions; MDN `prefers-reduced-motion`.
- **Description**: Users with vestibular disorders get uninterrupted motion (falling petals, spinning leaf, pulsing goals, voice ripples) with no escape.
- **Fix**: Wrap the ambient/looping animations:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .petal, .leaf, .goal-pulse, .vc-ripple, .vc-wave { animation: none !important; }
  }
  ```
  (Note: `开屏页.html` already implements this correctly at lines 251/410/430 — copy the pattern.)

#### (Positive) MO-02/03/05/06/07
Transition durations sit in the 150–450ms band (MO-02 ✓); `linear` easing is used only on continuous spinners (exempt, MO-03 ✓); no flashing > 3×/s (MO-05 ✓); ripple/`:active` give immediate micro-feedback (MO-06 ✓); animations don't block input (MO-07 ✓).

#### Finding L1 — Decorative ambient motion may be gratuitous
- **Criterion**: MO-04
- **Severity**: Low
- **Evidence**: `petalSway`/`leafSpin`/`petalFall`/`goalPulse` are purely decorative brand ambiance.
- **Fix**: Keep, but ensure they're disabled under reduced-motion (H7) and don't delay any user task.

---

### Dimension 6: Feedback & States (High/Medium)

#### Finding M3 — No `:hover` or `:disabled` states anywhere
- **Criterion**: FB-02
- **Severity**: Medium
- **Evidence**: `dear-源码/DEAR.html` — `grep ":hover"` → **0**; `grep ":disabled"` → **0** (vs 43 `:active`). Only `:focus` appears twice.
- **Measured value**: 0 hover rules; 0 disabled rules.
- **Citation**: MD3 state layers; NN/g visibility of system status.
- **Description**: On desktop, controls give no hover affordance; disabled buttons (if any are toggled via JS) would show no visual difference.
- **Fix**: Add `:hover` background tints (mirror the existing `:active` fills, e.g. `rgba(192,176,188,0.20)`) and a `.is-disabled`/`:disabled` style with reduced opacity + `not-allowed` cursor.

#### (Partial) FB-01/04/05/07/09
The voice-call component shows status text (`#vcCallStatus` "正在连接…") — good (FB-01). Loading skeletons/spinners for message send and empty/error states are implemented in JS and **not visible in static source** — see coverage gap.

---

### Dimension 1: Visual Hierarchy & Layout (Medium)

#### Finding M4 — Off-grid spacing values
- **Criterion**: LY-01
- **Severity**: Medium
- **Evidence**: Non-4/8 multiples in the UI CSS: `7px` (`:1311` gap, `:1724`), `9px` (`:1265`, `:1614`), `11px` (`:1347`, `:1470`, `:1636`), `13px` (`:1355`, `:1605`, `:1470`), plus many `2/3/5/6px` micro-gaps.
- **Measured value**: ≥ 6 distinct off-scale spacing literals.
- **Citation**: MD3 8dp grid; Refactoring UI spacing system.
- **Fix**: Snap to a 4/8 scale (`4,8,12,16,24,32`); replace `7/9/11/13` with `8/12/12/12` (or `8/8/12/12`).

#### Finding M5 — No enforced spacing scale
- **Criterion**: LY-02
- **Severity**: Medium
- **Evidence**: Spacing literals span `2–24px` with a long tail of one-offs; no `--space-*` token set exists (only `--shadow-*` and color tokens).
- **Fix**: Introduce `--space-1…--space-6` tokens and reference them.

#### (Positive) VH-01/02/03/04, LY-04/05/06
Single clear focal area (message stream), de-emphasis via lighter color + smaller size, one filled primary (`.action-btn`) per menu, perceptible size/weight steps, and proximity grouping are all present in code. LY-03 (line-length cap) and LY-04–06 need a render to confirm — see gap.

---

### Dimension 2: Typography (Medium)

#### Finding M6 — No modular type scale (many near-duplicate sizes)
- **Criterion**: TY-03
- **Severity**: Medium
- **Evidence**: 14 distinct sizes observed: `8,9,10,11,12,13,14,15,16,17,20,21,22,34`px, with clusters at 11/12/13/14/15.
- **Fix**: Adopt a scale (e.g., `12/14/16/20/24/32`) and drop 17/21/22/34 or snap them to scale steps.

#### Finding M7 — Entirely fixed-`px` type (no `rem`/`em`)
- **Criterion**: TY-08
- **Severity**: Medium
- **Evidence**: Every `font-size` is `px` (e.g., `:918,948,1046`); no `rem`/`em` units anywhere.
- **Citation**: WCAG 2.2 SC 1.4.4 Resize Text; Refactoring UI.
- **Fix**: Base body on `rem` and scale components relatively, so user font-size preferences propagate.

#### Finding L2 — Sub-12px text down to 8px
- **Criterion**: TY-01 (legibility)
- **Severity**: Low
- **Evidence**: `:1827,:1828,:1849` → `8px`; `:1432,:1925` → `9px`; `:1876,:2013,:2051` → `10px`; many `11px`.
- **Fix**: Raise minimum UI text to ≥ 12px; reserve 8–10px only for purely decorative marks.

#### (Positive) TY-02/05/07
Body line-heights cluster at 1.5–1.7 (✓); weights limited to 400/500/600/700 with clear contrast (✓); headings use tight 1.2–1.3 line-height (✓).

#### Finding L3 — `font-family` sprawl (4 families)
- **Criterion**: TY-04
- **Severity**: Low
- **Evidence**: system sans stack (`:826`), `monospace` (`:1073,:1122`), `Ma Shan Zheng` (display, decorative), `Dancing Script` (display). 
- **Fix**: Keep the 2 functional families (sans + mono) and treat the 2 decorative faces as intentional display accents (acceptable, but document the intent).

#### Finding L4 — Display letter-spacing not tuned
- **Criterion**: TY-06
- **Severity**: Low
- **Evidence**: Only `:1481` sets `letter-spacing:0.5px` (monospace); large display/brush headings get default tracking.
- **Fix**: Slightly tighten large display text; the brush/logo faces are fine as-is.

---

### Dimension 4: Depth & Elevation (Medium/Low)

#### Finding M8 — One pure-black shadow
- **Criterion**: DE-01
- **Severity**: Medium
- **Evidence**: `dear-源码/DEAR.html:1595` `box-shadow: 0 2px 6px rgba(0,0,0,0.20);` (checkbox thumb).
- **Measured value**: pure-black `rgba(0,0,0,…)`.
- **Citation**: Refactoring UI "shadows"; Josh Comeau.
- **Fix**: Tint it to match the scene: `rgba(80,70,75,0.20)` (consistent with the other shadows).

#### Finding L5 — Elevation partly ad-hoc (tokens under-used)
- **Criterion**: DE-03
- **Severity**: Low
- **Evidence**: `--shadow-card/--shadow-near/--shadow-float` are defined (`:803–805`) but UI mostly hardcodes `0 3px 14px rgba(80,70,75,0.08/0.10)`.
- **Fix**: Reference the elevation tokens consistently so elevation maps to a systematic scale.

#### (Positive) DE-02/04/05/06
Shadows share a downward light source (DE-02 ✓); higher surfaces use larger/softer shadows via the float token (DE-04 ✓); elevation pairs with color/state layers (DE-06 ✓). The dominant shadow color is correctly tinted `rgba(80,70,75,…)` (good baseline).

---

### Dimension 5: Components & Affordance (Medium/Low)

#### Finding M9 — Inconsistent border-radius
- **Criterion**: CP-06
- **Severity**: Medium
- **Evidence**: Radii range widely: `2/3/5/8/9/10/12/13/14/16/18/20/30/50%` (`:1642–1847`). Pills (`30px`,`:1144`), chips (`14px`), cards (`12–16px`), and tiny dots (`2px`) coexist without a radius scale.
- **Fix**: Define `--radius-sm/md/lg` (e.g., 8/12/20) and apply per component role.

#### (Positive) CP-01/02/03/04/05, IC-02/03/04
Buttons are visually distinct (fill/border) with a clear primary (`.action-btn`); target sizes are near the 44px guideline (verify per control); labels are verb-based ("拍摄", "上传图片"); icons use one consistent inline-SVG stroke style at a 24dp-ish grid; icon stroke color `var(--mg-600)` = **7.85:1** (IC-04 ✓).

#### Finding L6 — Icon-button hit areas possibly < 44px
- **Criterion**: CP-03
- **Severity**: Low
- **Evidence**: `.rail-btn`/`.tb-btn` wrap a `20px` SVG with compact padding; `.action-btn` is `padding:10px 16px` + ~14px text ≈ 36px tall.
- **Fix**: Verify measured box ≥ 44×44px (Apple HIG / MD3); increase padding if short. (Could not measure precisely without render.)

---

## What Was NOT Checked

- **Dark mode (DM-01–05)**: no dark theme exists in source; cannot be scored. Recommend adding one (the Morandi tokens transfer well).
- **Rendered contrast on glass**: text on translucent bubbles/glass was computed against `#FFF` as a near-worst-case; actual rendered contrast over the live gradient/photo background could differ. A live capture would confirm.
- **Runtime states (FB-01/04/05/07/09, AC-09 reflow)**: loading skeletons, send-spinners, empty/error states, and 320px reflow are implemented in JS and not visible in static source.
- **LY-03 line-length cap, LY-04/05/06 proximity/alignment/density**: require a rendered layout to confirm.
- **`开屏页.html` depth**: splash was scanned (good `<h1>` + reduced-motion) but not exhaustively audited dimension-by-dimension; its dark cosmic theme shows high text contrast by construction.
- **Interactions requiring a live server**: voice call flow, drag (none found), and cognitive-auth (SC 3.3.8) were not exercised.

---

## Prioritized Recommendations

### Immediate (Critical / High)
1. **C1** — Fix `.drawer-item.active` contrast (dark bg or dark text). *Critical.*
2. **H1/H2/H3** — Darken `--text-sub` (→`#6E6973`), `--gray` (→`#6F6A75`), `--danger` (→`#A65A5A`) to clear AA. *High.*
3. **H5** — Add a global `:focus-visible` outline; remove bare `outline:none`. *High.*
4. **H4** — Add `aria-label` to the 7 unlabeled icon buttons. *High.*
5. **H6** — Convert `.set-label`/placeholders to real `<label for>` / `aria-label`. *High.*
6. **H7** — Add `@media (prefers-reduced-motion: reduce)` to the main app. *High.*

### Short-term (Medium)
1. **M4/M5** — Introduce a 4/8 spacing scale and `--space-*` tokens.
2. **M3** — Add `:hover` and `:disabled` states.
3. **M6/M7** — Adopt a modular type scale; move to `rem`.
4. **M1** — Add `<h1>` + `<main>`/landmark structure.
5. **M2** — Make `div`/`img` click handlers keyboard-operable.
6. **M8** — Tint the one black shadow.
7. **M9** — Define a radius scale.

### Polish (Low)
1. **L2** — Raise sub-12px text to ≥12px.
2. **L3/L4** — Document the 2 decorative fonts; tune display tracking.
3. **L1** — Keep decorative motion but gate behind reduced-motion.
4. **L5/L6** — Use elevation tokens; verify 44px targets.

---

## Design Tooling Recommendations

- **a11y linting**: `eslint-plugin-jsx-a11y` (if migrated) or a one-off `axe-core`/`pa11y` pass over the rendered page.
- **Contrast/CI**: `pa11y-ci` + Lighthouse CI to catch the token-contrast regressions automatically.
- **Design tokens**: consolidate the ad-hoc `px` spacing/radius/shadow literals into a single token source (`--space-*`, `--radius-*`, `--shadow-*`) so the fixes above propagate.
- **Reduced motion**: add the global `prefers-reduced-motion` guard now (pattern already proven in `开屏页.html`).

---

## References
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Material Design 3: https://m3.material.io/
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines
- Nielsen Norman Group: https://www.nngroup.com/articles/
- Refactoring UI: https://www.refactoringui.com/
- Laws of UX: https://lawsofux.com/
