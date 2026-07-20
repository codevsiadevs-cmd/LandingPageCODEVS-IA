import { latestScrollY, sceneMotion, prefersReducedMotionGlobal, isMobileBg } from "./scroll.js";
import {
  initParticles,
  updateBackgroundCanvasSize,
  drawPerspectiveGrid,
  drawParticles,
  updateNebula,
  syncBrainRectFromWrap,
} from "./background.js";
import { drawNeuralNetwork, initNeuralBackground, NEURAL_BACKGROUND_ENABLED } from "./neural-background.js";

const SPLINE_RUNTIME_URL =
  "https://cdn.jsdelivr.net/npm/@splinetool/runtime@1.12.67/build/runtime.js";

/** @type {Function | null} */
let SplineApplication = null;

async function ensureSplineRuntime() {
  if (SplineApplication) return SplineApplication;
  const mod = await import(SPLINE_RUNTIME_URL);
  SplineApplication = mod.Application;
  return SplineApplication;
}

function markBrainFailed(wrap) {
  if (!wrap) return;
  wrap.classList.add("brain-failed");
  wrap.setAttribute("data-brain-failed", "1");
  wrap.querySelectorAll("canvas").forEach((canvas) => canvas.remove());
}

/** API pública o privada de Spline según versión del runtime. */
function getSplineEventManager(app) {
  if (!app) return null;
  return app.eventManager ?? app._eventManager ?? null;
}

const SPLINE_SCENE_URL = "./assets/3d/particle-ai-brain.splinecode";
/** Zoom Spline = cerebro más grande en pantalla (sin solo desplazar el contenedor). */
const HERO_BRAIN_ZOOM_DESKTOP = 2.28;
const HERO_BRAIN_ZOOM_MOBILE = 1.55;
/** Perfil lateral del logo nav al inicio (lado opuesto). */
const NAV_BRAIN_BASE_ROT_Y = Math.PI * 0.5;

/** Helpers esféricos (antes Three.Vector3 / Three.Spherical) para orbit Spline. */
function sphericalFromOffset(ox, oy, oz) {
  const radius = Math.hypot(ox, oy, oz) || 1;
  return {
    radius,
    theta: Math.atan2(ox, oz),
    phi: Math.acos(Math.min(1, Math.max(-1, oy / radius))),
  };
}

function offsetFromSpherical(spherical) {
  const sinPhiRadius = Math.sin(spherical.phi) * spherical.radius;
  return {
    x: sinPhiRadius * Math.sin(spherical.theta),
    y: Math.cos(spherical.phi) * spherical.radius,
    z: sinPhiRadius * Math.cos(spherical.theta),
  };
}

const navWrap = document.getElementById("nav-brain-wrap");
const footerWrap = document.getElementById("footer-brain-wrap");
const endLogoWrap = document.getElementById("end-logo-brain-wrap");
const endLogoMirrorWrap = document.getElementById("end-logo-brain-wrap-mirror");
const heroWrap = document.getElementById("hero-brain-wrap");
const solucionesBrainWrap = document.getElementById("soluciones-brain-wrap");
const hasNavBrain = Boolean(navWrap);
const hasFooterBrain = Boolean(footerWrap);
const hasEndLogoBrain = Boolean(endLogoWrap);
const hasEndLogoMirrorBrain = Boolean(endLogoMirrorWrap);
const hasHeroBrain = Boolean(heroWrap);
const hasSolucionesBrain = Boolean(solucionesBrainWrap);
const hasLogoSplineBrain =
  hasNavBrain || hasFooterBrain || hasEndLogoBrain || hasEndLogoMirrorBrain || hasSolucionesBrain;
const hasBrainScene = hasHeroBrain || hasLogoSplineBrain;

/** Tamaño y zoom del hero Spline fijados al valor inicial (no cambian con el scroll). */
let lockedHeroBrainPx = null;
let lockedHeroBrainZoom = null;
let wasInProcesoBrain = false;

function lockHeroBrainDimensions() {
  if (!heroWrap) return null;
  heroWrap.style.removeProperty("width");
  heroWrap.style.removeProperty("height");
  const rect = heroWrap.getBoundingClientRect();
  const size = Math.max(Math.round(Math.max(rect.width, rect.height, window.innerWidth, window.innerHeight)), 1);
  lockedHeroBrainPx = size;
  heroWrap.style.width = `${size}px`;
  heroWrap.style.height = `${size}px`;
  return size;
}

