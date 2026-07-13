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
      const title = row.querySelector(".projects__row-name");
      const top = (title || row).getBoundingClientRect().top;
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

  if (prefersReducedMotionGlobal) {
    rows.forEach((row) => {
      row.classList.add("is-preview-active");
      const preview = row.querySelector(".projects__row-preview");
      if (preview) preview.setAttribute("aria-hidden", "false");
    });
    return;
  }

  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine) and (min-width: 1024px)"
  ).matches;

  let activeRow = null;
  let hoveredRow = null;
  let rafId = null;
  let switchLocked = false;
  let unlockTimer = null;
  let closeTimer = null;
  let lastScrollY = window.scrollY || 0;
  let scrollDir = 0;

  function setExpanded(row, expanded) {
    const wasActive = row.classList.contains("is-preview-active");
    if (wasActive === expanded) return;

    const preview = row.querySelector(".projects__row-preview");
    const img = row.querySelector(".projects__row-preview-img");
    row.classList.toggle("is-preview-active", expanded);
    if (preview) preview.setAttribute("aria-hidden", expanded ? "false" : "true");
    if (expanded && img) restartGif(img);
  }

  function applyActive(next) {
    if (next === activeRow) return;

    switchLocked = true;
    if (unlockTimer) clearTimeout(unlockTimer);
    unlockTimer = setTimeout(() => {
      switchLocked = false;
      pickActive();
    }, 420);

    if (activeRow && activeRow !== next && activeRow !== hoveredRow) {
      setExpanded(activeRow, false);
    }
    if (next) setExpanded(next, true);
    activeRow = next;
  }

  function pickActive() {
    rafId = null;
    if (switchLocked) return;

    /* Si hay hover en desktop, ese gana y el scroll no lo cierra. */
    if (hoveredRow) {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      applyActive(hoveredRow);
      return;
    }

    const y = window.scrollY || 0;
    scrollDir = y === lastScrollY ? scrollDir : y > lastScrollY ? 1 : -1;
    lastScrollY = y;

    const vh = window.innerHeight;
    const focusY = vh * (scrollDir < 0 ? 0.46 : 0.38);
    const switchGap = scrollDir < 0 ? 120 : 78;
    let best = null;
    let bestDist = Infinity;

    for (const row of rows) {
      const title = row.querySelector(".projects__row-name");
      const rect = (title || row).getBoundingClientRect();
      if (rect.bottom < vh * 0.1 || rect.top > vh * 0.82) continue;
      const mid = rect.top + rect.height * 0.5;
      const dist = Math.abs(mid - focusY);
      if (dist < bestDist) {
        bestDist = dist;
        best = row;
      }
    }

    if (!best) {
      if (!activeRow) return;
      if (closeTimer) return;
      /* Al subir/salir: cierra con un pequeño delay para no cortar el fade. */
      closeTimer = setTimeout(() => {
        closeTimer = null;
        if (!hoveredRow) applyActive(null);
      }, scrollDir < 0 ? 220 : 120);
      return;
    }

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    if (activeRow && activeRow !== best) {
      const activeTitle = activeRow.querySelector(".projects__row-name");
      const activeRect = (activeTitle || activeRow).getBoundingClientRect();
      if (activeRect.bottom > vh * 0.08 && activeRect.top < vh * 0.88) {
        const activeMid = activeRect.top + activeRect.height * 0.5;
        const activeDist = Math.abs(activeMid - focusY);
        if (activeDist - bestDist < switchGap) {
          best = activeRow;
        }
      }
    }

    applyActive(best);
  }

  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(pickActive);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  if (canHover) {
    rows.forEach((row) => {
      row.addEventListener("mouseenter", () => {
        hoveredRow = row;
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        applyActive(row);
      });

      row.addEventListener("mouseleave", () => {
        if (hoveredRow === row) hoveredRow = null;
        /* Vuelve al que indica el scroll, sin cerrar en seco. */
        pickActive();
      });
    });
  }

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
