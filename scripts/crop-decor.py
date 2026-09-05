"""Crop decorative fragments from the original paintings.

Each fragment is a real piece of the artwork, used as decoration in the
matching gallery space (docs/design/assets.md: keep provenance with assets).

Usage: python scripts/crop-decor.py
Source images: public/assets/paintings/  ->  Output: public/assets/decor/
"""

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PAINTINGS = ROOT / "public" / "assets" / "paintings"
DECOR = ROOT / "public" / "assets" / "decor"

# (source painting, output name, crop box (left, top, right, bottom), options)
CROPS = [
    ("home-water-lilies.jpg", "lily-pink.jpg", (25, 1300, 290, 1455), {}),
    ("home-water-lilies.jpg", "lily-pads.jpg", (700, 980, 1270, 1330), {}),
    ("home-water-lilies.jpg", "lily-band.jpg", (560, 250, 1120, 420), {}),
    ("home-water-lilies.jpg", "water-mist.jpg", (330, 780, 940, 1030), {"blur": 2}),
    ("home-water-lilies.jpg", "lily-corner.jpg", (60, 1150, 420, 1420), {}),
    ("home-water-lilies.jpg", "pads-mist.jpg", (150, 470, 580, 730), {}),
    ("home-water-lilies.jpg", "water-green.jpg", (880, 560, 1275, 900), {}),
    ("chat-impression-soleil-levant.jpg", "sunrise-sun.jpg", (660, 210, 900, 400), {}),
    ("chat-impression-soleil-levant.jpg", "sunrise-reflection.jpg", (690, 460, 870, 910), {}),
    ("chat-impression-soleil-levant.jpg", "sunrise-boat.jpg", (510, 600, 730, 800), {}),
    ("us-woman-with-parasol.jpg", "us-sky.jpg", (820, 80, 1240, 520), {"blur": 2}),
    ("us-woman-with-parasol.jpg", "us-parasol.jpg", (400, 100, 860, 480), {}),
    ("us-woman-with-parasol.jpg", "us-veil.jpg", (330, 430, 780, 950), {}),
    ("us-woman-with-parasol.jpg", "us-meadow.jpg", (80, 1130, 760, 1520), {"blur": 2}),
]


def main() -> None:
    DECOR.mkdir(parents=True, exist_ok=True)
    for source, name, box, options in CROPS:
        image = Image.open(PAINTINGS / source)
        limits = (image.size[0], image.size[1], image.size[0], image.size[1])
        left, top, right, bottom = [min(value, size) for value, size in zip(box, limits)]
        crop = image.crop((left, top, right, bottom))
        if options.get("blur"):
            crop = crop.filter(ImageFilter.GaussianBlur(options["blur"]))
        crop.save(DECOR / name, quality=88)
        print(f"{name}: {crop.size[0]}x{crop.size[1]}")


if __name__ == "__main__":
    main()
