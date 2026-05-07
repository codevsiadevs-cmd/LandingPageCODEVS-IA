import { prefersReducedMotionGlobal } from "./scroll.js";

/**
 * Helper: observe an element once with IntersectionObserver, then unobserve.
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

/* ─────────────────────────────────────────────────────────────────────────────
 * #servicios — cards staggered from bottom (80ms per card)
 * Reuses the existing servicesCardReveal keyframe (already supports
 * --reveal-delay) and the .services__card--visible trigger class.
 * ─────────────────────────────────────────────────────────────────────────── */
{
  const sec = document.getElementById("servicios");
  const cards = sec ? sec.querySelectorAll(".services__card") : [];
  if (sec && cards.length) {
    cards.forEach((card, i) => {
      const delay = prefersReducedMotionGlobal ? 0 : i * 80;
      card.style.setProperty("--reveal-delay", `${delay}ms`);
    });
    observeOnce(sec, () => {
      cards.forEach((c) => c.classList.add("services__card--visible"));
    });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #tecnologias — tech badges cascade left → right (20ms per badge).
 * El marquee infinito vive en el track padre; aquí solo animamos cada badge
 * desde translateX(-20px) opacity:0 a su estado normal una sola vez.
 * ─────────────────────────────────────────────────────────────────────────── */
{
  const sec = document.getElementById("tecnologias");
  const badges = sec ? sec.querySelectorAll(".tech-badge") : [];
  if (sec && badges.length) {
    badges.forEach((b, i) => {
      const delay = prefersReducedMotionGlobal ? 0 : i * 20;
      b.style.setProperty("--cascade-delay", `${delay}ms`);
    });
    observeOnce(
      sec,
      () => {
        sec.classList.add("tech--cascading");
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #proyectos — fade in from sides with 120ms stagger.
 * Odd → translateX(-30px), Even → translateX(30px). Implementado vía CSS
 * variable --reveal-x que se compone con la transformación final del fan-stage
 * (translateX(-50%) ...) sin romper el layout.
 * ─────────────────────────────────────────────────────────────────────────── */
{
  const sec = document.getElementById("proyectos");
  const cards = sec ? sec.querySelectorAll(".project-card") : [];
  if (sec && cards.length) {
    cards.forEach((c, i) => {
      const delay = prefersReducedMotionGlobal ? 0 : i * 120;
      c.style.setProperty("--reveal-delay", `${delay}ms`);
      const offset = prefersReducedMotionGlobal ? "0px" : i % 2 === 0 ? "-30px" : "30px";
      c.style.setProperty("--reveal-x", offset);
    });
    observeOnce(
      sec,
      () => {
        cards.forEach((c) => c.classList.add("project-card--inview"));
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #proceso — typewriter-style left border per step (scaleY 0 → 1, top origin).
 * Stagger 120ms por paso. La línea decorativa global (proceso-line-svg) y los
 * dots iluminados se manejan más abajo (lógica preexistente).
 * ─────────────────────────────────────────────────────────────────────────── */
{
  const sec = document.getElementById("proceso");
  const steps = sec ? sec.querySelectorAll(".proceso-step") : [];
  if (sec && steps.length) {
    steps.forEach((s, i) => {
      const delay = prefersReducedMotionGlobal ? 0 : i * 120;
      s.style.setProperty("--reveal-delay", `${delay}ms`);
    });
    observeOnce(
      sec,
      () => {
        steps.forEach((s) => s.classList.add("proceso-step--inview"));
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Stats count-up con requestAnimationFrame (1200ms, easeOutCubic).
 * Reemplaza al setInterval anterior. Se aplica a:
 *   • .tech-metric__value (sección #tecnologias / #tech-metrics)
 *   • cualquier [data-target] dentro de #nosotros (futuro-friendly)
 * ─────────────────────────────────────────────────────────────────────────── */
function countUpRAF(el, duration = 1200) {
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
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = prefix + target + suffix;
  }
  requestAnimationFrame(frame);
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
  let activated = false;
  const activate = () => {
    techMetricEls.forEach((n) => n.classList.add("tech-metric--visible"));
    if (prefersReducedMotionGlobal) {
      setStaticValues(techValueEls);
    } else {
      techValueEls.forEach((el) => countUpRAF(el, 1200));
    }
  };
  const obs = new IntersectionObserver(
    (entries, o) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || activated) return;
        activated = true;
        activate();
        o.unobserve(e.target);
      });
    },
    { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.18 }
  );
  obs.observe(techMetricsBlock);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #nosotros — visibilidad + count-up de cualquier [data-target] que se añada
 * en el futuro. Hoy la sección no tiene contadores, pero el observer queda
 * cableado para no requerir cambios cuando se incorporen.
 * ─────────────────────────────────────────────────────────────────────────── */
const whySection = document.getElementById("nosotros");
if (whySection) {
  const whyStats = whySection.querySelectorAll("[data-target]");
  if (whyStats.length) {
    let done = false;
    const obs = new IntersectionObserver(
      (entries, o) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || done) return;
          done = true;
          if (prefersReducedMotionGlobal) {
            setStaticValues(whyStats);
          } else {
            whyStats.forEach((el) => countUpRAF(el, 1200));
          }
          o.unobserve(e.target);
        });
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );
    obs.observe(whySection);
  }
  observeOnce(
    whySection,
    () => whySection.classList.add("why--visible"),
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * #testimonios — flip 3D sutil (rotateX 8deg → 0). El contenedor
 * .testimonials__grid lleva perspective: 800px (definido en layout.css).
 * Stagger 100ms por tarjeta para suavizar la entrada en cascada.
 * ─────────────────────────────────────────────────────────────────────────── */
{
  const sec = document.getElementById("testimonios");
  const cards = sec ? sec.querySelectorAll(".testimonial-card") : [];
  if (sec && cards.length) {
    cards.forEach((c, i) => {
      const delay = prefersReducedMotionGlobal ? 0 : i * 100;
      c.style.setProperty("--reveal-delay", `${delay}ms`);
    });
    observeOnce(
      sec,
      () => {
        cards.forEach((c) => c.classList.add("testimonial-card--visible"));
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
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
 * Footer reveal (sin cambios).
 * ─────────────────────────────────────────────────────────────────────────── */
const footer = document.getElementById("site-footer");
if (footer) {
  observeOnce(
    footer,
    () => footer.classList.add("footer--visible"),
    { rootMargin: "0px 0px -5% 0px", threshold: 0.1 }
  );
}
