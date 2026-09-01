# Asset Guidelines

## Asset groups
Recommended structure:

```text
public/assets/
├── paintings/
├── frames/
├── textures/
├── decorations/
├── pet/
└── icons/
```

## Paintings
- Keep source/provenance metadata for every artwork asset.
- Do not scrape random web images without license/source tracking.
- Prefer museum/open-access/public-domain reproductions with explicit reuse terms.
- Store optimized web derivatives separately from archival/source references.
- Use responsive sizes and modern formats where practical.

## Frames
Frames are UI elements, not photographic clutter. Prefer reusable CSS/SVG frame systems or lightweight textures. Maintain focus states and avoid making clickable bounds ambiguous.

## Textures
Use paper, canvas grain, glass haze, water reflection and subtle noise as low-opacity layers. Never place heavy texture beneath dense text or charts.

## Decorations
Flowers, leaves, notes, ribbons and room objects should support a painting theme or Home State. Decorative elements must not look interactive unless they are interactive.

## Pet / presence assets
Create an original, reusable presence character system rather than tying the product to a copyrighted character franchise.

Suggested states:
- idle
- typing
- phone
- browsing
- reading
- working
- sleeping
- waiting
- carrying-note
- celebration

Each state should work at small mobile sizes and should have reduced-motion/static fallbacks.

## Icons
Use a consistent icon system for functional controls. Decorative painterly icons may be used sparingly, but core actions should remain recognizable.

## Performance budget principles
- Lazy-load gallery assets outside the immediate viewport/neighbor range.
- Do not ship full-resolution museum files to the client.
- Avoid many simultaneous animated GIFs; prefer SVG/CSS/sprite/video only when justified.
- Define placeholder/aspect ratio to prevent layout shift.
