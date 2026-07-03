const nav = document.getElementById("site-nav");
const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
const navLinksContainer = document.querySelector(".nav__links");
const navIndicator = document.querySelector(".nav-indicator");
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
  "presentacion",
  "tecnologias",
  "proyectos",
  "proceso",
  "nosotros",
  "contacto",
];

/** @type {{ id: string, top: number, bottom: number }[]} */
let sectionRects = [];
let cachedDocMaxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

function getFooterMaxScroll() {
  const footer = document.getElementById("site-footer");
  if (!footer) return null;
  const footerBottom = footer.getBoundingClientRect().bottom + window.scrollY;
  return Math.max(0, footerBottom - window.innerHeight);
}

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
  const docMax = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const footerMax = getFooterMaxScroll();
  cachedDocMaxScroll = footerMax != null ? Math.min(docMax, footerMax) : docMax;
}

function clampScrollToPageEnd() {
  if (window.scrollY <= cachedDocMaxScroll + 1) return;
  window.scrollTo(0, cachedDocMaxScroll);
}

function handleWheelScrollBoundary(event) {
  const maxY = cachedDocMaxScroll;
  const y = window.scrollY;
  if (y >= maxY - 1 && event.deltaY > 0) {
    event.preventDefault();
    if (y > maxY) window.scrollTo(0, maxY);
    return;
  }
  if (y <= 0 && event.deltaY < 0) {
    event.preventDefault();
  }
}

recalcSectionRects();

if (typeof ResizeObserver !== "undefined") {
  const layoutRo = new ResizeObserver(() => recalcSectionRects());
  layoutRo.observe(document.body);
  const footer = document.getElementById("site-footer");
  if (footer) layoutRo.observe(footer);
}
window.addEventListener("load", recalcSectionRects);
window.addEventListener("resize", recalcSectionRects, { passive: true });
window.addEventListener(
  "wheel",
  handleWheelScrollBoundary,
  { passive: false }
);

/**
 * Posiciona la pildorita .nav-indicator debajo del link activo.
 * Lee offsetLeft/offsetWidth (sin forzar reflow extra: ya estamos dentro del
 * mismo frame que actualiza .nav__link--active) y aplica left/width inline.
 */
function updateNavIndicator() {
  if (!navIndicator || !navLinksContainer) return;
  const activeLink = navLinksContainer.querySelector("a.nav__link--active");
  if (!activeLink) {
    navIndicator.classList.remove("nav-indicator--active");
    navIndicator.style.width = "0px";
    return;
  }
  const left = activeLink.offsetLeft;
  const width = activeLink.offsetWidth;
  navIndicator.style.left = `${left}px`;
  navIndicator.style.width = `${width}px`;
  navIndicator.classList.add("nav-indicator--active");
}

window.addEventListener("resize", updateNavIndicator, { passive: true });
window.addEventListener("load", updateNavIndicator);

export function updateGlobalScrollEffects() {
  clampScrollToPageEnd();
  latestScrollY = window.scrollY;
  nav.classList.toggle("nav--scrolled", latestScrollY > 50);
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

  /*
   * Detección robusta de la sección activa.
   *
   * Antes usábamos un test de “sección que cruza el tercio superior”, que
   * fallaba para las secciones cortas del final (#nosotros, #contacto,
   * #contacto): cuando alguna no llegaba a tapar el threshold, la barra se
   * quedaba mostrando #proceso. Ahora elegimos la sección con mayor área
   * visible dentro del viewport y forzamos #contacto cuando el usuario llega
   * al fondo del documento (margen de 80px), para que la última sección
   * siempre quede marcada aunque mida menos que la ventana.
   *
   * Trabajamos con `sectionRects` (offsetTop/Height en coords de documento)
   * para no provocar reflows extra: traducimos a coords de viewport restando
   * `latestScrollY`.
   */
  let currentSection = "inicio";
  const vh = window.innerHeight;
  const isNearDocumentBottom = latestScrollY >= cachedDocMaxScroll - 80;

  if (isNearDocumentBottom) {
    currentSection = "contacto";
  } else {
    let maxVisibility = 0;
    for (let i = 0; i < sectionRects.length; i += 1) {
      const r = sectionRects[i];
      const visibleTop = Math.max(0, r.top - latestScrollY);
      const visibleBottom = Math.min(vh, r.bottom - latestScrollY);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      if (visibleHeight > maxVisibility) {
        maxVisibility = visibleHeight;
        currentSection = r.id;
      }
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
    const navSection = currentSection === "presentacion" ? "inicio" : currentSection;
    navLinks.forEach((link) => {
      const id = link.getAttribute("href")?.slice(1);
      link.classList.toggle("nav__link--active", id === navSection);
    });
    updateNavIndicator();
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
