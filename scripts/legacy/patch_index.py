from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
p = ROOT / "index.html"
t = p.read_text(encoding="utf-8")
t = t.replace(
    '<meta property="og:image" content="./og-cover.png" />',
    '<meta property="og:image" content="./assets/images/og-cover.png" />',
)
start = t.index("<style>")
end = t.index("</style>") + len("</style>")
links = """  <link rel="stylesheet" href="./css/base.css" />
  <link rel="stylesheet" href="./css/layout.css" />
  <link rel="stylesheet" href="./css/components.css" />
  <link rel="stylesheet" href="./css/animations.css" />
  <link rel="stylesheet" href="./css/responsive.css" />"""
t = t[:start] + links + t[end:]
start = t.index('<script type="module">')
end = t.index("</script>", start) + len("</script>")
t = t[:start] + '  <script type="module" src="./js/main.js"></script>' + t[end:]
p.write_text(t, encoding="utf-8")
print("patched index.html")
