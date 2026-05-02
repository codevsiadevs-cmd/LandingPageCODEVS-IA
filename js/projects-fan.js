/**
 * Abanico de proyectos: filtros, posiciones 2D; clic / swipe / teclado para centrar.
 */
function initProjectsFan() {
  const section = document.getElementById("proyectos");
  const stage = document.getElementById("projects-grid");
  if (!section || !stage) return;

  const cards = [...stage.querySelectorAll(".project-card")];
  const filters = document.querySelectorAll(".project-filter");
  const liveEl = document.getElementById("projects-fan-live");

  if (!cards.length) return;

  let filterKey = "all";

  /** Índice centrado en la lista visible para que el abanico no quede todo hacia la derecha */
  function middleActiveIndex(n) {
    if (n <= 0) return 0;
    return Math.floor((n - 1) / 2);
  }

  let activeIndex = middleActiveIndex(cards.length);
  /** Hasta que el usuario pulse una tarjeta o use flechas/swipe, ninguna lleva estilo "seleccionado" */
  let userHasSelectedCard = false;

  const FAN_VARS = ["--fan-tx", "--fan-ty", "--fan-rot", "--fan-sc", "--fan-op", "--fan-z"];

  function clearFanVars(card) {
    FAN_VARS.forEach((p) => card.style.removeProperty(p));
    card.removeAttribute("data-fan-offset");
    card.removeAttribute("data-fan-active");
  }

  function matching(card) {
    if (filterKey === "all") return true;
    const cats = (card.dataset.categories || "").split(/\s+/).filter(Boolean);
    return cats.includes(filterKey);
  }

  function visibleOrdered() {
    return cards.filter((c) => matching(c));
  }

  /**
   * Dos grupos con hueco central; misma geometría de abanico siempre.
   * Sin selección: rotación espejo por bloque (ninguna tarjeta a 0° por pivote global);
   * escala/opacidad/z por ranura desde el hueco (0 = junto al centro), espejo izq./der.,
   * para que los bordes superiores sigan la misma pendiente que en el grupo derecho.
   */
  function applyFanMetrics(card, idxInVis, n, activeIndex, userHasSelectedCard) {
    const pivotIndex = userHasSelectedCard ? activeIndex : middleActiveIndex(n);

    const mid = Math.ceil(n / 2);
    const leftCount = mid;
    const rightCount = n - mid;
    const maxInCluster = Math.max(Math.max(leftCount, rightCount) - 1, 1);

    const clusterSpread = Math.min(4.35, 14 / maxInCluster);
    const rotPerDeg = Math.min(9, 36 / Math.max(n - 1, 1));

    /*
     * Sin selección: anclar cada bloque en la tarjeta junto al hueco (mid-1 | mid).
     * Antes el pivote global hacía focusRight = mid+1 en 6 tarjetas → el derecho quedaba
     * desfasado respecto al izquierdo (distinta “arquitectura”, altura y recortes).
     */
    let focusLeft;
    let focusRight;
    if (!userHasSelectedCard) {
      focusLeft = Math.max(0, mid - 1);
      focusRight = Math.min(n - 1, mid);
    } else {
      focusLeft =
        pivotIndex < mid ? pivotIndex : Math.max(0, Math.floor((leftCount - 1) / 2));
      focusRight =
        pivotIndex >= mid
          ? pivotIndex
          : Math.min(n - 1, mid + Math.floor((rightCount - 1) / 2));
    }

    const gapRem = 9;
    const leftCx = -gapRem * 0.48 - clusterSpread * 2.35;
    const rightCx = gapRem * 0.48 + clusterSpread * 2.35;

    let txRem;
    if (idxInVis < mid) {
      txRem = leftCx + (idxInVis - focusLeft) * clusterSpread;
    } else {
      txRem = rightCx + (idxInVis - focusRight) * clusterSpread;
    }

    const d = idxInVis - pivotIndex;
    const absD = Math.abs(d);

    /*
     * Sin selección: rotación espejo por grupo — la tarjeta junto al hueco (última izq. / primera der.)
     * ya no queda a 0° como antes con pivote global en el centro de la lista.
     */
    let rotDeg;
    if (!userHasSelectedCard) {
      if (idxInVis < mid) {
        rotDeg = -(mid - idxInVis) * rotPerDeg;
      } else {
        rotDeg = (idxInVis - mid + 1) * rotPerDeg;
      }
    } else {
      rotDeg = d * rotPerDeg;
    }

    let absStyle = absD;
    if (!userHasSelectedCard) {
      /* Desde el hueco hacia afuera: misma jerarquía en ambos bloques (la del centro del fan primero). */
      if (idxInVis < mid) {
        absStyle = mid - 1 - idxInVis;
      } else {
        absStyle = idxInVis - mid;
      }
    }

    let scale;
    let op;
    let z;

    if (!userHasSelectedCard) {
      scale = Math.max(0.9, 1 - absStyle * 0.028);
      op = Math.max(0.95, 1 - absStyle * 0.014);
      z = 28 - absStyle * 3;
      card.dataset.fanActive = "false";
    } else {
      scale = Math.max(0.72, 1 - absD * 0.042);
      op = Math.max(0.9, 1 - absD * 0.022);
      z = 34 - absD * 4;
      card.dataset.fanActive = d === 0 ? "true" : "false";
    }

    card.dataset.fanOffset = String(d);

    /*
     * Escalera desde el hueco (izq./der. comparten tyStep). En el bloque derecho, la rotación +°
     * baja más el borde superior que la −° del izquierdo; sumamos extraRem por ranura para alinear.
     */
    const tyStepRem = 0.62;
    /* Extras derechos: 2.ª alineada con la izq.; 3.ª como antes (gran subida) + un poco más. */
    const rightTyExtraRem = [0, 2.2, 4.05];
    let tyRem = 0;
    if (idxInVis < mid && leftCount > 1) {
      const slot = mid - 1 - idxInVis;
      tyRem = -slot * tyStepRem;
    } else if (idxInVis >= mid && rightCount > 1) {
      const slot = idxInVis - mid;
      const extra = rightTyExtraRem[slot] ?? rightTyExtraRem[rightTyExtraRem.length - 1];
      tyRem = -slot * tyStepRem - extra;
    }

    card.style.setProperty("--fan-tx", `${txRem}rem`);
    card.style.setProperty("--fan-ty", `${tyRem}rem`);
    card.style.setProperty("--fan-rot", `${rotDeg}deg`);
    card.style.setProperty("--fan-sc", String(scale));
    card.style.setProperty("--fan-op", String(op));
    card.style.setProperty("--fan-z", String(z));
  }

  function setSlots() {
    const vis = visibleOrdered();
    if (activeIndex >= vis.length) activeIndex = Math.max(0, vis.length - 1);

    const n = vis.length;

    cards.forEach((card) => {
      if (!matching(card)) {
        card.style.display = "none";
        card.classList.add("project-card--filtered-out");
        clearFanVars(card);
        card.setAttribute("aria-hidden", "true");
        card.tabIndex = -1;
        return;
      }

      card.style.removeProperty("display");
      card.removeAttribute("hidden");
      card.classList.remove("project-card--filtered-out");

      const idxInVis = vis.indexOf(card);
      applyFanMetrics(card, idxInVis, n, activeIndex, userHasSelectedCard);

      if (!userHasSelectedCard) {
        card.setAttribute("aria-hidden", "false");
        card.tabIndex = -1;
      } else {
        const d = idxInVis - activeIndex;
        const isCenter = d === 0;
        card.setAttribute("aria-hidden", isCenter ? "false" : "true");
        card.tabIndex = isCenter ? 0 : -1;
      }
    });

    announce(vis);
  }

  function announce(vis) {
    if (!liveEl || !vis.length) return;
    if (!userHasSelectedCard) {
      liveEl.textContent = "";
      return;
    }
    const cur = vis[activeIndex];
    const name = cur?.querySelector(".project-card__name");
    liveEl.textContent = name ? `${name.textContent}. ${activeIndex + 1} de ${vis.length}` : "";
  }

  function step(delta) {
    const vis = visibleOrdered();
    if (!vis.length) return;
    if (!userHasSelectedCard) {
      userHasSelectedCard = true;
      activeIndex = middleActiveIndex(vis.length);
    }
    activeIndex = (activeIndex + delta + vis.length) % vis.length;
    setSlots();
  }

  filters.forEach((filterBtn) => {
    filterBtn.addEventListener("click", () => {
      filterKey = filterBtn.dataset.filter || "all";
      filters.forEach((b) => {
        const on = b === filterBtn;
        b.classList.toggle("project-filter--active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      activeIndex = middleActiveIndex(visibleOrdered().length);
      setSlots();
    });
  });

  stage.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("button, a")) return;
    const card = t.closest(".project-card");
    if (!card || !matching(card)) return;
    const vis = visibleOrdered();
    const idx = vis.indexOf(card);
    if (idx >= 0 && idx !== activeIndex) {
      activeIndex = idx;
      setSlots();
    }
  });

  let touchX = 0;
  stage.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].screenX - touchX;
      if (Math.abs(dx) < 52) return;
      step(dx > 0 ? -1 : 1);
    },
    { passive: true }
  );

  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  });

  setSlots();
}

initProjectsFan();