function getHeroBrainRenderSize() {
  if (lockedHeroBrainPx) return lockedHeroBrainPx;
  if (!heroWrap) return 1;
  return Math.max(Math.round(heroWrap.clientWidth), 1);
}

let navWrapRect = navWrap ? navWrap.getBoundingClientRect() : null;
let heroWrapRect = heroWrap ? heroWrap.getBoundingClientRect() : null;

function refreshWrapRects() {
  if (navWrap) navWrapRect = navWrap.getBoundingClientRect();
  if (heroWrap) heroWrapRect = heroWrap.getBoundingClientRect();
  const particleTarget =
    heroWrapRect && heroWrapRect.width > 120 ? heroWrapRect : navWrapRect;
  syncBrainRectFromWrap(particleTarget);
}

if (hasBrainScene && typeof ResizeObserver !== "undefined") {
  const wrapResizeObserver = new ResizeObserver(refreshWrapRects);
  if (navWrap) wrapResizeObserver.observe(navWrap);
  if (footerWrap) wrapResizeObserver.observe(footerWrap);
  if (endLogoWrap) wrapResizeObserver.observe(endLogoWrap);
  if (heroWrap) wrapResizeObserver.observe(heroWrap);
}
window.addEventListener("resize", refreshWrapRects, { passive: true });

function syncHeroBrainWithScroll() {
  if (!heroWrap) return;
  const vh = window.innerHeight;

  heroWrap.classList.remove("hero__canvas-wrap--proceso");
  wasInProcesoBrain = false;

  /* Y fijo en el centro vertical del viewport. */
  heroWrap.style.setProperty("--brain-scroll-y", "46vh");
  /* X centrado en toda la página (desktop y móvil). */
  heroWrap.style.setProperty("--brain-scroll-x", "50%");

  heroWrap.style.removeProperty("opacity");

  /* Interacción al inicio; el cerebro permanece detrás del texto (desktop y móvil). */
  const interactive = latestScrollY < vh * 0.72;
  heroWrap.classList.toggle("hero__canvas-wrap--interactive", interactive);
}

/* ——— Hero: Particle AI Brain (Spline) ——— */
const splineTargets = [];

/**
 * No rotar Brain_Part_06 ni emitters: la escena Particle AI Brain de Spline
 * usa Particle Force + hover sobre ese mesh; sobrescribir rotation.* lo rompe.
 */
function pickRotationRoot() {
  return null;
}

function getHeroBrainOrbit(target) {
  return target.app.controls?.orbitControls ?? null;
}

function setHeroBrainOrbit(target, enabled) {
  const orbit = getHeroBrainOrbit(target);
  if (!orbit) return;
  orbit.enabled = enabled;
  orbit.enableRotate = enabled;
  orbit.enableZoom = false;
  orbit.enablePan = false;
  if (enabled) orbit.enableDamping = true;
}

/** Spline puede bloquear touchmove si preventTouchScroll está activo en la escena. */
function patchSplineScrollFlags(target) {
  const eventManager = getSplineEventManager(target.app);
  if (!eventManager) return;
  eventManager.preventScroll = false;
  eventManager.preventTouchScroll = false;
}

function isTouchPrimaryDevice() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function forwardOrbitPointerDown(target, event, clientX, clientY) {
  const orbit = getHeroBrainOrbit(target);
  if (!orbit?.onPointerDown) return false;

  orbit.onPointerDown(
    new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      clientX,
      clientY,
      button: 0,
      buttons: 1,
      isPrimary: true,
    })
  );
  return true;
}

/** En desktop el scroll es con rueda; el drag siempre puede rotar el cerebro. */
function wireHeroBrainWheelPassthrough(target) {
  const { canvas } = target;
  if (!canvas) return;

  const onWheel = (event) => {
    event.stopImmediatePropagation();
  };

  queueMicrotask(() => {
    canvas.addEventListener("wheel", onWheel, { capture: true, passive: true });
  });
}

/**
 * Solo touch: scroll vertical libre; rotación solo tras arrastre horizontal.
 * Orbit se engancha con un pointerdown sintético (Spline lo requiere desde el inicio).
 */
