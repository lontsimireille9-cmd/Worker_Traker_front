export default function ChartHeading({ icon, title, text }) {
  return <div className="mb-5 flex items-start gap-3"><span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span><div><h2 className="font-semibold text-ink">{title}</h2><p className="mt-1 text-xs text-muted">{text}</p></div></div>;
}
