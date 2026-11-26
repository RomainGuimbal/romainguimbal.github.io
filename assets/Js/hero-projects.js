/* ============================================================
   Hero projects — continuous "wave" stack

   Every <article> of .hero-projects gets a height in pixels, and
   the heights always add up to the viewport: the stack never
   scrolls and no project is ever pushed off screen.

   Where a height comes from
   -------------------------
   1. The focus is one project, an integer index `f`.
   2. Lay a curve over the stack, centred on the focused project,
      and read how much of it each card catches:

          density(x) = exp(-(|x - c| / width) ^ 2)      c = peak

      `width` is how far, in projects, you have to move away from
      the peak for the curve to fall to 1/e. `centre` slides the peak inside
      the focused card, 0 being its top edge and 1 its bottom edge.
   3. The curve is sampled evenly across the stack — CONFIG.substeps
      points per card, taken at their midpoints — and the samples
      are added up into a running total. The cumulative value at a
      card edge is that total; the height of card i is the
      difference between the values at its two edges, i.e. the
      slice of the curve sitting in that card's band. Differences
      of the cumulative total, never of the curve itself: those go
      negative on the far side of the peak, while a running total
      only ever rises, so every slice is positive and the n slices
      add up to the mass the stack caught.
   4. fitHeights() gives every slice the same lift, --hero-min-height,
      and shares what is left of the available height between them in
      proportion to the curve. The lift is added, never clamped: a
      ceiling would cut the flanks off flat and leave the ends of the
      wave as a bar of equal cards. It is small, so the focused card
      still ends up with whatever the curve gives it, which is what
      `width` and `shape` are for.

   Motion
   ------
   The script never interpolates and never runs a frame loop. It
   writes one keyframe — the heights of the project being focused —
   and CSS transitions the heights, with the duration and easing
   declared in hero-projects.css. A hop that lands mid-slide just
   retargets: the browser eases from the current computed heights.

   Input is accumulated until it crosses a threshold, then the focus
   jumps exactly one project, and the wheel stays deaf for
   CONFIG.cooldown ms so no gesture, however violent, can skip a
   card.
   ============================================================ */

