import { useMemo, useState } from "react";
import Legend from "./Legend";
import { FaExpand, FaTimes } from "react-icons/fa";

const COLORS = { primary: "#1769E8", success: "#10B981", grid: "#DCE7F5" };

function formatDetailDate(value, language = "fr") {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(language === "en" ? "en-US" : "fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function ChartSvg({ data, valueKey, percent, showCompleted, detailed = false, language = "fr" }) {
  const width = 760;
  const height = detailed ? 330 : 250;
  const pad = { left: 42, right: 14, top: 18, bottom: detailed ? 48 : 16 };
  const max = percent ? 100 : Math.max(1, ...data.map((item) => Math.max(Number(item[valueKey]) || 0, showCompleted ? Number(item.completed) || 0 : 0)));
  const step = (width - pad.left - pad.right) / Math.max(data.length - 1, 1);
  const yFor = (value) => pad.top + (height - pad.top - pad.bottom) * (1 - (Number(value) || 0) / max);
  const points = data.map((item, index) => ({ ...item, x: pad.left + index * step, y: yFor(item[valueKey]) }));
  const completedPoints = data.map((item, index) => ({ ...item, x: pad.left + index * step, y: yFor(item.completed) }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const completedLine = completedPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${pad.left},${height - pad.bottom} ${line} ${points.at(-1)?.x || pad.left},${height - pad.bottom}`;
  const id = `chart-area-${valueKey}-${showCompleted}-${detailed ? "detail" : "compact"}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Graphique d'activité">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={COLORS.primary} stopOpacity=".20" />
          <stop offset="1" stopColor={COLORS.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, .25, .5, .75, 1].map((stepValue) => (
        <line key={stepValue} x1={pad.left} x2={width - pad.right} y1={pad.top + stepValue * (height - pad.top - pad.bottom)} y2={pad.top + stepValue * (height - pad.top - pad.bottom)} stroke={COLORS.grid} strokeDasharray="3 5" />
      ))}
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={COLORS.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {showCompleted && <polyline points={completedLine} fill="none" stroke={COLORS.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {detailed && points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={point.x} cy={point.y} r="5" fill="white" stroke={COLORS.primary} strokeWidth="2" />
          {showCompleted && <circle cx={completedPoints[index].x} cy={completedPoints[index].y} r="4" fill={COLORS.success} />}
          <text x={point.x} y={height - 20} textAnchor="middle" className="fill-muted text-[11px]">
            {new Date(point.timestamp || point.date || point.label).toLocaleDateString(language === "en" ? "en-US" : "fr-FR", { day: "2-digit", month: "short" })}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function HoverLineChart({ data, valueKey = "total", percent = false, showCompleted = false, t, language = "fr" }) {
  const [expanded, setExpanded] = useState(false);
  const safeData = useMemo(() => data || [], [data]);
  const valueLabel = (value) => `${value}${percent ? "%" : ""}`;

  if (!safeData.length) return <p className="py-8 text-center text-sm text-muted">Aucune donnée pour cette période.</p>;

  const compactChart = (
    <div className="relative w-full">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
        <Legend color={COLORS.primary} label={percent ? t("averageProductivity") : t("created")} value="" />
        {showCompleted && <Legend color={COLORS.success} label={t("completedPlural")} value="" />}
      </div>
<ChartSvg data={safeData} valueKey={valueKey} percent={percent} showCompleted={showCompleted} language={language} />
    </div>
  );

  return (
    <>
      <Button type="Button" onClick={() => setExpanded(true)} className="group relative block w-full cursor-zoom-in text-left" aria-label="Ouvrir le graphique détaillé">
        {compactChart}
        <span className="pointer-events-none absolute right-2 top-1 flex h-8 w-8 items-center justify-center rounded-lg bg-surface/90 text-primary opacity-70 shadow-sm transition group-hover:opacity-100"><FaExpand size={13} /></span>
      </Button>
      {expanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpanded(false); }}>
          <div className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto overflow-x-hidden rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink">{percent ? t("averageProductivity") : t("activityEvolution")}</h2>
                <p className="mt-1 text-xs text-muted">Vue détaillée avec les valeurs de la période.</p>
              </div>
              <Button type="Button" onClick={() => setExpanded(false)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Fermer"><FaTimes /></Button>
            </div>
            <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted">
              <Legend color={COLORS.primary} label={percent ? t("averageProductivity") : t("created")} value="" />
              {showCompleted && <Legend color={COLORS.success} label={t("completedPlural")} value="" />}
            </div>
            <ChartSvg data={safeData} valueKey={valueKey} percent={percent} showCompleted={showCompleted} detailed language={language} />
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {safeData.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-xl border border-line bg-canvas p-3">
                  <p className="text-xs font-semibold text-ink">{formatDetailDate(item.timestamp || item.date || item.label, language)}</p>
                  <p className="mt-1 text-xs text-primary">{t("value")}: {valueLabel(item[valueKey])}</p>
                  {showCompleted && <p className="text-xs text-emerald-600">{t("completedPlural")}: {item.completed}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
