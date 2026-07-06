import { prefersReducedMotionGlobal } from "./scroll.js";

const CARD_COUNT = 5;
const DESKTOP_MQ = window.matchMedia("(min-width: 900px)");
const WHEEL_STEP_THRESHOLD = 150;
const STEP_COOLDOWN_MS = 580;
const OBSERVER_MIN_RATIO = 0.38;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function initParticles(canvas, section) {
  if (!canvas || !DESKTOP_MQ.matches) {
    canvas?.classList.add("why__canvas--off");
    return () => {};
  }

  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let nodes = [];
  let raf = 0;
  let running = true;

  function resize() {
    const rect = section.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = DESKTOP_MQ.matches ? 42 : 24;
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
    }));
  }

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    const activeCard = section.querySelector(".why__card.is-active");
    let focal = { x: w * 0.65, y: h * 0.5 };
    if (activeCard) {
      const sRect = section.getBoundingClientRect();
      const cRect = activeCard.getBoundingClientRect();
      focal = {
        x: cRect.left + cRect.width / 2 - sRect.left,
        y: cRect.top + cRect.height / 2 - sRect.top,
      };
    }

    const linkDist = DESKTOP_MQ.matches ? 120 : 90;
    const reduced = prefersReducedMotionGlobal;

    nodes.forEach((n) => {
      if (!reduced) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        const dx = focal.x - n.x;
        const dy = focal.y - n.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 220) {
          n.x += (dx / dist) * 0.08;
          n.y += (dy / dist) * 0.08;
        }
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(15, 255, 212, ${0.25 + n.r * 0.12})`;
      ctx.fill();
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > linkDist) continue;
        const alpha = (1 - d / linkDist) * 0.22;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(123, 97, 255, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    if (!reduced) {
      ctx.beginPath();
      ctx.arc(focal.x, focal.y, 28, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(focal.x, focal.y, 0, focal.x, focal.y, 28);
      grad.addColorStop(0, "rgba(15, 255, 212, 0.18)");
      grad.addColorStop(1, "rgba(15, 255, 212, 0)");
      ctx.fillStyle = grad;
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  }

  resize();
  draw();

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
  };
}

function initWhyShowcase() {
  const section = document.getElementById("nosotros");
  const scrollWrap = section?.querySelector(".why__scroll");
  const viewport = document.getElementById("why-viewport");
  const rail = document.getElementById("why-rail");
  const canvas = document.getElementById("why-canvas");
  const progressFill = document.getElementById("why-progress-fill");

  if (!section || !scrollWrap || !viewport || !rail) return;

  const cards = [...section.querySelectorAll("[data-why-card]")];
  const dots = [...section.querySelectorAll(".why__dot")];
  const nodes = [...section.querySelectorAll(".why__progress-node")];

  if (cards.length !== CARD_COUNT) return;

  let activeIndex = 0;
  let stepLockUntil = 0;
  let wheelAccumulator = 0;
  let desktopObserver = null;
  let mobileMetrics = { itemSpan: 0, centerOffset: 0 };

  function canStepNow() {
    return performance.now() >= stepLockUntil;
  }

  function lockStep() {
    stepLockUntil = performance.now() + STEP_COOLDOWN_MS;
    wheelAccumulator = 0;
  }

  function updateChrome(index) {
    section.dataset.active = String(index);

    dots.forEach((dot, i) => {
      const on = i === index;
      dot.classList.toggle("is-active", on);
      dot.setAttribute("aria-current", on ? "true" : "false");
    });

    nodes.forEach((node, i) => {
      node.classList.toggle("is-active", i === index);
    });

    if (progressFill) {
      const pct = index === 0 ? 0 : (index / (CARD_COUNT - 1)) * 100;
      progressFill.style.height = `${pct}%`;
    }
  }

  function setDesktopActive(index) {
    const next = clamp(index, 0, CARD_COUNT - 1);
    activeIndex = next;

    cards.forEach((card, i) => {
      const isActive = i === activeIndex;
      card.classList.toggle("is-active", isActive);
      card.classList.toggle("is-past", i < activeIndex);
      card.tabIndex = isActive ? 0 : -1;
      card.style.removeProperty("--why-card-opacity");
      card.style.removeProperty("--why-card-blur");
      card.style.removeProperty("--why-card-scale");
    });

    rail.style.transform = "";
    updateChrome(activeIndex);
  }

  function measureMobile() {
    const first = cards[0];
    const second = cards[1];
    const itemSpan = second ? second.offsetTop - first.offsetTop : first.offsetHeight;
    const centerOffset = (viewport.clientHeight - first.offsetHeight) / 2;

    mobileMetrics = { itemSpan, centerOffset };
    section.style.setProperty("--why-item-span", `${itemSpan}px`);
    section.style.setProperty("--why-center-offset", `${centerOffset}px`);

    return mobileMetrics;
  }

  function getMobilePinMetrics() {
    const rect = scrollWrap.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollRange = Math.max(scrollWrap.offsetHeight - vh, 1);
    const scrolled = clamp(-rect.top, 0, scrollRange);
    const progress = scrolled / scrollRange;
    const pinned = rect.top <= 1 && rect.bottom > vh + 1;

    return { progress, pinned, scrollRange };
  }

  function applyMobileTimeline(index) {
    const { itemSpan, centerOffset } = mobileMetrics;
    const trackOffset = centerOffset - index * itemSpan;

    rail.style.transform = `translate3d(0, ${trackOffset}px, 0)`;

    cards.forEach((card, i) => {
      const absDelta = Math.abs(i - index);
      let opacity = 0;
      let scale = 0.97;

      if (absDelta < 0.38) {
        opacity = 1;
        scale = 1;
      } else if (absDelta < 0.92) {
        const t = (absDelta - 0.38) / 0.54;
        opacity = 1 - t;
        scale = 1 - t * 0.04;
      }

      card.style.setProperty("--why-card-blur", "0px");
      card.style.setProperty("--why-card-opacity", String(opacity));
      card.style.setProperty("--why-card-scale", String(scale));
      card.style.visibility = opacity < 0.04 ? "hidden" : "visible";
      card.classList.toggle("is-active", absDelta < 0.38);
      card.classList.toggle("is-past", i < index - 0.2);
      card.tabIndex = absDelta < 0.38 ? 0 : -1;
    });

    const nextActive = Math.round(index);
    if (nextActive !== activeIndex) {
      activeIndex = nextActive;
      updateChrome(activeIndex);
    }
  }

  let mobileScrollRaf = 0;

  function updateMobileFromScroll() {
    cancelAnimationFrame(mobileScrollRaf);
    mobileScrollRaf = requestAnimationFrame(() => {
      const { progress, pinned } = getMobilePinMetrics();
      const eased = easeInOutCubic(progress);
      const index = eased * (CARD_COUNT - 1);

      section.classList.toggle("why--pinned", pinned);
      applyMobileTimeline(index);
    });
  }

  function scrollToMobileIndex(index) {
    const vh = window.innerHeight;
    const scrollRange = Math.max(scrollWrap.offsetHeight - vh, 1);
    const progress = clamp(index, 0, CARD_COUNT - 1) / (CARD_COUNT - 1);
    const sectionTop = scrollWrap.getBoundingClientRect().top + window.scrollY;
    const targetY = sectionTop + progress * scrollRange;

    window.scrollTo({ top: targetY, behavior: "smooth" });
  }

  function initDesktopObserver() {
    const ratios = new Map();
    let debounceId = 0;

    function pickBestIndex() {
      let bestIdx = activeIndex;
      let bestRatio = ratios.get(cards[activeIndex]) ?? 0;

      cards.forEach((card, i) => {
        const ratio = ratios.get(card) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestIdx = i;
        }
      });

      return { bestIdx, bestRatio };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        clearTimeout(debounceId);
        debounceId = window.setTimeout(() => {
          if (!canStepNow()) return;

          const { bestIdx, bestRatio } = pickBestIndex();
          if (bestRatio < OBSERVER_MIN_RATIO || bestIdx === activeIndex) return;

          setDesktopActive(bestIdx);
          lockStep();
        }, 70);
      },
      {
        root: null,
        rootMargin: "-34% 0px -34% 0px",
        threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
      }
    );

    cards.forEach((card) => observer.observe(card));
    return observer;
  }

  function setupMode() {
    if (DESKTOP_MQ.matches) {
      desktopObserver?.disconnect();
      desktopObserver = initDesktopObserver();
      setDesktopActive(activeIndex);
      window.removeEventListener("scroll", updateMobileFromScroll);
    } else {
      desktopObserver?.disconnect();
      desktopObserver = null;
      measureMobile();
      updateMobileFromScroll();
      window.addEventListener("scroll", updateMobileFromScroll, { passive: true });
    }
  }

  function goToIndex(index, { fromUser = false } = {}) {
    const next = clamp(index, 0, CARD_COUNT - 1);

    if (DESKTOP_MQ.matches) {
      setDesktopActive(next);
      if (fromUser) lockStep();
      return;
    }

    if (fromUser) {
      scrollToMobileIndex(next);
      lockStep();
      return;
    }

    applyMobileTimeline(next);
  }

  if (prefersReducedMotionGlobal) {
    section.classList.add("why--static");
    setDesktopActive(0);
    return;
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goToIndex(Number(dot.dataset.goto), { fromUser: true });
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      goToIndex(Number(card.dataset.whyCard), { fromUser: true });
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goToIndex(Number(card.dataset.whyCard), { fromUser: true });
      }
    });
  });

  section.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    handleArrowNav(e);
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const inView = rect.top < vh * 0.75 && rect.bottom > vh * 0.25;
    if (!inView) return;
    handleArrowNav(e);
  });

  function handleArrowNav(e) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goToIndex(activeIndex + 1, { fromUser: true });
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goToIndex(activeIndex - 1, { fromUser: true });
    }
  }

  section.addEventListener(
    "wheel",
    (e) => {
      if (!DESKTOP_MQ.matches) return;

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const inZone = rect.top < vh * 0.72 && rect.bottom > vh * 0.28;
      if (!inZone) return;

      const goingDown = e.deltaY > 0;
      const goingUp = e.deltaY < 0;
      const atStart = activeIndex === 0;
      const atEnd = activeIndex === CARD_COUNT - 1;

      if ((goingDown && atEnd) || (goingUp && atStart)) {
        wheelAccumulator = 0;
        return;
      }

      e.preventDefault();

      if (!canStepNow()) return;

      wheelAccumulator += e.deltaY;
      if (Math.abs(wheelAccumulator) < WHEEL_STEP_THRESHOLD) return;

      const direction = wheelAccumulator > 0 ? 1 : -1;
      goToIndex(activeIndex + direction, { fromUser: true });
    },
    { passive: false }
  );

  DESKTOP_MQ.addEventListener("change", () => {
    if (DESKTOP_MQ.matches) {
      canvas?.classList.remove("why__canvas--off");
    } else {
      canvas?.classList.add("why__canvas--off");
    }
    setupMode();
  });
  window.addEventListener("resize", () => {
    if (!DESKTOP_MQ.matches) {
      measureMobile();
      updateMobileFromScroll();
    }
  });

  initParticles(canvas, section);
  setupMode();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWhyShowcase);
} else {
  initWhyShowcase();
}
