import {
  prefersReducedMotionGlobal,
  isMobileBg,
  sceneMotion,
  sharedScrollVelocity,
} from "./scroll.js";

const bgGridCanvas = document.getElementById("bg-grid-canvas");
const bgParticlesCanvas = document.getElementById("bg-particles-canvas");
const nebula1 = document.getElementById("bg-nebula-1");
const nebula2 = document.getElementById("bg-nebula-2");
const nebula3 = document.getElementById("bg-nebula-3");

export const bgGridCtx = bgGridCanvas ? bgGridCanvas.getContext("2d") : null;
export const bgParticlesCtx = bgParticlesCanvas ? bgParticlesCanvas.getContext("2d") : null;
export const particles = [];
export const particleCount = prefersReducedMotionGlobal ? 0 : isMobileBg ? 40 : 120;
let brainRectCenterX = window.innerWidth * 0.5;
let brainRectCenterY = window.innerHeight * 0.5;
export let gridFlow = 0;

export function syncBrainRectFromWrap(wrapRect) {
  if (!wrapRect) return;
  brainRectCenterX = wrapRect.left + wrapRect.width * 0.5;
  brainRectCenterY = wrapRect.top + wrapRect.height * 0.5;
}

export function updateBackgroundCanvasSize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (bgGridCanvas && bgGridCtx) {
    bgGridCanvas.width = w;
    bgGridCanvas.height = h;
  }
  if (bgParticlesCanvas && bgParticlesCtx) {
    bgParticlesCanvas.width = w;
    bgParticlesCanvas.height = h;
  }
}

