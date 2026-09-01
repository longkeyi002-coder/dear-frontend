# Design System — Monet Gallery / Our Home

## 1. Design intent
The interface is a living private gallery. It should feel intimate, quiet, painterly and inhabitable rather than like an admin console.

## 2. System layers
1. **Foundation tokens** — spacing, radius, typography, elevation, focus, breakpoints.
2. **Semantic tokens** — background, surface, text, muted, accent, danger, success, frame, glow.
3. **Painting theme tokens** — palette, lighting, texture, atmosphere, decorative motifs and motion profile.
4. **Component contracts** — Chat, Tool Call, Usage, Relationship Event, Gallery Card, Presence, Dialog/Palette.

Components consume semantic/theme tokens; components must not invent one-off colors for a specific painting.

## 3. Visual rules
- Painterly does not mean blurry text. Text and controls stay crisp.
- Use texture in backgrounds, frames and decorative layers, not underneath dense body text.
- Avoid default SaaS patterns: endless rounded cards, bright neon gradients, dense KPI grids, excessive glassmorphism.
- Cards are reserved for real objects, actions, grouped controls, events, messages or data modules.
- Prefer whitespace, framing, labels and composition over boxed containers.
- Decorative imagery is secondary to interaction affordance.

## 4. Typography
Use a readable UI sans-serif for interaction and body copy. A restrained display serif may be used for painting titles, gallery labels and ceremonial relationship moments. Do not use decorative fonts for chat body, command menus, tables, logs or forms.

## 5. Spacing and touch
- Build from a consistent spacing scale.
- Mobile primary touch targets should generally aim for >=44x44 CSS px.
- Keep composer controls reachable by thumb and avoid tiny icon-only actions without accessible labels.

## 6. Focus and contrast
- Every interactive element has a visible focus state.
- Theme palettes must preserve readable text and control contrast even when the source painting is low contrast.
- Never reproduce a painting palette literally when doing so harms usability.

## 7. Data-source expression
Source classes are semantic, not decorative:
- REALITY: restrained factual presentation.
- AGENT_LIFE: intimate/expressive but clearly authored by the Agent.
- RELATIONSHIP: shared/approved history and proposals.
- HOME_STATE: environmental/world changes.

Do not use red/green alone to encode source type or approval state.

## 8. Responsive philosophy
Desktop and mobile share data and components, not necessarily layout. Desktop favors spatial overview; mobile favors focus, thumb reach and sequential exploration.
