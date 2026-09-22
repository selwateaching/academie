// Carrosserie Pro — interactions front-end (lignes de devis/factures, filtres dynamiques)

function euros(n) {
  return (n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function lineTotalHT(row) {
  const qte = parseFloat(row.querySelector(".ligne-quantite").value) || 0;
  const pu = parseFloat(row.querySelector(".ligne-prix").value) || 0;
  const remise = parseFloat(row.querySelector(".ligne-remise").value) || 0;
  return qte * pu * (1 - remise / 100);
}

function recalcLignes(container) {
  const rows = container.querySelectorAll(".ligne-row");
  let totalHT = 0;
  let totalTVA = 0;
  const parTaux = {};

  rows.forEach((row) => {
    const ht = lineTotalHT(row);
    const tva = parseFloat(row.querySelector(".ligne-tva").value) || 0;
    const montantTVA = ht * (tva / 100);
    totalHT += ht;
    totalTVA += montantTVA;
    parTaux[tva] = (parTaux[tva] || 0) + montantTVA;
    const cell = row.querySelector(".ligne-total");
    if (cell) cell.textContent = euros(ht);
  });

  const totalTTC = totalHT + totalTVA;
  const elHT = document.getElementById("recap-total-ht");
  const elTVA = document.getElementById("recap-total-tva");
  const elTTC = document.getElementById("recap-total-ttc");
  if (elHT) elHT.textContent = euros(totalHT);
  if (elTVA) elTVA.textContent = euros(totalTVA);
  if (elTTC) elTTC.textContent = euros(totalTTC);
}

function newLigneRow(template, index) {
  const html = template.innerHTML.replaceAll("__INDEX__", index);
  const wrapper = document.createElement("tbody");
  wrapper.innerHTML = html;
  return wrapper.firstElementChild;
}

function initLignesEditor() {
  const container = document.getElementById("lignes-body");
  const template = document.getElementById("ligne-template");
  const addBtn = document.getElementById("add-ligne-btn");
  if (!container || !template) return;

  let index = container.querySelectorAll(".ligne-row").length;

  function bindRow(row) {
    row.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("input", () => recalcLignes(container));
      el.addEventListener("change", () => recalcLignes(container));
    });
    const removeBtn = row.querySelector(".remove-ligne");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        row.remove();
        recalcLignes(container);
      });
    }
    const select = row.querySelector(".ligne-catalogue-select");
    if (select) {
      select.addEventListener("change", () => {
        const opt = select.selectedOptions[0];
        if (!opt || !opt.dataset.designation) return;
        row.querySelector(".ligne-designation").value = opt.dataset.designation;
        row.querySelector(".ligne-reference").value = opt.dataset.reference || "";
        row.querySelector(".ligne-type").value = opt.dataset.type || "piece";
        row.querySelector(".ligne-unite").value = opt.dataset.unite || "u";
        row.querySelector(".ligne-prix").value = opt.dataset.prix || 0;
        row.querySelector(".ligne-tva").value = opt.dataset.tva || 20;
        recalcLignes(container);
      });
    }
  }

  container.querySelectorAll(".ligne-row").forEach(bindRow);

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const row = newLigneRow(template, index);
      container.appendChild(row);
      bindRow(row);
      index += 1;
      recalcLignes(container);
    });
  }

  recalcLignes(container);
}

function initClientVehiculeFilter() {
  const clientSelect = document.getElementById("client_id");
  const vehiculeSelect = document.getElementById("vehicule_id");
  if (!clientSelect || !vehiculeSelect) return;

  function loadVehicules(clientId, keepSelection) {
    if (!clientId) {
      vehiculeSelect.innerHTML = '<option value="">— Sélectionnez d\'abord un client —</option>';
      return;
    }
    fetch(`/dossiers/api/vehicules/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        vehiculeSelect.innerHTML = "";
        if (data.vehicules.length === 0) {
          vehiculeSelect.innerHTML = '<option value="">Aucun véhicule — ajoutez-en un</option>';
          return;
        }
        data.vehicules.forEach((v) => {
          const opt = document.createElement("option");
          opt.value = v.id;
          opt.textContent = v.designation;
          if (keepSelection && String(keepSelection) === String(v.id)) opt.selected = true;
          vehiculeSelect.appendChild(opt);
        });
      });
  }

  const initialVehiculeId = vehiculeSelect.dataset.selected;
  if (clientSelect.value) loadVehicules(clientSelect.value, initialVehiculeId);

  clientSelect.addEventListener("change", () => loadVehicules(clientSelect.value));
}

function initSinistreToggle() {
  const typeSelect = document.getElementById("type_sinistre");
  const assuranceBlock = document.getElementById("assurance-fields");
  if (!typeSelect || !assuranceBlock) return;

  function toggle() {
    assuranceBlock.style.display = typeSelect.value === "hors_assurance" ? "none" : "block";
  }
  typeSelect.addEventListener("change", toggle);
  toggle();
}

function initDestinataireToggle() {
  const select = document.getElementById("destinataire_type");
  const franchiseBlock = document.getElementById("franchise-field");
  if (!select || !franchiseBlock) return;
  function toggle() {
    franchiseBlock.style.display = select.value === "mixte" ? "block" : "none";
  }
  select.addEventListener("change", toggle);
  toggle();
}

function initExpertPicker() {
  const picker = document.getElementById("expert-picker");
  if (!picker) return;
  picker.addEventListener("change", () => {
    const opt = picker.selectedOptions[0];
    if (!opt || !opt.dataset.nom) return;
    document.getElementById("expert_nom").value = opt.dataset.nom || "";
    document.getElementById("expert_cabinet").value = opt.dataset.cabinet || "";
    document.getElementById("expert_telephone").value = opt.dataset.telephone || "";
    document.getElementById("expert_email").value = opt.dataset.email || "";
  });
}

function initSidebarToggle() {
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (!toggleBtn || !sidebar) return;

  const backdrop = document.createElement("div");
  backdrop.className = "sidebar-backdrop";
  document.body.appendChild(backdrop);

  function close() {
    sidebar.classList.remove("open");
    backdrop.classList.remove("show");
  }

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("show");
  });
  backdrop.addEventListener("click", close);
  sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
}

document.addEventListener("DOMContentLoaded", () => {
  initLignesEditor();
  initClientVehiculeFilter();
  initSinistreToggle();
  initDestinataireToggle();
  initExpertPicker();
  initSidebarToggle();

  document.querySelectorAll("[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!confirm(form.dataset.confirm)) e.preventDefault();
    });
  });
});
