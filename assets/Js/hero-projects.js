/* ============================================================
   Hero projects — continuous "wave" stack

   Every <article> of .hero-projects gets a height in pixels, and
   the heights always add up to the viewport: the stack never
   scrolls and no project is ever pushed off screen.

   How a height is obtained
   ------------------------
   1. A focus position `p` slides along the stack in index units.
      p = 0 is the first project, p = 2.5 sits halfway between the
      third and the fourth. Wheel, drag and arrow keys move it.
      There is no inertia: input is accumulated until it crosses a
      threshold, then the focus jumps exactly one project in
      CONFIG.duration ms and stops dead on arrival. The wheel is
      then deaf for CONFIG.cooldown ms, so no gesture — however
      violent — can ever skip a project.
   2. Every project is scored with one continuous profile:

        profile(d) = 1 / (1 + (d / spread) ^ tail)      d = |i - p|

      `spread` is how wide the peak is, `tail` how fast the rest
      of the stack fades away (below 1 the tail stays fat, above 2
      only the immediate neighbour stays visible).
   3. The scores are normalised, then raised to a single exponent
      solved once per layout so that the most focused project lands
      on `peakShare` of the screen. That exponent is solved for each
      resting position and blended between them, because a project
      in the middle of the stack has two neighbours of equal height
      while the end ones do not — without the per-position solve the
      peak would only reach 60 % at the ends.
   4. The shares are turned into pixels, with a floor at
      --hero-min-height so the collapsed projects stay visible and
      clickable. The overflow is taken back from the others.

   Everything is a share of the available height, so a resize only
   needs a fresh measurement. Knobs live in CONFIG below.
   ============================================================ */

