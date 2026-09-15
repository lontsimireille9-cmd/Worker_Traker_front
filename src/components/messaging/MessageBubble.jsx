import { FaCheck, FaCheckDouble } from 'react-icons/fa';

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, own }) {
  const status = message.status || 'sent';
  return (
    <div className={`flex ${own ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm ${own ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-line bg-surface text-ink'}`}>
        {!own && <p className="mb-1 text-[11px] font-semibold text-primary">{message.senderName || 'Utilisateur'}</p>}
        <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.content}</p>
        <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${own ? 'text-white/70' : 'text-muted'}`}>
          {formatTime(message.createdAt)}
          {own && (status === 'read' ? <FaCheckDouble className="text-sky-200" title="Lu" /> : status === 'delivered' ? <FaCheckDouble title="Recu" /> : <FaCheck title="Envoye" />)}
        </p>
      </div>
    </div>
  );
}
