const audio = document.getElementById("site-music-audio");
const btn = document.getElementById("music-toggle");

if (audio && btn) {
  audio.volume = 0.38;
  audio.loop = false;

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
    btn.setAttribute(
      "aria-label",
      playing ? "Pausar Ibiza Global Radio" : "Reproducir Ibiza Global Radio en directo"
    );
    if (playing) startWaveform();
    else stopWaveform();
  }

  idleHeights();

  btn.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
        btn.classList.remove("music-toggle--error");
        btn.title = "Ibiza Global Radio — en directo";
      } catch {
        btn.classList.add("music-toggle--error");
        btn.setAttribute(
          "aria-label",
          "No se pudo reproducir la emisora. Comprueba tu conexión o inténtalo más tarde."
        );
        btn.title = "No se pudo conectar al stream";
      }
    } else {
      audio.pause();
    }
    syncUiFromAudio();
  });

  audio.addEventListener("play", syncUiFromAudio);
  audio.addEventListener("pause", syncUiFromAudio);

  audio.addEventListener("error", () => {
    btn.classList.add("music-toggle--error");
    btn.title = "Error al cargar el stream de Ibiza Global Radio";
    stopWaveform();
  });
}
