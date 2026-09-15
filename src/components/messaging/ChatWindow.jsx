import { FaArrowLeft, FaUsers, FaUser, FaEllipsisV } from 'react-icons/fa';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function ChatWindow({ conversation, messages, currentUserId, loading, sending, hasMore, onLoadOlder, onSend, onBack, onOpenGroupInfo }) {
  if (!conversation) return <section className="hidden min-w-0 flex-1 items-center justify-center bg-canvas lg:flex"><div className="text-center"><FaUsers className="mx-auto mb-3 text-3xl text-muted/50" /><p className="text-sm font-semibold text-ink">Sélectionnez une conversation</p><p className="mt-1 text-xs text-muted">Vos messages apparaîtront ici.</p></div></section>;
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex min-h-[68px] items-center gap-3 border-b border-line bg-surface px-3 sm:px-5">
        <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 lg:hidden" aria-label="Retour"><FaArrowLeft size={14} /></button>
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">{conversation.type === 'group' ? <FaUsers size={15} /> : <FaUser size={14} />}</div>
        <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-ink">{conversation.name}</h2><p className="flex items-center gap-1.5 text-xs text-muted">{conversation.type === 'group' ? `${conversation.members?.length || 0} membre(s)` : 'Conversation privée'}<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></p></div>
        {conversation.type === 'group' && <button type="button" onClick={onOpenGroupInfo} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2" aria-label="Options du groupe"><FaEllipsisV size={13} /></button>}
      </header>
      <MessageList messages={messages} currentUserId={currentUserId} loading={loading} hasMore={hasMore} onLoadOlder={onLoadOlder} />
      <MessageInput onSend={onSend} sending={sending} />
    </section>
  );
}
