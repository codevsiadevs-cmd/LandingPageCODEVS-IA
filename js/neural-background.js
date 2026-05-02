/**
 * Codrops-style neural network (Animated Header Backgrounds — Demo 1).
 * Canvas transparente: las redes se iluminan cerca del cursor sobre el fondo existente.
 * https://tympanus.net/Development/AnimatedHeaderBackgrounds/index.html
 */
import { prefersReducedMotionGlobal, isMobileBg } from "./scroll.js";

const canvas = document.getElementById("bg-neural-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

let width = 0;
let height = 0;
let points = [];
const target = { x: 0, y: 0 };
let sceneRevision = 0;
let listenersAttached = false;

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

function drawLines(p) {
  if (!p.active) return;
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

function buildPoints(gridDiv) {
  points = [];
  const stepX = width / gridDiv;
  const stepY = height / gridDiv;

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
      point.circle = new Circle(point, 2 + Math.random() * 2);
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
    for (let k = 0; k < 5 && k < scored.length; k += 1) {
      p.closest.push(scored[k].pt);
    }
  }
}

function animatePoint(point, rev) {
  if (rev === undefined) rev = sceneRevision;
  const fromX = point.x;
  const fromY = point.y;
  const toX = point.originX - 50 + Math.random() * 100;
  const toY = point.originY - 50 + Math.random() * 100;
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
      animatePoint(point, rev);
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
    window.addEventListener("touchmove", setTargetFromEvent, { passive: true });
    window.addEventListener(
      "resize",
      () => {
        resizeNeuralBackground();
      },
      { passive: true }
    );
  }

  resizeNeuralBackground();
}

export function resizeNeuralBackground() {
  if (!canvas || !ctx || prefersReducedMotionGlobal) return;
  sceneRevision += 1;
  syncCanvasSize();
  const gridDiv = isMobileBg ? 14 : 20;
  buildPoints(gridDiv);
  const rev = sceneRevision;
  for (let i = 0; i < points.length; i += 1) {
    animatePoint(points[i], rev);
  }
}

export function drawNeuralNetwork() {
  if (!canvas || !ctx || prefersReducedMotionGlobal || points.length === 0) return;

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const d2 = getDistanceSq(p, target);

    /* Umbrales en distancia²; radios algo mayores que Codrops puro para verse sobre el sitio */
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

    drawLines(p);
    p.circle.draw();
  }
}
