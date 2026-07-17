# One-off: splits inline CSS from index.html into css/*.css
# Run: python scripts/split_css.py

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
LINES = HTML.read_text(encoding="utf-8").splitlines()
CSS_LINES = LINES[28:2257]


def strip_indent(line: str) -> str:
    if line.startswith("    "):
        return line[4:]
    return line


def assign_rule(block_text: str) -> str:
    s = block_text.strip()
    if s.startswith("@media"):
        return "responsive"
    if s.startswith("@keyframes"):
        return "animations"
    if s.startswith("@supports"):
        return "animations"

    # Selector list up to first {
    pre = s.split("{", 1)[0] if "{" in s else s
    parts = [p.strip() for p in pre.replace("\n", " ").split(",") if p.strip()]

    def any_sel(pred):
        return any(pred(p) for p in parts)

    # Base
    if any_sel(lambda p: p.startswith(":root")):
        return "base"
    if any_sel(lambda p: p.startswith("*")):
        return "base"
    if any_sel(lambda p: p == "html"):
        return "base"
    if any_sel(lambda p: p == "body" or p.startswith("body[data-section")):
        return "base"
    if any_sel(lambda p: p in ("header", "main", "footer")):
        return "base"
    if any_sel(lambda p: p in ("a", "button", "ul") or p.startswith(("a ", "a,", "button", "ul ", "ul,"))):
        return "base"
    if any_sel(lambda p: p.startswith(("img", "canvas"))):
        return "base"

    # Components
    comp_checks = [
        ".btn",
        ".services__card",
        ".services__icon",
        ".services__tag",
        ".tech-badge",
        ".project-card",
        ".project-filter",
        ".proceso-step",
        ".why__quote",
        ".testimonial-card",
        ".contact__",
        ".footer__brand",
        ".footer__tagline",
        ".footer__col-title",
        ".footer__list",
        ".custom-cursor",
        ".scroll-progress",
        ".bg-layer",
        "#bg-grid",
        "#bg-particles",
        ".bg-nebula",
        ".bg-scanlines",
        ".bg-vignette",
        ".brain-neural-cursor",
    ]
    for c in comp_checks:
        if any(p.startswith(c) for p in parts):
            return "components"

    # Layout
    layout_checks = [
        ".nav",
        ".hero",
        ".services",
        ".tech",
        ".projects",
        ".proceso",
        ".why",
        ".testimonials",
        ".contact",
        ".footer",
    ]
    for c in layout_checks:
        if any_sel(lambda p, cc=c: p.startswith(cc)):
            return "layout"

    return "layout"


def parse_top_level_blocks(lines):
    """Split top-level rules; supports multi-line selectors before {."""
    i = 0
    n = len(lines)
    while i < n:
        while i < n and not lines[i].strip():
            i += 1
        if i >= n:
            break

        start = i
        depth = 0
        saw_brace = False
        while i < n:
            ln = lines[i]
            if "{" in ln:
                saw_brace = True
            depth += ln.count("{") - ln.count("}")
            i += 1
            if saw_brace and depth <= 0:
                break

        block_lines = lines[start:i]
        block_raw = "\n".join(block_lines)
        bucket = assign_rule(block_raw)
        yield bucket, [strip_indent(x) for x in block_lines]


buckets = {"base": [], "layout": [], "components": [], "animations": [], "responsive": []}

for bucket, block in parse_top_level_blocks(CSS_LINES):
    buckets[bucket].append("\n".join(block))
    buckets[bucket].append("")

for name, chunks in buckets.items():
    text = "\n".join(chunks).strip() + "\n"
    (ROOT / "css" / f"{name}.css").write_text(text, encoding="utf-8")
    print(name, len(text))
