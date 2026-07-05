import { initBrandNeuralHover } from "./brand-neural-hover.js";

const panel = document.querySelector(".nav__brand-panel");
const canvas = document.getElementById("nav-brand-neural");

if (panel && canvas) {
  initBrandNeuralHover(panel, canvas, { hoverClass: "nav__brand-panel--hover" });
}
