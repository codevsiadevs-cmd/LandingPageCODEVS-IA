function initProjectsHover() {
  const rows = document.querySelectorAll(".projects__row");
  if (!rows.length || !window.matchMedia("(hover: none)").matches) return;

  rows.forEach((row) => {
    row.addEventListener(
      "touchstart",
      () => {
        rows.forEach((item) => item.classList.remove("is-active"));
        row.classList.add("is-active");
      },
      { passive: true }
    );
  });

  document.addEventListener(
    "touchstart",
    (event) => {
      if (!event.target.closest(".projects__row")) {
        rows.forEach((item) => item.classList.remove("is-active"));
      }
    },
    { passive: true }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectsHover);
} else {
  initProjectsHover();
}
