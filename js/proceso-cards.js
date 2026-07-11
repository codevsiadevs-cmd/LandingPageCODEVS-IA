/**
 * Stack 3D de Cómo Trabajamos impulsado por scroll vertical.
 * Las tarjetas pasan una a una: entran arriba, frente al centro, salen abajo.
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

  root.style.setProperty("--proceso-steps", String(total));

  const mainVideo = stack.querySelector(".proceso__card-video");
  let activeIndex = 0;
  let lastAnnounced = -1;
  let scrollingProgrammatically = false;
  let scrollUnlockTimer = 0;

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
    if (lastAnnounced === activeIndex) return;
    lastAnnounced = activeIndex;
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
    if (leadEl.textContent === next) return;
    if (prefersReducedMotionGlobal) {
      leadEl.textContent = next;
      return;
    }
    leadEl.style.opacity = "0";
    window.setTimeout(() => {
      leadEl.textContent = next;
      leadEl.style.opacity = "1";
    }, 140);
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

  function getScrollMetrics() {
    const rect = root.getBoundingClientRect();
    const totalScroll = Math.max(root.offsetHeight - window.innerHeight, 1);
    const scrolled = Math.min(Math.max(-rect.top, 0), totalScroll);
    return { totalScroll, scrolled, progress: scrolled / totalScroll };
  }

  function indexFromScroll() {
    const { progress } = getScrollMetrics();
    if (total <= 1) return 0;
    return Math.min(total - 1, Math.max(0, Math.round(progress * (total - 1))));
  }

  function scrollToIndex(index, smooth = true) {
    if (total <= 1) return;
    const targetIndex = ((index % total) + total) % total;
    const docTop = root.getBoundingClientRect().top + window.scrollY;
    const totalScroll = Math.max(root.offsetHeight - window.innerHeight, 1);
    const top = docTop + (targetIndex / (total - 1)) * totalScroll;
    scrollingProgrammatically = true;
    window.clearTimeout(scrollUnlockTimer);
    window.scrollTo({
      top,
      behavior: smooth && !prefersReducedMotionGlobal ? "smooth" : "auto",
    });
    scrollUnlockTimer = window.setTimeout(() => {
      scrollingProgrammatically = false;
    }, smooth ? 700 : 80);
  }

  function goTo(nextIndex, { syncScroll = true } = {}) {
    const wrapped = ((nextIndex % total) + total) % total;
    if (wrapped === activeIndex) {
      if (syncScroll) scrollToIndex(wrapped, true);
      return;
    }
    activeIndex = wrapped;
    applySlots();
    if (syncScroll) scrollToIndex(activeIndex, true);
  }

  function syncFromScroll() {
    if (scrollingProgrammatically) return;
    const nextIndex = indexFromScroll();
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    applySlots();
  }

  prevBtn.addEventListener("click", () => goTo(activeIndex - 1));
  nextBtn.addEventListener("click", () => goTo(activeIndex + 1));

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (index === activeIndex) return;
      goTo(index);
    });
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
  });

  window.addEventListener("scroll", syncFromScroll, { passive: true });
  window.addEventListener("resize", syncFromScroll, { passive: true });

  activeIndex = indexFromScroll();
  applySlots();
  keepVideoPlaying();
}

initProcesoCards();
