# Agent Skills Baseline

This project uses a small, explicit skill set. Do not add overlapping “make frontend beautiful” skills without review.

## Project skills (source of truth in this repo)

| Skill | Purpose |
|---|---|
| `skills/monet-gallery-design/SKILL.md` | Visual/world design, theme-system guardrails |
| `skills/monet-gallery-interaction/SKILL.md` | Gallery navigation, mobile swipe/card behavior, route recovery |
| `skills/hermes-chat-interaction/SKILL.md` | Chat composer, slash palette, tool calls, proactive messages, reconnect |

These project skills override generic aesthetic preferences when they conflict.

## Recommended external skills

### Vercel Agent Skills
Pinned repository commit reviewed on 2026-09-01:
`vercel-labs/agent-skills@063bee94c3f4df8453406c830b0a7df0f2860278`

Use:
- `vercel-react-best-practices` (`skills/react-best-practices`): React performance and bundle/re-render guidance.
- `web-design-guidelines` (`skills/web-design-guidelines`): UI review/audit guidance.

Important: the upstream `web-design-guidelines` skill instructs agents to fetch the *latest* rules from `vercel-labs/web-interface-guidelines/main` at review time. That defeats reproducibility even when the skill repository itself is pinned. For this project, do **not** rely on that moving `main` URL in deterministic reviews. Pin the guideline source too, or vendor an approved snapshot before enabling automated audits.

Approved guideline source snapshot reference as of 2026-09-01:
`vercel-labs/web-interface-guidelines@e3d624baaf29dc1fc645aff3e38f03e564d2d6b1`

### Magnus Agent Skills
Pinned repository commit reviewed on 2026-09-01:
`magnus919/agent-skills@516c233d3364a90277a16d2e77c30ee038928397`

Use:
- `product-design-and-ux`: information architecture, task/state/recovery flows, engineering UX handoff.
- `web-accessibility`: semantics, keyboard/focus, responsive input, motion and WCAG-informed verification.
- `playwright`: browser-level E2E verification after interaction flows exist.

## Activation order

For product/interaction design work:
1. `product-design-and-ux`
2. local `monet-gallery-design`
3. local `monet-gallery-interaction`
4. local `hermes-chat-interaction` when Chat is in scope
5. `web-accessibility`

For React implementation/review:
1. relevant local project skill(s)
2. `vercel-react-best-practices`
3. pinned web interface audit guidance

For verification:
1. unit/component tests already present in the repo
2. Playwright once a browser flow exists
3. accessibility/manual interaction checks

## Conflict rules
- Product-v3 and project skills win over generic aesthetic suggestions.
- Accessibility and data-integrity requirements win over atmosphere.
- Do not introduce a third-party skill that fetches moving remote instructions during a deterministic build/review unless that behavior has been explicitly approved.
- Do not copy huge external skill catalogs into the repo. Vendor only the specific approved skill/version when needed.
- A skill may recommend Next.js-specific behavior; this project currently uses Vite + React, so apply only framework-relevant rules.

## Current status
Project skills and design docs are committed. External skills are **recommended and version-pinned by reference**, not yet vendored into this repository.
