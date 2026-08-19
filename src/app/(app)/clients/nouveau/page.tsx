import { PageHeader } from '@/components/ui/PageHeader';
import { ClientFormFields } from '@/components/forms/ClientForm';
import { createClient } from '../actions';

export default function NouveauClientPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Nouveau client" description="Ajoutez un particulier ou une entreprise." />
      <form action={createClient} className="card p-6 space-y-6">
        <ClientFormFields />
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Créer le client</button>
          <a href="/clients" className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}
