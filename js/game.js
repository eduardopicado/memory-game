/* Memory game — 1 or 2 players. No build step, no dependencies. */
(function () {
  "use strict";

  var MISS_DELAY = 900; // ms a mismatched pair stays visible

  var el = {
    setup: document.getElementById("setup"),
    game: document.getElementById("game"),
    board: document.getElementById("board"),
    startBtn: document.getElementById("start-btn"),
    menuBtn: document.getElementById("menu-btn"),
    soundBtn: document.getElementById("sound-btn"),
    deckNote: document.getElementById("deck-note"),
    namesGroup: document.getElementById("names-group"),
    name1: document.getElementById("name1"),
    name2: document.getElementById("name2"),
    soloStats: document.getElementById("solo-stats"),
    versusStats: document.getElementById("versus-stats"),
    moves: document.getElementById("moves"),
    timer: document.getElementById("timer"),
    pairsFound: document.getElementById("pairs-found"),
    turnBanner: document.getElementById("turn-banner"),
    overlay: document.getElementById("overlay"),
    resultTitle: document.getElementById("result-title"),
    resultDetail: document.getElementById("result-detail"),
    resultBest: document.getElementById("result-best"),
    againBtn: document.getElementById("again-btn"),
    overlayMenuBtn: document.getElementById("overlay-menu-btn"),
    playerCards: [document.getElementById("p1-card"), document.getElementById("p2-card")],
    playerNames: [document.getElementById("p1-name"), document.getElementById("p2-name")],
    playerScores: [document.getElementById("p1-score"), document.getElementById("p2-score")]
  };

  var settings = { players: 1, pairs: 8, cols: 4, colsNarrow: 4 };

  var state = null;
  var soundOn = true;
  var tickHandle = null;

  /* ---------------------------------------------------------- deck */

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  // Picks `pairs` distinct faces: user images first, emoji for the rest.
  function pickFaces(pairs) {
    var faces = [];
    var images = shuffle(CARD_IMAGES.slice());
    var emoji = shuffle(CARD_EMOJI.slice());

    for (var i = 0; i < images.length && faces.length < pairs; i++) {
      faces.push({
        key: "img:" + images[i],
        src: IMAGE_DIR + images[i],
        emoji: emoji[faces.length % emoji.length]
      });
    }
    for (var j = 0; faces.length < pairs; j++) {
      faces.push({ key: "emo:" + j, src: null, emoji: emoji[j % emoji.length] });
    }
    return faces;
  }

  function buildDeck(pairs) {
    var deck = [];
    pickFaces(pairs).forEach(function (face) {
      deck.push({ face: face, matched: false, flipped: false });
      deck.push({ face: face, matched: false, flipped: false });
    });
    return shuffle(deck);
  }

  /* --------------------------------------------------------- sound */

  var audioCtx = null;

  function beep(freq, duration, type) {
    if (!soundOn) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration + 0.02);
    } catch (err) {
      /* audio is a nicety — never let it break the game */
    }
  }

  var sfx = {
    flip: function () { beep(420, 0.08, "triangle"); },
    match: function () { beep(660, 0.1); setTimeout(function () { beep(880, 0.14); }, 90); },
    miss: function () { beep(200, 0.16, "sawtooth"); },
    win: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        setTimeout(function () { beep(f, 0.18); }, i * 120);
      });
    }
  };

  /* ---------------------------------------------------------- setup */

  function wireRadioGroup(selector, onPick) {
    document.querySelectorAll(selector).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var siblings = btn.parentElement.querySelectorAll(".option");
        siblings.forEach(function (s) {
          s.classList.remove("is-selected");
          s.setAttribute("aria-checked", "false");
        });
        btn.classList.add("is-selected");
        btn.setAttribute("aria-checked", "true");
        onPick(btn);
      });
    });
  }

  wireRadioGroup(".option[data-players]", function (btn) {
    settings.players = parseInt(btn.dataset.players, 10);
    el.namesGroup.hidden = settings.players !== 2;
  });

  wireRadioGroup(".option[data-pairs]", function (btn) {
    settings.pairs = parseInt(btn.dataset.pairs, 10);
    settings.cols = parseInt(btn.dataset.cols, 10);
    settings.colsNarrow = parseInt(btn.dataset.colsNarrow, 10);
    updateDeckNote();
  });

  function updateDeckNote() {
    var have = CARD_IMAGES.length;
    if (have === 0) {
      el.deckNote.textContent =
        "Playing with the built-in emoji deck. Add your images to the images/ folder and list them in js/cards.js.";
    } else if (have < settings.pairs) {
      el.deckNote.textContent =
        "Using your " + have + " image" + (have === 1 ? "" : "s") +
        " plus " + (settings.pairs - have) + " emoji to fill this board.";
    } else {
      el.deckNote.textContent =
        have + " stickers in the deck — every game deals a fresh mix.";
    }
  }

  /* --------------------------------------------------------- render */

  function buildBoard() {
    el.board.innerHTML = "";
    var total = state.deck.length;
    el.board.style.setProperty("--cols", settings.cols);
    el.board.style.setProperty("--cols-narrow", settings.colsNarrow);
    // Row counts let the board cap its own size against viewport height too,
    // so cards grow to fill a landscape iPad instead of just a portrait one.
    el.board.style.setProperty("--rows", Math.ceil(total / settings.cols));
    el.board.style.setProperty("--rows-narrow", Math.ceil(total / settings.colsNarrow));

    state.deck.forEach(function (card, index) {
      var btn = document.createElement("button");
      btn.className = "card";
      btn.type = "button";
      btn.dataset.index = index;
      btn.setAttribute("aria-label", "Card " + (index + 1) + ", face down");

      var inner = document.createElement("span");
      inner.className = "card-inner";

      var back = document.createElement("span");
      back.className = "card-face card-back";
      back.setAttribute("aria-hidden", "true");

      var front = document.createElement("span");
      front.className = "card-face card-front";

      if (card.face.src) {
        var img = document.createElement("img");
        img.src = card.face.src;
        img.alt = "";
        img.draggable = false;
        // If the file is missing or broken, silently fall back to emoji.
        img.addEventListener("error", function () {
          img.remove();
          front.appendChild(emojiSpan(card.face.emoji));
        });
        front.appendChild(img);
      } else {
        front.appendChild(emojiSpan(card.face.emoji));
      }

      inner.appendChild(back);
      inner.appendChild(front);
      btn.appendChild(inner);
      btn.addEventListener("click", function () { onCardClick(index); });
      el.board.appendChild(btn);
    });
  }

  function emojiSpan(char) {
    var span = document.createElement("span");
    span.className = "card-emoji";
    span.textContent = char;
    return span;
  }

  function cardEl(index) {
    return el.board.children[index];
  }

  function paintCard(index) {
    var card = state.deck[index];
    var node = cardEl(index);
    node.classList.toggle("is-flipped", card.flipped || card.matched);
    node.classList.toggle("is-matched", card.matched);
    node.disabled = card.matched;
    node.setAttribute(
      "aria-label",
      "Card " + (index + 1) + ", " +
        (card.matched ? "matched" : card.flipped ? "face up" : "face down")
    );
  }

  /* ----------------------------------------------------------- play */

  function startGame() {
    var names = [
      (el.name1.value || "").trim() || "Player 1",
      (el.name2.value || "").trim() || "Player 2"
    ];

    if (state && state.pendingMiss) clearTimeout(state.pendingMiss.timer);

    state = {
      deck: buildDeck(settings.pairs),
      selection: [],
      pendingMiss: null,
      busy: false,
      moves: 0,
      matched: 0,
      current: 0,
      scores: [0, 0],
      names: names,
      startedAt: null,
      elapsed: 0
    };

    buildBoard();

    var solo = settings.players === 1;
    el.soloStats.hidden = !solo;
    el.versusStats.hidden = solo;
    el.turnBanner.hidden = solo;

    if (!solo) {
      el.playerNames[0].textContent = names[0];
      el.playerNames[1].textContent = names[1];
    }

    el.moves.textContent = "0";
    el.timer.textContent = "0:00";
    updateStats();

    el.setup.hidden = true;
    el.game.hidden = false;
    el.overlay.hidden = true;
    stopTimer();
  }

  function onCardClick(index) {
    // Impatient players shouldn't have to wait out the mismatch pause —
    // a third click closes the previous pair and counts straight away.
    if (state.pendingMiss) flushMiss();

    var card = state.deck[index];
    if (state.busy || card.flipped || card.matched) return;

    if (state.startedAt === null) startTimer();

    card.flipped = true;
    paintCard(index);
    state.selection.push(index);
    sfx.flip();

    if (state.selection.length < 2) return;

    state.busy = true;
    state.moves++;
    if (settings.players === 1) el.moves.textContent = String(state.moves);

    var a = state.selection[0];
    var b = state.selection[1];

    if (state.deck[a].face.key === state.deck[b].face.key) {
      resolveMatch(a, b);
    } else {
      resolveMiss(a, b);
    }
  }

  function resolveMatch(a, b) {
    state.deck[a].matched = true;
    state.deck[b].matched = true;
    state.matched++;
    state.scores[state.current]++;
    state.selection = [];
    state.busy = false;
    paintCard(a);
    paintCard(b);
    sfx.match();
    updateStats();

    if (state.matched === settings.pairs) finish();
  }

  function resolveMiss(a, b) {
    sfx.miss();
    cardEl(a).classList.add("is-wrong");
    cardEl(b).classList.add("is-wrong");
    state.pendingMiss = {
      a: a,
      b: b,
      timer: setTimeout(flushMiss, MISS_DELAY)
    };
  }

  function flushMiss() {
    var miss = state.pendingMiss;
    if (!miss) return;
    clearTimeout(miss.timer);
    state.pendingMiss = null;

    [miss.a, miss.b].forEach(function (i) {
      state.deck[i].flipped = false;
      cardEl(i).classList.remove("is-wrong");
      paintCard(i);
    });

    state.selection = [];
    state.busy = false;

    if (settings.players === 2) {
      state.current = state.current === 0 ? 1 : 0;
      updateStats();
    }
  }

  function updateStats() {
    if (settings.players === 1) {
      el.pairsFound.textContent = state.matched + "/" + settings.pairs;
      return;
    }
    for (var i = 0; i < 2; i++) {
      el.playerScores[i].textContent = String(state.scores[i]);
      el.playerCards[i].classList.toggle("is-active", state.current === i);
    }
    el.turnBanner.textContent = state.names[state.current] + "'s turn";
  }

  /* ---------------------------------------------------------- timer */

  function startTimer() {
    state.startedAt = Date.now();
    tickHandle = setInterval(function () {
      state.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      el.timer.textContent = formatTime(state.elapsed);
    }, 250);
  }

  function stopTimer() {
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = null;
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  /* --------------------------------------------------------- finish */

  function finish() {
    stopTimer();
    if (state.startedAt !== null) {
      state.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    }
    var finished = state; // don't pop the result over a game already left behind
    setTimeout(function () {
      if (state !== finished || el.game.hidden) return;
      sfx.win();
      showResult();
      el.overlay.hidden = false;
      el.againBtn.focus();
    }, 450);
  }

  function showResult() {
    if (settings.players === 1) {
      el.resultTitle.textContent = "Board cleared!";
      el.resultDetail.textContent =
        state.moves + " moves in " + formatTime(state.elapsed) + ".";
      el.resultBest.textContent = recordBest();
      return;
    }

    var s = state.scores;
    if (s[0] === s[1]) {
      el.resultTitle.textContent = "It's a draw!";
    } else {
      var winner = s[0] > s[1] ? 0 : 1;
      el.resultTitle.textContent = state.names[winner] + " wins!";
    }
    el.resultDetail.textContent =
      state.names[0] + " " + s[0] + " — " + s[1] + " " + state.names[1];
    el.resultBest.textContent = "";
  }

  // Best solo score per board size: fewest moves, time breaks ties.
  function recordBest() {
    var key = "memory-best-" + settings.pairs;
    var best = null;
    try {
      best = JSON.parse(localStorage.getItem(key));
    } catch (err) {
      best = null;
    }

    var isBest =
      !best ||
      state.moves < best.moves ||
      (state.moves === best.moves && state.elapsed < best.seconds);

    if (isBest) {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ moves: state.moves, seconds: state.elapsed })
        );
      } catch (err) {
        /* private browsing — skip persistence */
      }
      return best ? "New best for this board!" : "First score on this board.";
    }
    return "Best: " + best.moves + " moves in " + formatTime(best.seconds) + ".";
  }

  /* ------------------------------------------------------ navigation */

  function toMenu() {
    stopTimer();
    if (state && state.pendingMiss) clearTimeout(state.pendingMiss.timer);
    el.overlay.hidden = true;
    el.game.hidden = true;
    el.setup.hidden = false;
  }

  el.startBtn.addEventListener("click", startGame);
  el.menuBtn.addEventListener("click", toMenu);
  el.overlayMenuBtn.addEventListener("click", toMenu);
  el.againBtn.addEventListener("click", startGame);

  el.soundBtn.addEventListener("click", function () {
    soundOn = !soundOn;
    el.soundBtn.classList.toggle("is-muted", !soundOn);
    el.soundBtn.setAttribute("aria-pressed", String(soundOn));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !el.game.hidden) toMenu();
  });

  updateDeckNote();
})();
