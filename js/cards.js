/*
 * ============================================================
 *  YOUR IMAGES GO HERE
 * ============================================================
 *
 *  1. Drop your image files into the `images/` folder.
 *  2. List their file names below, one per line, in quotes.
 *
 *  Each image becomes one PAIR of cards, so you need at least
 *  as many images as the pair count of the board you play:
 *      Easy 6 · Normal 8 · Hard 10 · Expert 15
 *
 *  Any pairs left over (or any image that fails to load) fall
 *  back to the emoji deck further down, so the game always works.
 *
 *  Square-ish images look best. PNG/JPG/GIF/SVG/WEBP all work.
 */
const CARD_IMAGES = [
  // Goalkeepers
  "alisson.jpg",
  "bento.jpg",
  "weverton.jpg",
  // Defenders
  "marquinhos.jpg",
  "eder-militao.jpg",
  "gabriel-magalhaes.jpg",
  "danilo.jpg",
  "alex-sandro.jpg",
  "wesley.jpg",
  // Midfielders
  "casemiro.jpg",
  "bruno-guimaraes.jpg",
  "lucas-paqueta.jpg",
  "joao-pedro.jpg",
  // Forwards
  "neymar-jr.jpg",
  "vinicius-junior.jpg",
  "rodrygo.jpg",
  "raphinha.jpg",
  "endrick.jpg",
  "estevao.jpg",
  "matheus-cunha.jpg",
  "gabriel-martinelli.jpg",
  "luiz-henrique.jpg",
  "igor-thiago.jpg",
  // Team stickers
  "brasil-badge.jpg",
  "we-are-brazil.jpg",
];

/* Folder the file names above are relative to. */
const IMAGE_DIR = "images/";

/* Fallback deck — used until you add images, and to top up short decks. */
const CARD_EMOJI = [
  "🦊", "🐼", "🐙", "🦉", "🐝", "🦋",
  "🐢", "🦄", "🐧", "🦁", "🐸", "🦖",
  "🌵", "🍄", "🌻", "🍉", "🍕", "🚀",
  "⚡", "🌈", "🎈", "🎸", "⚓", "🔮",
];
