import { FaSearch, FaPlus, FaUsers, FaUser } from 'react-icons/fa';
import ConversationItem from './ConversationItem';

export default function ConversationList({ conversations, contacts, selectedId, search, onSearch, onSelect, onContactSelect, onNew, loading }) {
  const filtered = conversations.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()));
  const filteredContacts = contacts.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <section className="flex min-h-0 w-full flex-col overflow-hidden border-line bg-surface lg:w-[340px] lg:flex-shrink-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Conversations</h2>
          <p className="text-xs text-muted">Les membres de votre entreprise</p>
        </div>
        <Button type="Button" onClick={onNew} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition hover:opacity-90" aria-label="Nouvelle conversation"><FaPlus size={14} /></Button>
      </div>
      <div className="border-b border-line bg-canvas/40 p-3">
        <label className="relative block">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={13} />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher une conversation" className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-ink outline-none transition focus:border-primary" />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && !conversations.length ? <div className="p-5 text-sm text-muted">Chargement des conversations...</div> : null}
        {filtered.map((conversation) => <ConversationItem key={conversation.id} conversation={conversation} active={selectedId === conversation.id} onClick={() => onSelect(conversation.id)} />)}
        {filteredContacts.length > 0 && <div className="border-y border-line bg-canvas/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Membres de l’entreprise</div>}
        {filteredContacts.map((user) => <Button key={user.uid} type="Button" onClick={() => onContactSelect(user.uid)} className="flex w-full items-center gap-3 border-b border-line px-3 py-3 text-left transition hover:bg-surface-2"><div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{user.name}</p><p className="truncate text-xs text-muted">{user.matricule ? `Matricule : ${user.matricule}` : user.role}</p></div><FaUser size={12} className="text-muted" /></Button>)}
        {!loading && !filtered.length && !filteredContacts.length && <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 text-center"><FaUsers className="mb-3 text-2xl text-muted/60" /><p className="text-sm font-medium text-ink">Aucune conversation</p><p className="mt-1 text-xs text-muted">Aucun membre ne correspond à votre recherche.</p></div>}
      </div>
    </section>
  );
}
