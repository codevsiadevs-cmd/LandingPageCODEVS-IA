const nav = document.getElementById("site-nav");
const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
const heroDots = document.querySelector(".hero__bg-dots");
const scrollProgress = document.getElementById("scroll-progress");

export const prefersReducedMotionGlobal = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isMobileBg = window.matchMedia("(max-width: 768px)").matches;
const supportsScrollTimeline =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("animation-timeline: scroll()");

/** Mutable state shared with three-scene (ES modules: imported bindings cannot be reassigned). */
export const sceneMotion = {
  scrollSpinBoost: 0,
  sharedPulse: 0,
};

export let latestScrollY = window.scrollY;
export let previousScrollY = latestScrollY;
export let sharedScrollVelocity = 0;

/**
 * Cache reactivo de --section-factor: lo refrescamos sólo cuando cambia
 * `body.data-section` (vía MutationObserver) en vez de leerlo con
 * getComputedStyle dentro del loop de animación.
 */
export let sectionFactor = 1;

function refreshSectionFactor() {
  const raw = Number(getComputedStyle(document.body).getPropertyValue("--section-factor"));
  sectionFactor = Number.isFinite(raw) && raw > 0 ? raw : 1;
}

refreshSectionFactor();

if (typeof MutationObserver !== "undefined") {
  const sectionFactorMo = new MutationObserver(refreshSectionFactor);
  sectionFactorMo.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-section"],
  });
}

/**
 * Cache de geometría de las secciones en coordenadas del documento (offsetTop/offsetHeight),
 * que NO cambian al hacer scroll. Sólo se recalculan cuando el layout cambia
 * (resize, font/img load, contenido), vía ResizeObserver y `load`.
 */
const SECTION_IDS = [
  "inicio",
  "servicios",
  "tecnologias",
  "proyectos",
  "proceso",
  "contacto",
];

/** @type {{ id: string, top: number, bottom: number }[]} */
let sectionRects = [];
let cachedDocMaxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

function recalcSectionRects() {
  const next = [];
  for (let i = 0; i < SECTION_IDS.length; i += 1) {
    const el = document.getElementById(SECTION_IDS[i]);
    if (!el) continue;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    next.push({ id: SECTION_IDS[i], top, bottom });
  }
  sectionRects = next;
  cachedDocMaxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
}

recalcSectionRects();

if (typeof ResizeObserver !== "undefined") {
  const layoutRo = new ResizeObserver(() => recalcSectionRects());
  layoutRo.observe(document.body);
}
window.addEventListener("load", recalcSectionRects);
window.addEventListener("resize", recalcSectionRects, { passive: true });

export function updateGlobalScrollEffects() {
  latestScrollY = window.scrollY;
  nav.classList.toggle("nav--scrolled", latestScrollY > 80);
  sharedScrollVelocity = latestScrollY - previousScrollY;

  if (!prefersReducedMotionGlobal) {
    if (heroDots) {
      heroDots.style.setProperty("--hero-dots-parallax", `${latestScrollY * 0.3}px`);
    }
    const deltaY = latestScrollY - previousScrollY;
    sceneMotion.scrollSpinBoost = Math.min(
      sceneMotion.scrollSpinBoost + Math.abs(deltaY) * 0.0038,
      1.6
    );
  }
  previousScrollY = latestScrollY;

  let currentSection = "inicio";
  const vh = window.innerHeight;
  for (let i = 0; i < sectionRects.length; i += 1) {
    const r = sectionRects[i];
    const vpTop = r.top - latestScrollY;
    const vpBottom = r.bottom - latestScrollY;
    if (vpTop <= vh * 0.45 && vpBottom >= vh * 0.35) {
      currentSection = r.id;
      break;
    }
  }
  if (document.body.dataset.section !== currentSection) {
    document.body.dataset.section = currentSection;
  }

  const maxScroll = cachedDocMaxScroll;
  const progress = Math.min(Math.max(latestScrollY / maxScroll, 0), 1);
  const edgeBoost = Math.abs(progress - 0.5) * 2;
  document.body.style.setProperty("--vignette-boost", (edgeBoost * 0.12).toFixed(3));

  if (scrollProgress && !supportsScrollTimeline) {
    const p = Math.min(Math.max(latestScrollY / maxScroll, 0), 1);
    scrollProgress.style.transform = `scaleX(${p})`;
  }

  if (navLinks.length) {
    navLinks.forEach((link) => {
      const id = link.getAttribute("href")?.slice(1);
      link.classList.toggle("nav__link--active", id === currentSection);
    });
  }
}

/**
 * rAF-coalesced scroll listener: agrupa múltiples eventos `scroll` en un único
 * tick por frame para evitar re-leer y re-pintar más de una vez por frame.
 */
let scrollRafPending = false;
window.addEventListener(
  "scroll",
  () => {
    if (scrollRafPending) return;
    scrollRafPending = true;
    requestAnimationFrame(() => {
      updateGlobalScrollEffects();
      scrollRafPending = false;
    });
  },
  { passive: true }
);
