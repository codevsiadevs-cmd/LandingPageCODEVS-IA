const CONSOLE_EASTER_KEY = "codevs-console-easter-shown";
const CONSOLE_INSPECTOR_KEY = "codevs-console-inspector-shown";

function runConsoleEasterEgg() {
  if (sessionStorage.getItem(CONSOLE_EASTER_KEY) === "1") return;
  sessionStorage.setItem(CONSOLE_EASTER_KEY, "1");

  console.clear();
  console.groupCollapsed("CODEVS IA");

  console.log(`%c
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
`, `
color: #0FFFD4;
font-family: monospace;
font-size: 10px;
line-height: 1.2;
text-shadow: 0 0 10px #0FFFD4;
`);

  console.log('%c⚡ Bienvenido a CODEVS IA',
'color: #0FFFD4; font-size: 18px; font-weight: bold; font-family: monospace;');

  console.log('%c🧠 Construimos el futuro con código\ne inteligencia artificial.',
'color: #7B61FF; font-size: 13px; font-family: monospace; line-height: 1.8;');

  console.log('%c💼 ¿Buscas talento tech?\n📧 contacto@codevsIA.com\n🌐 www.codevsIA.com\n💻 github.com/codevsIA',
'color: #8896B3; font-size: 12px; font-family: monospace; line-height: 2;');

  console.log('%c⚠️  Si estás viendo esto,\nsabemos que eres curioso/a.\n¡Nos gusta eso! Escríbenos. 👀',
'color: #F0F4FF; background: #1A2235; font-size: 12px; padding: 8px 16px; border-radius: 4px; font-family: monospace; border-left: 3px solid #0FFFD4;');

  console.log('%cCODEVS IA © 2025 — \nTodos los derechos reservados.',
'color: #2A3450; font-size: 10px; font-family: monospace;');

  console.log('%c codevsIA.core-[v1.0.0]-build-prod.js:1 \nSistema de protección activo',
'color: #0FFFD4; font-size: 10px; font-family: monospace; opacity: 0.6;');

  console.groupEnd();
}

function setupDevtoolsHello() {
  let wasOpen = false;

  function isDevToolsOpen() {
    const wGap = Math.abs(window.outerWidth - window.innerWidth);
    const hGap = Math.abs(window.outerHeight - window.innerHeight);
    return wGap > 160 || hGap > 160;
  }

  function checkDevToolsOpenAfterLoad() {
    const open = isDevToolsOpen();
    if (!wasOpen && open && sessionStorage.getItem(CONSOLE_INSPECTOR_KEY) !== "1") {
      sessionStorage.setItem(CONSOLE_INSPECTOR_KEY, "1");
      console.log("%c👋 Hola inspector... vemos que te gusta mirar bajo el capó. Bienvenido a CODEVS IA ⚡", "color: #0FFFD4; font-size: 12px; font-family: monospace;");
    }
    wasOpen = open;
  }

  window.addEventListener("resize", checkDevToolsOpenAfterLoad, { passive: true });
  window.setInterval(checkDevToolsOpenAfterLoad, 1200);
}

runConsoleEasterEgg();
setupDevtoolsHello();
