import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotionGlobal } from "./scroll.js";

gsap.registerPlugin(ScrollTrigger);

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

/** @type {null | ((progress: number) => void)} */
let setSolucionesBrainScrollProgress = null;

import("./three-scene.js")
  .then((mod) => {
    setSolucionesBrainScrollProgress = mod.setSolucionesBrainScrollProgress;
  })
  .catch(() => {
    setSolucionesBrainScrollProgress = null;
  });

function measureAnchors(board, items) {
  const boardRect = board.getBoundingClientRect();
  const centerX = boardRect.width / 2;
  const isNarrow = boardRect.width < 720;
  /* Zigzag amplio; en móvil un poco más contenido para no salir del board */
  const zigzag = Math.min(
    boardRect.width * (isNarrow ? 0.36 : 0.42),
    isNarrow ? 120 : 280
  );
  const halfBrain = Math.min(
    isNarrow ? 68 : 176,
    boardRect.width * (isNarrow ? 0.18 : 0.22)
  );
  const minX = halfBrain;
  const maxX = boardRect.width - halfBrain;

  return items.map((item) => {
    const body = item.querySelector(".projects__item-body") || item;
    const rect = body.getBoundingClientRect();
    const isLeft = item.classList.contains("projects__item--left");
    const x = clamp(isLeft ? centerX + zigzag : centerX - zigzag, minX, maxX);
    const y = rect.top + rect.height / 2 - boardRect.top;
    return { x, y };
  });
}

function initProjectsScroll() {
  const section = document.querySelector(".projects");
  if (!section) return;

  const board = section.querySelector("[data-projects-board]");
  const brain = section.querySelector("[data-projects-brain]");
  const items = [...section.querySelectorAll("[data-projects-item]")];
  if (!board || !brain || !items.length) return;

  gsap.set(brain, { xPercent: -50, yPercent: -50, force3D: true, rotation: 0 });

  if (prefersReducedMotionGlobal) {
    const pts = measureAnchors(board, items);
    gsap.set(brain, { x: pts[0].x, y: pts[0].y });
    items.forEach((item, i) => item.classList.toggle("is-active", i === 0));
    setSolucionesBrainScrollProgress?.(0);
    return;
  }

  let tl;

  function buildTimeline() {
    if (tl) {
      tl.scrollTrigger?.kill();
      tl.kill();
    }

    const pts = measureAnchors(board, items);
    gsap.set(brain, { x: pts[0].x, y: pts[0].y, rotation: 0 });
    items.forEach((item, i) => item.classList.toggle("is-active", i === 0));
    setSolucionesBrainScrollProgress?.(0);

    tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "soluciones-brain",
        trigger: board,
        start: "top 58%",
        end: "bottom 42%",
        scrub: 0.75,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.round(self.progress * (items.length - 1));
          items.forEach((item, i) => {
            item.classList.toggle("is-active", i === idx);
          });
          /* Rota la figura 3D Spline (yaw izq → der), no el DOM 2D */
          setSolucionesBrainScrollProgress?.(self.progress);
        },
      },
    });

    for (let i = 1; i < items.length; i += 1) {
      const index = i;
      tl.to(brain, {
        x: () => measureAnchors(board, items)[index].x,
        y: () => measureAnchors(board, items)[index].y,
        duration: 1,
        ease: "power1.inOut",
      });
    }
  }

  buildTimeline();

  const onResize = () => {
    buildTimeline();
    ScrollTrigger.refresh();
  };

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectsScroll);
} else {
  initProjectsScroll();
}
