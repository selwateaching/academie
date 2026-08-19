import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClientFormFields } from '@/components/forms/ClientForm';
import { updateClient } from '../../actions';

export default async function ModifierClientPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const client = await prisma.client.findFirst({ where: { id: params.id, companyId: user.companyId } });
  if (!client) notFound();

  const action = updateClient.bind(null, client.id);

  return (
    <div className="max-w-3xl">
      <PageHeader title={`Modifier ${client.firstName} ${client.lastName}`} />
      <form action={action} className="card p-6 space-y-6">
        <ClientFormFields client={client} />
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">Enregistrer</button>
          <a href={`/clients/${client.id}`} className="btn-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}
