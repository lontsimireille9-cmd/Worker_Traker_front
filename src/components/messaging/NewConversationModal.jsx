import { useEffect, useState } from 'react';
import { FaSearch, FaUser, FaUsers } from 'react-icons/fa';
import Dialog from '../ui/dialog';
import Button from '../ui/Button';

export default function NewConversationModal({ open, onClose, onPrivate, onCreateGroup, searchUsers, creating }) {
  const [mode, setMode] = useState('private');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode('private'); setQuery(''); setUsers([]); setSelected([]); setName('');
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 1) { setUsers([]); return; }
    const timer = setTimeout(() => searchUsers(query).then(setUsers).catch(() => setUsers([])), 250);
    return () => clearTimeout(timer);
  }, [query, open, searchUsers]);

  function toggle(uid) { setSelected((current) => current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid]); }

  return (
    <Dialog open={open} onClose={onClose} title="Nouvelle conversation" className="max-w-xl">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-canvas p-1">
        <Button type="Button" onClick={() => setMode('private')} className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium ${mode === 'private' ? 'bg-surface text-primary shadow-sm' : 'text-muted'}`}><FaUser size={13} /> Privée</Button>
        <Button type="Button" onClick={() => setMode('group')} className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium ${mode === 'group' ? 'bg-surface text-primary shadow-sm' : 'text-muted'}`}><FaUsers size={13} /> Groupe</Button>
      </div>
      {mode === 'group' && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du groupe" className="mb-3 h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm outline-none focus:border-primary" />}
      <label className="relative block">
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={13} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un employé..." className="h-11 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm outline-none focus:border-primary" />
      </label>
      <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-line">
        {users.map((user) => <Button key={user.uid} type="Button" onClick={() => mode === 'private' ? onPrivate(user.uid) : toggle(user.uid)} className="flex w-full items-center gap-3 border-b border-line px-3 py-3 text-left last:border-0 hover:bg-surface-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{user.name.split(/\s+/).map((x) => x[0]).join('').slice(0,2).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{user.name}</p><p className="truncate text-xs text-muted">{user.matricule ? `Matricule : ${user.matricule}` : user.role}</p></div>
          {mode === 'group' && <span className={`h-5 w-5 rounded-full border ${selected.includes(user.uid) ? 'border-primary bg-primary' : 'border-line'}`} />}
        </Button>)}
        {!users.length && query.trim() && <p className="p-5 text-center text-sm text-muted">Aucun employé trouvé.</p>}
      </div>
      {mode === 'group' && <div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-muted">{selected.length} membre(s) sélectionné(s) · vous serez ajouté automatiquement</p><Button disabled={!name.trim() || !selected.length || creating} loading={creating} onClick={() => onCreateGroup(name, selected)}>Créer</Button></div>}
    </Dialog>
  );
}
