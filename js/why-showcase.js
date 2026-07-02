import { prefersReducedMotionGlobal } from "./scroll.js";

const STEP_COUNT = 5;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function initWhyShowcase() {
  const section = document.getElementById("nosotros");
  const scrollWrap = section?.querySelector(".why__scroll");
  const viewport = document.getElementById("why-viewport");
  const track = document.getElementById("why-track");

  if (!section || !scrollWrap || !viewport || !track) return;

  const items = [...track.querySelectorAll("[data-why-item]")];
  if (items.length !== STEP_COUNT) return;

  let activeIndex = 0;
  let metrics = { itemSpan: 0, centerOffset: 0 };

  function measure() {
    const first = items[0];
    const second = items[1];
    const itemSpan = second
      ? second.offsetTop - first.offsetTop
      : first.offsetHeight;
    const centerOffset = (viewport.clientHeight - first.offsetHeight) / 2;

    metrics = { itemSpan, centerOffset };
    section.style.setProperty("--why-item-span", `${itemSpan}px`);
    section.style.setProperty("--why-center-offset", `${centerOffset}px`);

    return metrics;
  }

  function getPinMetrics() {
    const rect = scrollWrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollRange = Math.max(scrollWrap.offsetHeight - vh, 1);
    const scrolled = clamp(-rect.top, 0, scrollRange);
    const progress = scrolled / scrollRange;
    const pinned = rect.top <= 1 && rect.bottom > vh + 1;

    return { progress, pinned };
  }

  function applyTimeline(index) {
    const { itemSpan, centerOffset } = metrics;
    const trackOffset = centerOffset - index * itemSpan;

    track.style.transform = `translate3d(0, ${trackOffset}px, 0)`;

    items.forEach((item, i) => {
      const delta = i - index;
      const absDelta = Math.abs(delta);
      const blur = clamp(absDelta * 5.5, 0, 14);
      const opacity = clamp(1 - absDelta * 0.38, 0.18, 1);

      item.style.setProperty("--why-item-blur", `${blur}px`);
      item.style.setProperty("--why-item-opacity", String(opacity));
      item.classList.toggle("is-focused", absDelta < 0.42);
    });
  }

  function updateFromScroll() {
    const { progress, pinned } = getPinMetrics();
    const index = progress * (STEP_COUNT - 1);

    section.classList.toggle("why--pinned", pinned);
    applyTimeline(index);

    const nextActive = Math.round(index);
    if (nextActive !== activeIndex) {
      activeIndex = nextActive;
      section.dataset.activeItem = String(activeIndex);
    }
  }

  if (prefersReducedMotionGlobal) {
    section.classList.add("why--static");
    measure();
    applyTimeline(0);
    return;
  }

  measure();
  applyTimeline(0);
  updateFromScroll();

  window.addEventListener("scroll", updateFromScroll, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    updateFromScroll();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWhyShowcase);
} else {
  initWhyShowcase();
}
