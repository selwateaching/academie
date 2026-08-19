import { getOrCreatePortalConversation } from '../../actions';
import { PortalChat } from './PortalChat';

export default async function PortalMessagesPage() {
  const conversationId = await getOrCreatePortalConversation();

  return (
    <div>
      <h1 className="text-xl font-bold text-ink-900 mb-5">Messages</h1>
      <PortalChat conversationId={conversationId} />
    </div>
  );
}
