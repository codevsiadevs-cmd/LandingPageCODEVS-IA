import { prefersReducedMotionGlobal } from "./scroll.js";

const customCursor = document.getElementById("custom-cursor");

if (customCursor && window.matchMedia("(pointer: fine)").matches && !prefersReducedMotionGlobal) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;
    customCursor.style.left = `${cursorX}px`;
    customCursor.style.top = `${cursorY}px`;
    requestAnimationFrame(animateCursor);
  }

  document.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    customCursor.classList.add("custom-cursor--visible");
  });

  document.addEventListener("pointerleave", () => {
    customCursor.classList.remove("custom-cursor--visible");
  });

  const hoverTargets = document.querySelectorAll("a, button, input, select, textarea, label");
  hoverTargets.forEach((node) => {
    node.addEventListener("pointerenter", () => customCursor.classList.add("custom-cursor--active"));
    node.addEventListener("pointerleave", () => customCursor.classList.remove("custom-cursor--active"));
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
