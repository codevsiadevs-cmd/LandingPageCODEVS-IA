import { prefersReducedMotionGlobal } from "./scroll.js";

/**
 * observeOnce — fire ONCE on enter, then unobserve.
 * Conservado solo para casos en los que la clase reveal forma parte del
 * layout permanente (p.ej. .project-card--inview controla el fan-stage:
 * z-index, visibility, transform vía CSS vars; quitarla en cada scroll-out
 * colapsaría el layout). Para el resto, usar observeReveal.
 */
function observeOnce(target, onEnter, options = {}) {
  if (!target) return;
  const obs = new IntersectionObserver(
    (entries, o) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        onEnter(entry);
        o.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12, ...options }
  );
  obs.observe(target);
}

/**
 * observeReveal — bidireccional. Llama onEnter cuando intersecta, onLeave
 * cuando deja de intersectar. NO desuscribe nunca: la animación se replay
 * cada vez que el elemento entra al viewport. Default rootMargin de
 * '0px 0px -80px 0px' garantiza que el reset ocurra cuando el elemento
 * está suficientemente fuera del viewport para que el snap sea invisible.
 */
function observeReveal(target, onEnter, onLeave, options = {}) {
  if (!target) return null;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (onEnter) onEnter(entry);
        } else if (onLeave) {
          onLeave(entry);
        }
      });
    },
    { root: null, rootMargin: "0px 0px -80px 0px", threshold: 0.12, ...options }
  );
  obs.observe(target);
  return obs;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #presentacion — párrafo intro entre hero y stack.
 * ─────────────────────────────────────────────────────────────────────────── */
