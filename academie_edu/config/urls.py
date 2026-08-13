from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("comptes/", include("accounts.urls")),
    path("classes/", include("academics.urls")),
    path("cours/", include("courses.urls")),
    path("controles/", include("quizzes.urls")),
    path("devoirs/", include("homework.urls")),
    path("gestion/", include("gestion.urls")),
    path("messagerie/", include("messagerie.urls")),
    path("documents/", include("documents_perso.urls")),
    path("bulletins/", include("bulletins.urls")),
    path("", include("core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
