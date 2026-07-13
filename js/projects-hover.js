import { prefersReducedMotionGlobal } from "./scroll.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function restartGif(img) {
  const src = img.getAttribute("src");
  if (!src) return;
  img.src = "";
  img.src = src;
}

function paintProjectsCorriente() {
  const vh = window.innerHeight;

  document.querySelectorAll(".projects[data-section]").forEach((sec) => {
    const N = Number(sec.dataset.count) || 4;
    const track = sec.querySelector(".projects__track") || sec;
    const r = track.getBoundingClientRect();
    const total = r.height - vh;
    const p = clamp01(total > 0 ? -r.top / total : 0);
    const f = p * (N - 1);
    const activeIndex = Math.max(0, Math.min(N - 1, Math.round(f)));

    sec.querySelectorAll("[data-panel]").forEach((panel, i) => {
      const d = i - f;
      const ad = Math.abs(d);
      const isFront = i === activeIndex;

      panel.classList.toggle("is-front", isFront);
      panel.setAttribute("aria-hidden", isFront ? "false" : "true");
      panel.tabIndex = isFront ? 0 : -1;

      if (!isFront && panel.classList.contains("is-open")) {
        panel.classList.remove("is-open");
        panel.setAttribute("aria-expanded", "false");
      }

      if (prefersReducedMotionGlobal) {
        const active = isFront || (f >= N - 1 && i === N - 1);
        panel.style.transform = "translate(-50%, -50%)";
        panel.style.opacity = active ? "1" : "0";
        panel.style.filter = "none";
        panel.style.zIndex = active ? "20" : "1";
        panel.style.pointerEvents = active ? "auto" : "none";
        return;
      }

      const tf = `translate(-50%, -50%) translateY(${d * 90}vh) skewY(${d * 4}deg)`;
      const op = clamp01(1 - ad * 0.85);
      const blur = Math.min(12, ad * 5);

      panel.style.transform = tf;
      panel.style.opacity = String(op);
      panel.style.filter = `blur(${blur}px)`;
      panel.style.zIndex = String(600 - Math.round(ad * 10));
      panel.style.pointerEvents = isFront ? "auto" : "none";
    });
  });
}

function initProjectsCorriente() {
  const section = document.querySelector(".projects[data-section]");
  if (!section) return;

  const count = Number(section.dataset.count) || 4;
  section.style.setProperty("--projects-steps", String(count));

  const panels = [...section.querySelectorAll("[data-panel]")];

  panels.forEach((panel) => {
    panel.setAttribute("aria-expanded", "false");
    panel.setAttribute("role", "button");

    function toggleOpen() {
      if (!panel.classList.contains("is-front")) return;

      const willOpen = !panel.classList.contains("is-open");
      panels.forEach((other) => {
        if (other === panel) return;
        other.classList.remove("is-open");
        other.setAttribute("aria-expanded", "false");
      });

      panel.classList.toggle("is-open", willOpen);
      panel.setAttribute("aria-expanded", willOpen ? "true" : "false");

      if (willOpen) {
        const img = panel.querySelector(".projects__panel-gif");
        if (img) restartGif(img);
      }
    }

    panel.addEventListener("click", (event) => {
      event.preventDefault();
      toggleOpen();
    });

    panel.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleOpen();
    });
  });

  let rafId = null;
  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      paintProjectsCorriente();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  paintProjectsCorriente();

  if ("IntersectionObserver" in window) {
    const imgs = [...section.querySelectorAll(".projects__panel-gif")];
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
  document.addEventListener("DOMContentLoaded", initProjectsCorriente);
} else {
  initProjectsCorriente();
}
