import Legend from "./Legend";

const COLORS = { success: "#159570", warning: "#d58b28" };

export default function DonutChart({ completed, pending, t }) {
  const total = completed + pending;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const doneLength = total ? completed / total * circumference : 0;
  return <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center"><div className="relative h-40 w-40"><svg viewBox="0 0 140 140" className="h-full w-full -rotate-90"><circle cx="70" cy="70" r={radius} fill="none" stroke="#e9efec" strokeWidth="18" /><circle cx="70" cy="70" r={radius} fill="none" stroke={COLORS.success} strokeWidth="18" strokeDasharray={`${doneLength} ${circumference}`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl text-ink">{total ? Math.round(completed / total * 100) : 0}%</strong><span className="text-[11px] text-muted">{t("realization")}</span></div></div><div className="space-y-3 text-sm"><Legend color={COLORS.success} label={t("completedPlural")} value={completed} /><Legend color={COLORS.warning} label={t("remaining")} value={pending} /></div></div>;
}
