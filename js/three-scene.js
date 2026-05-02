import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
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

function addFallbackMesh() {
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
}

const loader = new GLTFLoader();
loader.load(
  "./assets/3d/logo.glb",
  (gltf) => {
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
  },
  undefined,
  () => {
    addFallbackMesh();
  }
);

let glowLevel = 0;

function updateRendererSize() {
  if (!wrap || !renderer) return;
  const size = Math.max(Math.round(wrap.getBoundingClientRect().width), 1);
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
  const wrapRect = wrap ? wrap.getBoundingClientRect() : null;
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
