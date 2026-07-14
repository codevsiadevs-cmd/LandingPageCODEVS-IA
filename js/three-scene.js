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
/** Perfil lateral del logo nav al inicio (lado opuesto). */
const NAV_BRAIN_BASE_ROT_Y = Math.PI * 0.5;

const navWrap = document.getElementById("nav-brain-wrap");
const footerWrap = document.getElementById("footer-brain-wrap");
const endLogoWrap = document.getElementById("end-logo-brain-wrap");
const endLogoMirrorWrap = document.getElementById("end-logo-brain-wrap-mirror");
const heroWrap = document.getElementById("hero-brain-wrap");
const hasNavBrain = Boolean(navWrap);
const hasFooterBrain = Boolean(footerWrap);
const hasEndLogoBrain = Boolean(endLogoWrap);
const hasEndLogoMirrorBrain = Boolean(endLogoMirrorWrap);
const hasHeroBrain = Boolean(heroWrap);
/** Logos usan el cerebro Spline del hero; ya no el GLB Three.js. */
const hasBrandBrain = false;
const hasLogoSplineBrain =
  hasNavBrain || hasFooterBrain || hasEndLogoBrain || hasEndLogoMirrorBrain;
const hasBrainScene = hasHeroBrain || hasLogoSplineBrain;

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
  if (footerWrap) wrapResizeObserver.observe(footerWrap);
  if (endLogoWrap) wrapResizeObserver.observe(endLogoWrap);
  if (heroWrap) wrapResizeObserver.observe(heroWrap);
}
window.addEventListener("resize", refreshWrapRects, { passive: true });

const techSectionEl = document.getElementById("tecnologias");
const whySectionEl = document.getElementById("nosotros");
const contactSectionEl = document.getElementById("contacto");

function syncHeroBrainWithScroll() {
  if (!heroWrap) return;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const vh = window.innerHeight;

  heroWrap.classList.remove("hero__canvas-wrap--proceso");
  wasInProcesoBrain = false;

  /* Y fijo en el centro vertical del viewport. */
  heroWrap.style.setProperty("--brain-scroll-y", "50vh");

  if (isMobile) {
    heroWrap.style.setProperty("--brain-scroll-x", "50%");
  } else {
    /* X: desde el stack hasta salir del slider de Por qué CODEVS IA. */
    const stackStart = techSectionEl
      ? Math.max(techSectionEl.getBoundingClientRect().top + latestScrollY, 0)
      : vh;
    const centerDoneAt = contactSectionEl
      ? Math.max(contactSectionEl.getBoundingClientRect().top + latestScrollY - vh * 0.15, stackStart + 1)
      : whySectionEl
        ? Math.max(whySectionEl.getBoundingClientRect().bottom + latestScrollY - vh, stackStart + 1)
        : Math.max(document.documentElement.scrollHeight - vh, stackStart + 1);
    const range = Math.max(centerDoneAt - stackStart, 1);
    const raw = Math.min(Math.max((latestScrollY - stackStart) / range, 0), 1);
    const eased = raw * raw * (3 - 2 * raw);
    const xPercent = raw >= 0.98 ? 50 : 73 + (50 - 73) * eased;
    heroWrap.style.setProperty("--brain-scroll-x", `${xPercent}%`);
  }

  heroWrap.style.removeProperty("opacity");

  /* Interacción al inicio; el cerebro permanece detrás del texto (desktop y móvil). */
  const interactive = latestScrollY < vh * 0.72;
  heroWrap.classList.toggle("hero__canvas-wrap--interactive", interactive);
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
let footerRenderer = null;

function createBrandRenderer(wrap, onContextRestore) {
  if (!wrap) return null;
  const targetRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  targetRenderer.outputColorSpace = THREE.SRGBColorSpace;
  targetRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  targetRenderer.toneMappingExposure = 1.22;
  wrap.appendChild(targetRenderer.domElement);

  targetRenderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
  });
  targetRenderer.domElement.addEventListener("webglcontextrestored", () => {
    onContextRestore?.();
  });

  return targetRenderer;
}

function updateBrandRendererSize(renderer, wrap) {
  if (!renderer || !wrap) return;
  const size = Math.max(Math.round(wrap.clientWidth), 1);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  renderer.setSize(size, size, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileBg ? 1 : 2));
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
  if (!hasBrandBrain || fallbackMesh) return;
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
  if (!hasBrandBrain || glbLoadTriggered) return;
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

if (hasBrandBrain) {
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
  refreshWrapRects();
  updateBrandRendererSize(navRenderer, navWrap);
}

