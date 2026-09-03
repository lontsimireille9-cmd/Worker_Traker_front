import Card from "../ui/card";

export default function Insight({ icon, label, value }) {
  return <Card className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-primary">{icon}</span><div><p className="text-xs text-muted">{label}</p><p className="text-xl font-bold text-ink">{value}</p></div></Card>;
}
