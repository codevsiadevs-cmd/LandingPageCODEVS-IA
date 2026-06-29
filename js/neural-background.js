/**
 * Codrops-style neural network (Animated Header Backgrounds — Demo 1).
 * Canvas transparente: las redes se iluminan cerca del cursor sobre el fondo existente.
 * https://tympanus.net/Development/AnimatedHeaderBackgrounds/index.html
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

/** Activa/desactiva la red de conexiones de fondo (desktop y móvil). */
export const NEURAL_BACKGROUND_ENABLED = false;

const canvas = document.getElementById("bg-neural-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

let width = 0;
let height = 0;
let points = [];
const target = { x: 0, y: 0 };
let sceneRevision = 0;
let listenersAttached = false;

function isMobileView() {
  return window.matchMedia("(max-width: 768px)").matches;
}

/** Red moderada: solo móvil (≤768px). Desktop sin cambios. */
function mobileNeuralConfig() {
  return {
    gridDiv: 11,
    linkCount: 3,
    near: 5600,
    mid: 14500,
    far: 26000,
    maxEdgeLenSq: 5800,
    maxLinkMidDistSq: 13000,
    maxLines: 28,
    wander: 14,
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getDistanceSq(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

function Circle(point, radius) {
  this.point = point;
  this.radius = radius;
  this.active = 0;
}

Circle.prototype.draw = function () {
  if (!this.active) return;
  ctx.beginPath();
  ctx.arc(this.point.x, this.point.y, this.radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(156,217,249,${this.active})`;
  ctx.fill();
};

function drawLines(p, targetRef, mobileCfg) {
  if (!p.active || mobileCfg) return;
  ctx.strokeStyle = `rgba(156,217,249,${p.active})`;
  ctx.lineWidth = 1;

  for (let i = 0; i < p.closest.length; i += 1) {
    const n = p.closest[i];
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(n.x, n.y);
    ctx.stroke();
  }
}

function drawMobileNeuralNetwork(mobileCfg) {
  let linesDrawn = 0;

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const d2 = getDistanceSq(p, target);

    if (d2 < mobileCfg.near) {
      p.active = 0.38;
      p.circle.active = 0.62;
    } else if (d2 < mobileCfg.mid) {
      p.active = 0.2;
      p.circle.active = 0.36;
    } else if (d2 < mobileCfg.far) {
      p.active = 0.1;
      p.circle.active = 0.2;
    } else {
      p.active = 0;
      p.circle.active = 0;
    }
  }

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    if (!p.active) continue;

    for (let j = 0; j < p.closest.length; j += 1) {
      if (linesDrawn >= mobileCfg.maxLines) break;

      const n = p.closest[j];
      if (!n.active) continue;
      if (getDistanceSq(p, n) > mobileCfg.maxEdgeLenSq) continue;

      const midX = (p.x + n.x) * 0.5;
      const midY = (p.y + n.y) * 0.5;
      const dx = midX - target.x;
      const dy = midY - target.y;
      if (dx * dx + dy * dy > mobileCfg.maxLinkMidDistSq) continue;

      const alpha = Math.min(p.active, n.active);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(n.x, n.y);
      ctx.strokeStyle = `rgba(156,217,249,${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      linesDrawn += 1;
    }

    p.circle.draw();
  }
}

function buildPoints(gridDiv, mobileCfg) {
  points = [];
  const stepX = width / gridDiv;
  const stepY = height / gridDiv;
  const linkCount = mobileCfg ? mobileCfg.linkCount : 5;

  for (let x = 0; x < width; x += stepX) {
    for (let y = 0; y < height; y += stepY) {
      const px = x + Math.random() * stepX;
      const py = y + Math.random() * stepY;
      const point = {
        x: px,
        originX: px,
        y: py,
        originY: py,
        closest: [],
        active: 0,
      };
      point.circle = new Circle(
        point,
        mobileCfg ? 1 + Math.random() * 1 : 2 + Math.random() * 2
      );
      points.push(point);
    }
  }

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const scored = [];
    for (let j = 0; j < points.length; j += 1) {
      if (i === j) continue;
      scored.push({ pt: points[j], d: getDistanceSq(p, points[j]) });
    }
    scored.sort((a, b) => a.d - b.d);
    p.closest = [];
    for (let k = 0; k < linkCount && k < scored.length; k += 1) {
      p.closest.push(scored[k].pt);
    }
  }
}

function animatePoint(point, rev, mobileCfg) {
  if (rev === undefined) rev = sceneRevision;
  if (mobileCfg && !mobileCfg.wander) return;

  const fromX = point.x;
  const fromY = point.y;
  const wander = mobileCfg ? mobileCfg.wander : 50;
  const toX = point.originX - wander + Math.random() * wander * 2;
  const toY = point.originY - wander + Math.random() * wander * 2;
  const duration = 1000 + Math.random() * 1000;
  const start = performance.now();

  function tick(now) {
    if (rev !== sceneRevision) return;
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    const e = easeInOutCubic(t);
    point.x = fromX + (toX - fromX) * e;
    point.y = fromY + (toY - fromY) * e;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      animatePoint(point, rev, mobileCfg);
    }
  }
  requestAnimationFrame(tick);
}

function syncCanvasSize() {
  if (!canvas || !ctx) return;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  target.x = width * 0.5;
  target.y = height * 0.5;
}

export function initNeuralBackground() {
  if (!NEURAL_BACKGROUND_ENABLED) {
    canvas?.classList.add("bg-neural-canvas--disabled");
    return;
  }
  canvas?.classList.remove("bg-neural-canvas--disabled");
  if (!canvas || !ctx || prefersReducedMotionGlobal) return;

  if (!listenersAttached) {
    listenersAttached = true;
    function setTargetFromEvent(e) {
      if (e.touches && e.touches[0]) {
        target.x = e.touches[0].clientX;
        target.y = e.touches[0].clientY;
      } else {
        target.x = e.clientX;
        target.y = e.clientY;
      }
    }
    window.addEventListener("pointermove", setTargetFromEvent, { passive: true });
    window.addEventListener("touchstart", setTargetFromEvent, { passive: true });
    window.addEventListener("touchmove", setTargetFromEvent, { passive: true });
    window.addEventListener("touchend", () => {
      if (isMobileView()) {
        target.x = width * 0.5;
        target.y = height * 0.5;
      }
    }, { passive: true });
    window.addEventListener("touchcancel", () => {
      if (isMobileView()) {
        target.x = width * 0.5;
        target.y = height * 0.5;
      }
    }, { passive: true });
    window.addEventListener(
      "resize",
      () => {
        resizeNeuralBackground();
      },
      { passive: true }
    );

    const mobileMq = window.matchMedia("(max-width: 768px)");
    mobileMq.addEventListener("change", () => {
      resizeNeuralBackground();
    });
  }

  resizeNeuralBackground();
}

export function resizeNeuralBackground() {
  if (!NEURAL_BACKGROUND_ENABLED || !canvas || !ctx || prefersReducedMotionGlobal) return;
  sceneRevision += 1;
  syncCanvasSize();
  const mobileCfg = isMobileView() ? mobileNeuralConfig() : null;
  const gridDiv = mobileCfg ? mobileCfg.gridDiv : 20;
  buildPoints(gridDiv, mobileCfg);
  const rev = sceneRevision;
  for (let i = 0; i < points.length; i += 1) {
    animatePoint(points[i], rev, mobileCfg);
  }
}

export function drawNeuralNetwork() {
  if (!NEURAL_BACKGROUND_ENABLED || !canvas || !ctx || prefersReducedMotionGlobal || points.length === 0) return;

  ctx.clearRect(0, 0, width, height);
  const mobileCfg = isMobileView() ? mobileNeuralConfig() : null;

  if (mobileCfg) {
    drawMobileNeuralNetwork(mobileCfg);
    return;
  }

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const d2 = getDistanceSq(p, target);

    if (d2 < 9000) {
      p.active = 0.42;
      p.circle.active = 0.78;
    } else if (d2 < 45000) {
      p.active = 0.18;
      p.circle.active = 0.38;
    } else if (d2 < 90000) {
      p.active = 0.06;
      p.circle.active = 0.18;
    } else {
      p.active = 0;
      p.circle.active = 0;
    }

    drawLines(p, target, mobileCfg);
    p.circle.draw();
  }
}
