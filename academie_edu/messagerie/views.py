from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from accounts.models import Utilisateur

from .forms import MessageForm
from .models import Conversation, Message
from .services import contact_autorise, contacts_disponibles


@login_required
def boite_reception(request):
    lignes = [
        {
            "conversation": conv,
            "autre": conv.autre_participant(request.user),
            "dernier": conv.dernier_message(),
            "non_lus": conv.non_lus_pour(request.user),
        }
        for conv in request.user.conversations.all()
    ]
    return render(request, "messagerie/boite_reception.html", {"lignes": lignes})


@login_required
def nouvelle_conversation(request):
    return render(request, "messagerie/nouvelle_conversation.html", {"groupes_contacts": contacts_disponibles(request.user)})


@login_required
def demarrer_conversation(request, contact_id):
    contact = get_object_or_404(Utilisateur, pk=contact_id)
    if not contact_autorise(request.user, contact):
        messages.error(request, "Vous ne pouvez pas contacter cette personne.")
        return redirect("messagerie:nouvelle_conversation")

    conversation = Conversation.objects.filter(participants=request.user).filter(participants=contact).first()
    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, contact)

    return redirect("messagerie:conversation_detail", pk=conversation.pk)


@login_required
def conversation_detail(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk, participants=request.user)
    autre = conversation.autre_participant(request.user)

    if request.method == "POST":
        form = MessageForm(request.POST, request.FILES)
        if form.is_valid():
            Message.objects.create(
                conversation=conversation,
                expediteur=request.user,
                contenu=form.cleaned_data["contenu"],
                fichier=form.cleaned_data.get("fichier"),
            )
            return redirect("messagerie:conversation_detail", pk=conversation.pk)
    else:
        form = MessageForm()

    conversation.messages.exclude(expediteur=request.user).update(lu=True)

    return render(
        request,
        "messagerie/conversation_detail.html",
        {"conversation": conversation, "autre": autre, "form": form, "fil_messages": conversation.messages.all()},
    )
