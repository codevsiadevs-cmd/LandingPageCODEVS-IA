const MOBILE_NAV_MQ = window.matchMedia("(max-width: 980px)");

function isMobileNav() {
  return MOBILE_NAV_MQ.matches;
}

function setMenuOpen(nav, toggle, open) {
  nav.classList.toggle("nav--open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  document.body.classList.toggle("nav-menu-open", open);
}

function closeMenu(nav, toggle) {
  if (!nav.classList.contains("nav--open")) return;
  setMenuOpen(nav, toggle, false);
}

function initNavMobile() {
  const nav = document.getElementById("site-nav");
  const toggle = document.getElementById("nav-toggle");
  const panel = document.getElementById("nav-mobile-panel");

  if (!nav || !toggle || !panel) return;

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("nav--open");
    setMenuOpen(nav, toggle, open);
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu(nav, toggle));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu(nav, toggle);
  });

  MOBILE_NAV_MQ.addEventListener("change", (event) => {
    if (!event.matches) closeMenu(nav, toggle);
  });

  window.addEventListener("resize", () => {
    if (!isMobileNav()) closeMenu(nav, toggle);
  });
}

initNavMobile();
