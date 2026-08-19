'use client';

import { useState } from 'react';
import { requestPasswordReset } from './actions';
import { Icon } from '@/components/shell/Icon';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const res = await requestPasswordReset(formData);
    setLoading(false);
    setSent(true);
    setDevLink(res.devLink);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-3">
            <Icon name="KeyRound" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-ink-400 text-sm mt-1 text-center">Recevez un lien de réinitialisation par email</p>
        </div>
        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="text-center space-y-3">
              <Icon name="MailCheck" size={32} className="mx-auto text-emerald-600" />
              <p className="text-sm text-ink-700">Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.</p>
              {devLink && (
                <div className="text-left bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                  <p className="text-xs text-amber-800 mb-1">Envoi d'email non configuré — lien de test (dev uniquement) :</p>
                  <a href={devLink} className="text-xs text-brand-700 break-all underline">{devLink}</a>
                </div>
              )}
              <a href="/login" className="btn-secondary inline-flex mt-2">Retour à la connexion</a>
            </div>
          ) : (
            <form action={onSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" name="email" required className="input" />
              </div>
              <button disabled={loading} type="submit" className="btn-primary w-full">{loading ? 'Envoi…' : 'Envoyer le lien'}</button>
              <a href="/login" className="block text-center text-sm text-ink-500 hover:underline">Retour à la connexion</a>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
