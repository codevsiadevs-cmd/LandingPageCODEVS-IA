/**
 * Stack vertical de Cómo Trabajamos impulsado por scroll.
 * Las tarjetas se extienden arriba/abajo y avanzan una a una al scrollear.
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

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
  let raf = 0;

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

  function getScrollMetrics() {
    const rect = root.getBoundingClientRect();
    const totalScroll = Math.max(root.offsetHeight - window.innerHeight, 1);
    const scrolled = clamp(-rect.top, 0, totalScroll);
    return { totalScroll, scrolled, progress: scrolled / totalScroll };
  }

  function getLayoutMetrics() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const cardH = cards[0]?.offsetHeight || 180;
    return {
      /* Separación vertical amplia entre tarjetas */
      spacing: cardH * (isMobile ? 1.05 : 1.2),
      tilt: isMobile ? 10 : 14,
      depth: isMobile ? 28 : 36,
    };
  }

  function paint() {
    const { progress } = getScrollMetrics();
    const floatIndex = progress * Math.max(total - 1, 0);
    const { spacing, tilt, depth } = getLayoutMetrics();

    cards.forEach((card, index) => {
      const offset = index - floatIndex;
      const abs = Math.abs(offset);
      const y = offset * spacing;
      const rx = clamp(offset * tilt, -42, 42);
      const z = -abs * depth;
      const scale = clamp(1.05 - abs * 0.07, 0.78, 1.08);
      const x = offset * (abs < 0.15 ? 0 : 6);

      card.style.transform =
        `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${-8}deg) scale(${scale})`;
      card.style.zIndex = String(Math.round(80 - abs * 10));
      card.style.opacity = String(abs > 3.5 ? 0 : abs > 2.7 ? 1 - (abs - 2.7) / 0.8 : 1);
      card.classList.toggle("is-front", Math.round(floatIndex) === index);
      card.setAttribute(
        "aria-hidden",
        Math.round(floatIndex) === index ? "false" : "true"
      );
    });

    const nextActive = clamp(Math.round(floatIndex), 0, total - 1);
    if (nextActive !== activeIndex) {
      activeIndex = nextActive;
      cards.forEach((card, index) => {
        card.tabIndex = index === activeIndex ? 0 : -1;
      });
      syncLead();
      announce();
      keepVideoPlaying();
    }
  }

  function requestPaint() {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      paint();
    });
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
      requestPaint();
    }, smooth ? 750 : 80);
  }

  function goTo(nextIndex) {
    scrollToIndex(((nextIndex % total) + total) % total, true);
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

  window.addEventListener(
    "scroll",
    () => {
      requestPaint();
    },
    { passive: true }
  );
  window.addEventListener("resize", requestPaint, { passive: true });

  paint();
  keepVideoPlaying();
}

initProcesoCards();
