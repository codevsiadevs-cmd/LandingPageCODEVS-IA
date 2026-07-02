import { t } from "./i18n.js";

const MOBILE_NAV_MQ = window.matchMedia("(max-width: 980px)");

function isMobileNav() {
  return MOBILE_NAV_MQ.matches;
}

function getNavActions(nav) {
  return nav.querySelector(".nav__actions");
}

function placeMobilePanel(nav, panel) {
  const actions = getNavActions(nav);
  if (isMobileNav()) {
    if (panel.parentElement !== document.body) {
      document.body.appendChild(panel);
    }
    panel.setAttribute("aria-hidden", nav.classList.contains("nav--open") ? "false" : "true");
    return;
  }

  panel.removeAttribute("aria-hidden");
  if (panel.parentElement !== nav && actions) {
    nav.insertBefore(panel, actions);
  }
}

function setMenuOpen(nav, toggle, panel, open) {
  nav.classList.toggle("nav--open", open);
  panel.classList.toggle("nav__links--open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? t("nav.closeMenu") : t("nav.openMenu"));
  panel.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("nav-menu-open", open);
}

function closeMenu(nav, toggle, panel) {
  if (!nav.classList.contains("nav--open")) return;
  setMenuOpen(nav, toggle, panel, false);
}

function initNavMobile() {
  const nav = document.getElementById("site-nav");
  const toggle = document.getElementById("nav-toggle");
  const panel = document.getElementById("nav-mobile-panel");

  if (!nav || !toggle || !panel) return;

  placeMobilePanel(nav, panel);

  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("nav--open");
    setMenuOpen(nav, toggle, panel, open);
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu(nav, toggle, panel));
  });

  panel.addEventListener("click", (event) => {
    if (event.target === panel) closeMenu(nav, toggle, panel);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu(nav, toggle, panel);
  });

  document.addEventListener("codevs:langchange", () => {
    const open = nav.classList.contains("nav--open");
    toggle.setAttribute("aria-label", open ? t("nav.closeMenu") : t("nav.openMenu"));
  });

  MOBILE_NAV_MQ.addEventListener("change", () => {
    placeMobilePanel(nav, panel);
    closeMenu(nav, toggle, panel);
  });

  window.addEventListener("resize", () => {
    placeMobilePanel(nav, panel);
    if (!isMobileNav()) closeMenu(nav, toggle, panel);
  });
}

initNavMobile();