export function initParticles() {
  particles.length = 0;
  for (let i = 0; i < particleCount; i += 1) {
    const cyan = Math.random() < 0.6;
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random(),
      r: 1 + Math.random() * 2,
      c: cyan ? "15,255,212" : "123,97,255",
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      a: 0.24 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

export function drawPerspectiveGrid(docProgress) {
  if (!bgGridCtx || !bgGridCanvas || prefersReducedMotionGlobal || isMobileBg) return;
  const w = bgGridCanvas.width;
  const h = bgGridCanvas.height;
  const horizonY = h * 0.38;
  const sectionFactor = Number(getComputedStyle(document.body).getPropertyValue("--section-factor")) || 1;
  bgGridCtx.clearRect(0, 0, w, h);
  bgGridCtx.lineWidth = 1;

  const baseAlpha = 0.06 + sceneMotion.sharedPulse * 0.09;
  const speed = Math.min(Math.abs(sharedScrollVelocity) * 0.005, 2.2) + docProgress * 0.45;
  gridFlow = (gridFlow + speed * sectionFactor) % 70;

  for (let i = 0; i < 24; i += 1) {
    const t = i / 23;
    const x = t * w;
    bgGridCtx.beginPath();
    bgGridCtx.strokeStyle = `rgba(15,255,212,${(baseAlpha * (0.55 + t * 0.45)).toFixed(4)})`;
    bgGridCtx.moveTo(x, h);
    bgGridCtx.lineTo(w * 0.5, horizonY);
    bgGridCtx.stroke();
  }

  for (let y = horizonY; y < h + 80; y += 28) {
    const depth = (y - horizonY + gridFlow) / Math.max(h - horizonY, 1);
    const yy = horizonY + (depth % 1) * (h - horizonY);
    const widthFactor = Math.pow((yy - horizonY) / Math.max(h - horizonY, 1), 1.5);
    const halfW = w * 0.48 * widthFactor;
    const alpha = baseAlpha * (0.25 + widthFactor * 1.2);
    bgGridCtx.beginPath();
    bgGridCtx.strokeStyle = `rgba(15,255,212,${alpha.toFixed(4)})`;
    bgGridCtx.moveTo(w * 0.5 - halfW, yy);
    bgGridCtx.lineTo(w * 0.5 + halfW, yy);
    bgGridCtx.stroke();
  }
}

export function drawParticles(docProgress, time) {
  if (!bgParticlesCtx || !bgParticlesCanvas || prefersReducedMotionGlobal) return;
  const w = bgParticlesCanvas.width;
  const h = bgParticlesCanvas.height;
  const trail = Math.min(Math.abs(sharedScrollVelocity) / 220, 0.3);
  bgParticlesCtx.fillStyle = `rgba(10,15,30,${Math.max(0.08, 0.2 - trail).toFixed(3)})`;
  bgParticlesCtx.fillRect(0, 0, w, h);

  const sectionFactor = Number(getComputedStyle(document.body).getPropertyValue("--section-factor")) || 1;
  const attractPower = isMobileBg ? 0.008 : 0.016;
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    const fx = Math.cos(time * 0.4 + p.phase) * 0.14;
    const fy = Math.sin(time * 0.35 + p.phase) * 0.14;
    const dx = brainRectCenterX - p.x;
    const dy = brainRectCenterY - p.y;
    const d2 = dx * dx + dy * dy;
    const attract = 1 / Math.max(d2 * 0.002, 1);
    p.vx += dx * attract * attractPower * sectionFactor;
    p.vy += dy * attract * attractPower * sectionFactor;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx + fx;
    p.y += p.vy + fy;
    if (p.x < -20) p.x = w + 20;
    if (p.x > w + 20) p.x = -20;
    if (p.y < -20) p.y = h + 20;
    if (p.y > h + 20) p.y = -20;
    bgParticlesCtx.beginPath();
    bgParticlesCtx.fillStyle = `rgba(${p.c},${Math.min(0.95, p.a + sceneMotion.sharedPulse * 0.4).toFixed(3)})`;
    bgParticlesCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bgParticlesCtx.fill();
  }
}

export function updateNebula(docProgress, mouseXNorm, mouseYNorm) {
  if (!nebula1 || !nebula2 || !nebula3 || prefersReducedMotionGlobal) return;
  const section = document.body.dataset.section || "inicio";
  const sectionFactor = Number(getComputedStyle(document.body).getPropertyValue("--section-factor")) || 1;
  const orbit = performance.now() * 0.00005;
  const parallaxX = isMobileBg ? 0 : mouseXNorm * 2;
  const parallaxY = isMobileBg ? 0 : mouseYNorm * 2;
  const centerPullX = ((brainRectCenterX / Math.max(window.innerWidth, 1)) - 0.5) * 240;
  const centerPullY = ((brainRectCenterY / Math.max(window.innerHeight, 1)) - 0.5) * 200;

  nebula1.style.transform = `translate3d(${Math.sin(orbit) * 36 + parallaxX}px, ${Math.cos(orbit) * 30 + parallaxY}px, 0)`;
  nebula3.style.transform = `translate3d(${Math.cos(orbit * 0.9) * 30 - parallaxX * 0.8}px, ${Math.sin(orbit * 0.7) * 26 - parallaxY * 0.7}px, 0)`;
  nebula2.style.transform = `translate3d(${Math.sin(orbit * 1.1) * 26 + centerPullX * 0.25}px, ${Math.cos(orbit * 0.8) * 28 + centerPullY * 0.25}px, 0)`;

  const base2 = 0.05 + sceneMotion.sharedPulse * 0.03;
  const sectionBoost = section === "proyectos" ? 1.35 : section === "contacto" ? 1.25 : 1;
  nebula2.style.opacity = String(Math.min(0.14, base2 * sectionBoost * sectionFactor));
  nebula1.style.opacity = String(Math.min(0.11, (0.04 + docProgress * 0.02) * sectionFactor));
  nebula3.style.opacity = String(Math.min(0.1, (0.03 + docProgress * 0.016) * sectionFactor));
}

updateBackgroundCanvasSize();
initParticles();

window.addEventListener("resize", () => {
  updateBackgroundCanvasSize();
  initParticles();
});