(function () {
  "use strict";

  var CONFIG = {
    // Share of the available height the focused project takes.
    peakShare: 0.7,

    // Width of the peak, in index units. Larger = the neighbours
    // stay tall for longer.
    spread: 0.5,

    // How fast the wave fades out. 1 = 1/d, 2 = 1/d².
    tail: 0.55,

    // Length of a slide from one project to the next, in ms. Every
    // focus change lasts exactly this long: no easing tail, and
    // nothing keeps drifting once the input stops.
    duration: 400,

    // Scrolled pixels needed before the focus hops one project.
    // A mouse notch is about 100 px, so two of them are needed here;
    // a trackpad gesture adds up until it reaches the same value.
    scrollThreshold: 200,

    // How long the wheel stays deaf after a hop, in ms. A gesture
    // that keeps sending events therefore moves the focus by one
    // project at most, instead of racing down the stack.
    cooldown: 400,

    // Part of the available height a drag has to cover to hop one
    // project.
    dragTravel: 0.22,

    // Height, in px, below which a card switches to small type.
    tinyBelow: 30,
    compactBelow: 90,
    largeAbove: 260,

    // How the label follows the card. --project-height drives the
    // font-size, and every new value makes the browser lay the text
    // out again — the expensive part in Firefox. So the value is
    // rounded to `fontStep` px and refreshed at most every
    // `fontInterval` ms per card: a handful of updates per slide
    // instead of one per frame. Both are imperceptible; at rest the
    // exact value is always written.
    fontStep: 8,
    fontInterval: 80,
  };

  var stack = document.querySelector(".hero-projects");
  if (!stack) return;

  var cards = [];
  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var state = {
    p: 0, // focus position, in index units
    target: 0, // project the focus is heading to
    from: 0, // focus position the current slide started from
    elapsed: 0, // ms spent in the current slide
    avail: 0, // height to share between the cards, in px
    minHeight: 40,
    contrasts: [], // one exponent per project, pins the peak share
    running: false,
    last: 0,
    lockUntil: 0, // wheel is ignored until this timestamp
  };

  /* ---------- The profile ---------- */

  function profile(d) {
    return 1 / (1 + Math.pow(Math.abs(d) / CONFIG.spread, CONFIG.tail));
  }

  // Share of the most focused card for a given contrast exponent,
  // with the focus resting on project `focus`.
  function peakShareAt(k, focus) {
    var max = 0;
    var sum = 0;
    var count = cards.length;

    for (var i = 0; i < count; i++) {
      var w = Math.pow(profile(i - focus), k);
      sum += w;
      if (w > max) max = w;
    }
    return sum > 0 ? max / sum : 0;
  }

  // Smallest exponent that brings the peak up to CONFIG.peakShare.
  function solveContrast(focus) {
    if (cards.length < 2) return 1;

    var target = Math.min(Math.max(CONFIG.peakShare, 0.05), 0.95);
    var lo = 0.05;
    var hi = 60;

    if (peakShareAt(hi, focus) <= target) return hi;
    if (peakShareAt(lo, focus) >= target) return lo;

    for (var i = 0; i < 32; i++) {
      var mid = (lo + hi) / 2;
      if (peakShareAt(mid, focus) < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Contrast exponent for a floating focus: the per-project values
  // are blended together, so the exponent is continuous in `p` and
  // lands on the exact solved value whenever a project is focused.
  function contrastAt(p) {
    var list = state.contrasts;
    if (!list.length) return 1;

    var lo = Math.min(Math.max(Math.floor(p), 0), list.length - 1);
    var hi = Math.min(Math.max(Math.ceil(p), 0), list.length - 1);
    if (lo === hi) return list[lo];
    return list[lo] + (list[hi] - list[lo]) * (p - lo);
  }

  // Normalised height shares, summing to exactly 1.
  function shares(p) {
    var count = cards.length;
    var weights = new Array(count);
    var contrast = contrastAt(p);
    var sum = 0;
    var i;

    for (i = 0; i < count; i++) {
      weights[i] = Math.pow(profile(i - p), contrast);
      sum += weights[i];
    }

    if (!(sum > 0)) sum = 1;
    for (i = 0; i < count; i++) weights[i] /= sum;
    return weights;
  }

  /* ---------- Shares to pixels ---------- */

  // Solve heights = shares * scale, with every height >= floor, and
  // the sum exactly equal to `avail`. Monotone in `scale`, so a
  // bisection is enough.
  function fitHeights(shareList, avail, floor) {
    var count = shareList.length;
    if (!count) return [];

    if (count * floor >= avail) {
      var even = avail / count;
      return shareList.map(function () {
        return even;
      });
    }

    var peak = Math.max.apply(null, shareList) || 1;
    var lo = 0;
    var hi = avail / peak;

    for (var pass = 0; pass < 36; pass++) {
      if (hi - lo < 0.01) break; // a hundredth of a pixel is enough

      var mid = (lo + hi) / 2;
      var total = 0;
      for (var i = 0; i < count; i++) total += Math.max(shareList[i] * mid, floor);
      if (total < avail) lo = mid;
      else hi = mid;
    }

    var scale = (lo + hi) / 2;
    return shareList.map(function (share) {
      return Math.max(share * scale, floor);
    });
  }

  /* ---------- DOM ---------- */

  function sizeFor(height) {
    if (height < CONFIG.tinyBelow) return "tiny";
    if (height < CONFIG.compactBelow) return "compact";
    if (height > CONFIG.largeAbove) return "large";
    return "normal";
  }

  function setCardHeight(card, height, exact) {
    var previous = card.__heroHeight;
    if (exact || previous === undefined || Math.abs(height - previous) >= 0.05) {
      card.__heroHeight = height;
      card.style.height = height.toFixed(2) + "px";

      var size = sizeFor(height);
      if (card.dataset.size !== size) card.dataset.size = size;
    }

    // The label scales with the card through this variable, but it
    // is rounded and throttled (CONFIG.fontStep / fontInterval):
    // rewriting it on every frame forces a text layout per frame in
    // Firefox, which is what made the slide stutter there.
    var step = Math.max(CONFIG.fontStep, 1);
    var bucket = Math.round(height / step) * step;

    if (bucket !== card.__heroBucket) {
      var now = Date.now();
      if (exact || !(now - (card.__heroFontAt || 0) < CONFIG.fontInterval)) {
        card.__heroFontAt = now;
        card.__heroBucket = bucket;
        card.style.setProperty("--project-height", bucket + "px");
      }
    }
  }

  function render() {
    var heights = fitHeights(shares(state.p), state.avail, state.minHeight);
    // At rest the heights are final, so write them exactly: the skip
    // tolerance below would otherwise leave the column a pixel short.
    var exact = state.p === state.target;
    for (var i = 0; i < cards.length; i++) setCardHeight(cards[i], heights[i], exact);
  }

  /* ---------- Measuring ---------- */

  function collectCards() {
    cards = Array.prototype.filter.call(stack.children, function (node) {
      return node.tagName === "ARTICLE";
    });
  }

  var footer = null;
  var footerInset = -1;

  function measureFooter() {
    if (!footer) footer = document.querySelector("main > footer");
    if (!footer) return;

    // Writing on the root invalidates the whole document, so only do
    // it when the footer has actually changed height.
    var inset = footer.offsetHeight;
    if (inset === footerInset) return;

    footerInset = inset;
    document.documentElement.style.setProperty("--hero-footer-inset", inset + "px");
  }

  function measure() {
    collectCards();

    var style = getComputedStyle(stack);
    var padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    var gap = parseFloat(style.rowGap);
    var floor = parseFloat(style.getPropertyValue("--hero-min-height"));

    if (!isFinite(padY)) padY = 0;
    if (!isFinite(gap)) gap = 0;
    if (!isFinite(floor)) floor = 40;

    state.minHeight = floor;
    state.avail = Math.max(
      0,
      stack.clientHeight - padY - gap * Math.max(cards.length - 1, 0),
    );
    state.contrasts = cards.map(function (card, index) {
      return solveContrast(index);
    });

    // The focus keeps `peakShare` of the height, the others share
    // the rest, so that is the most a collapsed card may claim.
    // Without this cap, a dozen projects on a laptop screen would
    // all end up at the floor and the wave would be gone.
    if (cards.length > 1) {
      var peak = Math.min(Math.max(CONFIG.peakShare, 0.05), 0.95);
      var roomy = ((1 - peak) * state.avail * 0.95) / (cards.length - 1);
      state.minHeight = Math.max(4, Math.min(floor, roomy));
    }

    if (state.target > cards.length - 1) state.target = Math.max(cards.length - 1, 0);
    if (state.p > cards.length - 1) state.p = state.target;
  }

  /* ---------- Motion ---------- */

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animate(now) {
    state.elapsed += state.last ? Math.min(now - state.last, 80) : 16;
    state.last = now;

    var t = Math.min(state.elapsed / CONFIG.duration, 1);
    state.p = state.from + (state.target - state.from) * easeInOut(t);
    render();

    if (t < 1) {
      window.requestAnimationFrame(animate);
      return;
    }

    state.p = state.target;
    state.running = false;
    state.last = 0;
  }

  function clampTarget(position) {
    return Math.min(Math.max(position, 0), Math.max(cards.length - 1, 0));
  }

  // Slide the focus to `position` in exactly CONFIG.duration ms.
  // Called again mid-slide, it starts a fresh slide from wherever
  // the wave currently is.
  function moveTo(position) {
    var next = clampTarget(position);

    state.target = next;
    state.from = state.p;
    state.elapsed = 0;

    if (reduceMotion || !(CONFIG.duration > 0) || next === state.p) {
      state.p = next;
      render();
      return;
    }

    if (!state.running) {
      state.running = true;
      state.last = 0;
      window.requestAnimationFrame(animate);
    }
  }

  function nudge(delta) {
    moveTo(state.target + delta);
  }

  // One gesture, one project: the input is deaf for `cooldown` ms
  // after a hop, so a flick that keeps firing events cannot skip a
  // card. Arrow keys are deliberate, they go through nudge instead.
  function hop(direction) {
    if (Date.now() < state.lockUntil) return false;

    state.lockUntil = Date.now() + Math.max(CONFIG.cooldown, 0);
    moveTo(state.target + direction);
    return true;
  }

  /* ---------- Input ---------- */

  // Scrolled pixels that have not yet been spent on a hop. Reset as
  // soon as a hop happens, so a slow trackpad gesture and a quick
  // mouse notch both move the focus one project at a time.
  var wheelTravel = 0;

  // The page cannot scroll, so the wheel is ours wherever it fires.
  window.addEventListener(
    "wheel",
    function (event) {
      if (event.ctrlKey) return; // pinch-zoom
      event.preventDefault();

      // Still cooling down from the previous hop: swallow the event
      // whole, including its travel, so nothing piles up.
      if (Date.now() < state.lockUntil) {
        wheelTravel = 0;
        return;
      }

      var delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      else if (event.deltaMode === 2) delta *= state.avail || window.innerHeight;

      var threshold = Math.max(CONFIG.scrollThreshold, 1);
      wheelTravel += delta;
      if (Math.abs(wheelTravel) < threshold) return;

      var direction = wheelTravel > 0 ? 1 : -1;
      wheelTravel = 0;
      hop(direction);
    },
    { passive: false },
  );

  var drag = null;

  stack.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    // Capture below retargets every following event, pointerup
    // included, to the stack, so the card under the pointer has to
    // be remembered now: by the time the tap is over, the event no
    // longer knows which project it landed on.
    var card = event.target.closest ? event.target.closest("article") : null;

    drag = { y: event.clientY, travel: 0, moved: 0, card: card };
    if (stack.setPointerCapture) stack.setPointerCapture(event.pointerId);
  });

  stack.addEventListener("pointermove", function (event) {
    if (!drag) return;

    var dy = drag.y - event.clientY;
    drag.y = event.clientY;
    drag.moved += Math.abs(dy);

    // A drag is one gesture too: the leftover travel is dropped once
    // it has been spent on a hop, and the cooldown ignores the rest
    // of the movement.
    if (Date.now() < state.lockUntil) {
      drag.travel = 0;
      return;
    }

    drag.travel += dy;

    var unit = Math.max((state.avail || window.innerHeight) * CONFIG.dragTravel, 1);
    if (Math.abs(drag.travel) < unit) return;

    var direction = drag.travel > 0 ? 1 : -1;
    drag.travel = 0;
    hop(direction);
  });

  function endDrag(event) {
    if (!drag) return;

    var moved = drag.moved;
    var card = drag.card;
    drag = null;

    if (stack.hasPointerCapture && stack.hasPointerCapture(event.pointerId)) {
      stack.releasePointerCapture(event.pointerId);
    }

    // A click focuses the project under the pointer, exactly like a
    // scroll hop: the wave slides to it in CONFIG.duration ms. A
    // gesture that dragged belongs to the scroll instead.
    if (event.type === "pointerup" && moved < 8) {
      var index = cards.indexOf(card);
      if (index !== -1) moveTo(index);
    }
  }

  stack.addEventListener("pointerup", endDrag);
  stack.addEventListener("pointercancel", endDrag);

  window.addEventListener("keydown", function (event) {
    var tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    var handled = true;

    switch (event.key) {
      case "ArrowUp":
        nudge(-1);
        break;
      case "ArrowDown":
        nudge(1);
        break;
      case "PageUp":
        nudge(-2);
        break;
      case "PageDown":
        nudge(2);
        break;
      case "Home":
        moveTo(0);
        break;
      case "End":
        moveTo(cards.length - 1);
        break;
      default:
        handled = false;
    }

    if (handled) event.preventDefault();
  });

  /* ---------- Resize ---------- */

  function relayout() {
    measureFooter();
    measure();
    render();
  }

  // Resize events and the ResizeObserver can fire in bursts; solving
  // the contrasts and rewriting every card for each of them is pure
  // waste, so they collapse into one relayout per frame.
  var relayoutQueued = false;

  function scheduleRelayout() {
    if (relayoutQueued) return;

    relayoutQueued = true;
    window.requestAnimationFrame(function () {
      relayoutQueued = false;
      relayout();
    });
  }

  window.addEventListener("resize", scheduleRelayout);

  if (window.ResizeObserver) {
    new window.ResizeObserver(scheduleRelayout).observe(stack);
  }

  /* ---------- Start ---------- */

  relayout();

  // Handy from the console while tuning:
  //   heroWave.config.spread = 0.8; heroWave.refresh()
  window.heroWave = {
    config: CONFIG,
    state: state,
    goTo: moveTo,
    refresh: relayout,
  };
})();
