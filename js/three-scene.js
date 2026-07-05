import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { Application } from "https://cdn.jsdelivr.net/npm/@splinetool/runtime@1.12.67/build/runtime.js";
import { latestScrollY, sceneMotion, prefersReducedMotionGlobal, isMobileBg } from "./scroll.js";

import {
  initParticles,
  updateBackgroundCanvasSize,
  drawPerspectiveGrid,
  drawParticles,
  updateNebula,
  syncBrainRectFromWrap,
} from "./background.js";
import { drawNeuralNetwork, initNeuralBackground } from "./neural-background.js";

const SPLINE_SCENE_URL = "./assets/3d/particle-ai-brain.splinecode";
/** Zoom Spline = cerebro más grande en pantalla (sin solo desplazar el contenedor). */
const HERO_BRAIN_ZOOM_DESKTOP = 2.28;
const HERO_BRAIN_ZOOM_MOBILE = 1.55;
/** Perfil lateral del logo nav al inicio (no de frente). */
const NAV_BRAIN_BASE_ROT_Y = -Math.PI * 0.5;

const navWrap = document.getElementById("nav-brain-wrap");
const heroWrap = document.getElementById("hero-brain-wrap");
const hasNavBrain = Boolean(navWrap);
const hasHeroBrain = Boolean(heroWrap);
const hasBrainScene = hasNavBrain || hasHeroBrain;

/** Tamaño y zoom del hero Spline fijados al valor inicial (no cambian con el scroll). */
let lockedHeroBrainPx = null;
let lockedHeroBrainZoom = null;
let wasInProcesoBrain = false;

function lockHeroBrainDimensions() {
  if (!heroWrap) return null;
  heroWrap.style.removeProperty("width");
  heroWrap.style.removeProperty("height");
  const size = Math.max(Math.round(heroWrap.getBoundingClientRect().width), 1);
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
  if (heroWrap) wrapResizeObserver.observe(heroWrap);
}
window.addEventListener("resize", refreshWrapRects, { passive: true });

function syncHeroBrainWithScroll() {
  if (!heroWrap) return;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const vh = window.innerHeight;
  const procesoSection = document.getElementById("proceso");
  const procesoAnchor = document.getElementById("proceso-brain-anchor");

  if (procesoSection && procesoAnchor) {
    const sectionRect = procesoSection.getBoundingClientRect();
    const inProceso = sectionRect.top <= vh * 0.02 && sectionRect.bottom >= vh * 0.98;

    if (inProceso !== wasInProcesoBrain) {
      wasInProcesoBrain = inProceso;
      lockedHeroBrainPx = null;
      lockedHeroBrainZoom = null;
      heroWrap.style.removeProperty("width");
      heroWrap.style.removeProperty("height");
      lockHeroBrainDimensions();
      resizeHeroSpline();
    }

    if (inProceso) {
      const anchorRect = procesoAnchor.getBoundingClientRect();
      heroWrap.classList.add("hero__canvas-wrap--proceso");
      heroWrap.style.setProperty("--brain-scroll-x", `${anchorRect.left + anchorRect.width / 2}px`);
      heroWrap.style.setProperty("--brain-scroll-y", `${anchorRect.top + anchorRect.height / 2}px`);
      return;
    }

    heroWrap.classList.remove("hero__canvas-wrap--proceso");
  } else {
    heroWrap.classList.remove("hero__canvas-wrap--proceso");
    wasInProcesoBrain = false;
  }

  const startRatio = isMobile ? 0.56 : 0.5;
  const startY = vh * startRatio;
  const topY = startY + Math.max(latestScrollY, 0);
  heroWrap.style.setProperty("--brain-scroll-y", `${topY}px`);

  const docMaxScroll = Math.max(document.documentElement.scrollHeight - vh, 1);
  const docProgress = Math.min(Math.max(latestScrollY / docMaxScroll, 0), 1);
  const xPercent = isMobile ? 50 : 73 + (50 - 73) * docProgress;
  heroWrap.style.setProperty("--brain-scroll-x", `${xPercent}%`);
}

/* ——— Nav: cerebro GLB original (Three.js) ——— */
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0.05, 2.15);

export const spinGroup = new THREE.Group();
export const tiltGroup = new THREE.Group();
scene.add(spinGroup);
spinGroup.add(tiltGroup);