function wireHeroBrainTouchScrollGuard(target) {
  const { canvas } = target;
  if (!canvas) return;

  const SCROLL_THRESHOLD = 14;
  const SCROLL_DOMINANCE = 1.08;
  const INTERACT_DOMINANCE = 1.05;

  let gestureMode = "idle";
  let startX = 0;
  let startY = 0;
  let activePointerId = null;

  const resetTouchGesture = (event) => {
    if (activePointerId == null) return;
    if (event != null && event.pointerId !== activePointerId) return;

    if (gestureMode === "interact") {
      getHeroBrainOrbit(target)?.onPointerUp?.(event);
    }

    gestureMode = "idle";
    activePointerId = null;
    canvas.classList.remove("hero__brain-canvas--interacting");
    canvas.style.touchAction = "pan-y";
    setHeroBrainOrbit(target, false);
  };

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch" || event.button !== 0 || !target.ready) return;
      gestureMode = "pending";
      activePointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      canvas.style.touchAction = "pan-y";
      setHeroBrainOrbit(target, false);
      syncSplineDomRect(target);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "touch" || event.pointerId !== activePointerId || !target.ready) return;
      if (gestureMode === "scroll" || gestureMode === "interact") return;

      const dx = Math.abs(event.clientX - startX);
      const dy = Math.abs(event.clientY - startY);
      if (Math.max(dx, dy) < SCROLL_THRESHOLD) return;

      if (dy >= dx * SCROLL_DOMINANCE) {
        gestureMode = "scroll";
        setHeroBrainOrbit(target, false);
        canvas.style.touchAction = "pan-y";
        return;
      }

      if (dx >= dy * INTERACT_DOMINANCE) {
        gestureMode = "interact";
        canvas.classList.add("hero__brain-canvas--interacting");
        canvas.style.touchAction = "none";
        setHeroBrainOrbit(target, true);
        syncSplineDomRect(target);
        if (forwardOrbitPointerDown(target, event, startX, startY)) {
          getHeroBrainOrbit(target)?.onPointerMove?.(event);
        }
      }
    },
    { passive: true }
  );

  canvas.addEventListener("pointerup", resetTouchGesture, { passive: true });
  canvas.addEventListener("pointercancel", resetTouchGesture, { passive: true });
}

function configureHeroBrainInteraction(target) {
  const { canvas } = target;
  if (!canvas) return;

  patchSplineScrollFlags(target);
  wireHeroBrainWheelPassthrough(target);
  wireHeroBrainTouchScrollGuard(target);

  const touchPrimary = isTouchPrimaryDevice();
  setHeroBrainOrbit(target, !touchPrimary);
  canvas.style.touchAction = touchPrimary ? "pan-y" : "auto";

  if (!touchPrimary) {
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType === "touch") return;
        setHeroBrainOrbit(target, true);
        syncSplineDomRect(target);
        canvas.classList.add("hero__brain-canvas--interacting");
      },
      { passive: true }
    );
    canvas.addEventListener(
      "pointerup",
      (event) => {
        if (event.pointerType === "touch") return;
        canvas.classList.remove("hero__brain-canvas--interacting");
        setHeroBrainOrbit(target, true);
      },
      { passive: true }
    );
  }
}

function applyHeroBrainZoom(target) {
  if (!target?.ready) return;
  if (lockedHeroBrainZoom == null) {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    lockedHeroBrainZoom = isMobile ? HERO_BRAIN_ZOOM_MOBILE : HERO_BRAIN_ZOOM_DESKTOP;
  }
  target.app.setZoom?.(lockedHeroBrainZoom);
}

