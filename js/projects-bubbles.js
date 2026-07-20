import Matter from "matter-js";
import { prefersReducedMotionGlobal } from "./scroll.js";

const { Engine, World, Bodies, Body, Mouse, MouseConstraint, Events, Runner } = Matter;

function isCoarsePointer() {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 900px)").matches
  );
}

function initProjectsBubbles() {
  const section = document.querySelector(".projects");
  const arena = section?.querySelector("[data-projects-arena]");
  if (!section || !arena) return;

  const bubbles = [...arena.querySelectorAll("[data-bubble]")];
  if (!bubbles.length) return;

  if (prefersReducedMotionGlobal) {
    section.classList.add("projects--static-bubbles");
    return;
  }

  section.classList.remove("projects--static-bubbles");

  let engine = null;
  let runner = null;
  /** @type {{ el: HTMLElement, body: Matter.Body }[]} */
  let pairs = [];
  /** @type {Matter.Body[]} */
  let walls = [];
  let rafSync = null;
  let mouseConstraint = null;
  /** @type {AbortController | null} */
  let pointerAbort = null;
  /** @type {null | {
   *   pair: { el: HTMLElement, body: Matter.Body },
   *   pointerId: number,
   *   lastX: number,
   *   lastY: number
   * }} */
  let touchDrag = null;
  let lastBuildW = 0;
  let lastBuildH = 0;

  function radiusOf(el) {
    const raw = getComputedStyle(el).getPropertyValue("--r").trim();
    const px = raw.endsWith("rem")
      ? parseFloat(raw) * 16
      : parseFloat(raw) || el.offsetWidth || 80;
    return Math.max(px, 36) / 2;
  }

  function clearTouchDrag() {
    if (!touchDrag) return;
    Body.setStatic(touchDrag.pair.body, false);
    touchDrag.pair.el.classList.remove("is-dragging");
    try {
      touchDrag.pair.el.releasePointerCapture?.(touchDrag.pointerId);
    } catch {
      /* ignore */
    }
    touchDrag = null;
  }

  function clearWorld() {
    clearTouchDrag();
    pointerAbort?.abort();
    pointerAbort = null;
    if (rafSync) cancelAnimationFrame(rafSync);
    rafSync = null;
    if (runner) Runner.stop(runner);
    if (engine) {
      World.clear(engine.world, false);
      Engine.clear(engine);
    }
    engine = null;
    runner = null;
    mouseConstraint = null;
    pairs = [];
    walls = [];
    bubbles.forEach((el) => el.classList.remove("is-dragging"));
  }

  function placeWalls(w, h) {
    const thickness = 80;
    return [
      Bodies.rectangle(w / 2, h + thickness / 2, w + thickness * 2, thickness, {
        isStatic: true,
      }),
      Bodies.rectangle(w / 2, -thickness / 2, w + thickness * 2, thickness, {
        isStatic: true,
      }),
      Bodies.rectangle(-thickness / 2, h / 2, thickness, h + thickness * 2, {
        isStatic: true,
      }),
      Bodies.rectangle(w + thickness / 2, h / 2, thickness, h + thickness * 2, {
        isStatic: true,
      }),
    ];
  }

  /** Solo altura (barra URL móvil): actualiza bordes sin reiniciar burbujas. */
  function softResize(w, h) {
    if (!engine || !walls.length) return;
    World.remove(engine.world, walls);
    walls = placeWalls(w, h);
    World.add(engine.world, walls);
    pairs.forEach(({ body }) => {
      const r = body.circleRadius || 20;
      const x = Math.min(Math.max(body.position.x, r + 4), w - r - 4);
      const y = Math.min(Math.max(body.position.y, r + 4), h - r - 4);
      if (x !== body.position.x || y !== body.position.y) {
        Body.setPosition(body, { x, y });
      }
    });
    lastBuildW = w;
    lastBuildH = h;
  }

  function wireMobileInstantDrag() {
    pointerAbort?.abort();
    pointerAbort = new AbortController();
    const { signal } = pointerAbort;

    pairs.forEach((pair) => {
      const { el, body } = pair;

      el.addEventListener(
        "pointerdown",
        (event) => {
          if (event.pointerType === "mouse") return;
          clearTouchDrag();
          el.classList.add("is-dragging");
          Body.setStatic(body, true);
          Body.setVelocity(body, { x: 0, y: 0 });
          touchDrag = {
            pair,
            pointerId: event.pointerId,
            lastX: event.clientX,
            lastY: event.clientY,
          };
          try {
            el.setPointerCapture(event.pointerId);
          } catch {
            /* ignore */
          }
        },
        { passive: true, signal }
      );

      el.addEventListener(
        "pointermove",
        (event) => {
          if (!touchDrag || touchDrag.pointerId !== event.pointerId) return;
          event.preventDefault();
          const rect = arena.getBoundingClientRect();
          const r = body.circleRadius || radiusOf(el);
          const x = Math.min(Math.max(event.clientX - rect.left, r), rect.width - r);
          const y = Math.min(Math.max(event.clientY - rect.top, r), rect.height - r);
          const vx = event.clientX - touchDrag.lastX;
          const vy = event.clientY - touchDrag.lastY;
          touchDrag.lastX = event.clientX;
          touchDrag.lastY = event.clientY;
          Body.setPosition(body, { x, y });
          body._toss = { x: vx * 0.35, y: vy * 0.35 };
        },
        { passive: false, signal }
      );

      const end = (event) => {
        if (!touchDrag || touchDrag.pointerId !== event.pointerId) return;
        Body.setStatic(body, false);
        const toss = body._toss || { x: 0, y: 0 };
        Body.setVelocity(body, toss);
        delete body._toss;
        el.classList.remove("is-dragging");
        try {
          el.releasePointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
        touchDrag = null;
      };

      el.addEventListener("pointerup", end, { signal });
      el.addEventListener("pointercancel", end, { signal });
    });
  }

  function wireDesktopMouse() {
    const mouse = Mouse.create(arena);
    if (typeof mouse.mousewheel === "function") {
      mouse.element.removeEventListener("wheel", mouse.mousewheel);
      mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
    }
    mouse.mousewheel = function noopWheel() {};

    mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.18,
        render: { visible: false },
      },
    });
    World.add(engine.world, mouseConstraint);

    Events.on(mouseConstraint, "startdrag", (ev) => {
      const pair = pairs.find((p) => p.body === ev.body);
      pair?.el.classList.add("is-dragging");
    });
    Events.on(mouseConstraint, "enddrag", (ev) => {
      const pair = pairs.find((p) => p.body === ev.body);
      pair?.el.classList.remove("is-dragging");
    });
  }

  function build(force = false) {
    const w = arena.clientWidth;
    const h = arena.clientHeight;
    if (w < 40 || h < 40) return;

    const widthDelta = Math.abs(w - lastBuildW);
    const heightDelta = Math.abs(h - lastBuildH);

    /* En móvil el scroll muestra/oculta la barra y dispara resize: no reiniciar. */
    if (!force && engine) {
      if (widthDelta < 16) {
        if (heightDelta >= 8) softResize(w, h);
        return;
      }
    }

    clearWorld();
    section.classList.remove("projects--static-bubbles");

    const mobile = isCoarsePointer();
    engine = Engine.create({ gravity: { x: 0, y: mobile ? 0.95 : 0.85 } });
    const world = engine.world;

    walls = placeWalls(w, h);
    World.add(world, walls);

    pairs = bubbles.map((el, i) => {
      const r = radiusOf(el);
      const cols = Math.min(4, Math.max(2, Math.floor(w / 90)));
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = w * 0.16 + col * (w * 0.22) + (row % 2) * 14;
      const y = h * (mobile ? 0.48 : 0.55) + row * (r * 1.4) + (i % 3) * 6;
      const body = Bodies.circle(
        Math.min(Math.max(x, r + 8), w - r - 8),
        Math.min(Math.max(y, r + 8), h - r - 8),
        r,
        {
          restitution: 0.52,
          friction: 0.14,
          frictionAir: 0.035,
          density: 0.0018,
        }
      );
      el.style.width = `${r * 2}px`;
      el.style.height = `${r * 2}px`;
      return { el, body };
    });

    World.add(
      world,
      pairs.map((p) => p.body)
    );

    if (mobile) {
      section.classList.add("projects--touch-physics");
      wireMobileInstantDrag();
    } else {
      section.classList.remove("projects--touch-physics");
      wireDesktopMouse();
    }

    runner = Runner.create();
    Runner.run(runner, engine);

    lastBuildW = w;
    lastBuildH = h;

    const sync = () => {
      pairs.forEach(({ el, body }) => {
        el.style.transform = `translate(${body.position.x}px, ${body.position.y}px) translate(-50%, -50%)`;
      });
      rafSync = requestAnimationFrame(sync);
    };
    sync();
  }

  build(true);

  let resizeTimer = 0;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => build(false), 200);
    },
    { passive: true }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectsBubbles);
} else {
  initProjectsBubbles();
}
