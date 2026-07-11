/**
 * Carrusel horizontal infinito de pasos (1–6) en Cómo Trabajamos.
 * Flechas, teclado y arrastre — mismo patrón que el carrusel de proyectos.
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

  originals.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.classList.add("proceso__card--clone");
    clone.setAttribute("aria-hidden", "true");
    clone.removeAttribute("data-proceso-card");
    track.appendChild(clone);
  });

  let slideIndex = 0;
  let scrollLock = false;
  let isDragging = false;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragDeltaX = 0;

  function getSlideWidth() {
    const width = originals[0].getBoundingClientRect().width;
    return width > 0 ? width : viewport.clientWidth;
  }

  function announce() {
    if (!liveEl) return;
    const card = originals[slideIndex];
    const title = card?.querySelector(".proceso__card-title")?.textContent?.trim() || "";
    liveEl.textContent = title
      ? `Paso ${slideIndex + 1} de ${total}: ${title}`
      : `Paso ${slideIndex + 1} de ${total}`;
  }

  function scrollToSlide(index, instant = false) {
    const width = getSlideWidth();
    if (width <= 0) return;

    slideIndex = index;
    scrollLock = true;
    viewport.style.scrollBehavior =
      instant || prefersReducedMotionGlobal ? "auto" : "smooth";
    viewport.scrollLeft = index * width;
    announce();

    window.setTimeout(
      () => {
        viewport.style.scrollBehavior = "";
        scrollLock = false;
        normalizeLoop();
      },
      instant || prefersReducedMotionGlobal ? 32 : 720
    );
  }

  function normalizeLoop() {
    const width = getSlideWidth();
    if (width <= 0) return;

    const rawIndex = Math.round(viewport.scrollLeft / width);

    if (rawIndex >= total) {
      viewport.style.scrollBehavior = "auto";
      viewport.scrollLeft = 0;
      slideIndex = 0;
      viewport.style.scrollBehavior = "";
      announce();
      return;
    }

    slideIndex = Math.max(0, Math.min(total - 1, rawIndex));
    announce();
  }

  function snapAfterDrag() {
    const width = getSlideWidth();
    if (width <= 0) return;

    const scrollPos = viewport.scrollLeft;
    const threshold = width * 0.18;

    if (scrollPos >= total * width - threshold && dragDeltaX < 0) {
      scrollToSlide(total, false);
      return;
    }

    if (scrollPos <= threshold && dragDeltaX > 0 && slideIndex === 0) {
      stepPrev();
      return;
    }

    if (scrollPos >= total * width - 1) {
      viewport.style.scrollBehavior = "auto";
      viewport.scrollLeft = 0;
      slideIndex = 0;
      viewport.style.scrollBehavior = "";
      announce();
      return;
    }

    const nearest = Math.max(0, Math.min(total, Math.round(scrollPos / width)));
    scrollToSlide(nearest >= total ? 0 : nearest, !prefersReducedMotionGlobal);
  }

  function stepNext() {
    if (scrollLock || isDragging) return;
    if (slideIndex >= total - 1) {
      scrollToSlide(total, false);
      return;
    }
    scrollToSlide(slideIndex + 1, false);
  }

  function stepPrev() {
    if (scrollLock || isDragging) return;
    if (slideIndex <= 0) {
      viewport.style.scrollBehavior = "auto";
      viewport.scrollLeft = total * getSlideWidth();
      slideIndex = total - 1;
      viewport.style.scrollBehavior = "";
      announce();
      window.setTimeout(() => scrollToSlide(total - 1, false), 32);
      return;
    }
    scrollToSlide(slideIndex - 1, false);
  }

  function endDrag(pointerId) {
    if (!isDragging) return;
    isDragging = false;
    dragPointerId = null;
    viewport.classList.remove("proceso__viewport--dragging");
    viewport.style.scrollSnapType = "";
    viewport.style.scrollBehavior = "";

    if (pointerId != null && viewport.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }

    if (Math.abs(dragDeltaX) > 6) {
      snapAfterDrag();
    } else {
      normalizeLoop();
    }
    dragDeltaX = 0;
  }

  viewport.addEventListener("pointerdown", (event) => {
    if (scrollLock) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    isDragging = true;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartScroll = viewport.scrollLeft;
    dragDeltaX = 0;
    viewport.classList.add("proceso__viewport--dragging");
    viewport.style.scrollSnapType = "none";
    viewport.style.scrollBehavior = "auto";
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return;
    dragDeltaX = event.clientX - dragStartX;
    viewport.scrollLeft = dragStartScroll - dragDeltaX;
  });

  viewport.addEventListener("pointerup", (event) => {
    if (event.pointerId !== dragPointerId) return;
    endDrag(event.pointerId);
  });

  viewport.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== dragPointerId) return;
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

  window.addEventListener("resize", () => scrollToSlide(slideIndex, true), {
    passive: true,
  });

  scrollToSlide(0, true);
  window.addEventListener("load", () => scrollToSlide(slideIndex, true), {
    once: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProcesoCards);
} else {
  initProcesoCards();
}