async function createHeroSplineBrain() {
  if (!heroWrap) return null;

  let Application;
  try {
    Application = await ensureSplineRuntime();
  } catch {
    markBrainFailed(heroWrap);
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "hero__brain-canvas";
  canvas.setAttribute("aria-hidden", "true");
  heroWrap.appendChild(canvas);

  const app = new Application(canvas);
  const target = { wrap: heroWrap, canvas, app, ready: false, rotRoot: null };
  splineTargets.push(target);

  try {
    await app.load(SPLINE_SCENE_URL);
    target.ready = true;
    target.rotRoot = pickRotationRoot(app);
    app.play?.();
    applyHeroBrainZoom(target);
    configureHeroBrainInteraction(target);
    syncSplineDomRect(target);
    resizeHeroSpline();
  } catch {
    const idx = splineTargets.indexOf(target);
    if (idx >= 0) splineTargets.splice(idx, 1);
    markBrainFailed(heroWrap);
    return null;
  }

  return target;
}

/* Cerebro Spline en logos: navbar/footer lejos; cierre más cerca (más grande) */
const NAV_LOGO_BRAIN_ZOOM_DESKTOP = 0.1;
const NAV_LOGO_BRAIN_ZOOM_MOBILE = 0.08;
const FOOTER_LOGO_BRAIN_ZOOM_DESKTOP = NAV_LOGO_BRAIN_ZOOM_DESKTOP;
const FOOTER_LOGO_BRAIN_ZOOM_MOBILE = NAV_LOGO_BRAIN_ZOOM_MOBILE;
const END_LOGO_BRAIN_ZOOM_DESKTOP = 0.55;
/** Móvil: zoom más abierto para que el mesh+partículas entren enteros en la caja. */
const END_LOGO_BRAIN_ZOOM_MOBILE = 0.18;
const SOLUCIONES_BRAIN_ZOOM_DESKTOP = 0.72;
const SOLUCIONES_BRAIN_ZOOM_MOBILE = 0.52;

/** @type {{ wrap: HTMLElement, canvas: HTMLCanvasElement, app: *, ready: boolean, kind: "nav" | "footer" | "end" | "soluciones" }[]} */
const logoSplineTargets = [];

function applyLogoBrainZoom(target) {
  if (!target?.ready) return;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  let zoom;
  if (target.kind === "end") {
    zoom = isMobile ? END_LOGO_BRAIN_ZOOM_MOBILE : END_LOGO_BRAIN_ZOOM_DESKTOP;
  } else if (target.kind === "footer") {
    zoom = isMobile ? FOOTER_LOGO_BRAIN_ZOOM_MOBILE : FOOTER_LOGO_BRAIN_ZOOM_DESKTOP;
  } else if (target.kind === "soluciones") {
    zoom = isMobile ? SOLUCIONES_BRAIN_ZOOM_MOBILE : SOLUCIONES_BRAIN_ZOOM_DESKTOP;
  } else {
    zoom = isMobile ? NAV_LOGO_BRAIN_ZOOM_MOBILE : NAV_LOGO_BRAIN_ZOOM_DESKTOP;
  }
  target.app.setZoom?.(zoom);
}

function resizeLogoSpline(target) {
  if (!target?.ready || !target.wrap) return;
  const rect = target.wrap.getBoundingClientRect();
  const display = Math.max(Math.round(Math.min(rect.width, rect.height) || target.wrap.clientWidth), 1);
  if (display < 4) return;
  const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), isMobileBg ? 2.25 : 2.75);
  const size = Math.max(Math.round(display * dpr), 1);
  target.app.setSize(size, size);
  target.canvas.style.width = "100%";
  target.canvas.style.height = "100%";
  applyLogoBrainZoom(target);
  if (target.kind === "nav") captureNavLogoOrbitBaseline(target);
  if (target.kind === "soluciones") captureLogoOrbitBaseline(target);
  syncSplineDomRect(target);
}

function setSplinePlaying(target, playing) {
  if (!target?.ready || !target.app) return;
  if (target._playing === playing) return;
  target._playing = playing;
  if (playing) target.app.play?.();
  else target.app.stop?.();
}

function captureLogoOrbitBaseline(target) {
  if (!target?.ready) return;
  const orbit = getHeroBrainOrbit(target);
  if (!orbit?.object || !orbit.target) return;
  const pos = orbit.object.position;
  const tgt = orbit.target;
  const spherical = sphericalFromOffset(pos.x - tgt.x, pos.y - tgt.y, pos.z - tgt.z);
  target._orbitPhi = spherical.phi;
  target._orbitRadius = spherical.radius;
}

function captureNavLogoOrbitBaseline(target) {
  captureLogoOrbitBaseline(target);
  target._navOrbitPhi = target._orbitPhi;
  target._navOrbitRadius = target._orbitRadius;
}

/** Solo navbar: gira el cerebro Spline según el scroll (no footer ni logo final). */
function applyNavLogoSplineScrollSpin(scrollRot) {
  for (const target of logoSplineTargets) {
    if (target.kind !== "nav" || !target.ready) continue;

    const spin = prefersReducedMotionGlobal ? scrollRot * 0.2 : scrollRot;
    /* Gira hacia la izquierda al scrollear; mantiene el perfil inicial. */
    const theta = NAV_BRAIN_BASE_ROT_Y - spin;
    applyLogoOrbitTheta(target, theta, true);
  }
}

/** Soluciones: rota la figura 3D de izquierda a derecha según el progreso de la sección. */
const SOLUCIONES_BRAIN_BASE_ROT_Y = 0;

