import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[1]
html = root.joinpath(".tmp-spline-page.html").read_text(
    encoding="utf-8", errors="ignore"
)
match = re.search(r"app\.start\(\[([0-9,\s]+)\]\)", html)
if not match:
    raise SystemExit("Could not find app.start([...]) payload")

values = [int(x.strip()) for x in match.group(1).split(",") if x.strip()]
out = root / "assets" / "3d" / "particle-ai-brain.splinecode"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(bytes(values))
print(f"Wrote {len(values)} bytes to {out}")
