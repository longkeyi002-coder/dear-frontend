# Mobile Gallery Interaction

## Goal
Recreate the feeling of browsing collectible/magic cards without sacrificing ordinary mobile navigation quality.

## Layout
- One primary painting card is visually dominant.
- Adjacent cards may peek into view to communicate horizontal exploration.
- Keep painting title and destination label readable without opening the card.
- Avoid shrinking a desktop gallery wall into a tiny grid.

## Gesture behavior
- Horizontal drag follows the finger.
- Release snaps to the nearest intended card.
- Define a movement threshold so a swipe does not trigger card activation.
- Fast flicks may advance one card; avoid unexpectedly skipping many cards by default.
- First/last card should resist overscroll gracefully rather than loop unless product later explicitly chooses looping.
- Preserve selected card and wing when returning from a space.

## Non-gesture access
Gesture cannot be the only control. Provide accessible previous/next actions and clear current-position semantics.

## Keyboard / assistive tech
Where keyboard navigation is available, support previous/next movement and Enter/Space activation. Give the carousel/collection an accessible name; announce the currently selected painting without flooding live regions during drag.

## No autoplay
Do not automatically rotate paintings. The gallery is explored by the user.

## Card interaction states
1. idle
2. focused/selected
3. dragging
4. snapping
5. entering
6. unavailable/placeholder

## Entering a painting
Activation occurs only from a stable selected card, not mid-drag. Transition may visually approach the artwork, but routing must not wait on a long animation.

## Bottom navigation
If a bottom navigation is used, it must not compete with the card gesture. Keep high-frequency Chat reachable globally. Gallery browsing is an experience, not a prerequisite for chatting.

## Performance
- Prefer responsive images and lazy loading beyond nearby cards.
- Limit simultaneous blur/filter layers.
- Use transform/opacity for gesture animation.
- Do not preload every future high-resolution painting on first load.
