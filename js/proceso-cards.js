/**
 * Stack 3D de Cómo Trabajamos.
 * Las tarjetas rotan entre slots con perspectiva; la frontal es la activa.
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

const SLOT_COUNT = 7;

function initProcesoCards() {
  const root = document.getElementById("proceso");
  const slider = document.getElementById("proceso-cards");
  const viewport = document.getElementById("proceso-viewport");
  const stack = document.getElementById("proceso-track");
  const prevBtn = root?.querySelector(".proceso__nav--prev");
  const nextBtn = root?.querySelector(".proceso__nav--next");
  const liveEl = slider?.querySelector(".proceso__live");
  const leadEl = root?.querySelector("[data-proceso-lead]");

  if (!root || !slider || !viewport || !stack || !prevBtn || !nextBtn) return;

  const cards = [...stack.querySelectorAll("[data-proceso-card]")];
  const total = cards.length;
  if (total === 0) return;

  const mainVideo = stack.querySelector(".proceso__card-video");
  let activeIndex = Math.min(1, total - 1);
  let animating = false;

  function keepVideoPlaying() {
    if (!mainVideo) return;
    mainVideo.muted = true;
    mainVideo.loop = true;
    if (mainVideo.paused) {
      const playPromise = mainVideo.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    }
  }

  function cardLabel(card) {
    if (card.classList.contains("proceso__card--video")) {
      return card.dataset.procesoTitle || "CODEVS IA";
    }
    return (
      card.querySelector(".proceso__card-title")?.textContent?.trim() ||
      card.dataset.procesoTitle ||
      ""
    );
  }

  function cardDesc(card) {
    return (
      card.querySelector(".proceso__card-desc")?.textContent?.trim() ||
      card.dataset.procesoDesc ||
      ""
    );
  }

  function announce() {
    const card = cards[activeIndex];
    if (!card || !liveEl) return;
    const title = cardLabel(card);
    liveEl.textContent = title
      ? `Paso ${activeIndex + 1} de ${total}: ${title}`
      : `Paso ${activeIndex + 1} de ${total}`;
  }

  function syncLead() {
    if (!leadEl) return;
    const card = cards[activeIndex];
    if (!card) return;
    const next = cardDesc(card) || cardLabel(card);
    if (prefersReducedMotionGlobal) {
      leadEl.textContent = next;
      return;
    }
    leadEl.style.opacity = "0";
    window.setTimeout(() => {
      leadEl.textContent = next;
      leadEl.style.opacity = "1";
    }, 160);
  }

  function applySlots() {
    cards.forEach((card, index) => {
      const slot = (index - activeIndex + total) % total;
      const boundedSlot = Math.min(slot, SLOT_COUNT - 1);
      card.dataset.slot = String(boundedSlot);
      card.classList.toggle("is-front", index === activeIndex);
      card.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");
      card.tabIndex = index === activeIndex ? 0 : -1;
    });
    syncLead();
    announce();
    keepVideoPlaying();
  }

  function goTo(nextIndex) {
    if (animating || total < 2) return;
    activeIndex = ((nextIndex % total) + total) % total;
    animating = true;
    applySlots();
    window.setTimeout(() => {
      animating = false;
    }, prefersReducedMotionGlobal ? 0 : 520);
  }

  function next() {
    goTo(activeIndex + 1);
  }

  function prev() {
    goTo(activeIndex - 1);
  }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (index === activeIndex) return;
      goTo(index);
    });
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      prev();
    }
  });

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let axisLock = null;

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest(".proceso__nav")) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    axisLock = null;
    try {
      viewport.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  });

  viewport.addEventListener("pointermove", (event) => {
    if (pointerId == null || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!axisLock) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisLock = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }
  });

  function endPointer(event) {
    if (pointerId == null || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    if (axisLock === "x" && Math.abs(dx) > 42) {
      if (dx < 0) next();
      else prev();
    }
    pointerId = null;
    axisLock = null;
  }

  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  applySlots();
  keepVideoPlaying();
}

initProcesoCards();