function applyLogoOrbitTheta(target, theta, useNavBaseline) {
  const orbit = getHeroBrainOrbit(target);

  if (orbit?.object && orbit.target) {
    if (useNavBaseline) {
      if (target._navOrbitRadius == null) captureNavLogoOrbitBaseline(target);
    } else if (target._orbitRadius == null) {
      captureLogoOrbitBaseline(target);
    }
    const pos = orbit.object.position;
    const tgt = orbit.target;
    const spherical = sphericalFromOffset(pos.x - tgt.x, pos.y - tgt.y, pos.z - tgt.z);
    spherical.radius = (useNavBaseline ? target._navOrbitRadius : target._orbitRadius) ?? spherical.radius;
    spherical.phi = (useNavBaseline ? target._navOrbitPhi : target._orbitPhi) ?? spherical.phi;
    spherical.theta = theta;
    const next = offsetFromSpherical(spherical);
    orbit.object.position.set(next.x + tgt.x, next.y + tgt.y, next.z + tgt.z);
    orbit.object.lookAt(orbit.target);
    orbit.update?.();
    return;
  }

  /* Fallback: no rotar el DOM 2D; sin orbit no hay yaw 3D. */
}

function applySolucionesBrainScrollSpin(progress) {
  const p = Math.min(1, Math.max(0, Number(progress) || 0));
  const spin = prefersReducedMotionGlobal ? p * Math.PI * 0.35 : p * Math.PI * 2.4;
  /* Derecha → izquierda al bajar (theta decrece). */
  const theta = SOLUCIONES_BRAIN_BASE_ROT_Y - spin;

  for (const target of logoSplineTargets) {
    if (target.kind !== "soluciones" || !target.ready) continue;
    applyLogoOrbitTheta(target, theta, false);
  }
}

/** API para GSAP ScrollTrigger en Soluciones. */
export function setSolucionesBrainScrollProgress(progress) {
  applySolucionesBrainScrollSpin(progress);
}

function resizeAllLogoSplines() {
  logoSplineTargets.forEach(resizeLogoSpline);
}

async function createLogoSplineBrain(wrap, kind = "nav") {
  if (!wrap || wrap.dataset.splineMounted === "1") return null;
  wrap.dataset.splineMounted = "1";

  let Application;
  try {
    Application = await ensureSplineRuntime();
  } catch {
    markBrainFailed(wrap);
    return null;
  }

  wrap.classList.add("logo-brain");

  const canvas = document.createElement("canvas");
  canvas.className = "logo-brain__canvas hero__brain-canvas";
  canvas.setAttribute("aria-hidden", "true");
  wrap.appendChild(canvas);

  const app = new Application(canvas);
  const target = { wrap, canvas, app, ready: false, kind, _playing: false, _visible: false };
  logoSplineTargets.push(target);

  try {
    await app.load(SPLINE_SCENE_URL);
    target.ready = true;
    applyLogoBrainZoom(target);
    setHeroBrainOrbit(target, false);
    if (kind === "nav") {
      captureNavLogoOrbitBaseline(target);
      const docMaxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const docProgress = Math.min(Math.max(latestScrollY / docMaxScroll, 0), 1);
      applyNavLogoSplineScrollSpin(docProgress * Math.PI * 2.75);
    } else if (kind === "soluciones") {
      captureLogoOrbitBaseline(target);
      applySolucionesBrainScrollSpin(0);
    }
    patchSplineScrollFlags(target);
    resizeLogoSpline(target);
    setSplinePlaying(target, target._visible);
    requestAnimationFrame(() => {
      resizeLogoSpline(target);
      applyLogoBrainZoom(target);
    });
  } catch {
    const idx = logoSplineTargets.indexOf(target);
    if (idx >= 0) logoSplineTargets.splice(idx, 1);
    markBrainFailed(wrap);
    return null;
  }

  if (typeof IntersectionObserver !== "undefined") {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        target._visible = visible;
        setSplinePlaying(target, visible);
        if (visible) {
          resizeLogoSpline(target);
          applyLogoBrainZoom(target);
        }
      },
      { threshold: 0.05, rootMargin: "80px 0px" }
    );
    io.observe(wrap);
  } else {
    target._visible = true;
    setSplinePlaying(target, true);
  }

  return target;
}

