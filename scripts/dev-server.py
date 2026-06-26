#!/usr/bin/env python3
"""Servidor local con MIME types correctos para módulos ES (.js)."""

from __future__ import annotations

import mimetypes
import socketserver
import sys
from http.server import SimpleHTTPRequestHandler
from pathlib import Path

# Registro global por si algún código usa mimetypes directamente.
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("model/gltf-binary", ".glb")
mimetypes.add_type("image/svg+xml", ".svg")

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class DevHandler(SimpleHTTPRequestHandler):
    # Python 3.13 usa extensions_map antes que mimetypes; en Windows .js → text/plain.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        "": "application/octet-stream",
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".html": "text/html",
        ".htm": "text/html",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".glb": "model/gltf-binary",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".mp3": "audio/mpeg",
        ".xml": "application/xml",
        ".txt": "text/plain",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def guess_type(self, path: str) -> str:
        ext = Path(path).suffix.lower()
        if ext in self.extensions_map and ext:
            return self.extensions_map[ext]
        return super().guess_type(path)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:
        sys.stderr.write("[dev-server] %s - %s\n" % (self.address_string(), format % args))


class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> None:
    print("=" * 56)
    print("  CODEVS IA — servidor local")
    print("  NO uses: python -m http.server  (rompe .js en Windows)")
    print("=" * 56)
    with ThreadedServer(("", PORT), DevHandler) as httpd:
        print(f"  Carpeta: {ROOT}")
        print(f"  URL:     http://localhost:{PORT}")
        print("  Ctrl+C para detener")
        print("=" * 56)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")


if __name__ == "__main__":
    main()
