import { t } from "./i18n.js";

const audio = document.getElementById("site-music-audio");
const btn = document.getElementById("music-toggle");

if (audio && btn) {
  audio.volume = 0.38;
  audio.loop = false;

  let playError = false;
  let loadError = false;

  const barEls = () => Array.from(btn.querySelectorAll(".music-toggle__bar"));
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function randomHeights() {
    barEls().forEach((el) => {
      const h = Math.random() * 0.8 + 0.2;
      el.style.height = `${Math.max(4, h * 14)}px`;
    });
  }

  function idleHeights() {
    barEls().forEach((el) => {
      el.style.height = `${Math.max(4, 0.1 * 14)}px`;
    });
  }

  let waveformIntervalId = null;

  function startWaveform() {
    stopWaveform();
    if (prefersReducedMotion) {
      barEls().forEach((el, i) => {
        el.style.height = `${6 + (i % 3) * 2}px`;
      });
      return;
    }
    randomHeights();
    waveformIntervalId = window.setInterval(randomHeights, 100);
  }

  function stopWaveform() {
    if (waveformIntervalId !== null) {
      window.clearInterval(waveformIntervalId);
      waveformIntervalId = null;
    }
    idleHeights();
  }

  function syncUiFromAudio() {
    const playing = !audio.paused;
    btn.classList.toggle("music-toggle--playing", playing);
    btn.setAttribute("aria-pressed", playing ? "true" : "false");

    if (loadError) {
      btn.setAttribute("aria-label", t("music.errorLoad"));
      btn.title = t("music.errorLoad");
    } else if (playError) {
      btn.setAttribute("aria-label", t("music.errorPlay"));
      btn.title = t("music.errorConnect");
    } else {
      btn.setAttribute("aria-label", playing ? t("music.pause") : t("music.play"));
      btn.title = t("music.titleLive");
    }

    if (playing) startWaveform();
    else stopWaveform();
  }

  idleHeights();

  btn.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
        btn.classList.remove("music-toggle--error");
        playError = false;
      } catch {
        btn.classList.add("music-toggle--error");
        playError = true;
      }
    } else {
      audio.pause();
      playError = false;
    }
    syncUiFromAudio();
  });

  audio.addEventListener("play", syncUiFromAudio);
  audio.addEventListener("pause", syncUiFromAudio);

  audio.addEventListener("error", () => {
    btn.classList.add("music-toggle--error");
    loadError = true;
    stopWaveform();
    syncUiFromAudio();
  });

  document.addEventListener("codevs:langchange", syncUiFromAudio);
}
