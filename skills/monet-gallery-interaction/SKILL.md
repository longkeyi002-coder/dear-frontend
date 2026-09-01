# Monet Gallery Interaction

Use this project skill for navigation, gestures, transitions, responsive behavior, and state restoration.

## Core interaction model
### Desktop
- Gallery wall may show several framed paintings at once.
- Hover and keyboard focus reveal labels and affordance without moving layout.
- Entering a painting should feel like approaching it, but route change must remain fast.
- Returning to the gallery restores prior wing and viewport/selection when practical.

### Mobile
- Use a magic-card style horizontal gallery: one primary painting card, adjacent cards partially visible when appropriate.
- Swipe must track the finger and snap predictably.
- Tapping must not accidentally trigger while the user is swiping.
- Provide visible previous/next controls or equivalent accessible controls; do not rely on gesture alone.
- Preserve the selected card when returning from a space.
- No autoplay carousel.

## Navigation rules
- East/West wings express daily-life vs system-management atmosphere, not rigid data ownership.
- High-frequency actions must bypass gallery navigation: Chat is globally reachable; model switching stays near the chat composer; status is quickly reachable.
- Browser/mobile back behavior must be deterministic and never reset the user to the first card without reason.
- Loading, empty, offline, unavailable, reconnecting and error states require explicit interaction paths.

## Motion rules
- Motion communicates entering/leaving a painting, card selection, time/season, or Agent Activity.
- Never delay a functional action just to finish an animation.
- Prefer transform/opacity and lightweight effects.
- Honor `prefers-reduced-motion`.

## Accessibility
- All interactive targets require visible focus.
- Keyboard operation must cover gallery navigation and dialogs/palettes.
- Touch targets should generally aim for at least 44x44 CSS px.
- Screen-reader labels describe the destination/function, not only the painting title.

## Before implementation
Read `docs/design/mobile-gallery.md`, `docs/design/motion.md`, and `docs/frontend-spec.md`.