let navRenderer = null;

function createNavRenderer() {
  if (!navWrap) return null;
  const targetRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  targetRenderer.outputColorSpace = THREE.SRGBColorSpace;
  targetRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  targetRenderer.toneMappingExposure = 0.96;
  navWrap.appendChild(targetRenderer.domElement);

  targetRenderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
  });
  targetRenderer.domElement.addEventListener("webglcontextrestored", () => {
    updateNavRendererSize();
  });

  navRenderer = targetRenderer;
  return targetRenderer;
}

if (hasNavBrain) {
  createNavRenderer();
}

const hemi = new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.82);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.95);
dir.position.set(1.5, 2.5, 2);
scene.add(dir);
const fill = new THREE.DirectionalLight(0xd0d0d0, 0.34);
fill.position.set(-2, 0.5, -1);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.2);
rim.position.set(0, 0, -2);
scene.add(rim);

export const innerPulseLight = new THREE.PointLight(0xffffff, 0.42, 6, 2);
innerPulseLight.position.set(0, 0.1, 0.35);
tiltGroup.add(innerPulseLight);

const whiteColor = new THREE.Color(0xffffff);
const softGrayColor = new THREE.Color(0xb0b0b0);
const pulseColor = new THREE.Color();

/** Convierte la textura base del GLB a escala de grises (el color neón viene del map, no de mat.color). */
function textureToMonochrome(texture) {
  const image = texture?.image;
  if (!image?.width || !image?.height) return texture;

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
    const contrast = 1.2;
    const centered = (lum / 255 - 0.5) * contrast + 0.5;
    const v = Math.round(Math.min(255, Math.max(0, centered * 255)));
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);

  const grayTex = new THREE.CanvasTexture(canvas);
  grayTex.colorSpace = THREE.SRGBColorSpace;
  grayTex.flipY = Boolean(texture.flipY);
  grayTex.needsUpdate = true;
  return grayTex;
}

function applyNavBrainMonochromeMaterials(root) {
  root.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((mat) => {
      if (!mat) return;
      mat.vertexColors = false;

      if (mat.map) {
        mat.map = textureToMonochrome(mat.map);
      }
      if (mat.emissiveMap) {
        mat.emissiveMap.dispose?.();
        mat.emissiveMap = null;
      }

      mat.color.set(0xffffff);
      if ("emissive" in mat) {
        mat.emissive.set(0x000000);
        mat.emissiveIntensity = 0;
      }
      if ("metalness" in mat) mat.metalness = 0.42;
      if ("roughness" in mat) mat.roughness = 0.48;
      mat.needsUpdate = true;
    });
  });
}

let fallbackMesh = null;

function addFallbackMesh() {
  if (!hasNavBrain || fallbackMesh) return;
  const geo = new THREE.IcosahedronGeometry(0.62, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    metalness: 0.52,
    roughness: 0.34,
    emissive: 0x141414,
    emissiveIntensity: 0.12,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 })
  );
  mesh.add(line);
  tiltGroup.add(mesh);
  fallbackMesh = mesh;
}

function removeFallbackMesh() {
  if (!fallbackMesh) return;
  tiltGroup.remove(fallbackMesh);
  fallbackMesh.traverse((node) => {
    if (node.geometry?.dispose) node.geometry.dispose();
    if (node.material) {
      if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose?.());
      else node.material.dispose?.();
    }
  });
  fallbackMesh = null;
}

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
loader.setDRACOLoader(dracoLoader);

let glbLoadTriggered = false;

function loadNavBrainModel() {
  if (!hasNavBrain || glbLoadTriggered) return;
  glbLoadTriggered = true;

  loader.load(
    "./assets/3d/logo.glb",
    (gltf) => {
      removeFallbackMesh();
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1.42 / maxDim;
      model.scale.setScalar(scale);
      box.setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      applyNavBrainMonochromeMaterials(model);

      tiltGroup.add(model);
    },
    undefined,
    () => {
      /* fallback mesh ya visible */
    }
  );
}

if (hasNavBrain) {
  addFallbackMesh();
  loadNavBrainModel();
}

