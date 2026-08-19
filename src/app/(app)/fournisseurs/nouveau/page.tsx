import { PageHeader } from '@/components/ui/PageHeader';
import { createSupplier } from '../actions';

export default function NouveauFournisseurPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Nouveau fournisseur" />
      <form action={createSupplier} className="card p-6 space-y-4">
        <div><label className="label">Nom</label><input name="name" required className="input" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Contact</label><input name="contactName" className="input" /></div>
          <div><label className="label">Téléphone</label><input name="phone" className="input" /></div>
          <div><label className="label">Email</label><input type="email" name="email" className="input" /></div>
          <div><label className="label">Adresse</label><input name="address" className="input" /></div>
        </div>
        <div><label className="label">Notes</label><textarea name="notes" className="input min-h-20" /></div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Créer</button>
          <a href="/fournisseurs" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}
