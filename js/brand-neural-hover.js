/**
 * Red neuronal Codrops al hover — reutilizable (navbar, título hero, etc.).
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function initBrandNeuralHover(panel, canvas, options = {}) {
  if (!panel || !canvas || !canHover || prefersReducedMotionGlobal) return;

  const {
    hoverClass = "brand-neural-panel--hover",
    gridDiv = 6,
    linkCount = 4,
    wander = 10,
  } = options;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let points = [];
  const target = { x: 0, y: 0 };
  let sceneRevision = 0;
  let animating = false;
  let hoverBlend = 0;
  let rafId = null;

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

  Circle.prototype.draw = function drawCircle() {
    if (!this.active) return;
    ctx.beginPath();
    ctx.arc(this.point.x, this.point.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${this.active})`;
    ctx.fill();
  };

  function drawLines(p) {
    if (!p.active) return;
    ctx.strokeStyle = `rgba(255,255,255,${p.active})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < p.closest.length; i += 1) {
      const n = p.closest[i];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    }
  }

  function getDistanceThresholds() {
    const base = Math.min(width, height);
    const unit = base * base;
    return {
      near: unit * 0.35,
      mid: unit * 1.4,
      far: unit * 3.2,
    };
  }

  function buildPoints() {
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
        point.circle = new Circle(point, 1.2 + Math.random() * 1.2);
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

  function animatePoint(point, rev) {
    const fromX = point.x;
    const fromY = point.y;
    const toX = point.originX - wander + Math.random() * wander * 2;
    const toY = point.originY - wander + Math.random() * wander * 2;
    const duration = 900 + Math.random() * 900;
    const start = performance.now();

    function step(now) {
      if (rev !== sceneRevision) return;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const e = easeInOutCubic(t);
      point.x = fromX + (toX - fromX) * e;
      point.y = fromY + (toY - fromY) * e;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        animatePoint(point, rev);
      }
    }
    requestAnimationFrame(step);
  }

  function resize() {
    const w = panel.clientWidth;
    const h = panel.clientHeight;
    if (w < 1 || h < 1) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    width = w;
    height = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rebuildScene() {
    sceneRevision += 1;
    resize();
    buildPoints();
    const rev = sceneRevision;
    for (let i = 0; i < points.length; i += 1) {
      animatePoint(points[i], rev);
    }
  }

  function setTargetFromEvent(event) {
    const rect = panel.getBoundingClientRect();
    target.x = event.clientX - rect.left;
    target.y = event.clientY - rect.top;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (hoverBlend < 0.01 || points.length === 0) return;

    const { near, mid, far } = getDistanceThresholds();

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const d2 = getDistanceSq(p, target);
      let active = 0;
      let circleActive = 0;

      if (d2 < near) {
        active = 0.42;
        circleActive = 0.78;
      } else if (d2 < mid) {
        active = 0.18;
        circleActive = 0.38;
      } else if (d2 < far) {
        active = 0.06;
        circleActive = 0.18;
      }

      p.active = active * hoverBlend;
      p.circle.active = circleActive * hoverBlend;
      drawLines(p);
      p.circle.draw();
    }
  }

  function tick() {
    if (animating) {
      hoverBlend = Math.min(1, hoverBlend + 0.09);
    } else {
      hoverBlend = Math.max(0, hoverBlend - 0.06);
    }

    if (hoverBlend > 0.01) {
      draw();
      rafId = requestAnimationFrame(tick);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rafId = null;
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  panel.addEventListener("pointerenter", (event) => {
    rebuildScene();
    setTargetFromEvent(event);
    animating = true;
    panel.classList.add(hoverClass);
    startLoop();
  });

  panel.addEventListener("pointermove", setTargetFromEvent);

  panel.addEventListener("pointerleave", () => {
    animating = false;
    panel.classList.remove(hoverClass);
    startLoop();
  });

  window.addEventListener("resize", rebuildScene);

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(rebuildScene).observe(panel);
  }

  resize();
}
