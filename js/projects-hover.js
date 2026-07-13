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
    /* Mismo efecto para todas (como Páginas Web). */
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

  let activeRow = null;

  function setExpanded(row, expanded) {
    const wasActive = row.classList.contains("is-preview-active");
    if (wasActive === expanded) return;

    const preview = row.querySelector(".projects__row-preview");
    const img = row.querySelector(".projects__row-preview-img");
    row.classList.toggle("is-preview-active", expanded);
    row.setAttribute("aria-expanded", expanded ? "true" : "false");
    if (preview) preview.setAttribute("aria-hidden", expanded ? "false" : "true");
    if (expanded && img) restartGif(img);
  }

  function toggleRow(row) {
    if (activeRow === row) {
      setExpanded(row, false);
      activeRow = null;
      return;
    }

    if (activeRow) setExpanded(activeRow, false);
    setExpanded(row, true);
    activeRow = row;
  }

  rows.forEach((row) => {
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-expanded", "false");
    row.classList.add("is-interactive");

    row.addEventListener("click", () => {
      toggleRow(row);
    });

    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleRow(row);
    });
  });

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
