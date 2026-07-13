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
    sw = stage.clientWidth;

    const trackRect = track.getBoundingClientRect();
    const nextTop = trackRect.top + scrollTop;
    const nextLen = Math.max(track.offsetHeight - stage.offsetHeight, 1);
    if (Math.abs(nextTop - trackTop) > 1 || Math.abs(nextLen - trackLen) > 1) {
      trackTop = nextTop;
      trackLen = nextLen;
    }

    /*
     * Solo activar el scroll de fases cuando la sección ya está “dentro”
     * (track pegado arriba). Antes de entrar, quedarse en la primera fase.
     */
    const pinned = trackRect.top <= 1;
    let progress = 0;
    if (pinned && trackLen > 0) {
      progress = clamp((scrollTop - trackTop) / trackLen, 0, 1);
    }

    /* Hold al entrar: primera fase estable antes de empezar a deslizar */
    const introHold = sw < 900 ? 0.14 : 0.2;
    let currentF;
    if (!pinned || progress <= introHold) {
      currentF = 0;
    } else {
      /* Última fase (Soporte) ocupa menos scroll que el resto */
      const t = (progress - introHold) / (1 - introHold);
      const segments = total - 1;
      const lastWeight = 0.55;
      const weights = Array.from({ length: segments }, (_, i) =>
        i === segments - 1 ? lastWeight : 1
      );
      const sum = weights.reduce((a, b) => a + b, 0);
      const target = t * sum;
      let acc = 0;
      currentF = segments;
      for (let i = 0; i < segments; i += 1) {
        if (target <= acc + weights[i]) {
          currentF = i + (target - acc) / weights[i];
          break;
        }
        acc += weights[i];
      }
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
