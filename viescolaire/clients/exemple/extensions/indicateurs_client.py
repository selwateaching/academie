"""Extension d'exemple : table propre au client, widget de tableau de bord, page et export dédiés."""
from flask import render_template_string


def register(api):
    api.ajouter_schema("""
        CREATE TABLE IF NOT EXISTS x_observations (
            id INTEGER PRIMARY KEY, etab_id INTEGER NOT NULL, texte TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );""")

    @api.app.route("/x/observations", methods=["GET", "POST"], endpoint="x_observations")
    def observations():
        from flask import g, redirect, request, abort
        if g.user["role"] not in ("admin", "direction", "cpe"):
            abort(403)
        if request.method == "POST" and request.form.get("texte", "").strip():
            api.run("INSERT INTO x_observations(etab_id,texte) VALUES (?,?)", (g.etab_id, request.form["texte"].strip()))
            api.audit("observation ajoutée")
            return redirect(request.path)
        rows = api.q("SELECT * FROM x_observations WHERE etab_id=? ORDER BY id DESC", (g.etab_id,))
        return render_template_string(
            """{% extends 'base.html' %}{% block body %}<div class="top"><h1>Observations</h1></div>
            <div class="card"><form method="post"><input type="hidden" name="_csrf" value="{{ csrf_token() }}">
            <textarea name="texte" required></textarea><br><br><button>Ajouter</button></form></div>
            <div class="card">{% for r in rows %}<p>{{ r.created_at }} — {{ r.texte }}</p>{% else %}<p class="mute">Aucune.</p>{% endfor %}</div>{% endblock %}""",
            rows=rows)

    api.ajouter_menu("Observations", "x_observations")
    api.ajouter_export("observations", "SELECT created_at, texte FROM x_observations WHERE etab_id=? ORDER BY id DESC")

    def widget():
        from flask import g
        n = api.one("SELECT COUNT(*) c FROM x_observations WHERE etab_id=?", (g.etab_id,))["c"]
        return f"<p><b>{n}</b> observation(s) enregistrée(s).</p>"
    api.ajouter_widget("Observations", widget)
