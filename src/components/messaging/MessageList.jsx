import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ messages, currentUserId, loading, onLoadOlder, hasMore }) {
  const endRef = useRef(null);
  const previousLength = useRef(0);

  useEffect(() => {
    if (messages.length && messages.length >= previousLength.current) endRef.current?.scrollIntoView({ behavior: previousLength.current ? 'smooth' : 'auto' });
    previousLength.current = messages.length;
  }, [messages.length]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-canvas px-3 py-4 sm:px-5">
      {hasMore && <div className="mb-4 text-center"><Button type="Button" onClick={onLoadOlder} disabled={loading} className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-primary hover:bg-surface-2">{loading ? 'Chargement...' : 'Charger les anciens messages'}</Button></div>}
      {loading && !messages.length && <p className="py-8 text-center text-sm text-muted">Chargement des messages...</p>}
      {!loading && !messages.length && <div className="flex h-full items-center justify-center"><div className="text-center"><p className="text-sm font-semibold text-ink">Aucun message</p><p className="mt-1 text-xs text-muted">Envoyez le premier message.</p></div></div>}
      {messages.map((message) => <MessageBubble key={message.id} message={message} own={message.senderId === currentUserId} />)}
      <div ref={endRef} />
    </div>
  );
}
