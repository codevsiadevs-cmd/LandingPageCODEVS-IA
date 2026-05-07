import { prefersReducedMotionGlobal } from "./scroll.js";

const customCursor = document.getElementById("custom-cursor");

if (customCursor && window.matchMedia("(pointer: fine)").matches && !prefersReducedMotionGlobal) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  /* ─── Trail dots ──────────────────────────────────────────────────────────
   * 8 puntos que siguen al cursor con retraso creciente. Mantenemos una
   * historia circular de posiciones del ratón muestreada cada frame; cada dot
   * lee la entrada cuya antigüedad coincide con su delay nominal en ms,
   * traducido a frames asumiendo ~16.67ms por frame.
   * ─────────────────────────────────────────────────────────────────────── */
  const TRAIL_LENGTH = 8;
  const HISTORY_LENGTH = 20;
  const FRAME_MS = 1000 / 60;
  const trailDelaysMs = [30, 60, 85, 110, 135, 160, 185, 200];
  const trailSizesPx = [4, 4, 3, 3, 2.5, 2, 1.5, 1];
  const trailOpacities = [0.85, 0.72, 0.6, 0.5, 0.4, 0.32, 0.22, 0.14];

  const history = new Array(HISTORY_LENGTH);
  for (let i = 0; i < HISTORY_LENGTH; i += 1) {
    history[i] = { x: mouseX, y: mouseY };
  }
  let historyHead = 0;

  const trailDots = [];
  for (let i = 0; i < TRAIL_LENGTH; i += 1) {
    const dot = document.createElement("div");
    dot.className = "cursor-trail";
    dot.setAttribute("aria-hidden", "true");
    dot.style.setProperty("--trail-size", `${trailSizesPx[i]}px`);
    dot.style.setProperty("--trail-opacity", String(trailOpacities[i]));
    document.body.appendChild(dot);
    trailDots.push(dot);
  }

  /* hoverFactor lerpea entre 0 (sin hover) y 1 (sobre elemento interactivo).
   * Cuando vale 1, los offsets de cada dot se reducen a la mitad (cluster). */
  let hoverActive = false;
  let hoverFactor = 0;

  function animateCursor() {
    /* Sample posición actual a la cabeza de la history. */
    history[historyHead].x = mouseX;
    history[historyHead].y = mouseY;

    /* Cursor principal: lerp suave hacia el ratón, transform vía CSS vars. */
    cursorX += (mouseX - cursorX) * 0.22;
    cursorY += (mouseY - cursorY) * 0.22;
    customCursor.style.setProperty("--cursor-x", `${cursorX}px`);
    customCursor.style.setProperty("--cursor-y", `${cursorY}px`);

    /* Lerp del hoverFactor para que el cluster se suavice. */
    const targetHover = hoverActive ? 1 : 0;
    hoverFactor += (targetHover - hoverFactor) * 0.18;
    const clusterMultiplier = 1 - hoverFactor * 0.5;

    /* Actualizar cada trail dot leyendo de la history con offset por delay. */
    for (let i = 0; i < trailDots.length; i += 1) {
      const effectiveDelay = trailDelaysMs[i] * clusterMultiplier;
      const offset = Math.min(HISTORY_LENGTH - 1, Math.max(1, Math.round(effectiveDelay / FRAME_MS)));
      const idx = (historyHead - offset + HISTORY_LENGTH) % HISTORY_LENGTH;
      const pos = history[idx];
      trailDots[i].style.setProperty("--tx", `${pos.x}px`);
      trailDots[i].style.setProperty("--ty", `${pos.y}px`);
    }

    historyHead = (historyHead + 1) % HISTORY_LENGTH;
    requestAnimationFrame(animateCursor);
  }

  /* ─── Click burst ─────────────────────────────────────────────────────────
   * En cada mousedown soltamos 4 partículas que se reparten radialmente
   * y se eliminan al terminar la animación CSS (400ms).
   * ─────────────────────────────────────────────────────────────────────── */
  function spawnClickBurst(x, y) {
    const count = 4;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const distance = 28 + Math.random() * 18;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const p = document.createElement("div");
      p.className = "cursor-burst-particle";
      p.setAttribute("aria-hidden", "true");
      p.style.setProperty("--burst-x", `${x}px`);
      p.style.setProperty("--burst-y", `${y}px`);
      p.style.setProperty("--burst-dx", `${dx.toFixed(1)}px`);
      p.style.setProperty("--burst-dy", `${dy.toFixed(1)}px`);
      document.body.appendChild(p);

      const cleanup = () => p.remove();
      p.addEventListener("animationend", cleanup, { once: true });
      window.setTimeout(cleanup, 600);
    }
  }

  /* ─── Eventos ────────────────────────────────────────────────────────── */
  document.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    customCursor.classList.add("custom-cursor--visible");
    trailDots.forEach((d) => d.classList.add("cursor-trail--visible"));
  });

  document.addEventListener("pointerleave", () => {
    customCursor.classList.remove("custom-cursor--visible");
    trailDots.forEach((d) => d.classList.remove("cursor-trail--visible"));
  });

  document.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    spawnClickBurst(event.clientX, event.clientY);
  });

  const hoverTargets = document.querySelectorAll(
    "a, button, input, select, textarea, label, .services__card, .project-card__inner"
  );
  hoverTargets.forEach((node) => {
    node.addEventListener("pointerenter", () => {
      customCursor.classList.add("custom-cursor--active");
      hoverActive = true;
    });
    node.addEventListener("pointerleave", () => {
      customCursor.classList.remove("custom-cursor--active");
      hoverActive = false;
    });
  });

  animateCursor();
}

if (!prefersReducedMotionGlobal) {
  const interactiveCardSelector = ".services__card, .project-card__inner";
  const interactiveCards = document.querySelectorAll(interactiveCardSelector);

  interactiveCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = ((event.clientX - rect.left) / rect.width) * 100;
      const py = ((event.clientY - rect.top) / rect.height) * 100;
      const tiltY = ((px - 50) / 50) * 5.5;
      const tiltX = ((50 - py) / 50) * 4.8;
      card.style.setProperty("--mx", `${px}%`);
      card.style.setProperty("--my", `${py}%`);
      card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Submit button ripple
 * Crea un <span class="contact__ripple"> en el punto del click y lo elimina
 * cuando termina la animación CSS. Si el usuario activa con teclado (sin
 * coords), se centra el ripple. Respeta prefers-reduced-motion.
 * ─────────────────────────────────────────────────────────────────────────── */
const contactSubmitBtn = document.querySelector(".contact__submit");
if (contactSubmitBtn) {
  contactSubmitBtn.addEventListener("click", (event) => {
    if (contactSubmitBtn.disabled) return;
    if (prefersReducedMotionGlobal) return;

    const rect = contactSubmitBtn.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    const isKeyboardActivation = event.detail === 0 || (event.clientX === 0 && event.clientY === 0);
    if (isKeyboardActivation) {
      x = rect.width / 2;
      y = rect.height / 2;
    }

    const ripple = document.createElement("span");
    ripple.className = "contact__ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    contactSubmitBtn.appendChild(ripple);

    const cleanup = () => ripple.remove();
    ripple.addEventListener("animationend", cleanup, { once: true });
    setTimeout(cleanup, 700);
  });
}
