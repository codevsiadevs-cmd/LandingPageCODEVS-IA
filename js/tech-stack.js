import { prefersReducedMotionGlobal, sharedScrollVelocity } from "./scroll.js";

const TECH_ROWS = [
  [
    { name: "React", icon: "react.svg" },
    { name: "Next.js", icon: "nextdotjs.svg" },
    { name: "TypeScript", icon: "typescript.svg" },
    { name: "Python", icon: "python.svg" },
    { name: "Node.js", icon: "nodedotjs.svg" },
    { name: "FastAPI", icon: "fastapi.svg" },
    { name: "Docker", icon: "docker.svg" },
  ],
  [
    { name: "PostgreSQL", icon: "postgresql.svg" },
    { name: "MongoDB", icon: "mongodb.svg" },
    { name: "AWS", icon: "amazonwebservices.svg" },
    { name: "GCP", icon: "googlecloud.svg" },
    { name: "OpenAI", icon: "openai.svg" },
    { name: "LangChain", icon: "langchain.svg" },
    { name: "Kubernetes", icon: "kubernetes.svg" },
  ],
];

const AUTO_SPEED = 42;
const SCROLL_SPEED_BOOST = 0.22;
const MIN_SET_COPIES = 2;

const techSection = document.getElementById("tecnologias");
const topTrack = techSection?.querySelector(".tech-row--ltr .tech-row__track");
const bottomTrack = techSection?.querySelector(".tech-row--rtl .tech-row__track");

let marqueePos = 0;
let scrollDirection = 1;
let lastScrollY = window.scrollY;
let topLoopWidth = 0;
let bottomLoopWidth = 0;
let rafId = null;
let lastFrameTime = 0;

function createTechTile({ name, icon }) {
  const tile = document.createElement("div");
  tile.className = "tech-tile";
  tile.setAttribute("aria-label", name);

  const img = document.createElement("img");
  img.className = "tech-tile__logo";
  img.src = `./assets/images/stack/${icon}`;
  img.alt = name;
  img.width = 48;
  img.height = 48;
  img.loading = "lazy";
  img.decoding = "async";

  tile.appendChild(img);
  return tile;
}

function measureCycleWidth(track, itemCount) {
  const tiles = track.children;
  if (tiles.length <= itemCount) return 0;
  return Math.round(tiles[itemCount].offsetLeft - tiles[0].offsetLeft);
}

function requiredCopies(cycleWidth) {
  if (cycleWidth <= 0) return MIN_SET_COPIES;
  const viewport = window.innerWidth;
  return Math.max(MIN_SET_COPIES, Math.ceil((viewport + cycleWidth * 2) / cycleWidth) + 1);
}

function buildInfiniteTrack(track, items) {
  if (!track) return 0;

  track.replaceChildren();

  for (let copy = 0; copy < 2; copy += 1) {
    items.forEach((item) => track.appendChild(createTechTile(item)));
  }

  const cycleWidth = measureCycleWidth(track, items.length);
  const copies = requiredCopies(cycleWidth);

  for (let copy = 2; copy < copies; copy += 1) {
    items.forEach((item) => {
      const tile = createTechTile(item);
      tile.setAttribute("aria-hidden", "true");
      track.appendChild(tile);
    });
  }

  return cycleWidth;
}

function buildAllTracks() {
  if (!topTrack || !bottomTrack) return;

  topLoopWidth = buildInfiniteTrack(topTrack, TECH_ROWS[0]);
  bottomLoopWidth = buildInfiniteTrack(bottomTrack, TECH_ROWS[1]);
}

function wrapOffset(value, cycleWidth) {
  if (cycleWidth <= 0) return value;
  let wrapped = value % cycleWidth;
  if (wrapped < 0) wrapped += cycleWidth;
  return wrapped;
}

function applyMarqueeTransform() {
  if (!topTrack || !bottomTrack) return;

  const topPos = wrapOffset(marqueePos, topLoopWidth);
  const bottomPos = wrapOffset(marqueePos, bottomLoopWidth);

  /* Arriba → derecha: empieza en -1 ciclo para loop sin hueco al reiniciar */
  topTrack.style.transform =
    topLoopWidth > 0
      ? `translate3d(${topPos - topLoopWidth}px, 0, 0)`
      : "";
  bottomTrack.style.transform =
    bottomLoopWidth > 0 ? `translate3d(${-bottomPos}px, 0, 0)` : "";
}

function tick(now) {
  if (!topTrack || !bottomTrack || (topLoopWidth <= 0 && bottomLoopWidth <= 0)) return;

  if (!lastFrameTime) lastFrameTime = now;
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  const scrollBoost = Math.min(Math.abs(sharedScrollVelocity) * SCROLL_SPEED_BOOST, 120);
  const speed = (AUTO_SPEED + scrollBoost) * scrollDirection;

  marqueePos += speed * dt;
  applyMarqueeTransform();

  rafId = requestAnimationFrame(tick);
}

function onScrollDirection() {
  const y = window.scrollY;
  const delta = y - lastScrollY;
  if (delta > 0.5) scrollDirection = 1;
  else if (delta < -0.5) scrollDirection = -1;
  lastScrollY = y;
}

function startMarquee() {
  if (prefersReducedMotionGlobal || !topTrack || !bottomTrack) return;
  lastFrameTime = 0;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);
}

function stopMarquee() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function refreshTracks() {
  const previousPos = wrapOffset(marqueePos, topLoopWidth || bottomLoopWidth);
  buildAllTracks();
  marqueePos = previousPos;
  applyMarqueeTransform();
}

function initTechStack() {
  buildAllTracks();
  applyMarqueeTransform();

  if (prefersReducedMotionGlobal) return;

  startMarquee();
  window.addEventListener("scroll", onScrollDirection, { passive: true });
  window.addEventListener("resize", refreshTracks, { passive: true });
  window.addEventListener("load", refreshTracks);
}

initTechStack();

export function pauseTechMarquee() {
  stopMarquee();
}

export function resumeTechMarquee() {
  startMarquee();
}
