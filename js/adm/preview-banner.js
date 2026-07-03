const banner = document.createElement("div");
banner.className = "adm-preview-banner";
banner.setAttribute("role", "status");
banner.innerHTML = `
  <strong>Modo preview /adm</strong>
  <span>Los cambios de tipografía y marco son temporales — no afectan la landing pública.</span>
`;
document.body.appendChild(banner);
