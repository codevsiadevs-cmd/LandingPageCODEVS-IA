/**
 * Fan deck de proyectos: 7 cards en abanico tipo baraja de cartas.
 *
 * Posiciones (7 slots, 7 cards): far-left-2, far-left, near-left, center,
 * near-right, far-right, far-right-2. La asignación se hace con la fórmula
 * `posIndex = clamp(i - activeIndex + 3, 0, 6)` donde 3 = center.
 *
 * Estructura HTML por card (plana, sin .project-card__inner):
 *   .project-card.fan-card.fan-card--<slot>
 *     .fan-card__image-wrap.fan-card__image-wrap--gradient (style inline)
 *     .fan-card__overlay
 *       .fan-card__category
 *       .fan-card__title
 *
 * Sin filtros: todas las cards son visibles siempre. Si en algún momento
 * se necesita reintroducir filtros, recuperar la rama matching/visibleOrdered
 * del git history (commit anterior tenía data-filter + .project-filter).
 *
 * Interacciones:
 *   • Click sobre una card: rota la baraja para llevarla al centro.
 *   • Scroll: el progress vertical de la sección mapea a un newIndex que
 *     llama rotateFanTo (debounced via lastScrollIndex). Sincronizado con
 *     el click para que ambos sistemas convivan sin pelearse.
 *   • Swipe (mobile): touch horizontal step ±1.
 *   • Teclado: ArrowLeft/Right cuando la sección tiene focus, Enter/Space
 *     activa la card focuseada (cards tienen role="button" tabindex="0").
 *   • IO bidireccional: añade fan-card--revealed con stagger 90ms al
 *     entrar al viewport, lo quita al salir (con transition: none vía CSS
 *     :not(--revealed)) para que el reveal se replay en cada entrada.
 *   • aria-live: anuncia "Mostrando proyecto X de Y: <Title>" cuando
 *     el usuario navega. Span dinámico hidden visualmente.
 *
 * En prefers-reduced-motion: todo esto se omite y las cards quedan
 * estáticas con --revealed permanente para que sean visibles sin animar.
 */
import { prefersReducedMotionGlobal } from "./scroll.js";

const POSITION_CLASSES = [
  "fan-card--far-left-2",
  "fan-card--far-left",
  "fan-card--near-left",
  "fan-card--center",
  "fan-card--near-right",
  "fan-card--far-right",
  "fan-card--far-right-2",
];
const CENTER_POS_INDEX = 3;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function defaultActiveFor(count) {
  if (count <= 0) return 0;
  return Math.floor((count - 1) / 2);
}