(function () {
  "use strict";

  var CONFIG = {
    // ---- the curve ----

    // Distance, in projects, at which the curve has fallen to 1/e.
    // The knob that decides everything: 0.3 is a spike, 0.6 a soft
    // hill, 1.2 a broad swell that lifts the whole stack.
    width: 4,

    // Where the peak sits inside the focused card: 0.5 centres it,
    // 0 puts it on the card's top edge, 1 on its bottom edge.
    centre: 0.5,

    // Samples taken per card when the curve is cut into slices.
    // 16 is already far finer than a pixel; this is the only reason
    // to touch it.
    substeps: 16,

    // ---- input ----

    // Scrolled pixels needed before the focus hops one project.
    // A mouse notch is about 100 px, so two of them are needed here;
    // a trackpad gesture adds up until it reaches the same value.
    scrollThreshold: 200,

    // How long the wheel stays deaf after a hop, in ms. A gesture
    // that keeps sending events therefore moves the focus by one
    // project at most, instead of racing down the stack.
    cooldown: 300,

    // Part of the available height a drag has to cover to hop one
    // project.
    dragTravel: 0.22,
  };

  var stack = document.querySelector(".hero-projects");
  if (!stack) return;

  var cards = [];

  var state = {
    focus: 0, // index of the focused project
    avail: 0, // height to share between the cards, in px
    minHeight: 40, // lift added under every card, in px
    cache: [], // heights per rest position, filled on demand
    lockUntil: 0, // wheel and drag are ignored until this timestamp
  };

  /* ---------- The curve ---------- */

  // The wave itself: a bell centred on `peak`, in index units,
  // falling to 1/e at CONFIG.width projects from the centre.
  // CONFIG.shape bends its flanks — 2 is the textbook gaussian, 1
  // keeps broad shoulders, 4 gives a flat top and steep sides.
  function density(x, peak) {
    return Math.exp((1-Math.sqrt(Math.abs(x - peak))) / (1/CONFIG.width));
    // return Math.exp(-Math.pow(Math.max(Math.abs(x - peak)-1,Math.abs(x - peak)+1) / CONFIG.width, 2));
  }

  // Share of the wave carried by each card, normalised to 1.
  //
  // The curve is sampled CONFIG.substeps times inside every card, at
  // the middle of each sub-step, and the samples are accumulated: a
  // card's share is the running total at its bottom edge minus the
  // total at its top edge. That integral, not the curve value at the
  // card's own index, is what makes the wave continuous across the
  // stack — sampling the curve once per card would hand the whole
  // peak to whichever card happens to sit under the centre and leave
  // its neighbours flat.
  function sharesAt(focus) {
    var count = cards.length;
    var shares = new Array(count);
    var step = 1 / CONFIG.substeps;
    var centre = focus + CONFIG.centre;
    var total = 0;
    var i;
    var j;

    for (i = 0; i < count; i++) {
      var before = total;

      for (j = 0; j < CONFIG.substeps; j++) {
        total += density(i + (j + 0.5) * step, centre);
      }

      shares[i] = total - before;
    }

    if (total > 0) {
      for (i = 0; i < count; i++) shares[i] /= total;
    }
    return shares;
  }

  /* ---------- Shares to pixels ---------- */

  // heights = lift + share * rest, with `rest` chosen so the heights
  // add up to `avail` exactly. Since the shares add up to 1, that is
  // just avail - count * lift: no search needed, and every card keeps
  // its slice of the curve in full — the lift only pads the bottom
  // of each one. Clamping instead of adding would put a ceiling under
  // the flanks, where the curve is at its thinnest, and turn the ends
  // of the wave into a bar of identical cards.
  function fitHeights(shareList, avail, lift) {
    var count = shareList.length;
    if (!count) return [];

    var rest = avail - count * lift;

    // A lift the column cannot pay for: fall back to an even split,
    // there is no room left for a shape.
    if (rest <= 0) {
      var even = avail / count;
      return shareList.map(function () {
        return even;
      });
    }

    return shareList.map(function (share) {
      return lift + share * rest;
    });
  }

  // Whole pixels that still add up to `target`. A card edge landing
  // between two pixels is snapped to one when it is painted, and which
  // way it snaps depends on where that edge falls — so a column of
  // fractional heights paints a total that is not the total it was
  // given, and the column's unpinned end moves by a pixel from one rest
  // position to the next. Rounded here, every edge sits on the grid and
  // the sum stays exact; the residue goes to the tallest card, where a
  // pixel changes nothing.
  function whole(heights, target) {
    var snapped = heights.map(Math.round);
    var slack = Math.round(target);

    for (var i = 0; i < snapped.length; i++) slack -= snapped[i];

    if (slack && snapped.length) {
      var tallest = 0;
      for (var j = 1; j < heights.length; j++) {
        if (heights[j] > heights[tallest]) tallest = j;
      }
      snapped[tallest] += slack;
    }
    return snapped;
  }

  // Heights for a rest position, solved on first use and kept until
  // the next measurement invalidates them.
  function heightsAt(focus) {
    var cached = state.cache[focus];
    if (cached) return cached;

    var count = cards.length;
    var heights;

    if (!count) return [];

    if (count === 1) {
      heights = [state.avail];
    } else {
      heights = fitHeights(sharesAt(focus), state.avail, state.minHeight);
    }

    heights = whole(heights, state.avail);

    state.cache[focus] = heights;
    return heights;
  }

  /* ---------- DOM ---------- */

  function setCardHeight(card, height) {
    // A keyframe, not a step: CSS eases from whatever the card
    // currently measures to this value, so one write per slide.
    var value = height.toFixed(2) + "px";
    card.style.height = value;
    card.style.setProperty("--project-height", value);

    // The vertical inset is half of what the border leaves. It is
    // written with the same value and transitioned on the same curve,
    // so height >= 2 * inset + 2px holds from the first frame to the
    // last and the card always measures exactly what it was given —
    // a card can never be thinner than its own padding otherwise.
    // CSS caps it, a tall card keeps its full inset.
    card.style.setProperty("--card-pad-y", ((height - 2) / 2).toFixed(2) + "px");
  }

  // `instant` writes the keyframe with the transition disabled: on a
  // resize the cards have to land at once instead of sliding from
  // the previous viewport's heights.
  function render(instant) {
    var heights = heightsAt(state.focus);

    if (instant) stack.classList.add("is-instant");

    for (var i = 0; i < cards.length; i++) {
      setCardHeight(cards[i], heights[i]);
      // The only flag the CSS needs: the focused card is the one whose
      // face is shown.
      cards[i].classList.toggle("is-focused", i === state.focus);
    }

    if (instant) {
      // Read back so the new heights commit while the class is still
      // on, then hand the cards back to CSS for the next slide.
      void stack.offsetHeight;
      stack.classList.remove("is-instant");
    }
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

    // The lift is paid for by every card, out of the same column, so
    // let the whole set of lifts claim at most half of it; the wave
    // keeps the rest. Without this cap, a dozen projects on a laptop
    // screen would spend the column on padding and the wave would be
    // gone.
    if (cards.length > 1) {
      var roomy = (state.avail * 0.5) / cards.length;
      state.minHeight = Math.max(4, Math.min(floor, roomy));
    }

    if (state.focus > cards.length - 1) state.focus = Math.max(cards.length - 1, 0);

    // Every cached height was built from the old measurement.
    state.cache = [];
  }

  /* ---------- Focus ---------- */

  function clampFocus(position) {
    return Math.min(Math.max(Math.round(position), 0), Math.max(cards.length - 1, 0));
  }

  // Point the wave at `position`. Only the target keyframe is
  // written: the slide is a CSS transition, so a call landing
  // mid-slide retargets from the current heights.
  function moveTo(position) {
    var next = clampFocus(position);
    if (next === state.focus) return;

    state.focus = next;
    render(false);
  }

  function nudge(delta) {
    moveTo(state.focus + delta);
  }

  // One gesture, one project: the input is deaf for `cooldown` ms
  // after a hop, so a flick that keeps firing events cannot skip a
  // card. Arrow keys are deliberate, they go through nudge instead.
  function hop(direction) {
    if (Date.now() < state.lockUntil) return false;

    state.lockUntil = Date.now() + Math.max(CONFIG.cooldown, 0);
    mark(null);
    moveTo(state.focus + direction);
    return true;
  }

  /* ---------- Input ---------- */

  // Scrolled pixels that have not yet been spent on a hop. Reset as
  // soon as a hop happens, so a slow trackpad gesture and a quick
  // mouse notch both move the focus one project at a time.
  var wheelTravel = 0;

  // The last few hundred wheel events, as [ms since load, px], with a
  // null px standing for a hop. Flick once, then run heroWave.dump() in
  // the console: the sizes and the gaps between them are what the
  // gesture reading has to be tuned against.
  var trace = [];

  function mark(delta) {
    if (trace.length > 250) trace.shift();
    trace.push([Math.round(performance.now()), delta]);
  }

  // The page cannot scroll, so the wheel is ours wherever it fires.
  window.addEventListener(
    "wheel",
    function (event) {
      if (event.ctrlKey) return; // pinch-zoom
      event.preventDefault();

      var delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      else if (event.deltaMode === 2) delta *= state.avail || window.innerHeight;

      mark(delta);

      // Still cooling down from the previous hop: swallow the event
      // whole, including its travel, so nothing piles up.
      if (Date.now() < state.lockUntil) {
        wheelTravel = 0;
        return;
      }

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
    // scroll hop: the wave slides to it in the CSS duration. A
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
    render(true);
  }

  // Resize events and the ResizeObserver can fire in bursts; cutting
  // the curve and rewriting every card for each of them is pure
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
  //   heroWave.config.width = 0.9; heroWave.refresh()
  window.heroWave = {
    config: CONFIG,
    state: state,
    goTo: moveTo,
    refresh: relayout,
    dump: function () {
      return trace
        .map(function (entry) {
          return entry[1] === null ? entry[0] + " hop" : entry[0] + " " + entry[1];
        })
        .join("\n");
    },
  };
})();
