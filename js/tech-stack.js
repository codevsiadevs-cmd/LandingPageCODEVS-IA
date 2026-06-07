const TECH_ROWS = [
  [
    { name: "React", icon: "react.svg", category: "frontend" },
    { name: "Next.js", icon: "nextdotjs.svg", category: "frontend" },
    { name: "TypeScript", icon: "typescript.svg", category: "frontend" },
    { name: "Python", icon: "python.svg", category: "backend" },
    { name: "Node.js", icon: "nodedotjs.svg", category: "backend" },
    { name: "FastAPI", icon: "fastapi.svg", category: "backend" },
    { name: "Docker", icon: "docker.svg", category: "backend" },
  ],
  [
    { name: "PostgreSQL", icon: "postgresql.svg", category: "backend" },
    { name: "MongoDB", icon: "mongodb.svg", category: "backend" },
    { name: "AWS", icon: "amazonwebservices.svg", category: "backend" },
    { name: "GCP", icon: "googlecloud.svg", category: "backend" },
    { name: "OpenAI", icon: "openai.svg", category: "ai" },
    { name: "LangChain", icon: "langchain.svg", category: "ai" },
    { name: "Kubernetes", icon: "kubernetes.svg", category: "backend" },
  ],
];

function createTechBadge({ name, icon, category }) {
  const badge = document.createElement("div");
  badge.className = `tech-badge tech-badge--${category}`;

  const iconWrap = document.createElement("span");
  iconWrap.className = "tech-badge__icon";

  const img = document.createElement("img");
  img.src = `./assets/images/stack/${icon}`;
  img.alt = "";
  img.width = 28;
  img.height = 28;
  img.loading = "lazy";
  img.decoding = "async";
  iconWrap.appendChild(img);

  const label = document.createElement("span");
  label.className = "tech-badge__name";
  label.textContent = name;

  badge.append(iconWrap, label);
  return badge;
}

function populateTechMarquees() {
  document.querySelectorAll(".tech-marquee__track[data-tech-row]").forEach((track) => {
    const rowIndex = Number(track.dataset.techRow, 10);
    const items = TECH_ROWS[rowIndex];
    if (!items) return;

    for (let copy = 0; copy < 2; copy += 1) {
      const set = document.createElement("div");
      set.className = "tech-marquee__set";
      items.forEach((item) => set.appendChild(createTechBadge(item)));
      track.appendChild(set);
    }
  });
}

populateTechMarquees();
