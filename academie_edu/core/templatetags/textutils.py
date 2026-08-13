import markdown as md
from django import template
from django.utils.html import escape
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter(name="markdown")
def markdown_filter(text):
    """Rend du texte Markdown en HTML, en échappant d'abord le texte source
    pour empêcher toute injection de HTML/JS brut (contenu généré par l'IA
    ou saisi par les utilisateurs)."""
    if not text:
        return ""
    html = md.markdown(escape(text), extensions=["extra", "nl2br"])
    return mark_safe(html)
