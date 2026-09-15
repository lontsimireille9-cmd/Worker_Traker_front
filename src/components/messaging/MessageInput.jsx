import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

export default function MessageInput({ onSend, sending }) {
  const [content, setContent] = useState('');
  async function submit(event) {
    event.preventDefault();
    const value = content.trim();
    if (!value || sending) return;
    try { await onSend(value); setContent(''); } catch { /* parent displays the error */ }
  }
  return (
    <form onSubmit={submit} className="border-t border-line bg-surface p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, 4000))} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e); } }} rows={1} placeholder="Écrire un message..." className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink outline-none focus:border-primary" />
        <Button type="submit" disabled={!content.trim() || sending} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Envoyer"><FaPaperPlane size={13} /></Button>
      </div>
      <p className="mt-1 px-1 text-[10px] text-muted">Entrée pour envoyer · Maj + Entrée pour un retour à la ligne</p>
    </form>
  );
}
