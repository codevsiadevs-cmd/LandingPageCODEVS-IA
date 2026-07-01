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
