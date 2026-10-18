"""Petit serveur statique pour Académie Maths (bibliothèque standard seulement).

Lancer :  python3 server.py   (port 8000, ou la variable PORT)
Sur Render, ce dossier peut aussi être déployé en « Static Site ».
"""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = {"index.html", "css", "js"}


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/healthz":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
            return
        if path == "/":
            self.path = "/index.html"
            return super().do_GET()
        top = path.lstrip("/").split("/")[0]
        if top in PUBLIC and not path.endswith(".py"):
            return super().do_GET()
        self.send_error(404)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=ROOT))
    print(f"Académie Maths : http://0.0.0.0:{port}")
    server.serve_forever()
