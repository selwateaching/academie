'use client';

import { useState, useTransition } from 'react';
import { SignaturePad } from '@/components/SignaturePad';
import { acceptDevisAsClient, refuseDevisAsClient } from '../../../actions';

export function DevisActions({ devisId }: { devisId: string }) {
  const [showSign, setShowSign] = useState(false);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">Merci, votre réponse a bien été enregistrée.</p>;

  if (showSign) {
    return (
      <div className="card p-5">
        <SignaturePad
          onAccept={(dataUrl, name) => startTransition(async () => { await acceptDevisAsClient(devisId, dataUrl, name); setDone(true); })}
        />
        <button onClick={() => setShowSign(false)} className="btn-ghost btn-sm mt-2">Annuler</button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button disabled={pending} onClick={() => setShowSign(true)} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700">
        Accepter et signer
      </button>
      <button
        disabled={pending}
        onClick={() => { if (confirm('Confirmer le refus de ce devis ?')) startTransition(async () => { await refuseDevisAsClient(devisId); setDone(true); }); }}
        className="btn-secondary"
      >
        Refuser
      </button>
    </div>
  );
}
