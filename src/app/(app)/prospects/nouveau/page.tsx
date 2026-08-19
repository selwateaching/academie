import { PageHeader } from '@/components/ui/PageHeader';
import { PROSPECT_STATUSES } from '@/lib/enums';
import { createProspect } from '../actions';

export default function NouveauProspectPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Nouveau prospect" />
      <form action={createProspect} className="card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Prénom</label>
            <input name="firstName" required className="input" />
          </div>
          <div>
            <label className="label">Nom</label>
            <input name="lastName" required className="input" />
          </div>
          <div>
            <label className="label">Entreprise (si applicable)</label>
            <input name="companyName" className="input" />
          </div>
          <div>
            <label className="label">Origine</label>
            <input name="origin" placeholder="Site web, bouche à oreille, LeBonCoin…" className="input" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input name="phone" className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" name="email" className="input" />
          </div>
          <div>
            <label className="label">Montant estimé (€)</label>
            <input type="number" step="0.01" name="estimatedAmount" className="input" />
          </div>
          <div>
            <label className="label">Statut</label>
            <select name="status" defaultValue="NOUVEAU" className="select">
              {Object.entries(PROSPECT_STATUSES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Demande du client</label>
            <textarea name="request" className="input min-h-20" />
          </div>
          <div>
            <label className="label">Prochaine action</label>
            <input name="nextAction" className="input" />
          </div>
          <div>
            <label className="label">Date prochaine action</label>
            <input type="date" name="nextActionDate" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea name="notes" className="input min-h-20" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Créer le prospect</button>
          <a href="/prospects" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}
