const STORAGE_KEY = "codevs-lang";
const DEFAULT_LANG = "es";

const LANGUAGES = [
  {
    code: "es",
    name: "Español",
    nativeName: "Español",
    flag: "./assets/images/flags/es.svg",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "./assets/images/flags/en.svg",
  },
];

const LANG_META = Object.fromEntries(LANGUAGES.map((lang) => [lang.code, lang]));

const translations = {
  es: {
    "meta.title": "Codevs IA",
    "meta.description": "",
    "preloader.loading": "Cargando sitio",
    "nav.brand": "CODEVS IA — Inicio",
    "nav.main": "Principal",
    "nav.technologies": "Tecnologías",
    "nav.projects": "Soluciones",
    "nav.process": "Proceso",
    "nav.about": "Nosotros",
    "nav.contact": "Contacto",
    "nav.openMenu": "Abrir menú",
    "nav.closeMenu": "Cerrar menú",
    "nav.langLabel": "Seleccionar idioma",
    "nav.langListAria": "Idiomas",
    "hero.keyword.tech": "Tecnología",
    "hero.keyword.innov": "Innovación",
    "hero.keyword.digital": "Digital",
    "hero.intro":
      "Promovemos y facilitamos la innovación digital y tecnológica, creando, probando e implementando soluciones diseñadas inteligentemente, más accesible y centrada en las personas.",
    "metrics.aria": "Métricas de CODEVS IA",
    "metrics.projects": "Proyectos entregados",
    "metrics.clients": "Clientes satisfechos",
    "metrics.years": "Años de experiencia",
    "metrics.success": "Tasa de éxito",
    "tech.aria": "Stack tecnológico",
    "tech.title": "Tecnologías",
    "projects.title": "Soluciones",
    "projects.step.1": "01",
    "projects.step.2": "02",
    "projects.step.3": "03",
    "projects.step.4": "04",
    "projects.1.title": "Páginas Web",
    "projects.1.desc":
      "Sitios corporativos, landings y experiencias digitales de alto impacto con diseño moderno y rendimiento optimizado",
    "projects.2.title": "Automatizaciones",
    "projects.2.desc":
      "Automatizamos procesos de negocio conectando tus herramientas y eliminando tareas repetitivas para aumentar la productividad.",
    "projects.3.title": "Agentes IA",
    "projects.3.desc":
      "Sistemas autónomos que planifican, ejecutan y resuelven flujos de trabajo con modelos de lenguaje",
    "projects.4.title": "Chatbot IA",
    "projects.4.desc":
      "Asistente conversacional para atención al cliente, soporte y respuestas inteligentes 24/7",
    "projects.5.title": "API Gateway",
    "projects.5.desc":
      "Infraestructura escalable para conectar, proteger y orquestar microservicios empresariales",
    "projects.6.title": "¿Necesitas algo diferente?",
    "projects.6.desc":
      "Desarrollamos soluciones personalizadas para las necesidades específicas de tu empresa.",
    "process.title": "Cómo trabajamos",
    "process.punch.badge": "Cómo trabajamos",
    "process.carouselAria": "Pasos de cómo trabajamos",
    "process.prev": "Paso anterior",
    "process.next": "Paso siguiente",
    "process.step.1": "PASO 01",
    "process.step.2": "PASO 02",
    "process.step.3": "PASO 03",
    "process.step.4": "PASO 04",
    "process.step.5": "PASO 05",
    "process.step.6": "PASO 06",
    "process.1.title": "Descubrimiento",
    "process.1.desc": "Entendemos tu negocio y definimos objetivos claros",
    "process.2.title": "Diseño",
    "process.2.desc": "Arquitectura técnica y prototipo de experiencia",
    "process.3.title": "Desarrollo",
    "process.3.desc": "Código limpio, tests y entregas incrementales",
    "process.4.title": "QA & Pruebas",
    "process.4.desc": "Validación rigurosa antes de cada release",
    "process.5.title": "Deploy",
    "process.5.desc": "Lanzamiento seguro con monitoreo en tiempo real",
    "process.6.title": "Soporte",
    "process.6.desc": "Acompañamiento continuo post-lanzamiento",
    "why.title": "¿Por qué elegir Codevs IA?",
    "why.transition.eyebrow": "FIN DEL PROCESO",
    "why.punch.badge": "Por qué CODEVS IA",
    "why.reason.1": "RAZÓN 01",
    "why.reason.2": "RAZÓN 02",
    "why.reason.3": "RAZÓN 03",
    "why.reason.4": "RAZÓN 04",
    "why.reason.5": "RAZÓN 05",
    "why.1": "Equipo senior con experiencia en productos reales",
    "why.2": "IA integrada desde el inicio, no como add-on",
    "why.3": "Comunicación transparente y entregas puntuales",
    "why.4": "Código limpio, documentado y escalable",
    "why.5": "Soporte post-lanzamiento incluido",
    "why.tag.1": "Equipo senior",
    "why.tag.2": "IA nativa",
    "why.tag.3": "Transparente",
    "why.tag.4": "Código limpio",
    "why.tag.5": "Soporte",
    "why.hint.mobile": "Sigue bajando para explorar ↓",
    "why.hint.desktop": "Scroll o flechas ↑↓ para explorar",
    "contact.title": "¿Listo para construir algo increíble?",
    "contact.subtitle": "Cuéntanos tu idea. Respondemos en menos de 24 horas.",
    "contact.name": "Nombre completo",
    "contact.email": "Email",
    "contact.type": "Tipo de proyecto",
    "contact.message": "Cuéntanos tu proyecto",
    "contact.submit": "Enviar mensaje",
    "contact.submitting": "Enviando...",
    "contact.success": "¡Mensaje enviado! Te contactamos pronto 🚀",
    "contact.subject": "Nuevo mensaje desde CODEVS IA",
    "contact.type.web": "Web",
    "contact.type.mobile": "Móvil",
    "contact.type.ai": "IA",
    "contact.type.backend": "Backend",
    "contact.type.consulting": "Consultoría",
    "contact.type.other": "Otro",
    "contact.error.name": "Escribe tu nombre completo (mínimo 2 caracteres).",
    "contact.error.emailRequired": "Necesitamos un email para responderte.",
    "contact.error.emailInvalid": "El formato del email no es válido.",
    "contact.error.type": "Selecciona el tipo de proyecto.",
    "contact.error.message": "Cuéntanos un poco más (mínimo 10 caracteres).",
    "contact.error.send": "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos segundos.",
    "contact.error.sendAlt": "No pudimos enviar tu mensaje. Inténtalo de nuevo.",
    "contact.error.network": "Hubo un problema con la conexión. Comprueba tu red e inténtalo de nuevo.",
    "contact.error.config": "Configura tu access_key de Web3Forms para activar el envío.",
    "footer.nav": "Navegación rápida",
    "footer.home": "Inicio",
    "footer.social": "Redes sociales",
    "footer.copyright": "© 2026 CODEVS IA. Todos los derechos reservados.",
    "footer.made.before": "Hecho con",
    "footer.made.mid": "y mucho",
    "whatsapp.label": "Escríbenos por WhatsApp al +57 302 7261612",
    "whatsapp.title": "WhatsApp",
  },
  en: {
    "meta.title": "Codevs IA",
    "meta.description": "",
    "preloader.loading": "Loading site",
    "nav.brand": "CODEVS IA — Home",
    "nav.main": "Main",
    "nav.technologies": "Technologies",
    "nav.projects": "Solutions",
    "nav.process": "Process",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.openMenu": "Open menu",
    "nav.closeMenu": "Close menu",
    "nav.langLabel": "Select language",
    "nav.langListAria": "Languages",
    "hero.keyword.tech": "Technology",
    "hero.keyword.innov": "Innovation",
    "hero.keyword.digital": "Digital",
    "hero.intro":
      "We promote and enable digital and technological innovation by creating, testing, and implementing intelligently designed solutions that are more accessible and people-centered.",
    "metrics.aria": "CODEVS IA metrics",
    "metrics.projects": "Projects delivered",
    "metrics.clients": "Happy clients",
    "metrics.years": "Years of experience",
    "metrics.success": "Success rate",
    "tech.aria": "Technology stack",
    "tech.title": "Technologies",
    "projects.title": "Solutions",
    "projects.step.1": "01",
    "projects.step.2": "02",
    "projects.step.3": "03",
    "projects.step.4": "04",
    "projects.1.title": "Web Pages",
    "projects.1.desc":
      "Corporate sites, landings, and high-impact digital experiences with modern design and optimized performance",
    "projects.2.title": "Automations",
    "projects.2.desc":
      "We automate business processes by connecting your tools and eliminating repetitive tasks to boost productivity.",
    "projects.3.title": "AI Agents",
    "projects.3.desc":
      "Autonomous systems that plan, execute, and solve workflows with language models",
    "projects.4.title": "AI Chatbot",
    "projects.4.desc":
      "Conversational assistant for customer support and intelligent 24/7 responses",
    "projects.5.title": "API Gateway",
    "projects.5.desc":
      "Scalable infrastructure to connect, secure, and orchestrate enterprise microservices",
    "projects.6.title": "Need something different?",
    "projects.6.desc":
      "We build custom solutions tailored to your company's specific needs.",
    "process.title": "How We Work",
    "process.punch.badge": "How we work",
    "process.carouselAria": "How we work steps",
    "process.prev": "Previous step",
    "process.next": "Next step",
    "process.step.1": "STEP 01",
    "process.step.2": "STEP 02",
    "process.step.3": "STEP 03",
    "process.step.4": "STEP 04",
    "process.step.5": "STEP 05",
    "process.step.6": "STEP 06",
    "process.1.title": "Discovery",
    "process.1.desc": "We understand your business and define clear goals",
    "process.2.title": "Design",
    "process.2.desc": "Technical architecture and experience prototype",
    "process.3.title": "Development",
    "process.3.desc": "Clean code, tests, and incremental delivery",
    "process.4.title": "QA & Testing",
    "process.4.desc": "Rigorous validation before every release",
    "process.5.title": "Deploy",
    "process.5.desc": "Secure launch with real-time monitoring",
    "process.6.title": "Support",
    "process.6.desc": "Ongoing post-launch partnership",
    "why.title": "Why choose Codevs IA?",
    "why.transition.eyebrow": "END OF THE PROCESS",
    "why.punch.badge": "Why CODEVS IA",
    "why.reason.1": "REASON 01",
    "why.reason.2": "REASON 02",
    "why.reason.3": "REASON 03",
    "why.reason.4": "REASON 04",
    "why.reason.5": "REASON 05",
    "why.1": "Senior team with real product experience",
    "why.2": "AI integrated from day one, not as an add-on",
    "why.3": "Transparent communication and on-time delivery",
    "why.4": "Clean, documented, and scalable code",
    "why.5": "Post-launch support included",
    "why.tag.1": "Senior team",
    "why.tag.2": "AI-native",
    "why.tag.3": "Transparent",
    "why.tag.4": "Clean code",
    "why.tag.5": "Support",
    "why.hint.mobile": "Keep scrolling down to explore ↓",
    "why.hint.desktop": "Scroll or use ↑↓ arrows to explore",
    "contact.title": "Ready to build something incredible?",
    "contact.subtitle": "Tell us your idea. We respond within 24 hours.",
    "contact.name": "Full name",
    "contact.email": "Email",
    "contact.type": "Project type",
    "contact.message": "Tell us about your project",
    "contact.submit": "Send message",
    "contact.submitting": "Sending...",
    "contact.success": "Message sent! We'll be in touch soon 🚀",
    "contact.subject": "New message from CODEVS IA",
    "contact.type.web": "Web",
    "contact.type.mobile": "Mobile",
    "contact.type.ai": "AI",
    "contact.type.backend": "Backend",
    "contact.type.consulting": "Consulting",
    "contact.type.other": "Other",
    "contact.error.name": "Enter your full name (minimum 2 characters).",
    "contact.error.emailRequired": "We need an email to reply to you.",
    "contact.error.emailInvalid": "The email format is not valid.",
    "contact.error.type": "Select a project type.",
    "contact.error.message": "Tell us a bit more (minimum 10 characters).",
    "contact.error.send": "We couldn't send your message. Please try again in a few seconds.",
    "contact.error.sendAlt": "We couldn't send your message. Please try again.",
    "contact.error.network": "There was a connection problem. Check your network and try again.",
    "contact.error.config": "Configure your Web3Forms access_key to enable sending.",
    "footer.nav": "Quick navigation",
    "footer.home": "Home",
    "footer.social": "Social media",
    "footer.copyright": "© 2026 CODEVS IA. All rights reserved.",
    "footer.made.before": "Made with",
    "footer.made.mid": "and lots of",
    "whatsapp.label": "Message us on WhatsApp at +57 302 7261612",
    "whatsapp.title": "WhatsApp",
  },
};

