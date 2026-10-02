import os

from flask import Flask, send_from_directory

app = Flask(__name__, static_folder=None)


@app.get("/")
def index():
    return send_from_directory(os.path.dirname(__file__), "index.html")


@app.get("/index.html")
def index_html():
    return send_from_directory(os.path.dirname(__file__), "index.html")


@app.get("/data.js")
def data_js():
    return send_from_directory(os.path.dirname(__file__), "data.js")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
