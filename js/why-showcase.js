import { prefersReducedMotionGlobal } from "./scroll.js";

const STEP_COUNT = 5;

function initWhyShowcase() {
  const section = document.getElementById("nosotros");
  const scrollWrap = section?.querySelector(".why__scroll");
  const viewport = document.getElementById("why-viewport");
  const track = document.getElementById("why-track");

  if (!section || !scrollWrap || !viewport || !track) return;

  const items = [...track.querySelectorAll("[data-why-item]")];
  if (items.length !== STEP_COUNT) return;

  let activeIndex = 0;
  let lastIndex = 0;

  function getPinMetrics() {
    const rect = scrollWrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollRange = Math.max(scrollWrap.offsetHeight - vh, 1);
    const scrolled = Math.min(Math.max(-rect.top, 0), scrollRange);
    const progress = scrolled / scrollRange;
    const pinned = rect.top <= 1 && rect.bottom > vh + 1;

    return { progress, pinned };
  }

  function measure() {
    const itemPx = items[0].getBoundingClientRect().height;
    const gap = Number.parseFloat(getComputedStyle(track).rowGap || getComputedStyle(track).gap) || 0;
    const itemSpan = itemPx + gap;
    const viewportPx = viewport.clientHeight;
    const topOffset = 0;
    const edgeSlidePx = viewportPx - itemPx - gap;
    const slidePx = edgeSlidePx > 20 ? edgeSlidePx : Math.max(viewportPx * 0.14, 16);

    section.style.setProperty("--why-item-h", `${itemPx}px`);
    section.style.setProperty("--why-viewport-h", `${viewportPx}px`);

    return { itemPx, itemSpan, viewportPx, slidePx, topOffset };
  }

  function getCardTop(i, index, topOffset, itemSpan, slidePx) {
    return topOffset + (i - index) * (itemSpan + slidePx);
  }

  function getVisibleRatio(cardTop, itemPx, viewportPx) {
    const cardBottom = cardTop + itemPx;
    const hiddenTop = Math.max(0, -cardTop);
    const hiddenBottom = Math.max(0, cardBottom - viewportPx);
    const visiblePx = Math.max(0, itemPx - hiddenTop - hiddenBottom);
    return itemPx > 0 ? visiblePx / itemPx : 0;
  }

  function getMobileTrackOffset() {
    const raw = getComputedStyle(section).getPropertyValue("--why-mobile-track-offset").trim();
    if (!raw) return 0;
    const value = Number.parseFloat(raw);
    if (Number.isNaN(value)) return 0;
    return raw.endsWith("rem") ? value * Number.parseFloat(getComputedStyle(document.documentElement).fontSize) : value;
  }

  function applyTimeline(index) {
    const { itemPx, itemSpan, viewportPx, slidePx, topOffset } = measure();
    const mobileOffset = getMobileTrackOffset();
    const firstItemBoost = mobileOffset > 0 ? mobileOffset * Math.max(0, 1 - index / 0.85) : 0;

    track.style.transform = `translate3d(0, ${topOffset - index * itemSpan + firstItemBoost}px, 0)`;

    items.forEach((item, i) => {
      const delta = i - index;
      const y = delta * slidePx;
      const cardTop = getCardTop(i, index, topOffset, itemSpan, slidePx) + firstItemBoost;
      const visibleRatio = getVisibleRatio(cardTop, itemPx, viewportPx);

      item.classList.toggle("is-active", Math.abs(delta) < 0.45);
      item.classList.toggle("is-near", Math.abs(delta) >= 0.45 && Math.abs(delta) < 1.35);
      item.style.transform = `translate3d(0, ${y}px, 0)`;
      item.style.opacity = visibleRatio < 0.04 ? "0" : "";
    });

    section.dataset.scrollDir = index >= lastIndex ? "down" : "up";
    lastIndex = index;
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
    applyTimeline(0);
    return;
  }

  applyTimeline(0);
  updateFromScroll();

  window.addEventListener("scroll", updateFromScroll, { passive: true });
  window.addEventListener("resize", updateFromScroll, { passive: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWhyShowcase);
} else {
  initWhyShowcase();
}
