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

const wrap = document.getElementById("hero-canvas-wrap");

/**
 * Cache del rect del wrap del cerebro: el wrap es position:fixed centrado, así
 * que sólo cambia cuando el viewport cambia de tamaño. Lo refrescamos vía
 * ResizeObserver (y resize) en lugar de leerlo cada frame.
 */
let wrapRect = wrap ? wrap.getBoundingClientRect() : null;

function refreshWrapRect() {
  if (!wrap) return;
  wrapRect = wrap.getBoundingClientRect();
}

if (wrap && typeof ResizeObserver !== "undefined") {
  const wrapResizeObserver = new ResizeObserver(refreshWrapRect);
  wrapResizeObserver.observe(wrap);
}
window.addEventListener("resize", refreshWrapRect, { passive: true });

let reducedOffscreen = null;

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0.2, 2.95);
const baseCameraZ = 2.95;
let targetCameraZ = baseCameraZ;

export let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
wrap.appendChild(renderer.domElement);

// WebGL context loss/restore: evita que el navegador “mate” la página al recuperar GPU.
renderer.domElement.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();
});
renderer.domElement.addEventListener("webglcontextrestored", () => {
  updateRendererSize();
});

updateBackgroundCanvasSize();
initParticles();
if (typeof OffscreenCanvas !== "undefined" && !isMobileBg) {
  reducedOffscreen = new OffscreenCanvas(1, 1);
}
window.addEventListener("resize", () => {
  updateRendererSize();
  updateBackgroundCanvasSize();
  initParticles();
});
updateRendererSize();

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

const hemi = new THREE.HemisphereLight(0xf0f4ff, 0x1a2235, 0.85);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0x0fffd4, 1.1);
dir.position.set(2, 4, 3);
scene.add(dir);
const fill = new THREE.DirectionalLight(0x7b61ff, 0.55);
fill.position.set(-3, 1, -2);
scene.add(fill);

export const spinGroup = new THREE.Group();
export const tiltGroup = new THREE.Group();
scene.add(spinGroup);
spinGroup.add(tiltGroup);

export const innerPulseLight = new THREE.PointLight(0x0fffd4, 1.2, 6, 2);
innerPulseLight.position.set(0, 0.15, 0.4);
tiltGroup.add(innerPulseLight);

const cyanColor = new THREE.Color(0x0fffd4);
const purpleColor = new THREE.Color(0x7b61ff);
const pulseColor = new THREE.Color();

let fallbackMesh = null;

function addFallbackMesh() {
  if (fallbackMesh) return;
  const geo = new THREE.IcosahedronGeometry(0.95, 1);
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

const progressEl = document.getElementById("glb-progress");
const progressLabelEl = document.getElementById("glb-progress-label");

function setGlbProgress(pct) {
  if (!progressEl) return;
  const value = Math.max(0, Math.min(100, pct));
  const rounded = Math.round(value);
  progressEl.style.setProperty("--glb-progress", `${value}%`);
  progressEl.setAttribute("aria-valuenow", String(rounded));
  progressEl.setAttribute("aria-hidden", "false");
  progressEl.classList.add("glb-progress--visible");
  if (progressLabelEl) progressLabelEl.textContent = `Cargando ${rounded}%`;
}

function hideGlbProgress() {
  if (!progressEl) return;
  progressEl.classList.remove("glb-progress--visible");
  progressEl.setAttribute("aria-hidden", "true");
}

let glbLoadTriggered = false;

function loadHeroModel() {
  if (glbLoadTriggered) return;
  glbLoadTriggered = true;
  setGlbProgress(0);

  loader.load(
    "./assets/3d/logo.glb",
    (gltf) => {
      removeFallbackMesh();
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1.95 / maxDim;
      model.scale.setScalar(scale);
      box.setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      tiltGroup.add(model);
      setGlbProgress(100);
      window.setTimeout(hideGlbProgress, 380);
    },
    (xhr) => {
      if (xhr && xhr.total) {
        setGlbProgress((xhr.loaded / xhr.total) * 100);
      }
    },
    () => {
      hideGlbProgress();
    }
  );
}

addFallbackMesh();

if (wrap && typeof IntersectionObserver !== "undefined") {
  const heroIo = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadHeroModel();
        obs.disconnect();
      });
    },
    { root: null, threshold: 0.05, rootMargin: "0px 0px 10% 0px" }
  );
  heroIo.observe(wrap);
} else {
  loadHeroModel();
}

let glowLevel = 0;

function updateRendererSize() {
  if (!wrap || !renderer) return;
  refreshWrapRect();
  const size = Math.max(Math.round(wrapRect ? wrapRect.width : wrap.clientWidth), 1);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
  renderer.setSize(size, size, false);
  renderer.setPixelRatio(isMobileBg ? 1 : Math.min(window.devicePixelRatio, 2));
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const docMaxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const docProgress = Math.min(Math.max(latestScrollY / docMaxScroll, 0), 1);
  if (wrapRect) {
    syncBrainRectFromWrap(wrapRect);
  }

  if (prefersReducedMotionGlobal) {
    spinGroup.rotation.y += dt * 0.18;
    tiltGroup.rotation.x = 0;
    tiltGroup.rotation.y = 0;
    sceneMotion.sharedPulse = 0;
  } else {
    currentMouseX += (targetMouseX - currentMouseX) * 0.05;
    currentMouseY += (targetMouseY - currentMouseY) * 0.05;
    sceneMotion.scrollSpinBoost *= 0.9;
    const spinSpeed = 0.24 + sceneMotion.scrollSpinBoost;
    spinGroup.rotation.y += dt * spinSpeed;
    tiltGroup.rotation.y = currentMouseX * 0.35;
    tiltGroup.rotation.x = -currentMouseY * 0.22;
  }

  if (!prefersReducedMotionGlobal) {
    const heroRange = Math.min(Math.max(latestScrollY / Math.max(window.innerHeight, 1), 0), 1.8);
    targetCameraZ = baseCameraZ + heroRange * 0.9;
    camera.position.z += (targetCameraZ - camera.position.z) * 0.05;
  }

  const pulse = (Math.sin(t * 2.2) + 1) * 0.5;
  const pulseIntensity = 0.8 + pulse * 1.7;
  if (!prefersReducedMotionGlobal) {
    sceneMotion.sharedPulse += (pulse - sceneMotion.sharedPulse) * 0.22;
  }
  const targetGlow = docProgress > 0.5 ? (docProgress - 0.5) * 2 : 0;
  glowLevel += (targetGlow - glowLevel) * 0.06;
  if (prefersReducedMotionGlobal) {
    innerPulseLight.intensity = 0.95;
    innerPulseLight.color.set(0x0fffd4);
    dir.intensity = 0.9;
    fill.intensity = 0.45;
  } else {
    innerPulseLight.intensity = pulseIntensity + glowLevel * 0.35;
    pulseColor.copy(cyanColor).lerp(purpleColor, pulse);
    innerPulseLight.color.copy(pulseColor);
    dir.intensity = 1.1 + glowLevel * 0.7;
    fill.intensity = 0.55 + glowLevel * 0.5;
  }

  drawPerspectiveGrid(docProgress);
  drawParticles(docProgress, t);
  drawNeuralNetwork();
  updateNebula(docProgress, currentMouseX * 0.02, currentMouseY * 0.02);

  renderer.render(scene, camera);
}

export { animate };
export { sceneMotion } from "./scroll.js";

animate();
