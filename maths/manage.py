"""Administration : accorder un abonnement à la main (espèces, geste commercial).

    python manage.py grant parent@exemple.com cm1 30
    python manage.py list
"""
import sys
from datetime import timedelta

from sqlalchemy import select

import store


def main(argv):
    eng = store.make_engine()
    u, s = store.users, store.subscriptions
    if argv[:1] == ["list"]:
        with eng.connect() as c:
            for r in c.execute(select(u.c.email, s.c.level, s.c.expires_at).select_from(s.join(u, u.c.id == s.c.user_id))):
                print(*r)
        return 0
    if len(argv) == 4 and argv[0] == "grant":
        _, email, level, days = argv
        if level not in store.LEVELS:
            print("niveau inconnu :", level); return 1
        with eng.begin() as c:
            row = c.execute(select(u.c.id).where(u.c.email == email.strip().lower())).first()
            if not row:
                print("aucun compte avec cet e-mail"); return 1
            t = store.now()
            sub = c.execute(select(s).where((s.c.user_id == row[0]) & (s.c.level == level))).mappings().first()
            if sub is None:
                c.execute(s.insert().values(user_id=row[0], level=level, expires_at=t + timedelta(days=int(days))))
            else:
                c.execute(s.update().where(s.c.id == sub["id"]).values(expires_at=max(t, sub["expires_at"]) + timedelta(days=int(days))))
        print("abonnement accordé"); return 0
    print(__doc__); return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
