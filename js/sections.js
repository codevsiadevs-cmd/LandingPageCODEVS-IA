const servicesSection = document.getElementById("servicios");
const serviceCards = document.querySelectorAll(".services__card");
if (servicesSection && serviceCards.length) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        serviceCards.forEach((card) => card.classList.add("services__card--visible"));
        obs.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  revealObserver.observe(servicesSection);
}

const techMetricsBlock = document.getElementById("tech-metrics");
const techMetricEls = document.querySelectorAll(".tech-metric");
const techValueEls = techMetricsBlock
  ? techMetricsBlock.querySelectorAll(".tech-metric__value")
  : [];

function runCounterWithInterval(el) {
  const target = Number(el.dataset.target);
  if (Number.isNaN(target)) return;
  const prefix = el.dataset.prefix ?? "";
  const suffix = el.dataset.suffix ?? "";
  const duration = 1700;
  const steps = 48;
  const stepMs = Math.max(16, Math.floor(duration / steps));
  let current = 0;
  const increment = target / steps;
  const id = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(id);
    }
    el.textContent = prefix + Math.round(current) + suffix;
  }, stepMs);
}

if (techMetricsBlock && techMetricEls.length && techValueEls.length) {
  let techMetricsActivated = false;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const activateTechMetrics = () => {
    techMetricEls.forEach((node) => node.classList.add("tech-metric--visible"));
    if (prefersReducedMotion) {
      techValueEls.forEach((el) => {
        const prefix = el.dataset.prefix ?? "";
        const suffix = el.dataset.suffix ?? "";
        el.textContent = prefix + el.dataset.target + suffix;
      });
    } else {
      techValueEls.forEach((el) => runCounterWithInterval(el));
    }
  };

  const techMetricsObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || techMetricsActivated) return;
        techMetricsActivated = true;
        activateTechMetrics();
        obs.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.18 }
  );
  techMetricsObserver.observe(techMetricsBlock);
}

const projectsSection = document.getElementById("proyectos");
const projectCards = projectsSection
  ? projectsSection.querySelectorAll(".project-card")
  : [];
if (projectsSection && projectCards.length) {
  const projectsReveal = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        projectCards.forEach((card) => card.classList.add("project-card--inview"));
        obs.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
  );
  projectsReveal.observe(projectsSection);
}

const procesoSection = document.getElementById("proceso");
const procesoSteps = procesoSection ? procesoSection.querySelectorAll(".proceso-step") : [];
const prefersReducedMotionProceso = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (procesoSection) {
  const supportsViewTimeline =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("view-timeline-name", "--proceso-line");

  if (!supportsViewTimeline && !prefersReducedMotionProceso) {
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

if (procesoSection && procesoSteps.length && !prefersReducedMotionProceso) {
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
} else if (procesoSection && procesoSteps.length && prefersReducedMotionProceso) {
  procesoSteps.forEach((s) => s.classList.add("proceso-step--lit"));
}

const whySection = document.getElementById("nosotros");
if (whySection) {
  const whyReveal = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        whySection.classList.add("why--visible");
        obs.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );
  whyReveal.observe(whySection);
}

const testimonialsSection = document.getElementById("testimonios");
const testimonialCards = testimonialsSection
  ? testimonialsSection.querySelectorAll(".testimonial-card")
  : [];
if (testimonialsSection && testimonialCards.length) {
  const testimonialsReveal = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        testimonialCards.forEach((card) => card.classList.add("testimonial-card--visible"));
        obs.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  testimonialsReveal.observe(testimonialsSection);
}

const footer = document.getElementById("site-footer");
if (footer) {
  const footerObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        footer.classList.add("footer--visible");
        obs.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -5% 0px", threshold: 0.1 }
  );
  footerObserver.observe(footer);
}
