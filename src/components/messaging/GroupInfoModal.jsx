import { useEffect, useState } from 'react';
import { FaSearch, FaTrash, FaUserMinus, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import Dialog from '../ui/dialog';
import Button from '../ui/Button';

export default function GroupInfoModal({ open, onClose, conversation, currentUserId, onRename, onAddMember, onRemoveMember, onLeave, onDelete, searchUsers, busy }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const isCompanyGroup = Boolean(conversation?.isCompanyGroup);
  const isAdmin = conversation?.role === 'admin' && !isCompanyGroup;

  useEffect(() => { if (open) { setName(conversation?.name || ''); setQuery(''); setUsers([]); } }, [open, conversation?.name]);
  useEffect(() => {
    if (!open || !isAdmin || query.trim().length < 1) { setUsers([]); return undefined; }
    const timer = setTimeout(() => searchUsers(query).then(setUsers).catch(() => setUsers([])), 250);
    return () => clearTimeout(timer);
  }, [open, isAdmin, query, searchUsers]);

  const memberIds = new Set((conversation?.members || []).map((member) => member.userId));
  return (
    <Dialog open={open} onClose={onClose} title="Informations du groupe" className="max-w-xl">
      <div className="space-y-5">
        {isAdmin && <div><label className="mb-1.5 block text-sm font-medium text-ink/70">Nom du groupe</label><div className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-primary" /><Button disabled={!name.trim() || busy} loading={busy} onClick={() => onRename(name)}>Enregistrer</Button></div></div>}
        <div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-ink">Membres ({conversation?.members?.length || 0})</h3></div><div className="max-h-56 overflow-y-auto rounded-xl border border-line">{(conversation?.members || []).map((member) => <div key={member.userId} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{member.user?.name?.split(/\s+/).map((x) => x[0]).join('').slice(0,2).toUpperCase() || 'U'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm text-ink">{member.user?.name || member.userId}</p><p className="text-[10px] text-muted">{member.role === 'admin' ? 'Administrateur' : 'Membre'}</p></div>{isAdmin && member.userId !== conversation.createdBy && <Button type="Button" disabled={busy} onClick={() => onRemoveMember(member.userId)} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50" title="Retirer"><FaUserMinus size={12} /></Button>}</div>)}</div></div>
        {isAdmin && <div><label className="relative block"><FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={12} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ajouter un employÃ©..." className="h-10 w-full rounded-xl border border-line bg-canvas pl-8 pr-3 text-sm outline-none focus:border-primary" /></label>{users.filter((u) => !memberIds.has(u.uid)).slice(0, 8).map((user) => <Button key={user.uid} type="Button" disabled={busy} onClick={() => onAddMember(user.uid)} className="mt-1 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{user.name.split(/\s+/).map((x) => x[0]).join('').slice(0,2).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-sm text-ink">{user.name}</span><FaUserPlus className="text-primary" size={12} /></Button>)}</div>}
        <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">{!isCompanyGroup && <Button variant="ghost" disabled={busy || (isAdmin && conversation.createdBy === currentUserId)} onClick={onLeave}><FaSignOutAlt className="mr-2" /> Quitter</Button>}{isAdmin && conversation.createdBy === currentUserId && <Button variant="ghost" disabled={busy} onClick={onDelete} className="text-red-600 hover:bg-red-50"><FaTrash className="mr-2" /> Supprimer le groupe</Button>}</div>
      </div>
    </Dialog>
  );
}

