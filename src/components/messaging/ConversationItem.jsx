import Button from "../ui/Button";
import { FaUsers } from 'react-icons/fa';

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

export default function ConversationItem({ conversation, active, onClick }) {
  return (
    <Button type="Button" variant="ghost" onClick={onClick} className={`flex w-full items-center gap-3 border-b border-line border-l-2 bg-white px-3 py-3 text-left text-ink transition hover:bg-surface-2 ${active ? 'border-l-primary bg-primary/5' : 'border-l-transparent'}`}>
      <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary">
        {conversation.avatar ? <img src={conversation.avatar} alt="" className="h-full w-full object-cover" /> : conversation.type === 'group' ? <FaUsers size={15} /> : <span>{initials(conversation.name)}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{conversation.name}</p>
          <span className="flex-shrink-0 text-[11px] text-muted">{formatTime(conversation.lastMessageAt || conversation.updatedAt)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-xs text-muted">{conversation.lastMessage || (conversation.type === 'group' ? 'Groupe créé' : 'Aucun message')}</p>
          {conversation.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>}
        </div>
      </div>
    </Button>
  );
}