/** Lazy-load de cerebros logo al acercarse al viewport. */
function scheduleLogoSplineBrain(wrap, kind = "nav") {
  if (!wrap) return;

  const mount = () => createLogoSplineBrain(wrap, kind);

  if (typeof IntersectionObserver === "undefined") {
    mount();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      mount();
    },
    { rootMargin: "280px 0px", threshold: 0.01 }
  );
  io.observe(wrap);
}

if (hasHeroBrain) {
  lockHeroBrainDimensions();
  createHeroSplineBrain();
}

if (hasNavBrain) scheduleLogoSplineBrain(navWrap, "nav");
if (hasFooterBrain) scheduleLogoSplineBrain(footerWrap, "footer");
if (hasEndLogoBrain) scheduleLogoSplineBrain(endLogoWrap, "end");
if (hasSolucionesBrain) scheduleLogoSplineBrain(solucionesBrainWrap, "soluciones");
/* El panel espejo queda oculto en CSS (móvil y web); no montar segundo Spline. */

/** Escala el logo final al viewport (ancho y alto) para que nunca se recorte. */
function fitEndLogoToWidth() {
  const panels = [...document.querySelectorAll(".nav__brand-panel--end-natural")];
  if (!panels.length) return;

  const section = panels[0].closest(".end-logo");
  if (!section) return;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const styles = getComputedStyle(section);
  const padX =
    (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
  const padY =
    (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
  /* Ancho casi full; alto con margen (nav + glifos fuera del line-box). */
  const fillW = isMobile ? 0.9 : 0.97;
  const fillH = isMobile ? 0.78 : 0.72;
  const availableW = Math.max(section.clientWidth - padX, 1) * fillW;
  const availableH =
    Math.max(Math.min(section.clientHeight || window.innerHeight, window.innerHeight) - padY, 1) *
    fillH;

  const panel = panels[0];
  const savedMax = panel.style.maxWidth;
  panel.style.maxWidth = "none";
  panel.style.removeProperty("transform");

  const probe = 100;
  panel.style.setProperty("--nav-brand-mark", `${probe}px`);
  void panel.offsetWidth;
  const naturalW = Math.max(panel.scrollWidth, panel.offsetWidth, 1);
  const naturalH = Math.max(panel.scrollHeight, panel.getBoundingClientRect().height, 1);
  const mark = Math.max(
    Math.min((availableW / naturalW) * probe, (availableH / naturalH) * probe),
    24
  );
  panel.style.setProperty("--nav-brand-mark", `${mark}px`);

  panel.style.maxWidth = savedMax;

  logoSplineTargets.forEach((target) => {
    if (target.kind === "end") resizeLogoSpline(target);
  });

  window.dispatchEvent(new CustomEvent("end-logo-fitted"));
}

/** Refit en el siguiente frame (tras wrap de letras / fuentes / spline). */
function scheduleEndLogoFit() {
  fitEndLogoToWidth();
  requestAnimationFrame(() => {
    fitEndLogoToWidth();
    requestAnimationFrame(() => fitEndLogoToWidth());
  });
}

/** Spline cachea getBoundingClientRect(); refrescarlo si el wrap se mueve o rota. */
function syncSplineDomRect(target) {
  if (!target?.ready || !target.canvas) return;
  const eventManager = getSplineEventManager(target.app);
  const ctx = eventManager?.eventContext ?? eventManager?._eventContext;
  if (ctx) ctx.domRect = target.canvas.getBoundingClientRect();
}

/** Centrado fijo: transform lo controla CSS (translate + scale). */
function applyHeroWrapEffects() {
  /* noop */
}

function syncHeroSplineFrame(target) {
  applyHeroWrapEffects();
  syncSplineDomRect(target);
}

function resizeHeroSpline() {
  if (!splineTargets.length) return;
  const size = getHeroBrainRenderSize();
  splineTargets.forEach((target) => {
    target.app.setSize(size, size);
    applyHeroBrainZoom(target);
    syncSplineDomRect(target);
  });
}

function resizeBrains() {
  fitEndLogoToWidth();
  refreshWrapRects();
  resizeHeroSpline();
  resizeAllLogoSplines();
}

updateBackgroundCanvasSize();
initParticles();
window.addEventListener("resize", () => {
  lockedHeroBrainPx = null;
  lockedHeroBrainZoom = null;
  lockHeroBrainDimensions();
  resizeBrains();
  updateBackgroundCanvasSize();
  initParticles();
  syncHeroBrainWithScroll();
});
if (hasBrainScene) {
  if (hasHeroBrain && !lockedHeroBrainPx) lockHeroBrainDimensions();
  refreshWrapRects();
  resizeBrains();
  syncHeroBrainWithScroll();
}

window.addEventListener(
  "load",
  () => {
    scheduleEndLogoFit();
    if (hasHeroBrain) {
      lockedHeroBrainPx = null;
      lockedHeroBrainZoom = null;
      lockHeroBrainDimensions();
      resizeHeroSpline();
    }
    resizeAllLogoSplines();
    refreshWrapRects();
  },
  { once: true }
);

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    scheduleEndLogoFit();
    resizeAllLogoSplines();
  });
}

