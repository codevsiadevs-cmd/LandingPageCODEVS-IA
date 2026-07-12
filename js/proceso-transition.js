/**
 * Transición iris triangular de Cómo trabajamos
 * (misma lógica de scroll que Por qué, con triángulo en vez de círculo).
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function initProcesoTransition() {
  const section = document.getElementById("proceso");
  if (!section) return;

  const transitionEl = section.querySelector("[data-proceso-transition]");
  const iris = section.querySelector("[data-proceso-iris]");
  const transitionCopy = section.querySelector(".proceso__transition-copy");

  if (!transitionEl || !iris) return;

  function paint() {
    const vh = window.innerHeight;
    const tr = transitionEl.getBoundingClientRect();
    const ttotal = tr.height - vh;
    const tp = clamp01(ttotal > 0 ? -tr.top / ttotal : 0);
    const irisProgress = smoothstep(tp);
    iris.style.transform = `scale(${irisProgress})`;

    if (transitionCopy) {
      const headlineFade = tp <= 0.42 ? 1 : clamp01(1 - (tp - 0.42) / 0.38);
      transitionCopy.style.opacity = String(headlineFade);
    }
  }

  if (prefersReducedMotionGlobal) {
    section.classList.add("proceso--static");
    iris.style.transform = "scale(1)";
    if (transitionCopy) transitionCopy.style.opacity = "1";
    return;
  }

  paint();
  window.addEventListener("scroll", paint, { passive: true });
  window.addEventListener("resize", paint, { passive: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProcesoTransition);
} else {
  initProcesoTransition();
}
