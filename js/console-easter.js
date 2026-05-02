function mostrarArteASCII() {
  console.clear();
  console.groupCollapsed("CODEVS IA");

  console.log(
    `%c
 ██████╗ ██████╗ ██████╗ ███████╗██╗   ██╗███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝██║   ██║██╔════╝
██║     ██║   ██║██║  ██║█████╗  ██║   ██║███████╗
██║     ██║   ██║██║  ██║██╔══╝  ╚██╗ ██╔╝╚════██║
╚██████╗╚██████╔╝██████╔╝███████╗ ╚████╔╝ ███████║
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝

██╗ █████╗
██║██╔══██╗
██║███████║
██║██╔══██║
██║██║  ██║
╚═╝╚═╝  ╚═╝
`,
    "color:#0FFFD4;font-family:monospace;font-size:10px;line-height:1.2;text-shadow:0 0 10px #0FFFD4;"
  );

  console.log(
    "%c⚡ Bienvenido a CODEVS IA",
    "color:#0FFFD4;font-size:18px;font-weight:bold;font-family:monospace;"
  );

  console.log(
    "%c🧠 Construimos el futuro con código\ne inteligencia artificial.",
    "color:#7B61FF;font-size:13px;font-family:monospace;line-height:1.8;"
  );

  console.log(
    "%c💼 ¿Buscas talento tech?\n📧 hola@codevsia.dev\n🌐 www.codevsia.dev\n💻 github.com/codevs-ia",
    "color:#8896B3;font-size:12px;font-family:monospace;line-height:2;"
  );

  console.log(
    "%c⚠️  Si estás viendo esto,\nsabemos que eres curioso/a.\n¡Nos gusta eso! Escríbenos. 👀",
    "color:#F0F4FF;background:#1A2235;font-size:12px;padding:8px 16px;border-radius:4px;font-family:monospace;border-left:3px solid #0FFFD4;"
  );

  console.log(
    "%cCODEVS IA © 2026 — Todos los derechos reservados.",
    "color:#2A3450;font-size:10px;font-family:monospace;"
  );

  console.log(
    "%c codevsIA.core-[v1.0.0]-build-prod.js:1\nSistema activo",
    "color:#0FFFD4;font-size:10px;font-family:monospace;opacity:0.6;"
  );

  console.groupEnd();
}

function setupDevtoolsHello() {
  let lastShown = 0;
  let wasOpen = false;

  function isDevToolsOpen() {
    const wGap = Math.abs(window.outerWidth - window.innerWidth);
    const hGap = Math.abs(window.outerHeight - window.innerHeight);
    return wGap > 160 || hGap > 160;
  }

  function checkAndShow() {
    const open = isDevToolsOpen();
    if (!wasOpen && open) {
      const now = Date.now();
      if (lastShown > 0 && now - lastShown < 3000) {
        wasOpen = open;
        return;
      }
      lastShown = now;
      setTimeout(() => mostrarArteASCII(), 300);
    }
    wasOpen = open;
  }

  window.addEventListener("resize", checkAndShow, { passive: true });
  setInterval(checkAndShow, 1200);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "F12") {
    setTimeout(() => mostrarArteASCII(), 500);
  }
});

mostrarArteASCII();
setupDevtoolsHello();
