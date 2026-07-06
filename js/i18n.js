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
    "meta.title": "CODEVS IA — Software e inteligencia artificial",
    "meta.description":
      "CODEVS IA — Desarrollo de software a medida potenciado con inteligencia artificial.",
    "preloader.loading": "Cargando sitio",
    "nav.brand": "CODEVS IA — Inicio",
    "nav.main": "Principal",
    "nav.technologies": "Tecnologías",
    "nav.projects": "Proyectos",
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
    "projects.title": "Proyectos Destacados",
    "projects.1":
      "Páginas Web — Sitios corporativos, landings y experiencias digitales de alto impacto con diseño moderno y rendimiento optimizado",
    "projects.2":
      "Chatbot IA — Asistente conversacional para atención al cliente, soporte y respuestas inteligentes 24/7",
    "projects.3":
      "E-commerce IA — Comercio digital con recomendaciones personalizadas, búsqueda semántica y checkout optimizado",
    "projects.4":
      "API Gateway — Infraestructura escalable para conectar, proteger y orquestar microservicios empresariales",
    "projects.5":
      "Agentes IA — Sistemas autónomos que planifican, ejecutan y resuelven flujos de trabajo con modelos de lenguaje",
    "projects.6":
      "Automatización de Documentos — Extracción, clasificación y procesamiento inteligente de documentos para equipos operativos",
    "process.title": "Cómo Trabajamos",
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
    "why.title": "¿Por qué elegir CODEVS IA?",
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
    "footer.tagline": "Software a medida y automatización inteligente para equipos que quieren crecer en serio.",
    "footer.nav": "Navegación rápida",
    "footer.home": "Inicio",
    "footer.social": "Redes sociales",
    "footer.copyright": "© 2026 CODEVS IA. Todos los derechos reservados.",
    "footer.made": "Hecho con ❤️ y mucho ☕",
    "music.play": "Reproducir Ibiza Global Radio en directo",
    "music.pause": "Pausar Ibiza Global Radio",
    "music.titleLive": "Ibiza Global Radio — en directo",
    "music.errorPlay":
      "No se pudo reproducir la emisora. Comprueba tu conexión o inténtalo más tarde.",
    "music.errorConnect": "No se pudo conectar al stream",
    "music.errorLoad": "Error al cargar el stream de Ibiza Global Radio",
    "whatsapp.label": "Escríbenos por WhatsApp al +57 305 350 9190",
    "whatsapp.title": "WhatsApp",
  },
  en: {
    "meta.title": "CODEVS IA — Software and artificial intelligence",
    "meta.description": "CODEVS IA — Custom software development powered by artificial intelligence.",
    "preloader.loading": "Loading site",
    "nav.brand": "CODEVS IA — Home",
    "nav.main": "Main",
    "nav.technologies": "Technologies",
    "nav.projects": "Projects",
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
    "projects.title": "Featured Projects",
    "projects.1":
      "Web Pages — Corporate sites, landings, and high-impact digital experiences with modern design and optimized performance",
    "projects.2":
      "AI Chatbot — Conversational assistant for customer support and intelligent 24/7 responses",
    "projects.3":
      "AI E-commerce — Digital commerce with personalized recommendations, semantic search, and optimized checkout",
    "projects.4":
      "API Gateway — Scalable infrastructure to connect, secure, and orchestrate enterprise microservices",
    "projects.5":
      "AI Agents — Autonomous systems that plan, execute, and solve workflows with language models",
    "projects.6":
      "Document Automation — Intelligent extraction, classification, and processing for operations teams",
    "process.title": "How We Work",
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
    "why.title": "Why choose CODEVS IA?",
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
    "footer.tagline": "Custom software and intelligent automation for teams that want to grow seriously.",
    "footer.nav": "Quick navigation",
    "footer.home": "Home",
    "footer.social": "Social media",
    "footer.copyright": "© 2026 CODEVS IA. All rights reserved.",
    "footer.made": "Made with ❤️ and lots of ☕",
    "music.play": "Play Ibiza Global Radio live",
    "music.pause": "Pause Ibiza Global Radio",
    "music.titleLive": "Ibiza Global Radio — live",
    "music.errorPlay": "Could not play the station. Check your connection or try again later.",
    "music.errorConnect": "Could not connect to the stream",
    "music.errorLoad": "Error loading Ibiza Global Radio stream",
    "whatsapp.label": "Message us on WhatsApp at +57 305 350 9190",
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
