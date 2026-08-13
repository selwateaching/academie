from functools import wraps

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect


def role_required(*roles):
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapped(request, *args, **kwargs):
            if request.user.role not in roles:
                messages.error(request, "Vous n'avez pas accès à cette page.")
                return redirect("core:dashboard")
            return view_func(request, *args, **kwargs)

        return wrapped

    return decorator
