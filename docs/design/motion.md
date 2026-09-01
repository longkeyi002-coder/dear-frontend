# Motion Guidelines

## Purpose
Motion should communicate place, state and life. It is not decorative filler.

## Allowed meanings
- approach/leave a painting space;
- select/snap a mobile gallery card;
- Agent presence/activity changes;
- time, weather or seasonal atmosphere;
- relationship/home-state ceremonial moments;
- loading, success, error and reconnect feedback.

## Timing
Keep navigation transitions short and interruptible. Functional state changes should feel immediate; ambient layers may move slowly in the background.

## Performance
Prefer transform and opacity. Use blur/filter sparingly, especially on mobile. Avoid continuous layout-triggering animation. Do not require WebGL/Three.js for V1 atmosphere.

## Reduced motion
When `prefers-reduced-motion: reduce` is active:
- remove parallax and large zoom travel;
- replace card/route movement with short fades or immediate state change;
- stop nonessential looping environmental animation;
- preserve all state feedback and affordances.

## Agent presence
Pet/presence animation can represent typing, browsing, looking at phone, reading, working, waiting or sleeping. When the underlying state is REALITY, animation must reflect actual activity categories. When it is only expressive ambiance, do not present it as a verified system event.

## Chat
Streaming text should not be accompanied by distracting bouncing or pulsing effects. Tool activity uses subtle state animation. Proactive messages may have a gentle arrival treatment, not a notification explosion.

## Avoid
- long page-intro sequences on every visit;
- mandatory animation before controls become usable;
- looping shimmer on static content;
- scroll hijacking/smooth-scroll frameworks unless a later design explicitly justifies them;
- motion that makes the gallery feel like a game menu rather than a private space.
