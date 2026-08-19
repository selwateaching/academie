'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '../forgot-password/actions';

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await resetPassword(token, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/login'), 2500);
  }

  if (done) return <p className="text-sm text-emerald-700 text-center">Mot de passe mis à jour. Redirection vers la connexion…</p>;
  if (!token) return <p className="text-sm text-rose-600 text-center">Lien invalide. <a href="/forgot-password" className="underline">Recommencer</a></p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Nouveau mot de passe</label>
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
      </div>
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
      <button disabled={loading} type="submit" className="btn-primary w-full">{loading ? 'Enregistrement…' : 'Réinitialiser'}</button>
    </form>
  );
}
