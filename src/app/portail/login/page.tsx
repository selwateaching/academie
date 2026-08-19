'use client';

import { useState } from 'react';
import { portalLogin } from '../actions';
import { Icon } from '@/components/shell/Icon';

export default function PortalLoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const res = await portalLogin(formData);
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-3">
            <Icon name="User" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Espace Client</h1>
          <p className="text-ink-400 text-sm mt-1">Suivez vos devis, factures et travaux</p>
        </div>
        <form action={onSubmit} className="card p-6 sm:p-8 space-y-4">
          <div><label className="label">Email</label><input type="email" name="email" required className="input" /></div>
          <div><label className="label">Mot de passe</label><input type="password" name="password" required className="input" /></div>
          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={loading} type="submit" className="btn-primary w-full !bg-emerald-600 hover:!bg-emerald-700">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="text-center text-xs text-ink-500 mt-6">Vous êtes une entreprise ? <a href="/login" className="text-brand-400 hover:underline">Connexion professionnelle</a></p>
      </div>
    </div>
  );
}