function initProjectsFan() {
  const section = document.querySelector("#proyectos");
  const deck = document.getElementById("projects-fan-deck");
  if (!section || !deck) return;

  const allCards = [...deck.querySelectorAll(".fan-card")];
  if (!allCards.length) return;

  /*
   * liveEl = span visualmente oculto, dinámico, con su propio aria-live.
   * Reusa la clase .projects__fan-live (visually-hidden ya definida en
   * css/layout.css). Insertado dentro del deck para estar en la región.
   */
  let liveEl = deck.querySelector(".projects__fan-live");
  if (!liveEl) {
    liveEl = document.createElement("span");
    liveEl.className = "projects__fan-live";
    liveEl.setAttribute("aria-live", "polite");
    deck.appendChild(liveEl);
  }

  let activeIndex = defaultActiveFor(allCards.length);
  let userHasInteracted = false;
  let lastScrollIndex = -1;

  /**
   * Asigna clase de posición a cada card según activeIndex. Sin filtros,
   * todas las cards son visibles siempre y la fórmula es directa.
   */
  function applyFanPositions() {
    if (activeIndex >= allCards.length) {
      activeIndex = defaultActiveFor(allCards.length);
    }

    allCards.forEach((card, i) => {
      card.classList.remove(...POSITION_CLASSES);

      const dist = i - activeIndex;
      const posIndex = clamp(dist + CENTER_POS_INDEX, 0, POSITION_CLASSES.length - 1);
      card.classList.add(POSITION_CLASSES[posIndex]);

      const isCenter = i === activeIndex;
      card.setAttribute("aria-hidden", isCenter ? "false" : "true");
      card.tabIndex = isCenter ? 0 : -1;
    });

    announce();
  }

  /**
   * Llamada externa: la card en posición newIndex pasa a center.
   * Sincroniza lastScrollIndex para que el scroll handler no la sobreescriba
   * inmediatamente después.
   */
  function rotateFanTo(newIndex) {
    activeIndex = clamp(newIndex, 0, allCards.length - 1);
    lastScrollIndex = activeIndex;
    userHasInteracted = true;
    applyFanPositions();
  }

  function step(delta) {
    rotateFanTo(activeIndex + delta);
  }

  function announce() {
    if (!liveEl || !allCards.length) return;
    if (!userHasInteracted) {
      liveEl.textContent = "";
      return;
    }
    const cur = allCards[activeIndex];
    const title = cur?.querySelector(".fan-card__title");
    const titleText = title ? title.textContent.trim() : "";
    liveEl.textContent = titleText
      ? `Mostrando proyecto ${activeIndex + 1} de ${allCards.length}: ${titleText}`
      : `Mostrando proyecto ${activeIndex + 1} de ${allCards.length}`;
  }

  /* ── CLICK / KEYBOARD ACTIVATE PARA CENTRAR UNA CARD ── */
  function activateCard(card) {
    if (!card) return;
    const idx = allCards.indexOf(card);
    if (idx >= 0 && idx !== activeIndex) {
      rotateFanTo(idx);
    }
  }

  deck.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest("button, a")) return;
    activateCard(target.closest(".fan-card"));
  });

  /* Cards tienen role="button" tabindex="0" — soportamos Enter/Space para
   * activarlas igual que un click, garantizando paridad de teclado. */
  deck.addEventListener("keydown", (e) => {
    const target = e.target;
    const card =
      target instanceof Element ? target.closest(".fan-card") : null;

    if (card && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      activateCard(card);
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  });

  /* ── SWIPE TOUCH ── */
  let touchX = 0;
  deck.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  deck.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].screenX - touchX;
      if (Math.abs(dx) < 52) return;
      step(dx > 0 ? -1 : 1);
    },
    { passive: true }
  );

  /* ── INIT POSICIONES ── */
  applyFanPositions();

  if (prefersReducedMotionGlobal) {
    allCards.forEach((card) => card.classList.add("fan-card--revealed"));
    return;
  }

  /* ── SCROLL ROTATION ──
   * El progress 0..1 de la sección dentro del viewport se mapea a un
   * índice 0..(count-1). Solo dispara rotateFanTo si cambió respecto
   * al último valor (debounce implícito). */
  let scrollRafPending = false;
  function updateFanOnScroll() {
    if (allCards.length <= 1) return;
    const rect = section.getBoundingClientRect();
    const denom = rect.height + window.innerHeight;
    if (denom <= 0) return;
    const progress = clamp(1 - rect.bottom / denom, 0, 1);
    const newIndex = Math.round(progress * (allCards.length - 1));
    if (newIndex !== lastScrollIndex) {
      lastScrollIndex = newIndex;
      activeIndex = newIndex;
      applyFanPositions();
    }
  }
  window.addEventListener(
    "scroll",
    () => {
      if (scrollRafPending) return;
      scrollRafPending = true;
      requestAnimationFrame(() => {
        updateFanOnScroll();
        scrollRafPending = false;
      });
    },
    { passive: true }
  );

  /* ── REVEAL BIDIRECCIONAL ──
   * Cada vez que la sección entra al viewport, se hace stagger reveal.
   * Cada vez que sale, se quita --revealed (instant snap-back vía
   * .fan-card:not(.fan-card--revealed) { transition: none }). Cancelamos
   * los timeouts pendientes con un Set de IDs para evitar que un reveal
   * antiguo aplique tras un leave→enter rápido. NUNCA llama unobserve. */
  const pendingTimers = new Set();
  function clearPendingRevealTimers() {
    pendingTimers.forEach((id) => clearTimeout(id));
    pendingTimers.clear();
  }

  const fanObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          clearPendingRevealTimers();
          allCards.forEach((card) => {
            card.classList.remove("fan-card--revealed");
          });
          // Force layout flush para que el siguiente add(--revealed)
          // dispare la transition desde el estado oculto
          // eslint-disable-next-line no-unused-expressions
          deck.offsetWidth;

          allCards.forEach((card, i) => {
            const id = window.setTimeout(() => {
              card.classList.add("fan-card--revealed");
              pendingTimers.delete(id);
            }, i * 90);
            pendingTimers.add(id);
          });
        } else {
          clearPendingRevealTimers();
          allCards.forEach((card) => {
            card.classList.remove("fan-card--revealed");
          });
          lastScrollIndex = -1;
          userHasInteracted = false;
          activeIndex = defaultActiveFor(allCards.length);
          applyFanPositions();
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  fanObserver.observe(section);
}

initProjectsFan();
