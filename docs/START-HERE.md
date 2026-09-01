# Monet Gallery — Start Here for Codex

Before changing product UI or interaction code, read these files in order:

1. `docs/product-v3.md` — product truth and scope.
2. `docs/hermes-capability-matrix.md` — what Hermes can provide vs what Our Home must provide.
3. `docs/frontend-spec.md` — Phase 1 engineering contract.
4. `docs/skills.md` — approved agent skills, pinned external references and conflict rules.
5. `skills/monet-gallery-design/SKILL.md` — visual/world rules.
6. `skills/monet-gallery-interaction/SKILL.md` — gallery/mobile/navigation rules.
7. `skills/hermes-chat-interaction/SKILL.md` — chat/slash/tool/proactive-message rules when Chat is in scope.
8. Relevant files under `docs/design/`.

## Priority when instructions conflict

1. Data integrity and safety boundaries.
2. `product-v3.md` product decisions.
3. Project-local skills.
4. `frontend-spec.md` engineering boundaries.
5. Accessibility requirements.
6. Pinned external engineering/design guidance.
7. Generic framework conventions or aesthetic preferences.

## Phase 1 reminder
Do not connect production Hermes, build Our Home Backend, add push/life-loop services, or expand the West Wing unless the task explicitly advances to that phase. Use adapters and honest placeholder/mock states.

## Completion rule
Do not declare an interaction complete by code inspection alone when it can be exercised in a browser. Once the flow exists, verify observable behavior and recovery paths; add Playwright coverage when appropriate.