function applyNavBrainRotation({ scrollRot, scrollBlend }) {
  if (prefersReducedMotionGlobal) {
    spinGroup.rotation.y = NAV_BRAIN_BASE_ROT_Y + scrollRot * 0.35;
    tiltGroup.rotation.x = 0;
    tiltGroup.rotation.y = 0;
    return;
  }

  spinGroup.rotation.y = NAV_BRAIN_BASE_ROT_Y + scrollRot;
  tiltGroup.rotation.y = currentMouseX * 0.18 * scrollBlend;
  tiltGroup.rotation.x = -currentMouseY * 0.12 * scrollBlend;
}

function updateNavRendererSize() {
  if (!navRenderer || !navWrap) return;
  refreshWrapRects();
  const size = Math.max(Math.round(navWrap.clientWidth), 1);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  navRenderer.setSize(size, size, false);
  navRenderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileBg ? 1 : 2));
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
  const eventManager = target.app.eventManager;
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

function createHeroSplineBrain() {
  if (!heroWrap) return null;

  const canvas = document.createElement("canvas");
  canvas.className = "hero__brain-canvas";
  canvas.setAttribute("aria-hidden", "true");
  heroWrap.appendChild(canvas);

  const app = new Application(canvas);
  const target = { wrap: heroWrap, canvas, app, ready: false, rotRoot: null };
  splineTargets.push(target);

  app
    .load(SPLINE_SCENE_URL)
    .then(() => {
      target.ready = true;
      target.rotRoot = pickRotationRoot(app);
      app.play?.();
      applyHeroBrainZoom(target);
      configureHeroBrainInteraction(target);
      syncSplineDomRect(target);
      resizeHeroSpline();
    })
    .catch(() => {});

  return target;
}

if (hasHeroBrain) {
  lockHeroBrainDimensions();
  createHeroSplineBrain();
}

/** Spline cachea getBoundingClientRect(); refrescarlo si el wrap se mueve o rota. */
function syncSplineDomRect(target) {
  if (!target?.ready || !target.canvas) return;
  const ctx = target.app._eventManager?.eventContext;
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
  updateNavRendererSize();
  resizeHeroSpline();
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
    if (!hasHeroBrain) return;
    lockedHeroBrainPx = null;
    lockedHeroBrainZoom = null;
    lockHeroBrainDimensions();
    resizeHeroSpline();
    refreshWrapRects();
  },
  { once: true }
);

initNeuralBackground();

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

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  elapsed += dt;

  const docMaxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const docProgress = Math.min(Math.max(latestScrollY / docMaxScroll, 0), 1);
  syncHeroBrainWithScroll();
  refreshWrapRects();

  const scrollRot = docProgress * Math.PI * 2.75;
  const scrollBlend = Math.min(Math.max(latestScrollY / 320, 0), 1);

  if (hasNavBrain || splineTargets.length) {
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

  if (hasNavBrain) {
    if (navRenderer) {
      navRenderer.toneMappingExposure = 1.22;
    }

    if (prefersReducedMotionGlobal) {
      innerPulseLight.intensity = 0.48;
      innerPulseLight.color.set(0xffffff);
      dir.intensity = 0.94;
      fill.intensity = 0.46;
      rim.intensity = 0.24;
    } else {
      innerPulseLight.intensity = 0.48 + pulse * 0.18 + glowLevel * 0.06;
      pulseColor.copy(whiteColor).lerp(softGrayColor, pulse * 0.08);
      innerPulseLight.color.copy(pulseColor);
      dir.intensity = 1.04 + glowLevel * 0.1;
      fill.intensity = 0.52 + glowLevel * 0.08;
      rim.intensity = 0.28 + pulse * 0.05;
    }

    applyNavBrainRotation({ scrollRot, scrollBlend });
    navRenderer?.render(scene, camera);
  }

  if (!prefersReducedMotionGlobal) {
    sceneMotion.sharedPulse += (pulse - sceneMotion.sharedPulse) * 0.22;
  }

  splineTargets.forEach((target) => {
    syncHeroSplineFrame(target);
  });

  drawPerspectiveGrid(docProgress);
  drawParticles(docProgress, elapsed);
  drawNeuralNetwork();
  updateNebula(docProgress, currentMouseX * 0.02, currentMouseY * 0.02);
}

export { animate };
export { sceneMotion } from "./scroll.js";

animate(performance.now());
