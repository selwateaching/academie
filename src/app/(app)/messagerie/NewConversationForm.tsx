'use client';

import { useState } from 'react';
import { createConversation } from './actions';
import { Icon } from '@/components/shell/Icon';

export function NewConversationForm({
  users, clients, chantiers,
}: {
  users: { id: string; name: string }[];
  clients: { id: string; firstName: string; lastName: string }[];
  chantiers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('INTERNAL');

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full">
        <Icon name="Plus" size={16} /> Nouvelle conversation
      </button>
    );
  }

  return (
    <form action={createConversation} className="card p-4 space-y-2">
      <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="select !text-sm">
        <option value="INTERNAL">Équipe interne</option>
        <option value="CLIENT">Client</option>
      </select>
      {type === 'INTERNAL' ? (
        <>
          <input name="name" placeholder="Nom du groupe (optionnel)" className="input !text-sm" />
          <select name="chantierId" className="select !text-sm">
            <option value="">Sans chantier</option>
            {chantiers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <select name="participants" multiple className="select !text-sm h-24">
            {users.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
          </select>
        </>
      ) : (
        <select name="clientId" required className="select !text-sm">
          <option value="">Choisir un client…</option>
          {clients.map((c) => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}
        </select>
      )}
      <div className="flex gap-2">
        <button className="btn-primary btn-sm flex-1">Créer</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary btn-sm">Annuler</button>
      </div>
    </form>
  );
}