function updateFooterRendererSize() {
  updateBrandRendererSize(footerRenderer, footerWrap);
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

/* Cerebro Spline en logos: navbar/footer lejos; cierre más cerca (más grande) */
const NAV_LOGO_BRAIN_ZOOM_DESKTOP = 0.1;
const NAV_LOGO_BRAIN_ZOOM_MOBILE = 0.08;
const FOOTER_LOGO_BRAIN_ZOOM_DESKTOP = NAV_LOGO_BRAIN_ZOOM_DESKTOP;
const FOOTER_LOGO_BRAIN_ZOOM_MOBILE = NAV_LOGO_BRAIN_ZOOM_MOBILE;
const END_LOGO_BRAIN_ZOOM_DESKTOP = 0.55;
/** Móvil: zoom más abierto para que el mesh+partículas entren enteros en la caja. */
const END_LOGO_BRAIN_ZOOM_MOBILE = 0.18;

/** @type {{ wrap: HTMLElement, canvas: HTMLCanvasElement, app: *, ready: boolean, kind: "nav" | "footer" | "end" }[]} */
const logoSplineTargets = [];

function applyLogoBrainZoom(target) {
  if (!target?.ready) return;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  let zoom;
  if (target.kind === "end") {
    zoom = isMobile ? END_LOGO_BRAIN_ZOOM_MOBILE : END_LOGO_BRAIN_ZOOM_DESKTOP;
  } else if (target.kind === "footer") {
    zoom = isMobile ? FOOTER_LOGO_BRAIN_ZOOM_MOBILE : FOOTER_LOGO_BRAIN_ZOOM_DESKTOP;
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
  syncSplineDomRect(target);
}

function setSplinePlaying(target, playing) {
  if (!target?.ready || !target.app) return;
  if (target._playing === playing) return;
  target._playing = playing;
  if (playing) target.app.play?.();
  else target.app.stop?.();
}

function captureNavLogoOrbitBaseline(target) {
  if (!target?.ready) return;
  const orbit = getHeroBrainOrbit(target);
  if (!orbit?.object || !orbit.target) return;
  const offset = new THREE.Vector3().subVectors(orbit.object.position, orbit.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  target._navOrbitPhi = spherical.phi;
  target._navOrbitRadius = spherical.radius;
}

/** Solo navbar: gira el cerebro Spline según el scroll (no footer ni logo final). */
function applyNavLogoSplineScrollSpin(scrollRot) {
  for (const target of logoSplineTargets) {
    if (target.kind !== "nav" || !target.ready) continue;

    const spin = prefersReducedMotionGlobal ? scrollRot * 0.2 : scrollRot;
    /* Gira hacia la izquierda al scrollear; mantiene el perfil inicial. */
    const theta = NAV_BRAIN_BASE_ROT_Y - spin;
    const orbit = getHeroBrainOrbit(target);

    if (orbit?.object && orbit.target) {
      if (target._navOrbitRadius == null) captureNavLogoOrbitBaseline(target);
      const offset = new THREE.Vector3().subVectors(orbit.object.position, orbit.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.radius = target._navOrbitRadius ?? spherical.radius;
      spherical.phi = target._navOrbitPhi ?? spherical.phi;
      spherical.theta = theta;
      orbit.object.position.setFromSpherical(spherical).add(orbit.target);
      orbit.object.lookAt(orbit.target);
      orbit.update?.();
      continue;
    }

    const deg = ((theta * 180) / Math.PI) % 360;
    target.canvas.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
  }
}

function resizeAllLogoSplines() {
  logoSplineTargets.forEach(resizeLogoSpline);
}

function createLogoSplineBrain(wrap, kind = "nav") {
  if (!wrap || wrap.dataset.splineMounted === "1") return null;
  wrap.dataset.splineMounted = "1";

  wrap.classList.add("logo-brain");

  const canvas = document.createElement("canvas");
  canvas.className = "logo-brain__canvas hero__brain-canvas";
  canvas.setAttribute("aria-hidden", "true");
  wrap.appendChild(canvas);

  const app = new Application(canvas);
  const target = { wrap, canvas, app, ready: false, kind, _playing: false, _visible: false };
  logoSplineTargets.push(target);

  app
    .load(SPLINE_SCENE_URL)
    .then(() => {
      target.ready = true;
      applyLogoBrainZoom(target);
      setHeroBrainOrbit(target, false);
      if (kind === "nav") {
        captureNavLogoOrbitBaseline(target);
        const docMaxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const docProgress = Math.min(Math.max(latestScrollY / docMaxScroll, 0), 1);
        applyNavLogoSplineScrollSpin(docProgress * Math.PI * 2.75);
      }
      patchSplineScrollFlags(target);
      resizeLogoSpline(target);
      setSplinePlaying(target, target._visible);
      requestAnimationFrame(() => {
        resizeLogoSpline(target);
        applyLogoBrainZoom(target);
      });
    })
    .catch(() => {});

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
/* El panel espejo queda oculto en CSS (móvil y web); no montar segundo Spline. */

/** Escala el logo final al ancho (mismas proporciones web/móvil). */
function fitEndLogoToWidth() {
  const panels = [...document.querySelectorAll(".nav__brand-panel--end-natural")];
  if (!panels.length) return;

  const section = panels[0].closest(".end-logo");
  if (!section) return;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const styles = getComputedStyle(section);
  const padX =
    (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
  const fill = isMobile ? 0.9 : 0.97;
  const available = Math.max(section.clientWidth - padX, 1) * fill;

  const panel = panels[0];
  const savedMax = panel.style.maxWidth;
  panel.style.maxWidth = "none";
  panel.style.removeProperty("transform");

  const probe = 100;
  panel.style.setProperty("--nav-brand-mark", `${probe}px`);
  void panel.offsetWidth;
  const natural = Math.max(panel.scrollWidth, panel.offsetWidth, 1);
  const mark = Math.max((available / natural) * probe, 24);
  panel.style.setProperty("--nav-brand-mark", `${mark}px`);

  panel.style.maxWidth = savedMax;

  logoSplineTargets.forEach((target) => {
    if (target.kind === "end") resizeLogoSpline(target);
  });

  window.dispatchEvent(new CustomEvent("end-logo-fitted"));
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
  fitEndLogoToWidth();
  updateNavRendererSize();
  updateFooterRendererSize();
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
    fitEndLogoToWidth();
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
    fitEndLogoToWidth();
    resizeAllLogoSplines();
  });
}

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
  drawNeuralNetwork();
  updateNebula(docProgress, currentMouseX * 0.02, currentMouseY * 0.02);
}

export { animate };
export { sceneMotion } from "./scroll.js";

animate(performance.now());
