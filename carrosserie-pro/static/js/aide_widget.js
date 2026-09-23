(function () {
  const bouton = document.getElementById("aide-bouton");
  const panneau = document.getElementById("aide-panneau");
  const fermer = document.getElementById("aide-fermer");
  const form = document.getElementById("aide-form");
  const input = document.getElementById("aide-input");
  const messages = document.getElementById("aide-messages");
  if (!bouton || !panneau || !form) return;

  function ouvrir() {
    panneau.classList.remove("d-none");
    bouton.classList.add("d-none");
    input.focus();
  }
  function fermerPanneau() {
    panneau.classList.add("d-none");
    bouton.classList.remove("d-none");
  }

  bouton.addEventListener("click", ouvrir);
  fermer.addEventListener("click", fermerPanneau);

  function ajouterMessage(texte, type) {
    const div = document.createElement("div");
    div.className = "aide-msg " + (type === "user" ? "aide-msg-user" : "aide-msg-bot");
    div.textContent = texte;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    ajouterMessage(question, "user");
    input.value = "";

    const attente = ajouterMessage("Recherche en cours...", "bot");

    fetch(`/aide/rechercher?q=${encodeURIComponent(question)}`)
      .then((r) => r.json())
      .then((data) => {
        attente.remove();
        if (!data.resultats || data.resultats.length === 0) {
          ajouterMessage(
            "Je n'ai pas trouvé de réponse précise à cette question. Essayez de la reformuler, ou consultez le menu correspondant (Dossiers, Planning, Devis, Courriers...). Un administrateur peut aussi ajouter cette question dans le menu « Aide ».",
            "bot"
          );
          return;
        }
        data.resultats.forEach((res, i) => {
          const bulle = ajouterMessage(res.reponse, "bot");
          if (i === 0) {
            const badge = document.createElement("div");
            badge.className = "aide-msg-categorie";
            badge.textContent = res.categorie;
            bulle.prepend(badge);
          }
        });
      })
      .catch(() => {
        attente.remove();
        ajouterMessage("Erreur réseau — merci de réessayer.", "bot");
      });
  });
})();
