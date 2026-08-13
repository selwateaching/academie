from django.urls import path

from . import views

app_name = "messagerie"

urlpatterns = [
    path("", views.boite_reception, name="boite_reception"),
    path("nouvelle/", views.nouvelle_conversation, name="nouvelle_conversation"),
    path("demarrer/<int:contact_id>/", views.demarrer_conversation, name="demarrer_conversation"),
    path("<int:pk>/", views.conversation_detail, name="conversation_detail"),
]
