import { prefersReducedMotionGlobal } from "./scroll.js";

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function restartGif(img) {
  const src = img.getAttribute("src");
  if (!src) return;
  img.src = "";
  img.src = src;
}

function paintProjectsScroll() {
  const section = document.querySelector(".projects");
  if (!section) return;

  const track = section.querySelector("[data-projects-track]");
  const rows = [...section.querySelectorAll("[data-projects-row]")];
  const bar = section.querySelector("[data-projects-progress]");
  if (!track || !rows.length) return;

  const n = rows.length;
  const rect = track.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  const p = clamp(total > 0 ? -rect.top / total : 0, 0, 1);
  const pos = p * n;

  if (bar) bar.style.width = `${(p * 100).toFixed(2)}%`;

  rows.forEach((row, i) => {
    const d = pos - (i + 0.5);
    const open = prefersReducedMotionGlobal
      ? 1
      : clamp(1 - Math.abs(d) * 1.6, 0, 1);
    const isOpen = open > 0.4;
    const wasOpen = row.classList.contains("is-open");

    const titleSize = 42 + open * 26;
    const titleColor = `rgba(255,255,255,${(0.42 + open * 0.58).toFixed(3)})`;
    /* altura del panel solo cuando ya se ve (evita huecos vacíos) */
    const panelOp = clamp((open - 0.28) / 0.72, 0, 1);
    const panelMax =
      panelOp * (window.innerWidth <= 1023 ? 280 : 340);

    row.style.setProperty("--open", open.toFixed(4));
    row.style.setProperty("--title-size", `${titleSize.toFixed(1)}px`);
    row.style.setProperty("--title-color", titleColor);
    row.style.setProperty("--panel-max", `${panelMax.toFixed(1)}px`);
    row.style.setProperty("--panel-op", panelOp.toFixed(3));
    /* padding fijo para que las 4 títulos no se separen */
    row.style.setProperty("--row-pad", "0.45rem");
    row.style.setProperty("--panel-mt", `${(panelOp * 10).toFixed(1)}px`);

    row.classList.toggle("is-open", isOpen);

    if (isOpen && !wasOpen) {
      const img = row.querySelector(".projects__row-gif");
      if (img) restartGif(img);
    }
  });
}

function initProjectsScroll() {
  const section = document.querySelector(".projects");
  if (!section) return;

  const count = Number(section.dataset.projectsCount) || 4;
  section.style.setProperty("--projects-count", String(count));

  let rafId = null;
  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      paintProjectsScroll();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  paintProjectsScroll();

  if ("IntersectionObserver" in window) {
    const imgs = [...section.querySelectorAll(".projects__row-gif")];
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectsScroll);
} else {
  initProjectsScroll();
}
