import { useEffect, useState } from "react";
import { FaCheck, FaFont, FaPalette } from "react-icons/fa";
import Card from "../components/ui/card";
import Button from "../components/ui/button";
import Select from "../components/ui/select";
import { useTheme } from "../context/ThemeContext";

const FONTS = ["Inter", "Manrope", "DM Sans", "Plus Jakarta Sans", "Roboto"];
const COLORS = [["primary", "Couleur principale"], ["primaryDark", "Couleur foncée"], ["accent", "Accent"], ["background", "Arrière-plan"], ["surface", "Surface"], ["text", "Texte"]];

export default function Settings() {
  const { theme, saveTheme } = useTheme();
  const [draft, setDraft] = useState(theme);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setDraft(theme), [theme]);
  function change(key, value) { setSaved(false); setDraft((current) => ({ ...current, [key]: value })); }
  async function submit(event) { event.preventDefault(); setSaving(true); setError(""); try { await saveTheme(draft); setSaved(true); } catch (err) { setError(err.message); } finally { setSaving(false); } }

  return <div className="mx-auto max-w-[1200px]"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Paramètres personnels</p><h1 className="mt-1 text-2xl font-bold">Personnalisation</h1><p className="mt-1 text-sm text-muted">Ces préférences ne s’appliquent qu’à votre compte.</p></div><form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_380px]"><Card><div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FaPalette /></span><div><h2 className="font-semibold">Couleurs</h2><p className="text-xs text-muted">Choisissez une interface adaptée à votre usage.</p></div></div><div className="grid gap-4 sm:grid-cols-2">{COLORS.map(([key, label]) => <label key={key} className="block"><span className="text-sm font-medium">{label}</span><div className="mt-2 flex gap-2"><input type="color" value={draft[key]} onChange={(e) => change(key, e.target.value)} className="h-11 w-12 cursor-pointer rounded-lg border border-line bg-white p-1" /><input value={draft[key]} onChange={(e) => change(key, e.target.value)} className="h-11 flex-1 rounded-lg border border-line px-3 text-sm font-mono uppercase" pattern="#[0-9A-Fa-f]{6}" /></div></label>)}</div><div className="mt-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><FaFont /></span><div className="flex-1"><p className="text-sm font-medium">Police</p><p className="text-xs text-muted">Utilisée uniquement par votre compte.</p></div><div className="w-52"><Select value={draft.font} onChange={(e) => change("font", e.target.value)} options={FONTS.map((font) => ({ value: font, label: font }))} /></div></div></Card><Card><h2 className="mb-4 font-semibold">Aperçu</h2><div className="rounded-2xl p-4" style={{ background: draft.background, color: draft.text, fontFamily: draft.font }}><div className="rounded-xl p-4 shadow-sm" style={{ background: draft.surface }}><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: draft.primary }}>SE</div><div><p className="font-semibold">Suivi Employés</p><p className="text-xs opacity-60">Votre interface</p></div></div><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-lg p-3" style={{ background: `${draft.primary}12` }}><p className="text-xs opacity-60">Tâches</p><p className="text-xl font-bold" style={{ color: draft.primary }}>24</p></div><div className="rounded-lg p-3" style={{ background: `${draft.accent}12` }}><p className="text-xs opacity-60">Activité</p><p className="text-xl font-bold" style={{ color: draft.accent }}>82%</p></div></div></div></div>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}{saved && <p className="mt-4 flex items-center gap-2 text-sm text-emerald-600"><FaCheck /> Modifications enregistrées.</p>}<Button type="submit" loading={saving} className="mt-5 w-full">Enregistrer</Button></Card></form></div>;
}
