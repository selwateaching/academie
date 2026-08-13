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


@register.filter(name="get_item")
def get_item(dictionnaire, cle):
    if not dictionnaire:
        return None
    return dictionnaire.get(cle)


@register.filter(name="avatar_bg")
def avatar_bg(pk):
    """Retourne une classe CSS de couleur d'avatar déterministe à partir d'un identifiant."""
    try:
        indice = int(pk) % 6
    except (TypeError, ValueError):
        indice = 0
    return f"avatar-bg-{indice}"


ICONES_EXTENSIONS = {
    "pdf": "bi-file-earmark-pdf",
    "doc": "bi-file-earmark-word", "docx": "bi-file-earmark-word",
    "xls": "bi-file-earmark-excel", "xlsx": "bi-file-earmark-excel",
    "ppt": "bi-file-earmark-ppt", "pptx": "bi-file-earmark-ppt",
    "png": "bi-file-earmark-image", "jpg": "bi-file-earmark-image",
    "jpeg": "bi-file-earmark-image", "gif": "bi-file-earmark-image",
    "zip": "bi-file-earmark-zip", "rar": "bi-file-earmark-zip",
    "mp3": "bi-file-earmark-music", "wav": "bi-file-earmark-music",
    "mp4": "bi-file-earmark-play", "mov": "bi-file-earmark-play",
    "txt": "bi-file-earmark-text",
}


@register.filter(name="file_icon")
def file_icon(nom_fichier):
    """Retourne une classe d'icône Bootstrap Icons adaptée à l'extension du fichier."""
    if not nom_fichier or "." not in nom_fichier:
        return "bi-file-earmark"
    extension = nom_fichier.rsplit(".", 1)[-1].lower()
    return ICONES_EXTENSIONS.get(extension, "bi-file-earmark")