const heroIntro = document.getElementById("presentacion");
if (heroIntro) {
  if (prefersReducedMotionGlobal) {
    heroIntro.classList.add("hero-intro--visible");
  } else {
    observeReveal(
      heroIntro,
      () => heroIntro.classList.add("hero-intro--visible"),
      () => heroIntro.classList.remove("hero-intro--visible"),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #tecnologias — tech badges cascade left → right (20ms per badge).
 * Bidireccional: la cascada se replay cada vez que la sección entra al
 * viewport. CSS .tech-badge:not(.tech--cascading...) hace transition: none
 * para que el reset al salir sea instantáneo (fuera de cámara).
 * ─────────────────────────────────────────────────────────────────────────── */
{
  const sec = document.getElementById("tecnologias");
  const badges = sec ? sec.querySelectorAll(".tech-badge") : [];
  if (sec && badges.length) {
    badges.forEach((b, i) => {
      const delay = prefersReducedMotionGlobal ? 0 : i * 20;
      b.style.setProperty("--cascade-delay", `${delay}ms`);
    });
    if (prefersReducedMotionGlobal) {
      sec.classList.add("tech--cascading");
    } else {
      observeReveal(
        sec,
        () => sec.classList.add("tech--cascading"),
        () => sec.classList.remove("tech--cascading"),
        { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
      );
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #proyectos — el reveal y la rotación del fan deck viven ahora en
 * js/projects-fan.js (IO bidireccional + scroll-rotation + click-to-center).
 * Aquí ya no hay nada que hacer. La clase --inview quedó deprecada; las
 * cards usan .fan-card--revealed gestionada por projects-fan.js.
 * ─────────────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────────
 * #proceso — typewriter-style left border per step (scaleY 0 → 1, top origin).
 * Bidireccional: cada step se observa por separado y la línea se replay al
 * re-entrar. La línea decorativa global y los dots iluminados se manejan
 * más abajo (lógica preexistente, scroll-progress-based, ya bidireccional).
 * ─────────────────────────────────────────────────────────────────────────── */
{
  const sec = document.getElementById("proceso");
  const steps = sec ? sec.querySelectorAll(".proceso-step") : [];
  if (sec && steps.length) {
    steps.forEach((s, i) => {
      const delay = prefersReducedMotionGlobal ? 0 : i * 120;
      s.style.setProperty("--reveal-delay", `${delay}ms`);
    });
    if (prefersReducedMotionGlobal) {
      steps.forEach((s) => s.classList.add("proceso-step--inview"));
    } else {
      steps.forEach((step) => {
        observeReveal(
          step,
          () => step.classList.add("proceso-step--inview"),
          () => step.classList.remove("proceso-step--inview"),
          { rootMargin: "0px 0px -80px 0px", threshold: 0.12 }
        );
      });
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Stats count-up con requestAnimationFrame (1200ms, easeOutCubic).
 * Cancellable: cada elemento guarda su rAF id en _countRafId (expando) para
 * poder abortarse y reiniciarse cuando la sección sale/vuelve al viewport.
 * resetCountUp(el) pinta '0' (con prefix/suffix) y cancela cualquier frame
 * en vuelo. setStaticValues fija el target final sin animar (reduced-motion).
 * ─────────────────────────────────────────────────────────────────────────── */
function countUpRAF(el, duration = 1200) {
  if (el._countRafId) cancelAnimationFrame(el._countRafId);

  const target = Number(el.dataset.target);
  if (!Number.isFinite(target)) return;
  const prefix = el.dataset.prefix ?? "";
  const suffix = el.dataset.suffix ?? "";
  const start = performance.now();
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const v = target * easeOutCubic(t);
    el.textContent = prefix + Math.round(v) + suffix;
    if (t < 1) {
      el._countRafId = requestAnimationFrame(frame);
    } else {
      el.textContent = prefix + target + suffix;
      el._countRafId = null;
    }
  }
  el._countRafId = requestAnimationFrame(frame);
}

function resetCountUp(el) {
  if (el._countRafId) {
    cancelAnimationFrame(el._countRafId);
    el._countRafId = null;
  }
  const prefix = el.dataset.prefix ?? "";
  const suffix = el.dataset.suffix ?? "";
  el.textContent = prefix + "0" + suffix;
}

function setStaticValues(els) {
  els.forEach((el) => {
    const prefix = el.dataset.prefix ?? "";
    const suffix = el.dataset.suffix ?? "";
    el.textContent = prefix + el.dataset.target + suffix;
  });
}

const techMetricsBlock = document.getElementById("tech-metrics");
const techMetricEls = techMetricsBlock ? techMetricsBlock.querySelectorAll(".tech-metric") : [];
const techValueEls = techMetricsBlock ? techMetricsBlock.querySelectorAll(".tech-metric__value") : [];

if (techMetricsBlock && techMetricEls.length && techValueEls.length) {
  if (prefersReducedMotionGlobal) {
    techMetricEls.forEach((n) => n.classList.add("tech-metric--visible"));
    setStaticValues(techValueEls);
  } else {
    observeReveal(
      techMetricsBlock,
      () => {
        techMetricEls.forEach((n) => n.classList.add("tech-metric--visible"));
        techValueEls.forEach((el) => countUpRAF(el, 1200));
      },
      () => {
        techMetricEls.forEach((n) => n.classList.remove("tech-metric--visible"));
        techValueEls.forEach((el) => resetCountUp(el));
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.18 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #nosotros — visibilidad de columnas + count-up bidireccional. Si la
 * sección sale del viewport, los counters se resetean a 0; al re-entrar,
 * cuentan otra vez desde 0 hasta target.
 * ─────────────────────────────────────────────────────────────────────────── */
const whySection = document.getElementById("nosotros");
if (whySection) {
  const whyStats = whySection.querySelectorAll("[data-target]");

  if (whyStats.length) {
    if (prefersReducedMotionGlobal) {
      setStaticValues(whyStats);
    } else {
      observeReveal(
        whySection,
        () => whyStats.forEach((el) => countUpRAF(el, 1200)),
        () => whyStats.forEach((el) => resetCountUp(el)),
        { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
      );
    }
  }

  if (prefersReducedMotionGlobal) {
    whySection.classList.add("why--visible");
  } else {
    observeReveal(
      whySection,
      () => whySection.classList.add("why--visible"),
      () => whySection.classList.remove("why--visible"),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #testimonios — flip 3D sutil (rotateX 8deg → 0). Bidireccional: cada
 * card se observa por separado y la rotación se replay al re-entrar.
 * ─────────────────────────────────────────────────────────────────────────── */
{
  const sec = document.getElementById("testimonios");
  const cards = sec ? sec.querySelectorAll(".testimonial-card") : [];
  if (sec && cards.length) {
    cards.forEach((c, i) => {
      const delay = prefersReducedMotionGlobal ? 0 : i * 100;
      c.style.setProperty("--reveal-delay", `${delay}ms`);
    });
    if (prefersReducedMotionGlobal) {
      cards.forEach((c) => c.classList.add("testimonial-card--visible"));
    } else {
      cards.forEach((card) => {
        observeReveal(
          card,
          () => card.classList.add("testimonial-card--visible"),
          () => card.classList.remove("testimonial-card--visible"),
          { rootMargin: "0px 0px -80px 0px", threshold: 0.1 }
        );
      });
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Lógica preexistente del proceso (línea decorativa global + dots iluminados).
 * Se mantiene tal cual para no perder el comportamiento por scroll en
 * navegadores sin soporte de view-timeline.
 * ─────────────────────────────────────────────────────────────────────────── */
const procesoSection = document.getElementById("proceso");
const procesoSteps = procesoSection ? procesoSection.querySelectorAll(".proceso-step") : [];

if (procesoSection) {
  const supportsViewTimeline =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("view-timeline-name", "--proceso-line");

  if (!supportsViewTimeline && !prefersReducedMotionGlobal) {
    procesoSection.classList.add("proceso--line-fallback");
    function updateProcesoLineProgress() {
      const r = procesoSection.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = r.height + vh * 0.35;
      const t = (vh * 0.55 - r.top) / Math.max(span * 0.55, 1);
      const p = Math.min(1, Math.max(0, t));
      procesoSection.style.setProperty("--proceso-line-progress", String(1 - p));
    }
    updateProcesoLineProgress();
    window.addEventListener("scroll", updateProcesoLineProgress, { passive: true });
    window.addEventListener("resize", updateProcesoLineProgress, { passive: true });
  }
}

if (procesoSection && procesoSteps.length && !prefersReducedMotionGlobal) {
  const ioThresholds = [0.12, 0.17, 0.22, 0.28, 0.34, 0.4];

  function recalcProcesoStepsLit() {
    const vh = window.innerHeight;
    let maxLit = -1;
    procesoSteps.forEach((step, i) => {
      const dot = step.querySelector(".proceso-step__dot");
      if (!dot) return;
      const r = dot.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      const limit = vh * (0.38 + i * 0.036);
      if (cy < limit) maxLit = Math.max(maxLit, i);
    });
    procesoSteps.forEach((s, i) => s.classList.toggle("proceso-step--lit", i <= maxLit));
  }

  procesoSteps.forEach((step, i) => {
    const tMin = ioThresholds[i] ?? 0.2;
    const thSet = [...new Set([0, 0.05, tMin, 0.35, 0.55, 0.75, 1])].sort((a, b) => a - b);
    const io = new IntersectionObserver(recalcProcesoStepsLit, {
      threshold: thSet,
      rootMargin: `-${10 + i * 3}% 0px -${14 - i}% 0px`,
    });
    io.observe(step);
  });
  window.addEventListener("scroll", recalcProcesoStepsLit, { passive: true });
  recalcProcesoStepsLit();
} else if (procesoSection && procesoSteps.length && prefersReducedMotionGlobal) {
  procesoSteps.forEach((s) => s.classList.add("proceso-step--lit"));
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Footer reveal — bidireccional. Si el usuario scrollea hacia arriba desde
 * el footer y vuelve a bajar, el reveal se replay.
 * ─────────────────────────────────────────────────────────────────────────── */
const footer = document.getElementById("site-footer");
if (footer) {
  if (prefersReducedMotionGlobal) {
    footer.classList.add("footer--visible");
  } else {
    observeReveal(
      footer,
      () => footer.classList.add("footer--visible"),
      () => footer.classList.remove("footer--visible"),
      { rootMargin: "0px 0px -5% 0px", threshold: 0.1 }
    );
  }
}
