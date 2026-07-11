/**
 * Carrusel horizontal infinito de pasos (1–6) en Cómo Trabajamos.
 * Clones a ambos lados para wrap natural 1↔6 en ambas direcciones.
 * Touch: swipe horizontal mueve el carrusel; vertical deja scrollear la página.
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
    return clone;
  }

  // Clones al final: … 1 2 3 4 5 6 | 1' 2' 3' 4' 5' 6'
  originals.forEach((card) => track.appendChild(makeClone(card)));

  // Clones al inicio: 1" 2" 3" 4" 5" 6" | 1 2 3 4 5 6 | …
  const prependFragment = document.createDocumentFragment();
  originals.forEach((card) => prependFragment.appendChild(makeClone(card)));
  track.insertBefore(prependFragment, track.firstChild);

  // Índices de scroll: [0..total-1]=clones prev, [total..2total-1]=reales, [2total..]=clones next
  const realOffset = total;

  const AXIS_THRESHOLD = 10;

  let slideIndex = 0;
  let scrollLock = false;
  let isPointerDown = false;
  let isDragging = false;
  let axisLock = null;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartScroll = 0;
  let dragDeltaX = 0;

  function getSlideWidth() {
    if (originals.length > 1) {
      const a = originals[0].getBoundingClientRect();
      const b = originals[1].getBoundingClientRect();
      const step = b.left - a.left;
      if (step > 0) return step;
    }
    const width = originals[0].getBoundingClientRect().width;
    return width > 0 ? width : viewport.clientWidth;
  }

  function logicalFromScrollIndex(scrollIndex) {
    if (scrollIndex < total) return ((scrollIndex % total) + total) % total;
    if (scrollIndex >= 2 * total) return ((scrollIndex - 2 * total) % total + total) % total;
    return scrollIndex - realOffset;
  }

  function announce() {
    if (!liveEl) return;
    const card = originals[slideIndex];
    const title = card?.querySelector(".proceso__card-title")?.textContent?.trim() || "";
    liveEl.textContent = title
      ? `Paso ${slideIndex + 1} de ${total}: ${title}`
      : `Paso ${slideIndex + 1} de ${total}`;
  }

  function normalizeLoop() {
    const width = getSlideWidth();
    if (width <= 0) return;

    const rawIndex = Math.round(viewport.scrollLeft / width);

    if (rawIndex < total) {
      viewport.style.scrollBehavior = "auto";
      viewport.scrollLeft = (rawIndex + total) * width;
      slideIndex = logicalFromScrollIndex(rawIndex + total);
      viewport.style.scrollBehavior = "";
      announce();
      return;
    }

    if (rawIndex >= 2 * total) {
      viewport.style.scrollBehavior = "auto";
      viewport.scrollLeft = (rawIndex - total) * width;
      slideIndex = logicalFromScrollIndex(rawIndex - total);
      viewport.style.scrollBehavior = "";
      announce();
      return;
    }

    slideIndex = logicalFromScrollIndex(rawIndex);
    announce();
  }

  function animateToScrollIndex(scrollIndex, instant = false) {
    const width = getSlideWidth();
    if (width <= 0) return;

    slideIndex = logicalFromScrollIndex(scrollIndex);
    scrollLock = true;
    viewport.style.scrollBehavior =
      instant || prefersReducedMotionGlobal ? "auto" : "smooth";
    viewport.scrollLeft = scrollIndex * width;
    announce();

    window.setTimeout(
      () => {
        viewport.style.scrollBehavior = "auto";
        normalizeLoop();
        viewport.style.scrollBehavior = "";
        scrollLock = false;
      },
      instant || prefersReducedMotionGlobal ? 32 : 720
    );
  }

  function scrollToLogical(logicalIndex, instant = false) {
    const safe = ((logicalIndex % total) + total) % total;
    animateToScrollIndex(realOffset + safe, instant);
  }

  function currentScrollIndex() {
    const width = getSlideWidth();
    if (width <= 0) return realOffset + slideIndex;
    return Math.round(viewport.scrollLeft / width);
  }

  function snapAfterDrag() {
    const width = getSlideWidth();
    if (width <= 0) return;

    const scrollPos = viewport.scrollLeft;
    const raw = scrollPos / width;
    const nearest = Math.round(raw);
    const threshold = 0.18;

    // Empuje claro hacia un lado: ir al slide en esa dirección
    let target = nearest;
    if (dragDeltaX < -width * threshold) {
      target = Math.ceil(raw - 0.001);
    } else if (dragDeltaX > width * threshold) {
      target = Math.floor(raw + 0.001);
    }

    animateToScrollIndex(target, false);
  }

  function stepNext() {
    if (scrollLock || isDragging) return;
    animateToScrollIndex(currentScrollIndex() + 1, false);
  }

  function stepPrev() {
    if (scrollLock || isDragging) return;
    animateToScrollIndex(currentScrollIndex() - 1, false);
  }

  function beginHorizontalDrag(pointerId) {
    isDragging = true;
    viewport.classList.add("proceso__viewport--dragging");
    viewport.style.scrollSnapType = "none";
    viewport.style.scrollBehavior = "auto";
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
    viewport.style.scrollSnapType = "";
    viewport.style.scrollBehavior = "";
  }

  function endDrag(pointerId) {
    if (!isPointerDown && !isDragging) return;

    const didHorizontalDrag = isDragging && axisLock === "x";
    const delta = dragDeltaX;

    if (pointerId != null && viewport.hasPointerCapture?.(pointerId)) {
      try {
        viewport.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }

    resetPointerState();

    if (didHorizontalDrag && Math.abs(delta) > 6) {
      dragDeltaX = delta;
      snapAfterDrag();
      dragDeltaX = 0;
    } else if (didHorizontalDrag) {
      normalizeLoop();
    }
  }

  viewport.addEventListener("pointerdown", (event) => {
    if (scrollLock) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest(".proceso__nav")) return;

    isPointerDown = true;
    isDragging = false;
    axisLock = null;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragStartScroll = viewport.scrollLeft;
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
      viewport.scrollLeft = dragStartScroll - dx;
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

  viewport.addEventListener(
    "scroll",
    () => {
      if (scrollLock || isDragging) return;
      normalizeLoop();
    },
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => scrollToLogical(slideIndex, true),
    { passive: true }
  );

  scrollToLogical(0, true);
  window.addEventListener("load", () => scrollToLogical(slideIndex, true), {
    once: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProcesoCards);
} else {
  initProcesoCards();
}
