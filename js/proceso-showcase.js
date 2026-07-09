import { prefersReducedMotionGlobal } from "./scroll.js";

const STEP_COUNT = 6;
const MOBILE_MQ = window.matchMedia("(max-width: 900px)");

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function ease(t) {
  return t * t * (3 - 2 * t);
}

function getShowcaseFrame(progress) {
  const maxFrame = STEP_COUNT - 1;
  if (!MOBILE_MQ.matches) {
    return progress * maxFrame;
  }

  const step0Hold = 0.1;
  if (progress <= step0Hold) {
    return 0;
  }

  const adjusted = (progress - step0Hold) / (1 - step0Hold);
  const leadEnd = 0.72;
  if (adjusted <= leadEnd) {
    return (adjusted / leadEnd) * (maxFrame - 0.35);
  }

  const tail = (adjusted - leadEnd) / (1 - leadEnd);
  return maxFrame - 0.35 + tail * 0.35;
}

function initProcesoShowcase() {
  const section = document.getElementById("proceso");
  const showcase = section?.querySelector("[data-proceso-showcase]");
  const panels = showcase ? [...showcase.querySelectorAll("[data-proceso-panel]")] : [];
  const counter = showcase?.querySelector("[data-proceso-counter]");

  if (!section || !showcase || panels.length !== STEP_COUNT) return;

  function paint() {
    const vh = window.innerHeight;
    const rect = showcase.getBoundingClientRect();
    const total = rect.height - vh;
    const progress = clamp01(total > 0 ? -rect.top / total : 0);
    const frame = getShowcaseFrame(progress);

    section.classList.toggle("proceso--pinned", rect.top <= 1 && rect.bottom > vh + 1);

    if (counter) {
      counter.textContent = String(
        Math.max(1, Math.min(STEP_COUNT, Math.round(frame) + 1))
      ).padStart(2, "0");
    }

    const txMul = MOBILE_MQ.matches ? 22 : 46;
    const tyMul = MOBILE_MQ.matches ? 24 : 38;
    const rotMul = MOBILE_MQ.matches ? 8 : 16;

    panels.forEach((panel, i) => {
      const d = i - frame;
      const ad = Math.min(Math.abs(d), 1.4);
      const dir = i % 2 === 0 ? 1 : -1;
      const t = ease(clamp01(ad / 1.4));

      let tx = d * txMul * dir;
      let ty = d * -tyMul * dir;
      let rot = d * rotMul * dir;

      if (MOBILE_MQ.matches && Math.abs(d) < 0.65) {
        const legibility = Math.abs(d) / 0.65;
        tx *= legibility;
        ty *= legibility;
        rot *= legibility;
      }

      const scale = 1 - t * (MOBILE_MQ.matches ? 0.26 : 0.34);
      const blur = t * 9;
      const op = clamp01(1 - t * 1.15);
      const z = 600 - Math.round(t * 100);

      panel.style.transform =
        `translate(-50%,-50%) translate(${tx}vw,${ty}vh) rotate(${rot}deg) scale(${scale})`;
      panel.style.opacity = String(op);
      panel.style.filter = `blur(${blur}px)`;
      panel.style.zIndex = String(z);
    });

    const activeStep = Math.round(frame);
    if (section.dataset.activeStep !== String(activeStep)) {
      section.dataset.activeStep = String(activeStep);
    }
  }

  if (prefersReducedMotionGlobal) {
    section.classList.add("proceso--static");
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
  document.addEventListener("DOMContentLoaded", initProcesoShowcase);
} else {
  initProcesoShowcase();
}
