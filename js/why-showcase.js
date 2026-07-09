import { prefersReducedMotionGlobal } from "./scroll.js";

const ZOOM_DEPTH = 3.4;
const STEP_COUNT = 5;

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function initWhyShowcase() {
  const section = document.getElementById("nosotros");
  if (!section) return;

  const transitionEl = section.querySelector("[data-why-transition]");
  const iris = section.querySelector("[data-why-iris]");
  const transitionCopy = section.querySelector(".why__transition-copy");
  const transitionPin = section.querySelector(".why__transition-pin");
  const showcase = section.querySelector("[data-why-showcase]");
  const slider = showcase?.querySelector(".why__slider");
  const panels = showcase ? [...showcase.querySelectorAll("[data-why-panel]")] : [];
  const counter = showcase?.querySelector("[data-why-counter]");

  if (!showcase || panels.length !== STEP_COUNT) return;

  function paint() {
    const vh = window.innerHeight;

    if (transitionEl && iris) {
      const tr = transitionEl.getBoundingClientRect();
      const ttotal = tr.height - vh;
      const tp = clamp01(ttotal > 0 ? -tr.top / ttotal : 0);
      const irisProgress = smoothstep(tp);
      iris.style.transform = `scale(${irisProgress})`;

      if (transitionCopy) {
        const headlineFade = tp <= 0.42 ? 1 : clamp01(1 - (tp - 0.42) / 0.38);
        transitionCopy.style.opacity = String(headlineFade);
      }

      if (transitionPin) {
        transitionPin.style.setProperty("--why-entry-fade", String(Math.min(tp * 2.2, 1)));
      }
    }

    const rect = showcase.getBoundingClientRect();
    const total = rect.height - vh;
    const progress = clamp01(total > 0 ? -rect.top / total : 0);
    const frame = progress * (STEP_COUNT - 1);

    section.classList.toggle("why--pinned", rect.top <= 1 && rect.bottom > vh + 1);

    if (counter) {
      counter.textContent = String(
        Math.max(1, Math.min(STEP_COUNT, Math.round(frame) + 1))
      ).padStart(2, "0");
    }

    panels.forEach((panel, i) => {
      const delta = i - frame;
      const absDelta = Math.abs(delta);
      const scale = Math.pow(ZOOM_DEPTH, -delta);
      const opacity = delta >= 0 ? clamp01(1 - delta * 0.7) : clamp01(1 + delta * 3);
      const blur = Math.min(16, absDelta * 8);
      const z = 1000 - Math.round(absDelta * 12);

      panel.style.transform = `translate(-50%, -50%) scale(${scale})`;
      panel.style.opacity = String(opacity);
      panel.style.filter = `blur(${blur}px)`;
      panel.style.zIndex = String(z);
    });

    const activeItem = Math.round(frame);
    if (section.dataset.activeItem !== String(activeItem)) {
      section.dataset.activeItem = String(activeItem);
    }

    if (slider) {
      const exitStart = 0.84;
      const exitFade = progress > exitStart
        ? clamp01(1 - (progress - exitStart) / (1 - exitStart))
        : 1;
      slider.style.opacity = String(exitFade);
    }
  }

  if (prefersReducedMotionGlobal) {
    section.classList.add("why--static");
    if (iris) iris.style.transform = "scale(1)";
    if (transitionCopy) transitionCopy.style.opacity = "1";
    if (transitionPin) transitionPin.style.setProperty("--why-entry-fade", "0");
    if (slider) slider.style.opacity = "1";
    if (counter) counter.textContent = "01";
    panels.forEach((panel) => {
      panel.style.transform = "";
      panel.style.opacity = "";
      panel.style.filter = "";
      panel.style.zIndex = "";
    });
    return;
  }

  paint();
  window.addEventListener("scroll", paint, { passive: true });
  window.addEventListener("resize", paint, { passive: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWhyShowcase);
} else {
  initWhyShowcase();
}
