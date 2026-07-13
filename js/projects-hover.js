function restartGif(img) {
  const src = img.getAttribute("src");
  if (!src) return;
  img.src = "";
  img.src = src;
}

function initProjectsExpand() {
  const section = document.querySelector(".projects");
  if (!section) return;

  const panels = [...section.querySelectorAll("[data-panel]")];
  if (!panels.length) return;

  panels.forEach((panel) => {
    panel.setAttribute("tabindex", "0");
    panel.setAttribute("aria-expanded", "false");
    panel.setAttribute("role", "button");

    function toggleOpen() {
      const willOpen = !panel.classList.contains("is-open");

      panels.forEach((other) => {
        if (other === panel) return;
        other.classList.remove("is-open");
        other.setAttribute("aria-expanded", "false");
      });

      panel.classList.toggle("is-open", willOpen);
      panel.setAttribute("aria-expanded", willOpen ? "true" : "false");

      if (willOpen) {
        const img = panel.querySelector(".projects__panel-gif");
        if (img) restartGif(img);
      }
    }

    panel.addEventListener("click", () => {
      toggleOpen();
    });

    panel.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleOpen();
    });
  });

  if ("IntersectionObserver" in window) {
    const imgs = [...section.querySelectorAll(".projects__panel-gif")];
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        imgs.forEach((img) => {
          const preload = new Image();
          preload.src = img.getAttribute("src");
        });
        preloadObserver.disconnect();
      },
      { rootMargin: "240px" }
    );
    preloadObserver.observe(section);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectsExpand);
} else {
  initProjectsExpand();
}
