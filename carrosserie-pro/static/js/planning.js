(function () {
  const board = document.querySelector(".kanban-board");
  if (!board) return;

  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  let draggedCard = null;

  board.querySelectorAll(".kanban-card").forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      draggedCard = card;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", card.dataset.dossierId);
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      draggedCard = null;
    });
    card.addEventListener("click", (e) => {
      if (card.classList.contains("dragging")) e.preventDefault();
    });
  });

  board.querySelectorAll(".kanban-column").forEach((column) => {
    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      column.classList.add("drag-over");
    });
    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });
    column.addEventListener("drop", (e) => {
      e.preventDefault();
      column.classList.remove("drag-over");
      if (!draggedCard) return;

      const dossierId = draggedCard.dataset.dossierId;
      const nouveauStatut = column.dataset.statut;
      const colonneOrigine = draggedCard.closest(".kanban-column");
      if (colonneOrigine === column) return;

      const body = column.querySelector(".kanban-column-body");
      const empty = body.querySelector(".kanban-empty");
      if (empty) empty.remove();
      body.appendChild(draggedCard);
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
            colonneOrigine.querySelector(".kanban-column-body").appendChild(draggedCard);
            updateCounts();
            alert(data.erreur || "Impossible de déplacer ce dossier.");
          }
        })
        .catch(() => {
          colonneOrigine.querySelector(".kanban-column-body").appendChild(draggedCard);
          updateCounts();
          alert("Erreur réseau : le déplacement n'a pas été enregistré.");
        });
    });
  });

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
