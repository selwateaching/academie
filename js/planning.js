import { requireAuth } from "./auth.js";
import { renderShell, escapeHtml } from "./ui.js";
import { supabase } from "./supabaseClient.js";

const profile = await requireAuth();
if (profile) {
  renderShell(profile, "planning");
  main();
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  let weekStart = startOfWeek(new Date());
  const grid = document.getElementById("week-grid");
  const weekLabel = document.getElementById("week-label");

  document.getElementById("prev-week-btn").addEventListener("click", () => {
    weekStart.setDate(weekStart.getDate() - 7);
    render();
  });
  document.getElementById("next-week-btn").addEventListener("click", () => {
    weekStart.setDate(weekStart.getDate() + 7);
    render();
  });
  document.getElementById("today-btn").addEventListener("click", () => {
    weekStart = startOfWeek(new Date());
    render();
  });

  async function render() {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    const weekEnd = new Date(days[6]);
    weekEnd.setHours(23, 59, 59, 999);

    weekLabel.textContent = `${days[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} – ${days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;

    grid.innerHTML = `<p class="empty-state">Chargement…</p>`;

    const [{ data: appts }, { data: tasks }] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .gte("date_debut", weekStart.toISOString())
        .lte("date_debut", weekEnd.toISOString()),
      supabase
        .from("tasks")
        .select("*")
        .gte("echeance", weekStart.toISOString().slice(0, 10))
        .lte("echeance", weekEnd.toISOString().slice(0, 10))
        .neq("statut", "termine"),
    ]);

    const todayStr = new Date().toDateString();

    grid.innerHTML = days
      .map((d) => {
        const dayStr = d.toISOString().slice(0, 10);
        const dayAppts = (appts || []).filter((a) => a.date_debut.slice(0, 10) === dayStr);
        const dayTasks = (tasks || []).filter((t) => t.echeance === dayStr);
        const isToday = d.toDateString() === todayStr;

        const apptsHtml = dayAppts
          .map((a) => {
            const time = new Date(a.date_debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
            return `<div class="plan-item appt">${time} — ${escapeHtml(a.titre)}</div>`;
          })
          .join("");
        const tasksHtml = dayTasks.map((t) => `<div class="plan-item task">${escapeHtml(t.titre)}</div>`).join("");

        return `
        <div class="day-col ${isToday ? "today" : ""}">
          <h4>${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}</h4>
          ${apptsHtml}${tasksHtml}
          ${!apptsHtml && !tasksHtml ? `<p style="color:var(--color-text-muted); font-size:0.78rem;">—</p>` : ""}
        </div>`;
      })
      .join("");
  }

  await render();
}
