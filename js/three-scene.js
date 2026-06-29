import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
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

const navWrap = document.getElementById("nav-brain-wrap");
const heroWrap = document.getElementById("hero-brain-wrap");
const hasBrainScene = Boolean(navWrap || heroWrap);

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
  const startRatio = isMobile ? 0.52 : 0.46;
  const startY = window.innerHeight * startRatio;
  const docY = startY + Math.max(latestScrollY, 0);
  heroWrap.style.setProperty("--brain-scroll-y", `${docY}px`);
}

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0.05, 2.15);

export const spinGroup = new THREE.Group();
export const tiltGroup = new THREE.Group();
scene.add(spinGroup);
spinGroup.add(tiltGroup);

const renderTargets = [];
const HERO_Y_OFFSET = Math.PI * 0.38;

function createRenderer(wrap, { maxPixelRatio = 2, role = "nav" } = {}) {
  if (!wrap) return null;
  const targetRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  targetRenderer.outputColorSpace = THREE.SRGBColorSpace;
  targetRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  targetRenderer.toneMappingExposure = 0.96;
  wrap.appendChild(targetRenderer.domElement);

  targetRenderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
  });
  targetRenderer.domElement.addEventListener("webglcontextrestored", () => {
    updateRendererSize();
  });

  renderTargets.push({ wrap, renderer: targetRenderer, maxPixelRatio, role });
  return targetRenderer;
}

export let renderer = null;
if (hasBrainScene) {
  renderer = createRenderer(navWrap, { maxPixelRatio: isMobileBg ? 1 : 2, role: "nav" });
  createRenderer(heroWrap, { maxPixelRatio: isMobileBg ? 1 : 1.75, role: "hero" });
}

updateBackgroundCanvasSize();
initParticles();
window.addEventListener("resize", () => {
  updateRendererSize();
  updateBackgroundCanvasSize();
  initParticles();
  syncHeroBrainWithScroll();
});
if (hasBrainScene) {
  refreshWrapRects();
  updateRendererSize();
  syncHeroBrainWithScroll();
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

const hemi = new THREE.HemisphereLight(0xf0f4ff, 0x1a2235, 0.82);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0x0fffd4, 0.92);
dir.position.set(1.5, 2.5, 2);
scene.add(dir);
const fill = new THREE.DirectionalLight(0x7b61ff, 0.42);
fill.position.set(-2, 0.5, -1);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.18);
rim.position.set(0, 0, -2);
scene.add(rim);

export const innerPulseLight = new THREE.PointLight(0x0fffd4, 0.42, 6, 2);
innerPulseLight.position.set(0, 0.1, 0.35);
tiltGroup.add(innerPulseLight);

const cyanColor = new THREE.Color(0x0fffd4);
const purpleColor = new THREE.Color(0x7b61ff);
const pulseColor = new THREE.Color();

let fallbackMesh = null;

function addFallbackMesh() {
  if (!hasBrainScene || fallbackMesh) return;
  const geo = new THREE.IcosahedronGeometry(0.62, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a2235,
    metalness: 0.4,
    roughness: 0.35,
    emissive: 0x0a3d35,
    emissiveIntensity: 0.35,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x0fffd4, transparent: true, opacity: 0.5 })
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

function loadBrainModel() {
  if (!hasBrainScene || glbLoadTriggered) return;
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

      model.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (!mat) return;
          if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
          mat.vertexColors = false;
          if ("emissive" in mat && mat.color) {
            mat.emissive.copy(mat.color).multiplyScalar(0.14);
            mat.emissiveIntensity = 0.24;
          }
          if ("metalness" in mat) mat.metalness = Math.min(0.65, (mat.metalness || 0.35) + 0.06);
          if ("roughness" in mat) mat.roughness = Math.max(0.28, (mat.roughness || 0.45) - 0.06);
          mat.needsUpdate = true;
        });
      });

      tiltGroup.add(model);
    },
    undefined,
    () => {
      /* fallback mesh ya visible */
    }
  );
}

if (hasBrainScene) {
  addFallbackMesh();
  loadBrainModel();
}

let glowLevel = 0;

function applyBrainRotation({ role, scrollRot, scrollBlend }) {
  const yOffset = role === "hero" ? HERO_Y_OFFSET : 0;

  if (prefersReducedMotionGlobal) {
    spinGroup.rotation.y = yOffset + scrollRot * 0.35;
    tiltGroup.rotation.x = 0;
    tiltGroup.rotation.y = 0;
    return;
  }

  spinGroup.rotation.y = yOffset + scrollRot;
  tiltGroup.rotation.y = currentMouseX * 0.18 * scrollBlend;
  tiltGroup.rotation.x = -currentMouseY * 0.12 * scrollBlend;
}

function updateRendererSize() {
  if (!renderTargets.length) return;
  refreshWrapRects();
  renderTargets.forEach(({ wrap, renderer: targetRenderer, maxPixelRatio }) => {
    const size = Math.max(Math.round(wrap.clientWidth), 1);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    targetRenderer.setSize(size, size, false);
    targetRenderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  });
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.elapsedTime;
  const docMaxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const docProgress = Math.min(Math.max(latestScrollY / docMaxScroll, 0), 1);
  syncHeroBrainWithScroll();
  refreshWrapRects();

  if (renderTargets.length) {
    const scrollRot = docProgress * Math.PI * 2.75;
    const scrollBlend = Math.min(Math.max(latestScrollY / 320, 0), 1);

    if (!prefersReducedMotionGlobal) {
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;
    }
  } else if (prefersReducedMotionGlobal) {
    sceneMotion.sharedPulse = 0;
  }

  const pulse = (Math.sin(t * 2.2) + 1) * 0.5;
  if (!prefersReducedMotionGlobal) {
    sceneMotion.sharedPulse += (pulse - sceneMotion.sharedPulse) * 0.22;
  }
  const targetGlow = docProgress > 0.5 ? (docProgress - 0.5) * 2 : 0;
  glowLevel += (targetGlow - glowLevel) * 0.06;
  if (renderTargets.length) {
    if (prefersReducedMotionGlobal) {
      innerPulseLight.intensity = 0.38;
      innerPulseLight.color.set(0x0fffd4);
      dir.intensity = 0.72;
      fill.intensity = 0.34;
      rim.intensity = 0.14;
    } else {
      innerPulseLight.intensity = 0.34 + pulse * 0.18 + glowLevel * 0.06;
      pulseColor.copy(cyanColor).lerp(purpleColor, pulse * 0.22);
      innerPulseLight.color.copy(pulseColor);
      dir.intensity = 0.78 + glowLevel * 0.1;
      fill.intensity = 0.38 + glowLevel * 0.08;
      rim.intensity = 0.16 + pulse * 0.05;
    }
  }

  drawPerspectiveGrid(docProgress);
  drawParticles(docProgress, t);
  drawNeuralNetwork();
  updateNebula(docProgress, currentMouseX * 0.02, currentMouseY * 0.02);

  const scrollRot = docProgress * Math.PI * 2.75;
  const scrollBlend = Math.min(Math.max(latestScrollY / 320, 0), 1);

  renderTargets.forEach(({ renderer: targetRenderer, role }) => {
    applyBrainRotation({ role, scrollRot, scrollBlend });
    targetRenderer.render(scene, camera);
  });
}

export { animate };
export { sceneMotion } from "./scroll.js";

animate();
