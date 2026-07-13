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

  rows.forEach((row) => {
    const img = row.querySelector(".projects__row-preview-img");
    const preview = row.querySelector(".projects__row-preview");
    if (!img || !preview) return;

    if (canHover) {
      row.addEventListener("mouseenter", () => {
        preview.setAttribute("aria-hidden", "false");
        restartGif(img);
      });

      row.addEventListener("mouseleave", () => {
        preview.setAttribute("aria-hidden", "true");
      });
    } else {
      row.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          const isActive = row.classList.toggle("is-preview-active");
          rows.forEach((item) => {
            if (item !== row) item.classList.remove("is-preview-active");
          });
          preview.setAttribute("aria-hidden", isActive ? "false" : "true");
          if (isActive) restartGif(img);
        },
        { passive: false }
      );
    }
  });

  if (!canHover) {
    document.addEventListener("click", (event) => {
      if (event.target.closest(".projects__row")) return;
      rows.forEach((row) => {
        row.classList.remove("is-preview-active");
        const preview = row.querySelector(".projects__row-preview");
        if (preview) preview.setAttribute("aria-hidden", "true");
      });
    });
  }

  if ("IntersectionObserver" in window) {
    const imgs = rows
      .map((row) => row.querySelector(".projects__row-preview-img"))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        imgs.forEach((img) => {
          const preload = new Image();
          preload.src = img.getAttribute("src");
        });
        observer.disconnect();
      },
      { rootMargin: "240px" }
    );
    observer.observe(section);
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
