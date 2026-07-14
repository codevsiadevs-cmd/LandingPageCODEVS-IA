import { prefersReducedMotionGlobal } from "./scroll.js";

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function ensureVideoSources(video) {
  if (!(video instanceof HTMLVideoElement) || video.dataset.sourcesReady === "1") return;
  const webm = video.dataset.srcWebm;
  const mp4 = video.dataset.srcMp4;
  if (!webm && !mp4) return;

  if (webm) {
    const source = document.createElement("source");
    source.src = webm;
    source.type = "video/webm";
    video.appendChild(source);
  }
  if (mp4) {
    const source = document.createElement("source");
    source.src = mp4;
    source.type = "video/mp4";
    video.appendChild(source);
  }
  video.dataset.sourcesReady = "1";
  video.load();
}

function restartProjectMedia(media) {
  if (media instanceof HTMLVideoElement) {
    ensureVideoSources(media);
    try {
      media.currentTime = 0;
      const play = media.play();
      if (play?.catch) play.catch(() => {});
    } catch {
      /* ignore autoplay/seek errors */
    }
    return;
  }

  if (media instanceof HTMLImageElement) {
    const src = media.getAttribute("src");
    if (!src) return;
    media.src = "";
    media.src = src;
  }
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
    const panelOp = clamp((open - 0.28) / 0.72, 0, 1);
    const titleOnly = row.hasAttribute("data-projects-title-only");
    const panelMax = titleOnly
      ? 0
      : panelOp * (window.innerWidth <= 1023 ? 280 : 340);

    row.style.setProperty("--open", open.toFixed(4));
    row.style.setProperty("--title-size", `${titleSize.toFixed(1)}px`);
    row.style.setProperty("--title-color", titleColor);
    row.style.setProperty("--panel-max", `${panelMax.toFixed(1)}px`);
    row.style.setProperty("--panel-op", panelOp.toFixed(3));
    row.style.setProperty("--row-pad", "0.45rem");
    row.style.setProperty("--panel-mt", `${(panelOp * 10).toFixed(1)}px`);

    row.classList.toggle("is-open", isOpen);

    const media = row.querySelector(".projects__row-gif");
    if (isOpen && !wasOpen && media) {
      restartProjectMedia(media);
    }
    if (!isOpen && media instanceof HTMLVideoElement && !media.paused) {
      media.pause();
    }
  });
}

function initProjectsScroll() {
  const section = document.querySelector(".projects");
  if (!section) return;

  const count = Number(section.dataset.projectsCount) || 6;
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

  const videos = [...section.querySelectorAll("video.projects__row-gif")];
  if ("IntersectionObserver" in window && videos.length) {
    const mediaObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          ensureVideoSources(entry.target);
          mediaObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "320px 0px" }
    );
    videos.forEach((video) => mediaObserver.observe(video));
  } else {
    videos.forEach(ensureVideoSources);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectsScroll);
} else {
  initProjectsScroll();
}
