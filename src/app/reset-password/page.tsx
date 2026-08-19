import { Suspense } from 'react';
import { Icon } from '@/components/shell/Icon';
import { ResetPasswordForm } from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-3">
            <Icon name="KeyRound" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nouveau mot de passe</h1>
        </div>
        <div className="card p-6 sm:p-8">
          <Suspense fallback={<p className="text-sm text-ink-400 text-center">Chargement…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
