export default function Legend({ color, label, value }) {
  return <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /><span className="text-muted">{label}</span><strong className="ml-auto text-ink">{value}</strong></div>;
}
