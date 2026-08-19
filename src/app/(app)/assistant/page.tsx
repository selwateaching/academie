import { PageHeader } from '@/components/ui/PageHeader';
import { AssistantChat } from './AssistantChat';
import { isAiConfigured } from '@/lib/ai';

export default function AssistantPage() {
  const configured = isAiConfigured();
  return (
    <div>
      <PageHeader title="Assistant IA" description="Posez vos questions sur l'activité de l'entreprise, en langage naturel." />
      {!configured && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          L'assistant n'est pas encore configuré. Ajoutez une clé <code className="font-mono">ANTHROPIC_API_KEY</code> dans les variables d'environnement pour l'activer.
        </div>
      )}
      <AssistantChat />
    </div>
  );
}
