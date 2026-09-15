import Legend from "./Legend";
import { useState } from "react";
import { FaExpand, FaTimes } from "react-icons/fa";

const COLORS = { success: "#159570", warning: "#d58b28" };

export default function DonutChart({ completed, pending, t }) {
  const [expanded, setExpanded] = useState(false);
  const total = completed + pending;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const doneLength = total ? completed / total * circumference : 0;
  const chart = <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center"><div className="relative h-40 w-40"><svg viewBox="0 0 140 140" className="h-full w-full -rotate-90"><circle cx="70" cy="70" r={radius} fill="none" stroke="#e9efec" strokeWidth="18" /><circle cx="70" cy="70" r={radius} fill="none" stroke={COLORS.success} strokeWidth="18" strokeDasharray={`${doneLength} ${circumference}`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl text-ink">{total ? Math.round(completed / total * 100) : 0}%</strong><span className="text-[11px] text-muted">{t("realization")}</span></div></div><div className="space-y-3 text-sm"><Legend color={COLORS.success} label={t("completedPlural")} value={completed} /><Legend color={COLORS.warning} label={t("remaining")} value={pending} /></div></div>;
  return <><button type="button" onClick={() => setExpanded(true)} className="group relative block w-full cursor-zoom-in text-left" aria-label="Agrandir le graphique"><div className="pointer-events-none">{chart}</div><span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface/90 text-primary opacity-70 shadow-sm group-hover:opacity-100"><FaExpand size={13} /></span></button>{expanded && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpanded(false); }}><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-ink">{t("statusBreakdown")}</h2><p className="mt-1 text-xs text-muted">Répartition détaillée des tâches de la période.</p></div><button type="button" onClick={() => setExpanded(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2" aria-label="Fermer"><FaTimes /></button></div><div className="flex justify-center">{chart}</div></div></div>}</>;
}
