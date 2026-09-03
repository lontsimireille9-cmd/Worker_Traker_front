import { useState } from "react";
import Legend from "./Legend";

const COLORS = { primary: "#2f5d50", success: "#159570", grid: "#dce6e1" };

export default function HoverLineChart({ data, valueKey = "total", percent = false, showCompleted = false, t }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const width = 700;
  const height = 250;
  const pad = { left: 35, right: 12, top: 15, bottom: 35 };
  const max = percent ? 100 : Math.max(...data.map((item) => Math.max(item[valueKey], showCompleted ? item.completed : 0)), 1);
  const points = data.map((item, index) => {
    const x = pad.left + index * ((width - pad.left - pad.right) / Math.max(data.length - 1, 1));
    const y = pad.top + (height - pad.top - pad.bottom) * (1 - item[valueKey] / max);
    return { ...item, x, y };
  });
  const completedPoints = data.map((item, index) => ({
    ...item,
    x: pad.left + index * ((width - pad.left - pad.right) / Math.max(data.length - 1, 1)),
    y: pad.top + (height - pad.top - pad.bottom) * (1 - item.completed / max),
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const completedLine = completedPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${pad.left},${height - pad.bottom} ${line} ${points.at(-1)?.x || pad.left},${height - pad.bottom}`;
  const activePoint = activeIndex === null ? null : points[activeIndex];
  const valueLabel = (value) => `${value}${percent ? "%" : ""}`;

  return <div className="w-full overflow-visible">
    <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted"><Legend color={COLORS.primary} label={percent ? t("averageProductivity") : t("created")} value="" />{showCompleted && <Legend color={COLORS.success} label={t("completedPlural")} value="" />}</div>
    <div className="relative">
      {activePoint && <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg" style={{ left: `${activePoint.x / width * 100}%`, top: `${activePoint.y / height * 100}%` }}>
        <p className="font-semibold text-ink">{activePoint.date}</p>
        <p className="text-primary">{t("value")}: {valueLabel(activePoint[valueKey])}</p>
        {showCompleted && <p className="text-emerald-600">{t("completedPlural")}: {valueLabel(activePoint.completed)}</p>}
      </div>}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={t("statisticalChart")} onMouseLeave={() => setActiveIndex(null)}>
        <defs><linearGradient id={`hover-area-${valueKey}-${showCompleted}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={COLORS.primary} stopOpacity=".25" /><stop offset="1" stopColor={COLORS.primary} stopOpacity="0" /></linearGradient></defs>
        {[0, .25, .5, .75, 1].map((step) => <line key={step} x1={pad.left} x2={width - pad.right} y1={pad.top + step * (height - pad.top - pad.bottom)} y2={pad.top + step * (height - pad.top - pad.bottom)} stroke={COLORS.grid} strokeDasharray="3 5" />)}
        <polygon points={area} fill={`url(#hover-area-${valueKey}-${showCompleted})`} />
        <polyline points={line} fill="none" stroke={COLORS.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {showCompleted && <polyline points={completedLine} fill="none" stroke={COLORS.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((point, index) => <g key={point.label} onMouseEnter={() => setActiveIndex(index)}>
          <circle cx={point.x} cy={point.y} r={activeIndex === index ? "6" : "4"} fill="white" stroke={COLORS.primary} strokeWidth="2" />
          {showCompleted && <circle cx={completedPoints[index].x} cy={completedPoints[index].y} r={activeIndex === index ? "5" : "3"} fill={COLORS.success} />}
          <text x={point.x} y={height - 12} textAnchor="middle" className="fill-muted text-[11px]">{point.label}</text>
        </g>)}
        {points.map((point, index) => <rect key={`hit-${point.label}`} x={index === 0 ? 0 : (point.x + points[index - 1].x) / 2} y="0" width={index === 0 ? (points[1]?.x || width) / 2 : index === points.length - 1 ? width - (points[index - 1].x + point.x) / 2 : (points[index + 1].x - points[index - 1].x) / 2} height={height} fill="transparent" onMouseEnter={() => setActiveIndex(index)} />)}
      </svg>
    </div>
  </div>;
}
