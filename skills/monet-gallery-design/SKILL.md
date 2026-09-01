# Monet Gallery Design

Use this project skill whenever designing or reviewing visual UI for Monet Gallery / Our Home.

## Goal
Create a living private gallery, not a conventional dashboard with Monet images pasted on top.

## Required principles
- A painting defines a visual theme space, not one feature or one page.
- Business components stay consistent; palettes, light, texture, frame language, decoration and motion change by painting theme.
- Atmosphere must never block navigation, readability, focus, or touch targets.
- Mobile is not a shrunken desktop. Desktop uses a gallery wall; mobile uses a card-like gallery experience.
- Avoid generic glassmorphism, excessive cards, neon gradients, dashboard grids, and decorative motion without meaning.
- Distinguish REALITY, AGENT_LIFE, RELATIONSHIP, and HOME_STATE visually without making the interface feel technical.
- Prefer CSS/SVG/lightweight assets before WebGL or heavy 3D.
- Respect prefers-reduced-motion and accessible contrast/focus states.

## Before implementation
Read:
- `docs/product-v3.md`
- `docs/frontend-spec.md`
- `docs/design/design-system.md`
- `docs/design/painting-themes.md`
- `docs/design/motion.md`
- `docs/design/assets.md`

## Review checklist
Reject implementations that:
- look like a generic admin dashboard;
- map one Hermes page directly to one painting;
- hard-code arbitrary colors inside components;
- use atmosphere to hide controls or reduce contrast;
- treat generated Agent Life text as system fact;
- render every section as a card;
- force desktop and mobile into the same gallery layout.
