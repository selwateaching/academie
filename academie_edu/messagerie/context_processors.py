from .models import Message


def messages_non_lus(request):
    if not request.user.is_authenticated:
        return {}
    total = Message.objects.filter(conversation__participants=request.user, lu=False).exclude(expediteur=request.user).count()
    return {"messages_non_lus": total}
