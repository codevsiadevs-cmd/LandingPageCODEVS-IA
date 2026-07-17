/**
 * Red neuronal Codrops al hover — reutilizable (navbar, título hero, etc.).
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function initBrandNeuralHover(panel, canvas, options = {}) {
  if (!panel || !canvas || prefersReducedMotionGlobal) return;

  const {
    hoverClass = "brand-neural-panel--hover",
    gridDiv = 6,
    linkCount = 4,
    wander = 10,
    colorRgb = "255,255,255",
    reachScale = 1,
    nodeRadiusMin = 1.2,
    nodeRadiusMax = 2.4,
    lineWidth = 1,
    spotlightLineWidth = 1.65,
    enableTouch = false,
    meshLinks = false,
    baseLinkAlpha = 0,
    baseNodeAlpha = 0,
    /** Si se define, la red solo se pinta dentro del glifo (p. ej. letras del hero). */
    clipGlyph = "",
    clipFontEl = null,
    glyphBaseAlpha = 0,
    /** Solo muestra la red cerca del cursor (radio relativo al tamaño del panel). */
    mouseSpotlight = false,
    spotlightRadius = 0.42,
    /** Tras salir del hover, mantiene el efecto visible N ms antes de apagarlo. */
    lingerMs = 0,
    /** Desplazamiento vertical de la máscara (fracción del font-size; + baja, − sube). */
    glyphNudgeY = 0.14,
    /** Velocidad de fade-out del blend (más bajo = más suave). */
    fadeOutSpeed = 0.06,
    /** Efecto siempre activo (logo final móvil: los 2 paneles). */
    ambient = false,
    /** Solo expone API (__brandNeural); el proxy de .end-logo controla el touch. */
    externalControl = false,
  } = options;

  if (!canHover && !enableTouch && !externalControl) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let points = [];
  const target = { x: 0, y: 0 };
  let sceneRevision = 0;
  let animating = false;
  let wanderActive = false;
  let hoverBlend = 0;
  let rafId = null;
  let lingerTimer = null;
  let ambientAngle = Math.random() * Math.PI * 2;

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
    ctx.fillStyle = `rgba(${colorRgb},${this.active})`;
    ctx.fill();
  };

  function drawConnectedMesh() {
    const baseLine = baseLinkAlpha * hoverBlend;
    const baseNode = baseNodeAlpha * hoverBlend;

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      for (let j = 0; j < p.closest.length; j += 1) {
        const n = p.closest[j];
        const hotspot = Math.min(p.active, n.active);
        const alpha = Math.max(baseLine, hotspot);
        if (alpha < 0.02) continue;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = `rgba(${colorRgb},${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const alpha = Math.max(baseNode, p.circle.active);
      if (alpha < 0.02) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.circle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colorRgb},${alpha})`;
      ctx.fill();
    }
  }

  function drawLines(p) {
    if (!p.active) return;
    ctx.strokeStyle = `rgba(${colorRgb},${p.active})`;
    ctx.lineWidth = mouseSpotlight ? spotlightLineWidth : lineWidth;
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
      near: unit * 0.35 * reachScale,
      mid: unit * 1.4 * reachScale,
      far: unit * 3.2 * reachScale,
    };
  }

  function buildPoints() {
    points = [];
    const stepX = width / gridDiv;
    const stepY = height / gridDiv;

    for (let x = 0; x < width; x += stepX) {
      for (let y = 0; y < height; y += stepY) {
        const px = wander > 0 ? x + Math.random() * stepX : x + stepX * 0.5;
        const py = wander > 0 ? y + Math.random() * stepY : y + stepY * 0.5;
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
          nodeRadiusMin + Math.random() * (nodeRadiusMax - nodeRadiusMin)
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

  function stopWander() {
    wanderActive = false;
    sceneRevision += 1;
  }

  function startWander() {
    if (wander <= 0 || prefersReducedMotionGlobal) return;
    wanderActive = true;
    const rev = sceneRevision;
    for (let i = 0; i < points.length; i += 1) {
      animatePoint(points[i], rev);
    }
  }

  function animatePoint(point, rev) {
    if (wander <= 0 || !wanderActive) return;

    const fromX = point.x;
    const fromY = point.y;
    const toX = point.originX - wander + Math.random() * wander * 2;
    const toY = point.originY - wander + Math.random() * wander * 2;
    const duration = 900 + Math.random() * 900;
    const start = performance.now();

    function step(now) {
      if (rev !== sceneRevision || !wanderActive) return;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const e = easeInOutCubic(t);
      point.x = fromX + (toX - fromX) * e;
      point.y = fromY + (toY - fromY) * e;
      if (t < 1) {
        requestAnimationFrame(step);
      } else if (wanderActive && rev === sceneRevision) {
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

  function rebuildScene({ withWander = false } = {}) {
    stopWander();
    resize();
    buildPoints();
    if (withWander || ambient || animating) {
      startWander();
    }
  }

  /**
   * Viewport → coords locales de la letra.
   * Solo aplica compensación ±90° si el panel está realmente rotado (móvil).
   * En desktop (horizontal) usa el mismo mapeo simple que el título.
   */
  function clientToLocal(clientX, clientY) {
    const rotRoot = panel.closest("[data-end-rotate]");
    const rect = panel.getBoundingClientRect();
    const w = Math.max(panel.offsetWidth || panel.clientWidth || 0, 1);
    const h = Math.max(panel.offsetHeight || panel.clientHeight || 0, 1);

    let rot = 0;
    if (rotRoot) {
      const t = getComputedStyle(rotRoot).transform;
      if (t && t !== "none") {
        rot = Number(rotRoot.dataset.endRotate || 0);
      }
    }

    if (!rot) {
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const sx = clientX - cx;
    const sy = clientY - cy;

    if (rot < 0) {
      return { x: sy + w / 2, y: -sx + h / 2 };
    }
    return { x: -sy + w / 2, y: sx + h / 2 };
  }

  function setTargetFromEvent(event) {
    const local = clientToLocal(event.clientX, event.clientY);
    target.x = local.x;
    target.y = local.y;
  }

  function hasRotatedEndAncestor() {
    const rotRoot = panel.closest("[data-end-rotate]");
    if (!rotRoot) return false;
    const t = getComputedStyle(rotRoot).transform;
    return Boolean(t && t !== "none");
  }

  function paintGlyphMask(alpha, rgb = "255,255,255") {
    if (!clipGlyph || alpha < 0.01 || width < 1 || height < 1) return;
    const face = clipFontEl || panel;
    if (!face) return;

    const cs = getComputedStyle(face);
    const brand = panel.closest?.(".hero__brand");
    const brandCs = brand ? getComputedStyle(brand) : cs;
    const fontSize = cs.fontSize !== "0px" ? cs.fontSize : brandCs.fontSize;
    const fontFamily = cs.fontFamily || brandCs.fontFamily || "Syne, sans-serif";
    const fontWeight = cs.fontWeight && cs.fontWeight !== "400" ? cs.fontWeight : "800";
    const fontStyle = cs.fontStyle || "normal";
    const fontPx = parseFloat(fontSize) || height;

    ctx.save();
    ctx.fillStyle = `rgba(${rgb},${alpha})`;
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    if ("letterSpacing" in ctx) {
      ctx.letterSpacing = "0px";
    }

    const metrics = ctx.measureText(clipGlyph);
    const ascent =
      metrics.actualBoundingBoxAscent ||
      metrics.fontBoundingBoxAscent ||
      fontPx * 0.72;
    /* Syne: nudge por letra (glyphNudgeY, + = bajar) */
    const yNudge = fontPx * glyphNudgeY;

    let x = width / 2;
    let y = ascent + yNudge;

    /*
     * Con logo final rotado, getBoundingClientRect es AABB y desalinea la máscara.
     * Usar coords locales del canvas (igual óptica que el título, sin AABB).
     */
    if (!hasRotatedEndAncestor()) {
      try {
        const panelRect = panel.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(face);
        const ink = range.getBoundingClientRect();
        if (ink.width > 0.5 && ink.height > 0.5) {
          x = ink.left - panelRect.left + ink.width / 2;
          y = ink.top - panelRect.top + ascent + yNudge;
        } else {
          const faceRect = face.getBoundingClientRect();
          x = faceRect.left - panelRect.left + faceRect.width / 2;
          y = faceRect.top - panelRect.top + ascent + yNudge;
        }
      } catch {
        /* fallback local */
      }
    }

    ctx.fillText(clipGlyph, x, y);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (hoverBlend < 0.01 || points.length === 0) return;

    const clipInside = Boolean(clipGlyph);
    const { near, mid, far } = getDistanceThresholds();

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const d2 = getDistanceSq(p, target);
      let active = 0;
      let circleActive = 0;

      if (d2 < near) {
        active = mouseSpotlight ? 0.82 : 0.55;
        circleActive = mouseSpotlight ? 1 : 0.95;
      } else if (d2 < mid) {
        active = mouseSpotlight ? 0.48 : 0.28;
        circleActive = mouseSpotlight ? 0.78 : 0.55;
      } else if (d2 < far) {
        active = mouseSpotlight ? 0.22 : 0.12;
        circleActive = mouseSpotlight ? 0.42 : 0.28;
      }

      p.active = active * hoverBlend;
      p.circle.active = circleActive * hoverBlend;
    }

    if (clipInside && glyphBaseAlpha > 0.01) {
      paintGlyphMask(glyphBaseAlpha * hoverBlend, "12,12,12");
      ctx.globalCompositeOperation = "source-atop";
    }

    if (meshLinks && baseLinkAlpha > 0) {
      drawConnectedMesh();
    } else {
      for (let i = 0; i < points.length; i += 1) {
        drawLines(points[i]);
        points[i].circle.draw();
      }
    }

    if (clipInside) {
      ctx.globalCompositeOperation = "destination-in";
      paintGlyphMask(1, "255,255,255");
      ctx.globalCompositeOperation = "source-over";
    }

    /* Spotlight: solo el área alrededor del mouse permanece visible */
    if (mouseSpotlight) {
      const radius = Math.max(28, Math.min(width, height) * spotlightRadius);
      ctx.globalCompositeOperation = "destination-in";
      const grad = ctx.createRadialGradient(
        target.x,
        target.y,
        radius * 0.08,
        target.x,
        target.y,
        radius
      );
      grad.addColorStop(0, `rgba(255,255,255,${hoverBlend})`);
      grad.addColorStop(0.35, `rgba(255,255,255,${0.85 * hoverBlend})`);
      grad.addColorStop(0.6, `rgba(255,255,255,${0.45 * hoverBlend})`);
      grad.addColorStop(0.82, `rgba(255,255,255,${0.15 * hoverBlend})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function tick() {
    if (ambient) {
      animating = true;
      ambientAngle += 0.02;
      if (width > 1 && height > 1) {
        target.x = width * (0.5 + 0.3 * Math.sin(ambientAngle));
        target.y = height * (0.48 + 0.3 * Math.cos(ambientAngle * 0.9));
      }
    }

    if (animating) {
      hoverBlend = Math.min(1, hoverBlend + 0.09);
    } else {
      hoverBlend = Math.max(0, hoverBlend - fadeOutSpeed);
    }

    if (hoverBlend > 0.01) {
      draw();
      rafId = requestAnimationFrame(tick);
      return;
    }

    panel.classList.remove(hoverClass);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rafId = null;
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function clearLinger() {
    if (lingerTimer == null) return;
    clearTimeout(lingerTimer);
    lingerTimer = null;
  }

  function deactivateNow() {
    /* Solo apaga el blend; la clase se quita al terminar el fade (evita corte brusco). */
    animating = false;
    if (!ambient) stopWander();
    startLoop();
  }

  function activateFromEvent(event) {
    clearLinger();
    rebuildScene({ withWander: true });
    setTargetFromEvent(event);
    animating = true;
    panel.classList.add(hoverClass);
    startLoop();
  }

  function deactivate() {
    if (ambient) return;
    if (lingerMs > 0) {
      clearLinger();
      lingerTimer = setTimeout(() => {
        lingerTimer = null;
        deactivateNow();
      }, lingerMs);
      return;
    }
    deactivateNow();
  }

  if (canHover) {
    panel.addEventListener("pointerenter", activateFromEvent);
    panel.addEventListener("pointermove", setTargetFromEvent);
    panel.addEventListener("pointerleave", deactivate);
  }

  if (enableTouch && !externalControl) {
    panel.addEventListener(
      "pointerdown",
      (event) => {
        if (canHover && event.pointerType === "mouse") return;
        activateFromEvent(event);
        if (typeof panel.setPointerCapture === "function") {
          panel.setPointerCapture(event.pointerId);
        }
      },
      { passive: true }
    );

    panel.addEventListener(
      "pointermove",
      (event) => {
        if (!animating) return;
        setTargetFromEvent(event);
      },
      { passive: true }
    );

    const endTouch = (event) => {
      if (canHover && event.pointerType === "mouse") return;
      deactivate();
      if (typeof panel.releasePointerCapture === "function" && panel.hasPointerCapture?.(event.pointerId)) {
        panel.releasePointerCapture(event.pointerId);
      }
    };

    panel.addEventListener("pointerup", endTouch, { passive: true });
    panel.addEventListener("pointercancel", endTouch, { passive: true });
  }

  function onLayoutChange() {
    rebuildScene({ withWander: ambient || animating });
  }

  window.addEventListener("resize", onLayoutChange);

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(onLayoutChange).observe(panel);
  }

  resize();

  if (ambient) {
    rebuildScene({ withWander: true });
    target.x = Math.max(width * 0.5, 1);
    target.y = Math.max(height * 0.48, 1);
    animating = true;
    hoverBlend = 1;
    panel.classList.add(hoverClass);
    startLoop();
  }

  /* API para re-sincronizar tras fitEndLogo / resize del logo final */
  panel.__brandNeural = {
    rebuild: () => rebuildScene({ withWander: ambient || animating }),
    activateAt(clientX, clientY) {
      clearLinger();
      rebuildScene({ withWander: true });
      const local = clientToLocal(clientX, clientY);
      target.x = local.x;
      target.y = local.y;
      animating = true;
      panel.classList.add(hoverClass);
      startLoop();
    },
    moveAt(clientX, clientY) {
      const local = clientToLocal(clientX, clientY);
      target.x = local.x;
      target.y = local.y;
      if (!animating) {
        animating = true;
        panel.classList.add(hoverClass);
        startLoop();
      }
    },
    deactivate,
  };
}