/* Tras wrap neuronal del logo final (primer load suele llegar después del fit inicial). */
window.addEventListener("end-logo-needs-fit", () => {
  scheduleEndLogoFit();
});

/* Al llegar al cierre: re-medir por si el primer fit corrió antes de fuentes/letras. */
{
  const endSection = document.querySelector(".end-logo");
  if (endSection && typeof IntersectionObserver !== "undefined") {
    let fittedOnView = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          scheduleEndLogoFit();
          if (!fittedOnView) {
            fittedOnView = true;
            /* Segunda pasada cuando el layout ya estabilizó en viewport */
            window.setTimeout(() => scheduleEndLogoFit(), 120);
          }
        }
      },
      { threshold: 0.05 }
    );
    io.observe(endSection);
  }
}

if (NEURAL_BACKGROUND_ENABLED) {
  initNeuralBackground();
}

export let targetMouseX = 0;
export let targetMouseY = 0;
export let currentMouseX = 0;
export let currentMouseY = 0;
if (!prefersReducedMotionGlobal) {
  window.addEventListener("pointermove", (event) => {
    targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = (event.clientY / window.innerHeight) * 2 - 1;
  });
}

let glowLevel = 0;
let elapsed = 0;
let lastFrameTime = performance.now();
let lastAnimatedScrollY = -1;
let rectsDirty = true;
let heroSyncDirty = true;

window.addEventListener(
  "scroll",
  () => {
    rectsDirty = true;
    heroSyncDirty = true;
  },
  { passive: true }
);
window.addEventListener(
  "resize",
  () => {
    rectsDirty = true;
    heroSyncDirty = true;
  },
  { passive: true }
);

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  elapsed += dt;

  const docMaxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const docProgress = Math.min(Math.max(latestScrollY / docMaxScroll, 0), 1);
  const scrollChanged = latestScrollY !== lastAnimatedScrollY;
  lastAnimatedScrollY = latestScrollY;

  if (heroSyncDirty || scrollChanged) {
    syncHeroBrainWithScroll();
    heroSyncDirty = false;
  }
  if (rectsDirty || scrollChanged) {
    refreshWrapRects();
    rectsDirty = false;
  }

  const scrollRot = docProgress * Math.PI * 2.75;

  if (splineTargets.length || logoSplineTargets.length) {
    if (!prefersReducedMotionGlobal) {
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;
    }
  } else if (prefersReducedMotionGlobal) {
    sceneMotion.sharedPulse = 0;
  }

  const pulse = (Math.sin(elapsed * 2.2) + 1) * 0.5;
  const targetGlow = docProgress > 0.5 ? (docProgress - 0.5) * 2 : 0;
  glowLevel += (targetGlow - glowLevel) * 0.06;

  const navVisible = logoSplineTargets.some((t) => t.kind === "nav" && t.ready && t._visible);
  if (navVisible && scrollChanged) {
    applyNavLogoSplineScrollSpin(scrollRot);
  }

  if (!prefersReducedMotionGlobal) {
    sceneMotion.sharedPulse += (pulse - sceneMotion.sharedPulse) * 0.22;
  }

  /* Sync DOM rect del hero solo cuando el scroll/layout cambia. */
  if (scrollChanged) {
    splineTargets.forEach((target) => {
      syncHeroSplineFrame(target);
    });
  }

  if (!isMobileBg) {
    drawPerspectiveGrid(docProgress);
    drawParticles(docProgress, elapsed);
  }
  if (NEURAL_BACKGROUND_ENABLED) {
    drawNeuralNetwork();
  }
  updateNebula(docProgress, currentMouseX * 0.02, currentMouseY * 0.02);
}

export { animate };
export { sceneMotion } from "./scroll.js";

animate(performance.now());
