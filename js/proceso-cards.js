/**
 * Cómo Trabajamos — fases a pantalla completa, una a una en horizontal.
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function initProcesoPhases() {
  const root = document.getElementById("proceso");
  const track = root?.querySelector("[data-proceso-track]") || root;
  const stage = root?.querySelector("[data-proceso-stage]");
  if (!root || !stage || !track) return;

  const phases = [...stage.querySelectorAll("[data-proceso-phase]")];
  const liveEl = stage.querySelector(".proceso__live");
  const counterEl = stage.querySelector("[data-proceso-counter]");
  const total = phases.length;
  if (!total) return;

  track.style.setProperty("--proceso-steps", String(total));
  root.style.setProperty("--proceso-steps", String(total));

  const names = phases.map((phase) => {
    const title = phase.querySelector("[data-proceso-title]");
    return title?.textContent?.trim() || phase.dataset.procesoTitle || "";
  });

  let trackTop = 0;
  let trackLen = 1;
  let sw = 1;
  let lastIdx = -1;

  function measure() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    trackTop = track.getBoundingClientRect().top + scrollTop;
    trackLen = Math.max(track.offsetHeight - stage.offsetHeight, 1);
    sw = stage.clientWidth;
  }

  function announce(idx) {
    if (!liveEl || idx === lastIdx) return;
    lastIdx = idx;
    const title = names[idx] || "";
    liveEl.textContent = title
      ? `Fase ${String(idx + 1).padStart(2, "0")} de ${String(total).padStart(2, "0")}: ${title}`
      : `Fase ${idx + 1} de ${total}`;
  }

  function paint() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;

    if (sw < 900) {
      const nextTop = track.getBoundingClientRect().top + scrollTop;
      const nextLen = Math.max(track.offsetHeight - stage.offsetHeight, 1);
      if (Math.abs(nextTop - trackTop) > 1 || Math.abs(nextLen - trackLen) > 1) {
        trackTop = nextTop;
        trackLen = nextLen;
      }
    }

    let progress = trackLen > 0 ? (scrollTop - trackTop) / trackLen : 0;
    progress = clamp(progress, 0, 1);

    const introHold = sw < 900 ? 0.04 : 0.08;
    let currentF;
    if (progress <= introHold) {
      currentF = 0;
    } else {
      currentF = ((progress - introHold) / (1 - introHold)) * (total - 1);
    }

    phases.forEach((el, i) => {
      const a = i - currentF;
      const abs = Math.abs(a);
      const x = a * 110;
      const opacity =
        abs < 0.05 ? 1 : abs >= 1 ? 0 : clamp(1 - abs * 1.05, 0, 1);
      const blur = prefersReducedMotionGlobal ? 0 : Math.min(12, abs * 8);

      el.style.transform = `translate(calc(-50% + ${x.toFixed(2)}%), -50%)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : "none";
      el.style.zIndex = String(Math.round(100 - abs * 10));
    });

    const idx = clamp(Math.round(currentF), 0, total - 1);
    if (counterEl) {
      counterEl.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    }
    announce(idx);
  }

  function tick() {
    paint();
    requestAnimationFrame(tick);
  }

  if (prefersReducedMotionGlobal) {
    root.classList.add("proceso--static");
    phases.forEach((el) => {
      el.style.transform = "none";
      el.style.opacity = "1";
      el.style.filter = "none";
    });
    if (counterEl) counterEl.hidden = true;
    return;
  }

  window.addEventListener(
    "resize",
    () => {
      measure();
      paint();
    },
    { passive: true }
  );
  window.visualViewport?.addEventListener(
    "resize",
    () => {
      measure();
      paint();
    },
    { passive: true }
  );

  measure();
  tick();
}

initProcesoPhases();
