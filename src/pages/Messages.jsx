import { useCallback, useEffect, useRef, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConversationList from '../components/messaging/ConversationList';
import ChatWindow from '../components/messaging/ChatWindow';
import NewConversationModal from '../components/messaging/NewConversationModal';
import GroupInfoModal from '../components/messaging/GroupInfoModal';
import { registerForMessaging } from '../services/notifications';

function messageCacheKey(userId, conversationId) {
  return `worker-tracker:messages:${userId || 'anonymous'}:${conversationId}`;
}

function readMessageCache(userId, conversationId) {
  try {
    const cached = JSON.parse(localStorage.getItem(messageCacheKey(userId, conversationId)) || 'null');
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

function writeMessageCache(userId, conversationId, messages) {
  try {
    localStorage.setItem(messageCacheKey(userId, conversationId), JSON.stringify(messages.slice(-100)));
  } catch {
    // Storage can be unavailable or full; the server remains the source of truth.
  }
}

export default function Messages() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [before, setBefore] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupBusy, setGroupBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const loadingConversationId = useRef(null);
  const pollingConversationId = useRef(null);
  const loadingConversationsRef = useRef(false);
  const sessionInvalidRef = useRef(false);

  const loadConversations = useCallback(async (silent = false) => {
    if (loadingConversationsRef.current || sessionInvalidRef.current) return;
    loadingConversationsRef.current = true;
    if (!silent) setLoadingConversations(true);
    try { const data = await api.get('/messages/conversations'); setConversations(data || []); setError(''); }
    catch (err) { if (err.status === 401) sessionInvalidRef.current = true; setError(err.message || 'Impossible de charger les conversations.'); }
    finally { loadingConversationsRef.current = false; if (!silent) setLoadingConversations(false); }
  }, []);

  const loadConversation = useCallback(async (id, olderBefore = null) => {
    if (!olderBefore && loadingConversationId.current === id) return;
    if (!olderBefore) loadingConversationId.current = id;
    setLoadingMessages(true);
    try {
      if (!olderBefore) {
        const cachedMessages = readMessageCache(profile?.uid, id);
        if (cachedMessages.length) setMessages(cachedMessages);
        const details = await api.get(`/messages/conversations/${id}`);
        setConversation(details);
        const result = await api.get(`/messages/conversations/${id}/messages?limit=30`);
        setMessages(result.messages || []);
        writeMessageCache(profile?.uid, id, result.messages || []);
        setBefore(result.nextBefore || null); setHasMore(Boolean(result.hasMore));
        await api.post(`/messages/conversations/${id}/read`);
        setConversations((items) => items.map((item) => item.id === id ? { ...item, unreadCount: 0 } : item));
      } else {
        const result = await api.get(`/messages/conversations/${id}/messages?limit=30&before=${encodeURIComponent(olderBefore)}`);
        setMessages((items) => {
          const merged = [...(result.messages || []), ...items];
          writeMessageCache(profile?.uid, id, merged);
          return merged;
        });
        setBefore(result.nextBefore || null); setHasMore(Boolean(result.hasMore));
      }
      setError('');
    } catch (err) { if (err.status === 401) sessionInvalidRef.current = true; setError(err.message || 'Impossible de charger la conversation.'); }
    finally { if (!olderBefore) loadingConversationId.current = null; setLoadingMessages(false); }
  }, [profile?.uid]);

  useEffect(() => {
    loadConversations();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') loadConversations(true); }, 60000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    searchUsers('').then((users) => setContacts(users.filter((user) => user.uid !== profile?.uid))).catch(() => setContacts([]));
    registerForMessaging().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedId) { setConversation(null); setMessages([]); return undefined; }
    loadConversation(selectedId).then(() => { pollingConversationId.current = selectedId; });
    const timer = setInterval(async () => {
      if (pollingConversationId.current !== selectedId || sessionInvalidRef.current || document.visibilityState !== 'visible') return;
      try {
        const result = await api.get(`/messages/conversations/${selectedId}/messages?limit=50`);
        setMessages(result.messages || []);
        writeMessageCache(profile?.uid, selectedId, result.messages || []);
      } catch (err) { if (err.status === 401) { sessionInvalidRef.current = true; pollingConversationId.current = null; } }
    }, 30000);
    return () => { pollingConversationId.current = null; clearInterval(timer); };
  }, [selectedId, loadConversation]);

  async function sendMessage(content) {
    if (!selectedId) return;
    setSending(true); setError('');
    try {
      const message = await api.post(`/messages/conversations/${selectedId}/messages`, { content });
      setMessages((items) => {
        const nextMessages = [...items, message];
        writeMessageCache(profile?.uid, selectedId, nextMessages);
        return nextMessages;
      });
      setConversations((items) => items.map((item) => item.id === selectedId ? { ...item, lastMessage: message.content, lastMessageAt: message.createdAt, updatedAt: message.createdAt, unreadCount: 0 } : item));
    } catch (err) { setError(err.message || 'Impossible d’envoyer le message.'); throw err; }
    finally { setSending(false); }
  }

  async function searchUsers(query) {
    try { return await api.get(`/messages/users/search?q=${encodeURIComponent(query)}`); }
    catch (err) { if (err.status === 401) sessionInvalidRef.current = true; throw err; }
  }

  async function startPrivate(userId) {
    setCreating(true); setError('');
    try { const result = await api.post('/messages/conversations/private', { userId }); setModalOpen(false); await loadConversations(true); setSelectedId(result.id); }
    catch (err) { setError(err.message || 'Impossible de démarrer la conversation.'); }
    finally { setCreating(false); }
  }

  async function openContact(userId) {
    const existing = conversations.find((item) => item.type === 'private' && item.otherUser?.uid === userId);
    if (existing) { setSelectedId(existing.id); return; }
    await startPrivate(userId);
  }

  async function groupAction(action) {
    const id = selectedId;
    setGroupBusy(true);
    try { await action(); setError(''); const details = await api.get(`/messages/conversations/${id}`); setConversation(details); await loadConversations(true); }
    catch (err) { setError(err.message || 'Impossible de modifier le groupe.'); }
    finally { setGroupBusy(false); }
  }

  async function createGroup(name, memberIds) {
    setCreating(true); setError('');
    try { const result = await api.post('/messages/conversations', { name, memberIds }); setModalOpen(false); await loadConversations(true); setSelectedId(result.id); }
    catch (err) { setError(err.message || 'Impossible de créer le groupe.'); }
    finally { setCreating(false); }
  }

  async function renameGroup(name) { await groupAction(() => api.patch(`/messages/conversations/${selectedId}`, { name })); }
  async function addMember(userId) { await groupAction(() => api.post(`/messages/conversations/${selectedId}/members`, { userId })); }
  async function removeMember(userId) { await groupAction(() => api.delete(`/messages/conversations/${selectedId}/members/${userId}`)); }
  async function leaveGroup() {
    const id = selectedId;
    setGroupBusy(true);
    try { await api.post(`/messages/conversations/${id}/leave`); setSelectedId(null); setConversation(null); setGroupInfoOpen(false); await loadConversations(true); setError(''); }
    catch (err) { setError(err.message || 'Impossible de quitter le groupe.'); }
    finally { setGroupBusy(false); }
  }
  async function deleteGroup() {
    const id = selectedId;
    setGroupBusy(true);
    try { await api.delete(`/messages/conversations/${id}`); setSelectedId(null); setConversation(null); setGroupInfoOpen(false); await loadConversations(true); setError(''); }
    catch (err) { setError(err.message || 'Impossible de supprimer le groupe.'); }
    finally { setGroupBusy(false); }
  }

  const selectedConversation = conversations.find((item) => item.id === selectedId);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><FaExclamationTriangle size={13} /> <span className="flex-1">{error}</span><Button type="Button" onClick={() => setError('')} className="text-xs font-semibold">Fermer</Button></div>}
      <div className="mt-0 flex min-h-0 flex-1 overflow-hidden border border-line bg-surface shadow-[0_12px_40px_rgba(24,46,38,0.06)] lg:rounded-2xl">
        <div className={`${selectedId ? 'hidden lg:flex' : 'flex'} min-h-0 flex-1 lg:w-[340px] lg:flex-none`}><ConversationList conversations={conversations} contacts={contacts} selectedId={selectedId} search={search} onSearch={setSearch} onSelect={setSelectedId} onContactSelect={openContact} onNew={() => setModalOpen(true)} loading={loadingConversations} /></div>
        <div className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1`}><ChatWindow conversation={conversation || selectedConversation} messages={messages} currentUserId={profile?.uid} loading={loadingMessages} sending={sending} hasMore={hasMore} onLoadOlder={() => before && loadConversation(selectedId, before)} onSend={sendMessage} onBack={() => setSelectedId(null)} onOpenGroupInfo={() => setGroupInfoOpen(true)} /></div>
      </div>
      {conversation?.type === 'group' && <GroupInfoModal open={groupInfoOpen} onClose={() => setGroupInfoOpen(false)} conversation={conversation} currentUserId={profile?.uid} onRename={renameGroup} onAddMember={addMember} onRemoveMember={removeMember} onLeave={leaveGroup} onDelete={deleteGroup} searchUsers={searchUsers} busy={groupBusy} />}
      <NewConversationModal open={modalOpen} onClose={() => setModalOpen(false)} onPrivate={startPrivate} onCreateGroup={createGroup} searchUsers={searchUsers} creating={creating} />
    </div>
  );
}
