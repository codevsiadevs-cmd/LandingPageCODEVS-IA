import { prefersReducedMotionGlobal } from "./scroll.js";

const STEP_COUNT = 6;

function initProcesoShowcase() {
  const section = document.getElementById("proceso");
  const viewport = document.getElementById("proceso-steps-viewport");
  const track = document.getElementById("proceso-steps-track");

  if (!section || !viewport || !track) return;

  const steps = [...track.querySelectorAll(".proceso-step-item")];
  if (steps.length !== STEP_COUNT) return;

  let activeIndex = 0;
  let lastIndex = 0;

  function getPinMetrics() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollRange = Math.max(section.offsetHeight - vh, 1);
    const scrolled = Math.min(Math.max(-rect.top, 0), scrollRange);
    const progress = scrolled / scrollRange;
    const pinned = rect.top <= 1 && rect.bottom > vh + 1;

    return { progress, pinned };
  }

  function measure() {
    const stepPx = steps[0].getBoundingClientRect().width;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    const stepSpan = stepPx + gap;
    const viewportPx = viewport.clientWidth;
    const slidePx = Math.min(Math.max(viewportPx * 0.28, 110), 320);

    section.style.setProperty("--proceso-step-w", `${stepPx}px`);
    section.style.setProperty("--proceso-viewport-w", `${viewportPx}px`);

    return { stepPx, stepSpan, viewportPx, slidePx };
  }

  function applyTimeline(index) {
    const { stepPx, stepSpan, viewportPx, slidePx } = measure();
    const centerOffset = (viewportPx - stepPx) / 2;

    track.style.transform = `translate3d(${centerOffset - index * stepSpan}px, 0, 0)`;

    steps.forEach((step, i) => {
      const delta = i - index;
      const x = delta * slidePx;

      step.classList.toggle("is-active", Math.abs(delta) < 0.45);
      step.classList.toggle("is-near", Math.abs(delta) >= 0.45 && Math.abs(delta) < 1.35);
      step.style.transform = `translate3d(${x}px, 0, 0)`;
      step.style.opacity = Math.abs(delta) > 2.2 ? "0.15" : "";
    });

    section.dataset.scrollDir = index >= lastIndex ? "down" : "up";
    lastIndex = index;
  }

  function updateFromScroll() {
    const { progress, pinned } = getPinMetrics();
    const index = progress * (STEP_COUNT - 1);

    section.classList.toggle("proceso--pinned", pinned);

    applyTimeline(index);

    const nextActive = Math.round(index);
    if (nextActive !== activeIndex) {
      activeIndex = nextActive;
      section.dataset.activeStep = String(activeIndex);
    }
  }

  if (prefersReducedMotionGlobal) {
    applyTimeline(0);
    return;
  }

  applyTimeline(0);
  updateFromScroll();

  window.addEventListener("scroll", updateFromScroll, { passive: true });
  window.addEventListener("resize", updateFromScroll, { passive: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProcesoShowcase);
} else {
  initProcesoShowcase();
}
