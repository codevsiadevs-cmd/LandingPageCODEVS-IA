/**
 * Carrusel infinito de Cómo Trabajamos.
 * Usa translate3d (sin scroll-snap ni scrollLeft) para swipe limpio
 * izquierda/derecha, sin pelear con el scroll vertical de la página.
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

function initProcesoCards() {
  const slider = document.getElementById("proceso-cards");
  const viewport = document.getElementById("proceso-viewport");
  const track = document.getElementById("proceso-track");
  const prevBtn = slider?.querySelector(".proceso__nav--prev");
  const nextBtn = slider?.querySelector(".proceso__nav--next");
  const liveEl = slider?.querySelector(".proceso__live");

  if (!slider || !viewport || !track || !prevBtn || !nextBtn) return;

  const originals = [...track.querySelectorAll("[data-proceso-card]")];
  const total = originals.length;
  if (total === 0) return;

  function makeClone(card) {
    const clone = card.cloneNode(true);
    clone.classList.add("proceso__card--clone");
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("data-proceso-card");

    // Un solo <video> real: en clones solo queda el fondo negro (no reinicia).
    clone.querySelectorAll(".proceso__card-video").forEach((video) => {
      video.remove();
    });

    return clone;
  }

  originals.forEach((card) => track.appendChild(makeClone(card)));

  const prependFragment = document.createDocumentFragment();
  originals.forEach((card) => prependFragment.appendChild(makeClone(card)));
  track.insertBefore(prependFragment, track.firstChild);

  const realOffset = total;
  const AXIS_THRESHOLD = 8;
  const TRANSITION_MS = prefersReducedMotionGlobal ? 0 : 480;
  const mainVideo = track.querySelector(
    ".proceso__card[data-proceso-card] .proceso__card-video"
  );

  function keepVideoPlaying() {
    if (!mainVideo) return;
    mainVideo.muted = true;
    mainVideo.loop = true;
    if (mainVideo.paused) {
      const playPromise = mainVideo.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    }
  }

  let slideIndex = 0;
  let positionIndex = realOffset;
  let step = 0;
  let offsetX = 0;
  let animating = false;
  let isPointerDown = false;
  let isDragging = false;
  let axisLock = null;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginOffset = 0;
  let dragDeltaX = 0;
  let settleTimer = 0;

  function measureStep() {
    if (originals.length > 1) {
      const a = originals[0].getBoundingClientRect();
      const b = originals[1].getBoundingClientRect();
      const next = b.left - a.left;
      if (next > 0) {
        step = next;
        return step;
      }
    }
    const width = originals[0].getBoundingClientRect().width;
    step = width > 0 ? width : viewport.clientWidth;
    return step;
  }

  function logicalFromPosition(index) {
    const wrapped = ((index % total) + total) % total;
    return wrapped;
  }

  function announce() {
    if (!liveEl) return;
    const card = originals[slideIndex];
    if (card?.classList.contains("proceso__card--video")) {
      liveEl.textContent = `Video ${slideIndex + 1} de ${total}`;
      return;
    }
    const title = card?.querySelector(".proceso__card-title")?.textContent?.trim() || "";
    liveEl.textContent = title
      ? `Paso ${slideIndex + 1} de ${total}: ${title}`
      : `Paso ${slideIndex + 1} de ${total}`;
  }

  function applyTransform(animate) {
    if (animate && TRANSITION_MS > 0) {
      track.classList.remove("proceso__track--dragging");
      track.style.transitionDuration = `${TRANSITION_MS}ms`;
    } else {
      track.classList.add("proceso__track--dragging");
      track.style.transitionDuration = "0ms";
    }
    track.style.transform = `translate3d(${-offsetX}px, 0, 0)`;
  }

  function normalizePosition(animate = false) {
    if (step <= 0) measureStep();
    if (step <= 0) return;

    if (positionIndex < total) {
      positionIndex += total;
      offsetX = positionIndex * step;
      applyTransform(false);
      if (animate) {
        // force reflow then continue if needed
        void track.offsetWidth;
      }
    } else if (positionIndex >= 2 * total) {
      positionIndex -= total;
      offsetX = positionIndex * step;
      applyTransform(false);
      if (animate) void track.offsetWidth;
    }

    slideIndex = logicalFromPosition(positionIndex);
    announce();
  }

  function goToPosition(index, animate = true) {
    if (step <= 0) measureStep();
    if (step <= 0) return;

    positionIndex = index;
    offsetX = positionIndex * step;
    slideIndex = logicalFromPosition(positionIndex);
    announce();
    applyTransform(animate && !prefersReducedMotionGlobal);

    window.clearTimeout(settleTimer);
    if (!animate || prefersReducedMotionGlobal || TRANSITION_MS === 0) {
      normalizePosition(false);
      animating = false;
      return;
    }

    animating = true;
    settleTimer = window.setTimeout(() => {
      normalizePosition(false);
      animating = false;
    }, TRANSITION_MS + 32);
  }

  function goToLogical(logical, animate = true) {
    const safe = ((logical % total) + total) % total;
    goToPosition(realOffset + safe, animate);
  }

  function stepNext() {
    if (animating || isDragging) return;
    goToPosition(positionIndex + 1, true);
  }

  function stepPrev() {
    if (animating || isDragging) return;
    goToPosition(positionIndex - 1, true);
  }

  function snapFromDrag() {
    if (step <= 0) measureStep();
    if (step <= 0) return;

    const raw = offsetX / step;
    let target = Math.round(raw);
    const pulled = -dragDeltaX / step;

    if (Math.abs(pulled) > 0.18) {
      target = pulled > 0 ? Math.ceil(raw - 0.001) : Math.floor(raw + 0.001);
    }

    goToPosition(target, true);
  }

  function beginHorizontalDrag(pointerId) {
    isDragging = true;
    animating = false;
    window.clearTimeout(settleTimer);
    track.classList.add("proceso__track--dragging");
    track.style.transitionDuration = "0ms";
    viewport.classList.add("proceso__viewport--dragging");
    try {
      viewport.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  }

  function resetPointerState() {
    isPointerDown = false;
    isDragging = false;
    axisLock = null;
    dragPointerId = null;
    dragDeltaX = 0;
    viewport.classList.remove("proceso__viewport--dragging");
  }

  function endDrag(pointerId) {
    if (!isPointerDown && !isDragging) return;

    const didHorizontal = isDragging && axisLock === "x";
    const delta = dragDeltaX;

    if (pointerId != null && viewport.hasPointerCapture?.(pointerId)) {
      try {
        viewport.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }

    resetPointerState();

    if (didHorizontal) {
      dragDeltaX = delta;
      if (Math.abs(delta) > 4) snapFromDrag();
      else goToPosition(positionIndex, true);
      dragDeltaX = 0;
    }
  }

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest(".proceso__nav")) return;

    // Cancelar animación a medias y anclar al offset actual
    window.clearTimeout(settleTimer);
    animating = false;
    track.classList.add("proceso__track--dragging");
    track.style.transitionDuration = "0ms";
    if (step > 0) {
      positionIndex = Math.round(offsetX / step);
      offsetX = positionIndex * step;
      applyTransform(false);
    }

    isPointerDown = true;
    isDragging = false;
    axisLock = null;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginOffset = offsetX;
    dragDeltaX = 0;
  });

  viewport.addEventListener(
    "pointermove",
    (event) => {
      if (!isPointerDown || event.pointerId !== dragPointerId) return;

      const dx = event.clientX - dragStartX;
      const dy = event.clientY - dragStartY;

      if (axisLock === null) {
        if (Math.abs(dx) < AXIS_THRESHOLD && Math.abs(dy) < AXIS_THRESHOLD) return;

        axisLock = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";

        if (axisLock === "y") {
          resetPointerState();
          return;
        }

        beginHorizontalDrag(event.pointerId);
      }

      if (axisLock !== "x") return;

      dragDeltaX = dx;
      offsetX = dragOriginOffset - dx;
      applyTransform(false);
      if (event.cancelable) event.preventDefault();
    },
    { passive: false }
  );

  viewport.addEventListener("pointerup", (event) => {
    if (event.pointerId !== dragPointerId && dragPointerId != null) return;
    endDrag(event.pointerId);
  });

  viewport.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== dragPointerId && dragPointerId != null) return;
    endDrag(event.pointerId);
  });

  prevBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    stepPrev();
  });

  nextBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    stepNext();
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepNext();
    }
  });

  function refreshLayout() {
    measureStep();
    offsetX = (realOffset + slideIndex) * step;
    positionIndex = realOffset + slideIndex;
    applyTransform(false);
  }

  window.addEventListener("resize", refreshLayout, { passive: true });

  measureStep();
  goToLogical(0, false);
  keepVideoPlaying();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) keepVideoPlaying();
  });
  window.addEventListener("load", () => {
    refreshLayout();
    keepVideoPlaying();
  }, { once: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProcesoCards);
} else {
  initProcesoCards();
}
