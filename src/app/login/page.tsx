'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/shell/Icon';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Email ou mot de passe incorrect.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-3">
            <Icon name="HardHat" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BTP Manager</h1>
          <p className="text-ink-400 text-sm mt-1">Gérez votre entreprise du bâtiment</p>
        </div>
        <form onSubmit={onSubmit} className="card p-6 sm:p-8 space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="vous@entreprise.fr" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">Mot de passe</label>
              <a href="/forgot-password" className="text-xs text-brand-600 hover:underline">Mot de passe oublié ?</a>
            </div>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
          <button disabled={loading} type="submit" className="btn-primary w-full">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <p className="text-center text-xs text-ink-400">
            Compte démo : <span className="font-mono">patron@btpmanager.fr</span> / <span className="font-mono">demo1234</span>
          </p>
        </form>
        <p className="text-center text-xs text-ink-500 mt-6">Vous êtes client ? <a href="/portail/login" className="text-brand-400 hover:underline">Accéder au portail client</a></p>
      </div>
    </div>
  );
}
