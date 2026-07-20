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
const REST_RX = -18;
const REST_RY = 22;
const TILT_MAX = 28;

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
let activePointerId = null;
/** @type {typeof TECH_ROWS} */
let shuffledRows = TECH_ROWS.map((row) => [...row]);
let hasLeftSection = false;

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function reshuffleRows() {
  shuffledRows = TECH_ROWS.map((row) => shuffle(row));
}

function createLogo(icon, name, decorative = false) {
  const img = document.createElement("img");
  img.className = "tech-die__logo";
  img.src = `./assets/images/stack/${icon}`;
  img.alt = decorative ? "" : name;
  if (decorative) img.setAttribute("aria-hidden", "true");
  img.width = 48;
  img.height = 48;
  img.loading = "lazy";
  img.decoding = "async";
  img.draggable = false;
  return img;
}

function createFace(modifier, content) {
  const face = document.createElement("div");
  face.className = `tech-die__face tech-die__face--${modifier}`;
  face.setAttribute("aria-hidden", "true");
  face.appendChild(content);
  return face;
}

function setDieRotation(tile, rx, ry) {
  tile.style.setProperty("--die-rx", `${rx}deg`);
  tile.style.setProperty("--die-ry", `${ry}deg`);
}

function createTechTile({ name, icon }) {
  const tile = document.createElement("div");
  tile.className = "tech-tile";
  tile.setAttribute("role", "img");
  tile.setAttribute("aria-label", name);
  tile.tabIndex = 0;
  setDieRotation(tile, REST_RX, REST_RY);

  const label = document.createElement("span");
  label.className = "tech-tile__label";
  label.textContent = name;
  label.setAttribute("aria-hidden", "true");

  const die = document.createElement("div");
  die.className = "tech-die";

  const cube = document.createElement("div");
  cube.className = "tech-die__cube";

  const faces = ["front", "back", "right", "left", "top", "bottom"];
  faces.forEach((face) => {
    cube.appendChild(
      createFace(face, createLogo(icon, name, face !== "front"))
    );
  });

  die.appendChild(cube);
  tile.append(label, die);

  bindDieInteraction(tile);

  return tile;
}

function pointerOffset(tile, clientX, clientY) {
  const rect = tile.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  return {
    nx: Math.min(1, Math.max(0, x)) * 2 - 1,
    ny: Math.min(1, Math.max(0, y)) * 2 - 1,
  };
}

function bindDieInteraction(tile) {
  tile.addEventListener("pointerenter", (event) => {
    tile.classList.add("is-named");
    if (prefersReducedMotionGlobal || activePointerId !== null) return;
    tile.classList.add("is-tilting");
    const { nx, ny } = pointerOffset(tile, event.clientX, event.clientY);
    setDieRotation(tile, -ny * TILT_MAX, nx * TILT_MAX);
  });

  tile.addEventListener("pointermove", (event) => {
    if (prefersReducedMotionGlobal) return;
    if (tile.classList.contains("is-tumbling")) return;
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    tile.classList.add("is-tilting");
    const { nx, ny } = pointerOffset(tile, event.clientX, event.clientY);
    setDieRotation(tile, -ny * TILT_MAX, nx * TILT_MAX);
  });

  tile.addEventListener("pointerleave", () => {
    tile.classList.remove("is-named");
    if (prefersReducedMotionGlobal) return;
    if (tile.classList.contains("is-tumbling")) return;
    tile.classList.remove("is-tilting");
    setDieRotation(tile, REST_RX, REST_RY);
  });

  tile.addEventListener("focus", () => {
    tile.classList.add("is-named");
  });

  tile.addEventListener("blur", () => {
    tile.classList.remove("is-named");
  });

  if (prefersReducedMotionGlobal) return;

  tile.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    activePointerId = event.pointerId;
    tile.setPointerCapture?.(event.pointerId);
    tile.classList.add("is-tilting");
  });

  tile.addEventListener("pointerup", (event) => {
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    activePointerId = null;
    tumbleDie(tile);
  });

  tile.addEventListener("pointercancel", () => {
    activePointerId = null;
    tile.classList.remove("is-tilting", "is-tumbling", "is-named");
    setDieRotation(tile, REST_RX, REST_RY);
  });

  tile.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      tumbleDie(tile);
    }
  });
}

function tumbleDie(tile) {
  if (tile.classList.contains("is-tumbling")) return;

  const spinsX = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.floor(Math.random() * 2) * 360);
  const spinsY = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.floor(Math.random() * 2) * 360);

  tile.classList.remove("is-tilting");
  tile.classList.add("is-tumbling");
  setDieRotation(tile, REST_RX + spinsX, REST_RY + spinsY);

  window.setTimeout(() => {
    tile.classList.remove("is-tumbling");
    tile.classList.add("is-tilting");
    setDieRotation(tile, REST_RX, REST_RY);
    requestAnimationFrame(() => {
      tile.classList.remove("is-tilting");
    });
  }, 900);
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
      tile.tabIndex = -1;
      track.appendChild(tile);
    });
  }

  return cycleWidth;
}

function buildAllTracks() {
  if (!topTrack || !bottomTrack) return;

  topLoopWidth = buildInfiniteTrack(topTrack, shuffledRows[0]);
  bottomLoopWidth = buildInfiniteTrack(bottomTrack, shuffledRows[1]);
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

  topTrack.style.transform =
    topLoopWidth > 0 ? `translate3d(${topPos - topLoopWidth}px, 0, 0)` : "";
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

function rebuildWithNewOrder() {
  reshuffleRows();
  marqueePos = 0;
  buildAllTracks();
  applyMarqueeTransform();
}

function watchSectionReentry() {
  if (!techSection || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (hasLeftSection) rebuildWithNewOrder();
        } else if (entry.intersectionRatio === 0) {
          hasLeftSection = true;
        }
      });
    },
    { threshold: [0, 0.15] }
  );
  observer.observe(techSection);
}

function initTechStack() {
  reshuffleRows();
  buildAllTracks();
  applyMarqueeTransform();
  watchSectionReentry();

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
