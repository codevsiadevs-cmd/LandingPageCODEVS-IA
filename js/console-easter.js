function mostrarArteASCII() {
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
