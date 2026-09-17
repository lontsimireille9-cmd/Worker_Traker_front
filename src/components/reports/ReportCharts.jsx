import { useState } from "react";
import { FaExpand, FaTimes } from "react-icons/fa";
import { formatShortDay } from "../../utils/reportCalculations";
import Button from "../ui/Button";

function getPoints(values, width, height, maxValue) {
  if (!values.length) return "";
  const step = values.length === 1 ? width : width / (values.length - 1);
  return values.map((value, index) => `${(index * step).toFixed(1)},${(height - (value / Math.max(maxValue, 1)) * height).toFixed(1)}`).join(" ");
}

function ChartFrame({ children, labels, maxValue, detailed = false }) {
  const height = detailed ? 270 : 220;
  return (
    <div className="relative w-full min-w-0">
      <svg viewBox={`0 0 600 ${height}`} className="h-auto w-full" role="img" aria-label="Graphique d'activité">
        <g transform="translate(42 12)">
          <g className="text-slate-200">{[0, 1, 2, 3, 4].map((line) => <line key={line} x1="0" x2="540" y1={line * ((height - 35) / 4)} y2={line * ((height - 35) / 4)} stroke="currentColor" />)}</g>
          <g className="fill-slate-500 text-[10px]">{[0, 1, 2, 3, 4, 5].map((tick) => <text key={tick} x="-10" y={height - 30 - tick * ((height - 35) / 5)} textAnchor="end">{Math.round((maxValue / 5) * tick)}</text>)}</g>
          {children}
          <g className="fill-slate-500 text-[9px]">{labels.map((label, index) => <text key={`${label}-${index}`} x={labels.length === 1 ? 270 : (index * 540) / Math.max(labels.length - 1, 1)} y={height - 8} textAnchor="middle">{formatShortDay(label)}</text>)}</g>
        </g>
      </svg>
    </div>
  );
}

function ChartModal({ open, onClose, title, children, details }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="max-h-[92dvh] w-full max-w-5xl overflow-y-auto overflow-x-hidden rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="text-lg font-semibold text-ink">{title}</h2><p className="mt-1 text-xs text-muted">Version détaillée du graphique et valeurs de la période.</p></div><Button type="Button" variant="ghost" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2" aria-label="Fermer"><FaTimes /></Button></div>
        {children}
        {details && <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{details.map((item, index) => <div key={index} className="rounded-xl border border-line bg-canvas p-3 text-xs">{item}</div>)}</div>}
      </div>
    </div>
  );
}

export function EmployeeTaskChart({ daily, employees }) {
  const labels = daily.map((item) => item.date);
  const maxValue = Math.max(1, ...employees.flatMap((employee) => employee.daily || []));
  const chart = <ChartFrame labels={labels} maxValue={maxValue}><>{employees.map((employee) => <polyline key={employee.uid} fill="none" stroke={employee.color} strokeWidth="2.5" points={getPoints(employee.daily || [], 540, 180, maxValue)} />)}</></ChartFrame>;
  return <div className="bg-white">{chart}<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">{employees.map((employee) => <span key={employee.uid} className="flex items-center gap-1.5 text-slate-600"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: employee.color }} />{employee.name}</span>)}</div></div>;
}

export function GlobalTaskChart({ daily }) {
  const labels = daily.map((item) => item.date);
  const values = daily.map((item) => item.total || 0);
  const maxValue = Math.max(1, ...values);
  const line = getPoints(values, 540, 180, maxValue);
  const area = `${line} 540,180 0,180`;
  const chart = <ChartFrame labels={labels} maxValue={maxValue}><><polygon points={area} fill="#1769E8" opacity=".13" /><polyline fill="none" stroke="#1769E8" strokeWidth="3" points={line} /></></ChartFrame>;
  const detailLine = getPoints(values, 540, 225, maxValue);
  const detailArea = `${detailLine} 540,225 0,225`;
  return <div className="bg-white">{chart}</div>;
}

export function ParticipationDonut({ employees, total }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const donut = (large = false) => {
    const size = 176;
    return <div className="relative shrink-0" style={{ width: size, height: size }}><svg viewBox="0 0 190 190" className="h-full w-full -rotate-90"><circle cx="95" cy="95" r={radius} fill="none" stroke="#E7EEF8" strokeWidth="28" />{employees.map((employee) => { const length = total ? (employee.completed / total) * circumference : 0; const circle = <circle key={employee.uid} cx="95" cy="95" r={radius} fill="none" stroke={employee.color} strokeWidth="28" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} />; offset += length; return circle; })}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl text-[#12345F]">100%</strong><span className="text-xs text-slate-500">des tâches</span></div></div>;
  };
  offset = 0;
  return <div className="flex flex-col items-center gap-5 bg-white sm:flex-row sm:justify-center"><div>{donut()}</div><div className="min-w-0 flex-1 space-y-2">{employees.map((employee) => <div key={employee.uid} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: employee.color }} /><span className="min-w-0 flex-1 truncate text-slate-700">{employee.name}</span><span className="text-slate-500">{employee.completed}</span><strong className="w-12 text-right text-[#12345F]">{employee.participation}%</strong></div>)}</div></div>;
}