let currentLang = DEFAULT_LANG;

function getStoredLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && translations[stored] ? stored : DEFAULT_LANG;
}

function createLangOption(lang) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav__lang-option";
  btn.role = "option";
  btn.dataset.lang = lang.code;
  btn.setAttribute("aria-selected", String(lang.code === currentLang));

  if (lang.code === currentLang) btn.classList.add("is-active");

  btn.innerHTML = `
    <span class="nav__lang-option-flag" aria-hidden="true">
      <img src="${lang.flag}" alt="" width="24" height="24" decoding="async" />
    </span>
    <span class="nav__lang-option-text">
      <span class="nav__lang-option-name">${lang.nativeName}</span>
      <span class="nav__lang-option-code">${lang.code.toUpperCase()}</span>
    </span>
  `;

  btn.addEventListener("click", () => {
    setLanguage(lang.code);
    closeAllLangPanels();
  });

  return btn;
}

function renderLangList(switcher) {
  const list = switcher.querySelector("[data-lang-list]");
  if (!list) return;

  list.replaceChildren(...LANGUAGES.map(createLangOption));
}

export function t(key) {
  return translations[currentLang]?.[key] ?? translations[DEFAULT_LANG]?.[key] ?? key;
}

export function getCurrentLang() {
  return currentLang;
}

