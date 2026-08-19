'use client';

import { useState, useTransition } from 'react';
import { togglePortalAccess, resetClientPortalPassword } from '../actions';
import { Icon } from '@/components/shell/Icon';

export function PortalAccessBox({ clientId, enabled, email }: { clientId: string; enabled: boolean; email: string | null }) {
  const [pending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-ink-800 mb-1 text-sm flex items-center gap-2">
        <Icon name="ShieldCheck" size={16} /> Portail client
      </h3>
      <p className="text-xs text-ink-500 mb-3">{enabled ? 'Accès activé' : "Le client n'a pas accès au portail"}</p>
      <button
        disabled={pending}
        onClick={() => startTransition(() => togglePortalAccess(clientId, !enabled))}
        className={enabled ? 'btn-secondary btn-sm w-full' : 'btn-primary btn-sm w-full'}
      >
        {enabled ? 'Désactiver l\'accès' : 'Activer l\'accès'}
      </button>
      {enabled && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input !py-1.5 !text-xs"
          />
          <button
            disabled={pending || newPassword.length < 6}
            onClick={() =>
              startTransition(async () => {
                await resetClientPortalPassword(clientId, newPassword);
                setMessage('Mot de passe mis à jour.');
                setNewPassword('');
              })
            }
            className="btn-secondary btn-sm w-full"
          >
            Réinitialiser le mot de passe
          </button>
          {message && <p className="text-xs text-emerald-600">{message}</p>}
          <p className="text-xs text-ink-400">Identifiant : {email ?? 'email requis'}</p>
        </div>
      )}
    </div>
  );
}
