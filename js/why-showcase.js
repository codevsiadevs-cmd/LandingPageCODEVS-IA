import { prefersReducedMotionGlobal } from "./scroll.js";

const DESKTOP_ZOOM_DEPTH = 3.4;
const MOBILE_ZOOM_DEPTH = 2.75;
const MOBILE_ZOOM_MQ = window.matchMedia("(max-width: 900px)");
const STEP_COUNT = 5;

function getZoomDepth() {
  return MOBILE_ZOOM_MQ.matches ? MOBILE_ZOOM_DEPTH : DESKTOP_ZOOM_DEPTH;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function getShowcaseFrame(progress) {
  const maxFrame = STEP_COUNT - 1;
  if (!MOBILE_ZOOM_MQ.matches) {
    return progress * maxFrame;
  }

  const leadEnd = 0.7;
  if (progress <= leadEnd) {
    return (progress / leadEnd) * (maxFrame - 0.35);
  }

  const tail = (progress - leadEnd) / (1 - leadEnd);
  return maxFrame - 0.35 + tail * 0.35;
}

function getPanelBlur(absDelta) {
  const blurScale = MOBILE_ZOOM_MQ.matches ? 5 : 8;
  return Math.min(16, absDelta * blurScale);
}

function initWhyShowcase() {
  const section = document.getElementById("nosotros");
  if (!section) return;

  const showcase = section.querySelector("[data-why-showcase]");
  const slider = showcase?.querySelector(".why__slider");
  const panels = showcase ? [...showcase.querySelectorAll("[data-why-panel]")] : [];
  const counter = showcase?.querySelector("[data-why-counter]");

  if (!showcase || panels.length !== STEP_COUNT) return;

  let rafId = null;
  let sectionNear = true;

  function paint() {
    if (!sectionNear) return;

    const vh = window.innerHeight;
    const rect = showcase.getBoundingClientRect();
    const total = rect.height - vh;
    const progress = clamp01(total > 0 ? -rect.top / total : 0);
    const frame = getShowcaseFrame(progress);

    section.classList.toggle("why--pinned", rect.top <= 1 && rect.bottom > vh + 1);

    if (counter) {
      counter.textContent = String(
        Math.max(1, Math.min(STEP_COUNT, Math.round(frame) + 1))
      ).padStart(2, "0");
    }

    panels.forEach((panel, i) => {
      const delta = i - frame;
      const absDelta = Math.abs(delta);
      const scale = Math.pow(getZoomDepth(), -delta);
      const opacity = delta >= 0 ? clamp01(1 - delta * 0.7) : clamp01(1 + delta * 3);
      const blur = getPanelBlur(absDelta);
      const z = 1000 - Math.round(absDelta * 12);

      panel.style.transform = `translate(-50%, -50%) scale(${scale})`;
      panel.style.opacity = String(opacity);
      panel.style.filter = `blur(${blur}px)`;
      panel.style.zIndex = String(z);
    });

    const activeItem = Math.round(frame);
    if (section.dataset.activeItem !== String(activeItem)) {
      section.dataset.activeItem = String(activeItem);
    }

    const onLastSlide = frame >= STEP_COUNT - 1.02;
    const exitStart = MOBILE_ZOOM_MQ.matches ? 0.87 : 0.93;
    const exitFade = onLastSlide && progress > exitStart
      ? smoothstep((progress - exitStart) / (1 - exitStart))
      : 0;
    const fadeValue = String(exitFade);

    section.classList.toggle("why--exiting", exitFade > 0.01);
    section.style.setProperty("--why-exit-fade", fadeValue);
    document.documentElement.style.setProperty("--why-exit-fade", fadeValue);
  }

  function schedulePaint() {
    if (rafId != null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      paint();
    });
  }

  if (prefersReducedMotionGlobal) {
    section.classList.add("why--static");
    if (slider) slider.style.opacity = "1";
    section.classList.remove("why--exiting");
    section.style.setProperty("--why-exit-fade", "0");
    document.documentElement.style.setProperty("--why-exit-fade", "0");
    if (counter) counter.textContent = "01";
    panels.forEach((panel) => {
      panel.style.transform = "";
      panel.style.opacity = "";
      panel.style.filter = "";
      panel.style.zIndex = "";
    });
    return;
  }

  paint();
  window.addEventListener("scroll", schedulePaint, { passive: true });
  window.addEventListener("resize", schedulePaint, { passive: true });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        sectionNear = entries.some((e) => e.isIntersecting);
        if (sectionNear) schedulePaint();
      },
      { rootMargin: "20% 0px", threshold: 0 }
    );
    io.observe(showcase);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWhyShowcase);
} else {
  initWhyShowcase();
}