export function getLangMeta(lang = currentLang) {
  return LANG_META[lang] ?? LANG_META[DEFAULT_LANG];
}

function updateToggleFlags() {
  const meta = getLangMeta();

  document.querySelectorAll("[data-lang-switcher]").forEach((switcher) => {
    const img = switcher.querySelector("[data-lang-flag-img]");
    const toggle = switcher.querySelector(".nav__lang-toggle");
    if (img) {
      img.src = meta.flag;
      img.alt = meta.name;
    }
    if (toggle) toggle.setAttribute("aria-label", t("nav.langLabel"));

    const list = switcher.querySelector("[data-lang-list]");
    if (list) list.setAttribute("aria-label", t("nav.langListAria"));

    renderLangList(switcher);
  });
}

export function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.title = t("meta.title");

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", t("meta.description"));

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", t("meta.title"));

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", t("meta.description"));

  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute("content", t("meta.title"));

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute("content", t("meta.description"));

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (!key) return;
    el.setAttribute("placeholder", t(key));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.dataset.i18nAriaLabel;
    if (!key) return;
    el.setAttribute("aria-label", t(key));
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.dataset.i18nTitle;
    if (!key) return;
    el.setAttribute("title", t(key));
  });

  document.querySelectorAll("[data-i18n-value]").forEach((el) => {
    const key = el.dataset.i18nValue;
    if (!key) return;
    el.value = t(key);
  });

  updateToggleFlags();
  document.dispatchEvent(new CustomEvent("codevs:langchange", { detail: { lang: currentLang } }));
}

