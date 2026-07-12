/**
 * Cómo Trabajamos — stack sticky con scroll (port del DC de referencia).
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function initProcesoCards() {
  const root = document.getElementById("proceso");
  const track = root?.querySelector("[data-proceso-track]") || root;
  const stage = root?.querySelector("[data-proceso-stage]");
  if (!root || !stage || !track) return;

  const cardsLayer = stage.querySelector("[data-proceso-cards-layer]");
  const cards = [...stage.querySelectorAll("[data-proceso-card]")];
  const liveEl = stage.querySelector(".proceso__live");
  const total = cards.length;
  if (!total) return;

  track.style.setProperty("--proceso-steps", String(total));
  root.style.setProperty("--proceso-steps", String(total));

  const names = cards.map((card) => {
    const title = card.querySelector("[data-proceso-title]");
    return title?.textContent?.trim() || card.dataset.procesoTitle || "";
  });

  let mx = 0;
  let my = 0;
  let cx = 0;
  let cy = 0;
  let trackTop = 0;
  let trackLen = 1;
  let sw = 1;
  let sh = 1;
  let raf = 0;
  let lastIdx = -1;

  function measure() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    trackTop = track.getBoundingClientRect().top + scrollTop;
    trackLen = Math.max(track.offsetHeight - stage.offsetHeight, 1);
    sw = stage.clientWidth;
    sh = stage.clientHeight;
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
    /* Remedir en móvil: la barra del navegador cambia svh/vh al scrollear */
    if (sw < 900) {
      const nextTop = track.getBoundingClientRect().top + scrollTop;
      const nextLen = Math.max(track.offsetHeight - stage.offsetHeight, 1);
      if (Math.abs(nextTop - trackTop) > 1 || Math.abs(nextLen - trackLen) > 1) {
        trackTop = nextTop;
        trackLen = nextLen;
        sh = stage.clientHeight;
      }
    }

    let progress = trackLen > 0 ? (scrollTop - trackTop) / trackLen : 0;
    progress = clamp(progress, 0, 1);

    /* Hold breve; en móvil más corto para alcanzar todas las fases */
    const introHold = sw < 900 ? 0.04 : 0.1;
    let currentF;
    if (progress <= introHold) {
      currentF = 0;
    } else {
      currentF = ((progress - introHold) / (1 - introHold)) * (total - 1);
    }

    const parallaxOn = !prefersReducedMotionGlobal;

    cx += ((parallaxOn ? mx : 0) - cx) * 0.06;
    cy += ((parallaxOn ? my : 0) - cy) * 0.06;

    if (cardsLayer) {
      cardsLayer.style.transform = `translate3d(${(-cx * 20).toFixed(2)}px, ${(-cy * 20).toFixed(2)}px, 0)`;
    }

    cards.forEach((el, i) => {
      const a = i - currentF;
      const aa = Math.abs(a);
      const isMobile = sw < 900;
      const focalY = isMobile ? 40 : 44;
      /* En móvil se centra; en desktop se abre a la derecha */
      const focalX = isMobile ? 50 : 70;
      const Y = a >= 0 ? focalY + 24 * (1 - 1 / (1 + a)) : focalY - 55 * -a;
      const focalPull = Math.max(0, 1 - aa);
      const scatter = 13 * Math.sin(a * 1.9 + i * 0.6);
      const X = focalX + scatter * (1 - focalPull);
      let scale =
        a >= 0 ? clamp(1 - 0.22 * a, 0.4, 1) : clamp(1 - 0.05 * -a, 0.72, 1);
      const rot = 6 * Math.sin(a * 1.3 + i * 0.9);
      let opacity =
        a >= 0 ? clamp(1 - 0.55 * a, 0.05, 1) : clamp(1 + 1.35 * a, 0, 1);

      /* Tarjeta activa más grande y nítida */
      if (aa < 0.35) {
        const boost = 1 - aa / 0.35;
        scale = clamp(scale + 0.08 * boost, 0.4, 1.08);
        opacity = Math.max(opacity, 0.92 + 0.08 * boost);
      }

      /* En móvil, la tarjeta activa queda un poco más compacta */
      if (isMobile) {
        scale *= 0.95;
      }

      const dx = ((X - 50) / 100) * sw;
      const dy = ((Y - 50) / 100) * sh;

      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = String(Math.round(200 - aa * 24));
      el.style.pointerEvents = aa < 0.5 ? "auto" : "none";
    });

    const idx = clamp(Math.round(currentF), 0, total - 1);
    announce(idx);
  }

  function tick() {
    paint();
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener(
    "mousemove",
    (event) => {
      mx = event.clientX / window.innerWidth - 0.5;
      my = event.clientY / window.innerHeight - 0.5;
    },
    { passive: true }
  );
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

initProcesoCards();
