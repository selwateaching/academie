(function () {
  const board = document.querySelector(".kanban-board");
  if (!board) return;

  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  const SEUIL_DEPLACEMENT = 8; // px de mouvement avant de considérer que c'est un glisser (pas un simple clic/tap)

  let etat = null; // { card, pointerId, startX, startY, dragging, colonneOrigine, colonneSurvolee }
  let dernierGlisserTermine = false;

  function colonneSousPointeur(x, y) {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest(".kanban-column") : null;
  }

  function surPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return; // souris gauche / doigt / stylet uniquement
    const card = e.currentTarget;
    etat = {
      card,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      colonneOrigine: card.closest(".kanban-column"),
      colonneSurvolee: null,
    };
  }

  function surPointerMove(e) {
    if (!etat || e.pointerId !== etat.pointerId) return;
    const dx = e.clientX - etat.startX;
    const dy = e.clientY - etat.startY;

    if (!etat.dragging) {
      if (Math.abs(dx) < SEUIL_DEPLACEMENT && Math.abs(dy) < SEUIL_DEPLACEMENT) return;
      etat.dragging = true;
      etat.card.classList.add("dragging");
      try {
        etat.card.setPointerCapture(etat.pointerId);
      } catch (err) {
        /* ignore */
      }
    }

    e.preventDefault();
    const colonne = colonneSousPointeur(e.clientX, e.clientY);
    if (colonne !== etat.colonneSurvolee) {
      if (etat.colonneSurvolee) etat.colonneSurvolee.classList.remove("drag-over");
      if (colonne) colonne.classList.add("drag-over");
      etat.colonneSurvolee = colonne;
    }
  }

  function surPointerUp(e) {
    if (!etat || e.pointerId !== etat.pointerId) return;
    const { card, dragging, colonneOrigine, colonneSurvolee } = etat;

    if (colonneSurvolee) colonneSurvolee.classList.remove("drag-over");
    card.classList.remove("dragging");
    try {
      card.releasePointerCapture(etat.pointerId);
    } catch (err) {
      /* ignore */
    }

    if (dragging) {
      dernierGlisserTermine = true;
      setTimeout(() => {
        dernierGlisserTermine = false;
      }, 0);
      if (colonneSurvolee && colonneSurvolee !== colonneOrigine) {
        deplacerCarte(card, colonneOrigine, colonneSurvolee);
      }
    }
    etat = null;
  }

  function deplacerCarte(card, colonneOrigine, colonneCible) {
    const dossierId = card.dataset.dossierId;
    const nouveauStatut = colonneCible.dataset.statut;

    const bodyCible = colonneCible.querySelector(".kanban-column-body");
    const empty = bodyCible.querySelector(".kanban-empty");
    if (empty) empty.remove();
    bodyCible.appendChild(card);
    updateCounts();

    fetch(`/planning/deplacer/${dossierId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": csrfToken,
      },
      body: `statut=${encodeURIComponent(nouveauStatut)}`,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          colonneOrigine.querySelector(".kanban-column-body").appendChild(card);
          updateCounts();
          alert(data.erreur || "Impossible de déplacer ce dossier.");
        }
      })
      .catch(() => {
        colonneOrigine.querySelector(".kanban-column-body").appendChild(card);
        updateCounts();
        alert("Erreur réseau : le déplacement n'a pas été enregistré.");
      });
  }

  board.querySelectorAll(".kanban-card").forEach((card) => {
    card.addEventListener("pointerdown", surPointerDown);
    card.addEventListener("click", (e) => {
      if (dernierGlisserTermine) e.preventDefault();
    });
  });

  document.addEventListener("pointermove", surPointerMove);
  document.addEventListener("pointerup", surPointerUp);
  document.addEventListener("pointercancel", surPointerUp);

  function updateCounts() {
    board.querySelectorAll(".kanban-column").forEach((column) => {
      const count = column.querySelectorAll(".kanban-card").length;
      column.querySelector(".kanban-column-count").textContent = count;
      const body = column.querySelector(".kanban-column-body");
      if (count === 0 && !body.querySelector(".kanban-empty")) {
        const div = document.createElement("div");
        div.className = "kanban-empty";
        div.textContent = "Aucun dossier";
        body.appendChild(div);
      }
    });
  }
})();
