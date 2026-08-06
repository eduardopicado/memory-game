# Card images

This folder holds the card faces. The deck currently has **25 stickers**: 23
Brazil squad players, the CBF badge, and the "We Are Brazil" team photo.

Twenty of them were cropped out of a scanned sticker sheet; the other five were
supplied as individual images and resized to 540px wide.

## Adding or replacing images

1. Copy your image files into this folder.
2. Open `js/cards.js` and list the file names in `CARD_IMAGES`:

```js
const CARD_IMAGES = [
  "alisson.jpg",
  "bento.jpg",
  "your-new-card.png",
];
```

Each image becomes one **pair** of cards, so the deck needs at least as many
images as the board's pair count:

| Board   | Cards | Images needed |
| ------- | ----- | ------------- |
| Easy    | 12    | 6             |
| Normal  | 16    | 8             |
| Hard    | 20    | 10            |
| Expert  | 30    | 15            |

Anything you don't cover is filled in with the built-in emoji deck, and a
missing or broken image file quietly falls back to an emoji too — the game
never breaks because of a bad path.

Tips: portrait images around a 3:4 ratio fit the card shape best (they're
scaled to fit, never cropped), and PNG, JPG, GIF, SVG and WEBP all work.
