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

const wrap = document.getElementById("nav-brain-wrap");

/**
 * El cerebro 3D vive en el logo del navbar (#nav-brain-wrap). Cacheamos su rect
 * para el attract de partículas de fondo y el resize del renderer.
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
export const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0.05, 2.15);

export let renderer = null;
export const spinGroup = new THREE.Group();
export const tiltGroup = new THREE.Group();
scene.add(spinGroup);
spinGroup.add(tiltGroup);

if (wrap) {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  wrap.appendChild(renderer.domElement);

  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    updateRendererSize();
  });
}

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
if (wrap) {
  updateRendererSize();
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
  if (!wrap || fallbackMesh) return;
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

function modelToParticleCloud(source, { pointSize = 0.016, step = 1 } = {}) {
  const positions = [];
  const colors = [];
  const colorCyan = new THREE.Color(0x0fffd4);
  const colorPurple = new THREE.Color(0x7b61ff);
  const colorGold = new THREE.Color(0xffc857);
  const sample = new THREE.Vector3();
  const tint = new THREE.Color();

  source.updateMatrixWorld(true);
  source.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;
    const attr = child.geometry.attributes.position;
    for (let i = 0; i < attr.count; i += step) {
      sample.fromBufferAttribute(attr, i);
      sample.applyMatrix4(child.matrixWorld);
      positions.push(sample.x, sample.y, sample.z);
      const roll = Math.random();
      if (roll < 0.42) tint.copy(colorCyan);
      else if (roll < 0.78) tint.copy(colorPurple);
      else tint.copy(colorGold);
      colors.push(tint.r, tint.g, tint.b);
    }
  });

  const baseCount = positions.length / 3;
  if (baseCount > 0 && baseCount < 9000) {
    for (let i = 0; i < baseCount; i += 3) {
      const ix = i * 3;
      positions.push(
        positions[ix] + (Math.random() - 0.5) * 0.014,
        positions[ix + 1] + (Math.random() - 0.5) * 0.014,
        positions[ix + 2] + (Math.random() - 0.5) * 0.014
      );
      colors.push(colors[ix], colors[ix + 1], colors[ix + 2]);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: pointSize,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
loader.setDRACOLoader(dracoLoader);

let glbLoadTriggered = false;

function loadNavBrainModel() {
  if (!wrap || glbLoadTriggered) return;
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

if (wrap) {
  addFallbackMesh();
  loadNavBrainModel();
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

  if (wrap && renderer) {
    const scrollRot = docProgress * Math.PI * 2.75;
    const scrollBlend = Math.min(Math.max(latestScrollY / 320, 0), 1);

    if (prefersReducedMotionGlobal) {
      spinGroup.rotation.y = scrollRot * 0.35;
      tiltGroup.rotation.x = 0;
      tiltGroup.rotation.y = 0;
    } else {
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;
      spinGroup.rotation.y = scrollRot;
      tiltGroup.rotation.y = currentMouseX * 0.18 * scrollBlend;
      tiltGroup.rotation.x = -currentMouseY * 0.12 * scrollBlend;
    }
  } else if (prefersReducedMotionGlobal) {
    sceneMotion.sharedPulse = 0;
  }

  const pulse = (Math.sin(t * 2.2) + 1) * 0.5;
  const pulseIntensity = 0.8 + pulse * 1.7;
  if (!prefersReducedMotionGlobal) {
    sceneMotion.sharedPulse += (pulse - sceneMotion.sharedPulse) * 0.22;
  }
  const targetGlow = docProgress > 0.5 ? (docProgress - 0.5) * 2 : 0;
  glowLevel += (targetGlow - glowLevel) * 0.06;
  if (wrap && renderer) {
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

  if (renderer) {
    renderer.render(scene, camera);
  }
}

export { animate };
export { sceneMotion } from "./scroll.js";

animate();
