import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotionGlobal } from "./scroll.js";

gsap.registerPlugin(ScrollTrigger);

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

/** @type {null | ((progress: number) => void)} */
let setProcesoBrainScrollProgress = null;

import("./three-scene.js")
  .then((mod) => {
    setProcesoBrainScrollProgress = mod.setProcesoBrainScrollProgress;
  })
  .catch(() => {
    setProcesoBrainScrollProgress = null;
  });

function measureAnchors(board, items) {
  const boardRect = board.getBoundingClientRect();
  const centerX = boardRect.width / 2;
  const isNarrow = boardRect.width < 720;
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
    const body = item.querySelector(".proceso__item-body") || item;
    const rect = body.getBoundingClientRect();
    const isLeft = item.classList.contains("proceso__item--left");
    const x = clamp(isLeft ? centerX + zigzag : centerX - zigzag, minX, maxX);
    const y = rect.top + rect.height / 2 - boardRect.top;
    return { x, y };
  });
}

function initProcesoZigzag() {
  const section = document.querySelector(".proceso");
  if (!section) return;

  const board = section.querySelector("[data-proceso-board]");
  const brain = section.querySelector("[data-proceso-brain]");
  const items = [...section.querySelectorAll("[data-proceso-item]")];
  if (!board || !brain || !items.length) return;

  gsap.set(brain, { xPercent: -50, yPercent: -50, force3D: true, rotation: 0 });

  if (prefersReducedMotionGlobal) {
    const pts = measureAnchors(board, items);
    gsap.set(brain, { x: pts[0].x, y: pts[0].y });
    items.forEach((item, i) => item.classList.toggle("is-active", i === 0));
    setProcesoBrainScrollProgress?.(0);
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
    setProcesoBrainScrollProgress?.(0);

    tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "proceso-brain",
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
          setProcesoBrainScrollProgress?.(self.progress);
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

  window.addEventListener(
    "resize",
    () => {
      buildTimeline();
      ScrollTrigger.refresh();
    },
    { passive: true }
  );
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProcesoZigzag);
} else {
  initProcesoZigzag();
}
