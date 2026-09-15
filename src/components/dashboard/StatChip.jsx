import Card from "../ui/card";

export default function StatChip({ icon, label, value, color }) {
  const styles = { primary: "bg-primary/10 text-primary", success: "bg-emerald-500/10 text-emerald-600", warning: "bg-amber-500/10 text-amber-600", blue: "bg-sky-500/10 text-sky-600" };
  return <Card className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[color]}`}>{icon}</span><div><p className="text-xs text-muted">{label}</p><p className="text-2xl font-bold text-ink">{value}</p></div></Card>;
}
