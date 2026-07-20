import "./i18n.js";
import "./why-showcase.js";
import "./preloader.js";
import "./proceso-cards.js";
import "./proceso-zigzag.js";
import "./console-easter.js";
import { updateGlobalScrollEffects } from "./scroll.js";
import { updateBackgroundCanvasSize, initParticles } from "./background.js";
import "./nav-brand-neural.js";
import "./hero-brand-neural.js";
import "./interactions.js";
import "./nav-mobile.js";
import "./tech-stack.js";
import "./sections.js";
import "./projects-bubbles.js";

updateGlobalScrollEffects();

import("./three-scene.js").catch(() => {
  document.documentElement.classList.add("no-3d");
  document
    .querySelectorAll(
      "#hero-brain-wrap, #nav-brain-wrap, #footer-brain-wrap, #end-logo-brain-wrap, #end-logo-brain-wrap-mirror, #proceso-brain-wrap"
    )
    .forEach((el) => {
      el.classList.add("brain-failed");
      el.setAttribute("data-brain-failed", "1");
    });
  /* Fondos 2D siguen disponibles aunque falle el runtime 3D. */
  updateBackgroundCanvasSize();
  initParticles();
});
