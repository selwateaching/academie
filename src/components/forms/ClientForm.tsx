import { CLIENT_TYPES } from '@/lib/enums';

export function ClientFormFields({ client }: { client?: any }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className="label">Type de client</label>
        <select name="type" defaultValue={client?.type ?? 'PARTICULIER'} className="select">
          {Object.entries(CLIENT_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Entreprise (si applicable)</label>
        <input name="companyName" defaultValue={client?.companyName ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Prénom</label>
        <input name="firstName" required defaultValue={client?.firstName ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Nom</label>
        <input name="lastName" required defaultValue={client?.lastName ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Téléphone</label>
        <input name="phone" defaultValue={client?.phone ?? ''} className="input" />
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" name="email" defaultValue={client?.email ?? ''} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Adresse</label>
        <input name="address" defaultValue={client?.address ?? ''} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Adresse du chantier (si différente)</label>
        <input name="siteAddress" defaultValue={client?.siteAddress ?? ''} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Informations complémentaires / notes</label>
        <textarea name="notes" defaultValue={client?.notes ?? ''} className="input min-h-24" />
      </div>
    </div>
  );
}
