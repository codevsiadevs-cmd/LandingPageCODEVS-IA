const DESKTOP_MIN_DURATION_MS = 2200;
const MOBILE_MIN_DURATION_MS = 1300;
const EXIT_MS = 900;
/** Cierra el preloader aunque window.load no llegue (CDN lento / scripts rotos). */
const MAX_WAIT_MS = 8000;

function isMobileViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function initPreloader() {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  const numDark = preloader.querySelector(".preloader__num--dark");
  const numLight = preloader.querySelector(".preloader__num--light");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.body.classList.add("is-preloading");

  if (reducedMotion) {
    document.body.classList.remove("is-preloading");
    preloader.remove();
    return;
  }

  const minDurationMs = isMobileViewport() ? MOBILE_MIN_DURATION_MS : DESKTOP_MIN_DURATION_MS;
  let displayValue = 0;
  let loadDone = false;
  let imagesLoaded = 0;
  let imagesTotal = 1;
  let fontsReady = false;
  const startTime = performance.now();

  function setCounter(value) {
    const clamped = Math.min(100, Math.max(0, value));
    const text = `${Math.round(clamped)}%`;
    if (numDark) numDark.textContent = text;
    if (numLight) numLight.textContent = text;
    preloader.style.setProperty("--preloader-progress", `${clamped}%`);
    preloader.setAttribute("aria-valuenow", String(Math.round(clamped)));
  }

  function isBelowFoldCritical(img) {
    /* Media diferida de Soluciones / videos no bloquean el preloader. */
    if (img.closest("#soluciones") || img.closest(".projects")) return true;
    if (img.tagName === "VIDEO") return true;
    if (img.hasAttribute("data-src") || img.hasAttribute("data-src-mp4")) return true;
    if (img.loading === "lazy") return true;
    return false;
  }

  function trackImages() {
    const images = [...document.images].filter(
      (img) => !img.closest("#preloader") && !isBelowFoldCritical(img)
    );
    imagesTotal = Math.max(images.length, 1);

    images.forEach((img) => {
      if (img.complete) {
        imagesLoaded += 1;
        return;
      }

      const markLoaded = () => {
        imagesLoaded += 1;
      };

      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", markLoaded, { once: true });
    });
  }

  function getLoadRatio() {
    const imageRatio = imagesLoaded / imagesTotal;
    const fontRatio = fontsReady ? 1 : 0;
    return Math.min(1, imageRatio * 0.7 + fontRatio * 0.3);
  }

  function getTargetProgress() {
    const elapsed = performance.now() - startTime;
    const timeRatio = Math.min(1, elapsed / minDurationMs);
    const loadRatio = getLoadRatio();

    if (loadDone) {
      return 100;
    }

    const easedTime = 1 - (1 - timeRatio) ** 2;
    return Math.min(92, easedTime * 55 + loadRatio * 37);
  }

  function finishPreloader() {
    preloader.classList.add("preloader--exit");
    window.setTimeout(() => {
      preloader.remove();
      document.body.classList.remove("is-preloading");
    }, EXIT_MS);
  }

  function tick() {
    const target = getTargetProgress();
    displayValue += (target - displayValue) * 0.14;

    if (loadDone && displayValue >= 99.6) {
      setCounter(100);
      window.setTimeout(finishPreloader, 280);
      return;
    }

    setCounter(displayValue);
    requestAnimationFrame(tick);
  }

  trackImages();

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      fontsReady = true;
    });
  } else {
    fontsReady = true;
  }

  /*
   * Móvil: no esperar window.load (GIFs/videos/Spline restantes).
   * Cerrar con DOM interactivo + fuentes + tiempo mínimo.
   */
  function markReadySoon() {
    const finalize = () => {
      loadDone = true;
    };

    if (isMobileViewport()) {
      const waitFonts = document.fonts?.ready ?? Promise.resolve();
      waitFonts.finally(() => {
        window.setTimeout(finalize, Math.max(0, minDurationMs - (performance.now() - startTime)));
      });
      /* Fallback si fuentes se demoran en red mala */
      window.setTimeout(finalize, minDurationMs + 1800);
      return;
    }

    if (document.readyState === "complete") {
      finalize();
    } else {
      window.addEventListener("load", finalize, { once: true });
    }
  }

  markReadySoon();
  window.setTimeout(() => {
    loadDone = true;
  }, MAX_WAIT_MS);

  setCounter(0);
  requestAnimationFrame(tick);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPreloader);
} else {
  initPreloader();
}
