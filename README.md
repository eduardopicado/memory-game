# Memory Game

A card-matching memory game for **1 or 2 players**, played with a deck of 25
FIFA World Cup 26 Brazil stickers.

No build step, no dependencies, no server required — it's plain HTML, CSS and
JavaScript.

## Play it

Open `index.html` in any browser. That's it.

If you'd rather serve it (useful on a phone on the same Wi-Fi):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How it works

**Solo** — clear the board while the game tracks your moves and time. Your best
run for each board size is saved in the browser and shown when you finish.

**Two players** — enter both names, then take turns. Find a pair and you score a
point *and* keep the turn; miss and play passes to the other player. Most pairs
at the end wins, draws included.

Board sizes: Easy (12 cards), Normal (16), Hard (20), Expert (30). Every game
deals a fresh shuffle from the 25-sticker deck, so no two rounds are the same.

Other details:
- Cards are real buttons — Tab and Enter/Space work, and screen readers announce
  each card's state.
- Clicking a third card during the "wrong pair" pause resolves it immediately,
  so fast players never wait.
- `Esc` returns to the menu; the speaker button mutes the sound effects.
- The layout reflows on phones (Expert drops from 6 columns to 5).

## Swapping the images

The deck lives in `js/cards.js` — a list of file names found in `images/`:

```js
const CARD_IMAGES = [
  "alisson.jpg",
  "bento.jpg",
  // ...
];
```

Drop new files into `images/`, list them there, and they're in the game. Each
image is one **pair**, so a board needs as many images as its pair count
(Easy 6, Normal 8, Hard 10, Expert 15). Anything short is topped up from the
built-in emoji deck, and a missing or broken file quietly falls back to an emoji
rather than breaking the board. See `images/README.md` for the details.

## Layout

```
index.html        markup for the three screens (setup, board, result)
css/styles.css    all styling, including the 3D card flip
js/cards.js       the deck — image file names and the emoji fallback
js/game.js        game logic: shuffling, turns, scoring, timer, best scores
images/           the card faces
```

The sticker images were supplied by the repository owner — Panini/FIFA artwork
included here for personal use.
