import { prefersReducedMotionGlobal } from "./scroll.js";

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function initProjectsReveal() {
  const section = document.querySelector(".projects");
  const rows = section ? [...section.querySelectorAll("[data-projects-row]")] : [];
  if (!rows.length) return;

  if (prefersReducedMotionGlobal) {
    rows.forEach((row) => row.style.setProperty("--p", "1"));
    return;
  }

  let rafId = null;

  function tick() {
    rafId = null;
    const vh = window.innerHeight;
    const start = vh * 0.9;
    const end = vh * 0.42;

    rows.forEach((row) => {
      const top = row.getBoundingClientRect().top;
      const raw = clamp01((start - top) / (start - end));
      row.style.setProperty("--p", easeInOutCubic(raw).toFixed(4));
    });
  }

  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  tick();
}

function restartGif(img) {
  const src = img.getAttribute("src");
  if (!src) return;
  img.src = "";
  img.src = src;
}

function initProjectsPreview() {
  const section = document.querySelector(".projects");
  if (!section) return;

  const rows = [...section.querySelectorAll("[data-projects-row]")];
  if (!rows.length) return;

  function setExpanded(row, expanded) {
    const wasActive = row.classList.contains("is-preview-active");
    if (wasActive === expanded) return;

    const preview = row.querySelector(".projects__row-preview");
    const img = row.querySelector(".projects__row-preview-img");
    row.classList.toggle("is-preview-active", expanded);
    if (preview) preview.setAttribute("aria-hidden", expanded ? "false" : "true");
    if (expanded && img) restartGif(img);
  }

  /* Desktop + móvil: al bajar, cada solución se abre sola
   * (descripción + GIF debajo). Solo una activa a la vez. */
  let activeRow = null;
  let rafId = null;
  const SWITCH_GAP = 72;

  function pickActive() {
    rafId = null;
    const vh = window.innerHeight;
    const focusY = vh * 0.42;
    let best = null;
    let bestDist = Infinity;

    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (rect.bottom < vh * 0.08 || rect.top > vh * 0.92) continue;
      const anchor = rect.top + Math.min(rect.height * 0.25, 80);
      const dist = Math.abs(anchor - focusY);
      if (dist < bestDist) {
        bestDist = dist;
        best = row;
      }
    }

    if (!best) {
      if (activeRow) {
        setExpanded(activeRow, false);
        activeRow = null;
      }
      return;
    }

    if (activeRow && activeRow !== best) {
      const activeRect = activeRow.getBoundingClientRect();
      if (activeRect.bottom > vh * 0.1 && activeRect.top < vh * 0.9) {
        const activeAnchor = activeRect.top + Math.min(activeRect.height * 0.25, 80);
        const activeDist = Math.abs(activeAnchor - focusY);
        if (activeDist - bestDist < SWITCH_GAP) {
          best = activeRow;
        }
      }
    }

    if (best === activeRow) return;

    if (activeRow) setExpanded(activeRow, false);
    setExpanded(best, true);
    activeRow = best;
  }

  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(pickActive);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  pickActive();

  if ("IntersectionObserver" in window) {
    const imgs = rows
      .map((row) => row.querySelector(".projects__row-preview-img"))
      .filter(Boolean);

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        imgs.forEach((img) => {
          const preload = new Image();
          preload.src = img.getAttribute("src");
        });
        preloadObserver.disconnect();
      },
      { rootMargin: "240px" }
    );
    preloadObserver.observe(section);
  }
}

function initProjects() {
  initProjectsReveal();
  initProjectsPreview();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjects);
} else {
  initProjects();
}
