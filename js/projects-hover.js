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

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isCompact = window.matchMedia("(max-width: 1023px)").matches;

  if (canHover && !isCompact) {
    rows.forEach((row) => {
      const img = row.querySelector(".projects__row-preview-img");
      const preview = row.querySelector(".projects__row-preview");
      if (!img || !preview) return;

      row.addEventListener("mouseenter", () => {
        preview.setAttribute("aria-hidden", "false");
        restartGif(img);
      });

      row.addEventListener("mouseleave", () => {
        preview.setAttribute("aria-hidden", "true");
      });
    });
  } else {
    /* Móvil / touch: el GIF aparece con el scroll, uno a uno. */
    const seen = new WeakSet();

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const row = entry.target;
            const preview = row.querySelector(".projects__row-preview");
            const img = row.querySelector(".projects__row-preview-img");
            if (!preview || !img) return;

            if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
              row.classList.add("is-preview-active");
              preview.setAttribute("aria-hidden", "false");
              if (!seen.has(row)) {
                seen.add(row);
                restartGif(img);
              }
            }
          });
        },
        {
          threshold: [0.2, 0.35, 0.55],
          rootMargin: "0px 0px -8% 0px",
        }
      );

      rows.forEach((row) => {
        const preview = row.querySelector(".projects__row-preview");
        if (preview) preview.setAttribute("aria-hidden", "false");
        observer.observe(row);
      });
    } else {
      rows.forEach((row) => {
        row.classList.add("is-preview-active");
        const preview = row.querySelector(".projects__row-preview");
        const img = row.querySelector(".projects__row-preview-img");
        if (preview) preview.setAttribute("aria-hidden", "false");
        if (img) restartGif(img);
      });
    }
  }

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
