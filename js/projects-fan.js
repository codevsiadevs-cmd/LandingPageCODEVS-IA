/**
 * Fan deck de proyectos: 6 cards en abanico tipo baraja de cartas.
 *
 * Posiciones (7 slots, 6 cards): far-left-2, far-left, near-left, center,
 * near-right, far-right, far-right-2. La asignación se hace con la fórmula
 * `posIndex = clamp(i - activeIndex + 3, 0, 6)` donde 3 = center.
 *
 * Interacciones:
 *   • Click: rota la baraja para que la card clickeada vaya al centro.
 *   • Scroll: el progress vertical de la sección mapea a un newIndex que
 *     llama rotateFanTo (debounced via lastScrollIndex). Sincronizado con
 *     el click para que ambos sistemas convivan sin pelearse.
 *   • Swipe (mobile): touch horizontal step ±1.
 *   • Teclado: ArrowLeft/Right cuando la sección tiene focus.
 *   • Filtros: hide cards no matching → se reasignan posiciones a las
 *     visibles; activeIndex se mueve al medio del subset.
 *   • IO bidireccional: añade fan-card--revealed con stagger 90ms al
 *     entrar al viewport, lo quita al salir (con transition: none vía CSS
 *     :not(--revealed)) para que el reveal se replay en cada entrada.
 *   • aria-live: anuncia la card centrada cuando el usuario navega.
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

function defaultActiveFor(visCount) {
  if (visCount <= 0) return 0;
  return Math.floor((visCount - 1) / 2);
}

function initProjectsFan() {
  const section = document.getElementById("proyectos");
  const deck = document.getElementById("projects-grid");
  if (!section || !deck) return;

  const allCards = [...deck.querySelectorAll(".fan-card")];
  if (!allCards.length) return;

  const filters = document.querySelectorAll(".project-filter");
  const liveEl = document.getElementById("projects-fan-live");

  let filterKey = "all";
  let activeIndex = defaultActiveFor(allCards.length);
  let userHasInteracted = false;
  let lastScrollIndex = -1;

  function matching(card) {
    if (filterKey === "all") return true;
    const cats = (card.dataset.categories || "").split(/\s+/).filter(Boolean);
    return cats.includes(filterKey);
  }

  function visibleOrdered() {
    return allCards.filter((c) => matching(c));
  }

  /**
   * Asigna clase de posición a cada card visible según activeIndex (índice
   * dentro del subset visible). Cards no visibles reciben display:none vía
   * la clase --filtered-out. activeIndex se ancla al medio si excede.
   */
  function applyFanPositions() {
    const vis = visibleOrdered();
    if (!vis.length) return;
    if (activeIndex >= vis.length) activeIndex = defaultActiveFor(vis.length);

    allCards.forEach((card) => {
      // Limpiar todas las clases de posición previas
      card.classList.remove(...POSITION_CLASSES);

      if (!matching(card)) {
        card.classList.add("project-card--filtered-out");
        card.setAttribute("aria-hidden", "true");
        card.tabIndex = -1;
        return;
      }
      card.classList.remove("project-card--filtered-out");

      const idxInVis = vis.indexOf(card);
      const dist = idxInVis - activeIndex;
      const posIndex = clamp(dist + CENTER_POS_INDEX, 0, POSITION_CLASSES.length - 1);
      card.classList.add(POSITION_CLASSES[posIndex]);

      const isCenter = idxInVis === activeIndex;
      card.setAttribute("aria-hidden", isCenter ? "false" : "true");
      card.tabIndex = isCenter ? 0 : -1;
    });

    announce(vis);
  }

  /**
   * Llamada externa: la card visible en posición newVisIndex pasa a center.
   * Sincroniza lastScrollIndex para que el scroll handler no la sobreescriba
   * inmediatamente después.
   */
  function rotateFanTo(newVisIndex) {
    const vis = visibleOrdered();
    if (!vis.length) return;
    activeIndex = clamp(newVisIndex, 0, vis.length - 1);
    lastScrollIndex = activeIndex;
    userHasInteracted = true;
    applyFanPositions();
  }

  function step(delta) {
    const vis = visibleOrdered();
    if (!vis.length) return;
    rotateFanTo(activeIndex + delta);
  }

  function announce(vis) {
    if (!liveEl || !vis.length) return;
    if (!userHasInteracted) {
      liveEl.textContent = "";
      return;
    }
    const cur = vis[activeIndex];
    const name = cur?.querySelector(".project-card__name");
    if (name) {
      liveEl.textContent = `${name.textContent}. ${activeIndex + 1} de ${vis.length}`;
    }
  }

  /* ── FILTROS ── */
  filters.forEach((filterBtn) => {
    filterBtn.addEventListener("click", () => {
      filterKey = filterBtn.dataset.filter || "all";
      filters.forEach((b) => {
        const on = b === filterBtn;
        b.classList.toggle("project-filter--active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      const vis = visibleOrdered();
      activeIndex = defaultActiveFor(vis.length);
      lastScrollIndex = activeIndex;
      userHasInteracted = false;
      applyFanPositions();
    });
  });

  /* ── CLICK PARA CENTRAR UNA CARD ── */
  deck.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest("button, a")) return;
    const card = target.closest(".fan-card");
    if (!card || !matching(card)) return;
    const vis = visibleOrdered();
    const idx = vis.indexOf(card);
    if (idx >= 0 && idx !== activeIndex) {
      rotateFanTo(idx);
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

  /* ── TECLADO (cuando deck tiene focus) ── */
  deck.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  });

  /* ── INIT POSICIONES ── */
  applyFanPositions();

  if (prefersReducedMotionGlobal) {
    // Cards visibles estáticas, sin replay ni scroll-rotation
    allCards.forEach((card) => card.classList.add("fan-card--revealed"));
    return;
  }

  /* ── SCROLL ROTATION ──
   * El progress 0..1 de la sección dentro del viewport se mapea a un
   * índice 0..(visCount-1). Solo dispara rotateFanTo si cambió respecto
   * al último valor (debounce implícito). Ignorado mientras el usuario
   * está interactuando manualmente. */
  let scrollRafPending = false;
  function updateFanOnScroll() {
    const rect = section.getBoundingClientRect();
    const denom = rect.height + window.innerHeight;
    if (denom <= 0) return;
    const progress = clamp(1 - rect.bottom / denom, 0, 1);
    const vis = visibleOrdered();
    if (vis.length <= 1) return;
    const newIndex = Math.round(progress * (vis.length - 1));
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
   * antiguo aplique tras un leave→enter rápido. */
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
          // Reset a estado oculto antes del stagger para forzar replay
          allCards.forEach((card) => {
            card.classList.remove("fan-card--revealed");
          });
          // Forzar layout flush para que el siguiente add(--revealed)
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
          // Reset al centro para la próxima entrada
          lastScrollIndex = -1;
          userHasInteracted = false;
          activeIndex = defaultActiveFor(visibleOrdered().length);
          applyFanPositions();
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  fanObserver.observe(section);
}

initProjectsFan();
