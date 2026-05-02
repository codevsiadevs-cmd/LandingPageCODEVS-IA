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

  const sections = [
    "inicio",
    "servicios",
    "tecnologias",
    "proyectos",
    "proceso",
    "contacto",
  ];
  let currentSection = "inicio";
  for (let i = 0; i < sections.length; i += 1) {
    const sec = document.getElementById(sections[i]);
    if (!sec) continue;
    const r = sec.getBoundingClientRect();
    if (r.top <= window.innerHeight * 0.45 && r.bottom >= window.innerHeight * 0.35) {
      currentSection = sections[i];
      break;
    }
  }
  document.body.dataset.section = currentSection;

  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
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

window.addEventListener("scroll", updateGlobalScrollEffects, { passive: true });