export function setLanguage(lang) {
  if (!translations[lang] || lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  applyTranslations();
}

export function initI18n() {
  currentLang = getStoredLang();
  applyTranslations();
}

function closeAllLangPanels(except) {
  document.querySelectorAll("[data-lang-switcher]").forEach((switcher) => {
    if (switcher === except) return;

    const toggle = switcher.querySelector(".nav__lang-toggle");
    const panel = switcher.querySelector(".nav__lang-panel");

    switcher.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
    panel?.setAttribute("hidden", "");
  });
}

function openLangPanel(switcher) {
  const toggle = switcher.querySelector(".nav__lang-toggle");
  const panel = switcher.querySelector(".nav__lang-panel");
  if (!toggle || !panel) return;

  closeAllLangPanels(switcher);
  switcher.classList.add("is-open");
  toggle.setAttribute("aria-expanded", "true");
  panel.removeAttribute("hidden");
  renderLangList(switcher);
}

function initLangSwitcher() {
  const switchers = document.querySelectorAll("[data-lang-switcher]");
  if (!switchers.length) return;

  switchers.forEach((switcher) => {
    const toggle = switcher.querySelector(".nav__lang-toggle");
    const panel = switcher.querySelector(".nav__lang-panel");
    if (!toggle || !panel) return;

    renderLangList(switcher);

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = switcher.classList.contains("is-open");
      if (open) closeAllLangPanels();
      else openLangPanel(switcher);
    });

    panel.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });

  document.addEventListener("click", () => closeAllLangPanels());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllLangPanels();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initI18n();
    initLangSwitcher();
  });
} else {
  initI18n();
  initLangSwitcher();
}
