import Matter from "matter-js";
import { prefersReducedMotionGlobal } from "./scroll.js";

const { Engine, World, Bodies, Mouse, MouseConstraint, Events, Runner } = Matter;

function initProjectsBubbles() {
  const section = document.querySelector(".projects");
  const arena = section?.querySelector("[data-projects-arena]");
  if (!section || !arena) return;

  const bubbles = [...arena.querySelectorAll("[data-bubble]")];
  if (!bubbles.length || prefersReducedMotionGlobal) return;

  let engine = null;
  let runner = null;
  /** @type {{ el: HTMLElement, body: Matter.Body }[]} */
  let pairs = [];
  let rafSync = null;

  function radiusOf(el) {
    const raw = getComputedStyle(el).getPropertyValue("--r").trim();
    const px = raw.endsWith("rem")
      ? parseFloat(raw) * 16
      : parseFloat(raw) || el.offsetWidth || 80;
    return Math.max(px, 40) / 2;
  }

  function clearWorld() {
    if (rafSync) cancelAnimationFrame(rafSync);
    rafSync = null;
    if (runner) Runner.stop(runner);
    if (engine) {
      World.clear(engine.world, false);
      Engine.clear(engine);
    }
    engine = null;
    runner = null;
    pairs = [];
  }

  function build() {
    clearWorld();

    const w = arena.clientWidth;
    const h = arena.clientHeight;
    if (w < 40 || h < 40) return;

    engine = Engine.create({ gravity: { x: 0, y: 0.85 } });
    const world = engine.world;
    const thickness = 80;

    World.add(world, [
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
    ]);

    pairs = bubbles.map((el, i) => {
      const r = radiusOf(el);
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = w * 0.18 + col * (w * 0.16) + (row % 2) * 18;
      const y = h * 0.55 + row * (r * 1.35) + (i % 3) * 8;
      const body = Bodies.circle(
        Math.min(Math.max(x, r + 8), w - r - 8),
        Math.min(Math.max(y, r + 8), h - r - 8),
        r,
        {
          restitution: 0.55,
          friction: 0.12,
          frictionAir: 0.03,
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

    const mouse = Mouse.create(arena);
    /* Matter bloquea el wheel con preventDefault: desactivar para permitir scroll de página */
    if (typeof mouse.mousewheel === "function") {
      mouse.element.removeEventListener("wheel", mouse.mousewheel);
      mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
      mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
    }
    mouse.mousewheel = function noopWheel() {};

    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.18,
        render: { visible: false },
      },
    });
    World.add(world, mouseConstraint);

    Events.on(mouseConstraint, "startdrag", (ev) => {
      const pair = pairs.find((p) => p.body === ev.body);
      pair?.el.classList.add("is-dragging");
      arena.style.touchAction = "none";
    });
    Events.on(mouseConstraint, "enddrag", (ev) => {
      const pair = pairs.find((p) => p.body === ev.body);
      pair?.el.classList.remove("is-dragging");
      arena.style.touchAction = "pan-y";
    });

    runner = Runner.create();
    Runner.run(runner, engine);

    const sync = () => {
      pairs.forEach(({ el, body }) => {
        el.style.transform = `translate(${body.position.x}px, ${body.position.y}px) translate(-50%, -50%)`;
      });
      rafSync = requestAnimationFrame(sync);
    };
    sync();
  }

  build();

  let resizeTimer = 0;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 180);
    },
    { passive: true }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectsBubbles);
} else {
  initProjectsBubbles();
}
