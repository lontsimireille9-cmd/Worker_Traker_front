import { useEffect, useMemo, useState } from "react";
import { FaChartLine, FaCheckCircle, FaClock, FaTasks, FaUsers } from "react-icons/fa";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/card";
import Select from "../components/ui/select";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";
import { formatTaskDate, isTaskCompleted } from "../utils/getTaskDisplayStatus";
import DashboardChartHeading from "../components/dashboard/ChartHeading";
import DashboardStatChip from "../components/dashboard/StatChip";
import DashboardInsight from "../components/dashboard/Insight";
import DashboardDonutChart from "../components/dashboard/DonutChart";
import DashboardHoverLineChart from "../components/dashboard/HoverLineChart";
import DashboardRecentTasks from "../components/dashboard/RecentTasks";

const PERIOD_KEYS = [{ value: "today", key: "today" }, { value: "yesterday", key: "yesterday" }, { value: "7", key: "last7Days" }, { value: "30", key: "lastDays" }, { value: "90", key: "lastMonths3" }, { value: "180", key: "lastMonths6" }, { value: "365", key: "lastMonths12" }];
const COLORS = { primary: "#2f5d50", success: "#159570", warning: "#d58b28", grid: "#dce6e1" };
function timestamp(value) { const date = new Date(value || 0); return Number.isNaN(date.getTime()) ? 0 : date.getTime(); }
function shortDate(value, language = "fr") { return new Date(value).toLocaleDateString(language === "en" ? "en-US" : "fr-FR", { day: "2-digit", month: "short" }); }
function fullDate(value, language = "fr") { return new Date(value).toLocaleDateString(language === "en" ? "en-US" : "fr-FR", { day: "2-digit", month: "long" }); }
function getPeriodBounds(period) { const endDate = new Date(); endDate.setHours(23, 59, 59, 999); if (period === "today") { const today = new Date(endDate); today.setHours(0, 0, 0, 0); return { start: today.getTime(), end: endDate.getTime() }; } if (period === "yesterday") { const yesterday = new Date(endDate); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0); return { start: yesterday.getTime(), end: endDate.getTime() - 86400000 }; } const days = Number(period); const startDate = new Date(endDate); startDate.setDate(startDate.getDate() - days + 1); return { start: startDate.getTime(), end: endDate.getTime() }; }
function inPeriod(task, period) { const bounds = getPeriodBounds(period); const taskTime = timestamp(task.createdAt); return taskTime >= bounds.start && taskTime <= bounds.end; }
function makeBuckets(tasks, period, employees = [], language = "fr") { const bounds = getPeriodBounds(period); const dayLength = 86400000; const firstTask = tasks.length ? Math.min(...tasks.map((task) => timestamp(task.createdAt))) : bounds.start; const firstDate = new Date(period === "today" ? bounds.start : Math.max(bounds.start, firstTask)); firstDate.setHours(0, 0, 0, 0); const startTime = firstDate.getTime(); const count = Math.max(1, Math.floor((bounds.end - startTime) / dayLength) + 1); return Array.from({ length: count }, (_, index) => { const start = startTime + index * dayLength; const bucketTasks = tasks.filter((task) => timestamp(task.createdAt) >= start && timestamp(task.createdAt) < start + dayLength); const completed = bucketTasks.filter(isTaskCompleted).length; const employeeRates = employees.map((employee) => { const own = bucketTasks.filter((task) => task.assigneeId === employee.uid); const done = own.filter(isTaskCompleted).length; return own.length ? done / own.length * 100 : 0; }); return { label: fullDate(start, language), date: fullDate(start, language), total: bucketTasks.length, completed, rate: bucketTasks.length ? Math.round(completed / bucketTasks.length * 100) : 0, productivity: employees.length ? Math.round(employeeRates.reduce((sum, rate) => sum + rate, 0) / employees.length) : 0 }; }); }
function makeTeamBuckets(tasks, team, days, language, granularity) { const memberIds = new Set(team.memberIds || []); return makeBuckets(tasks.filter((task) => task.assignmentScope === "TEAM" && task.teamId === team.id && memberIds.has(task.assigneeId)), days, team.memberIds?.map((uid) => ({ uid })) || [], language, granularity); }

export default function Dashboard() {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [tasks, setTasks] = useState([]); const [employees, setEmployees] = useState([]); const [teams, setTeams] = useState([]); const [view, setView] = useState("30-week");
  const [period, granularity] = view.split("-");
  const isEmployee = profile?.role === "EMPLOYEE";
  useEffect(() => { api.get("/tasks").then(setTasks).catch(() => setTasks([])); if (!isEmployee) { api.get("/employees").then(setEmployees).catch(() => setEmployees([])); api.get("/teams").then(setTeams).catch(() => setTeams([])); } }, [isEmployee]);
  const periodTasks = useMemo(() => tasks.filter((task) => inPeriod(task, period)), [tasks, period]);
  const buckets = useMemo(() => makeBuckets(periodTasks, period, isEmployee ? [{ uid: profile?.uid }] : employees, language, granularity), [periodTasks, period, employees, isEmployee, profile?.uid, language, granularity]);
  const completed = periodTasks.filter(isTaskCompleted).length; const pending = periodTasks.length - completed; const completionRate = periodTasks.length ? Math.round(completed / periodTasks.length * 100) : 0;
  const overdue = periodTasks.filter((task) => !isTaskCompleted(task) && timestamp(task.createdAt) < Date.now() - 86400000).length;
  const employeePerformance = useMemo(() => employees.map((employee) => { const own = periodTasks.filter((task) => task.assigneeId === employee.uid); const done = own.filter(isTaskCompleted).length; return { ...employee, total: own.length, done, rate: own.length ? Math.round(done / own.length * 100) : 0 }; }).sort((a, b) => b.rate - a.rate || b.done - a.done), [employees, periodTasks]);

  const periods = PERIOD_KEYS.map(({ value, key }) => ({ value: `${value}-week`, label: t(key) }));
  return <div className="mx-auto max-w-7xl">
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("performanceAnalysis")}</p><Title as="h1" variant="page" className="mt-1 mb-1">{t("hello")} {profile?.name?.split(" ")[0] || t("you")}</Title><p className="text-sm text-muted">{isEmployee ? t("followActivity") : t("companyActivity")}</p></div><div className="w-full sm:w-56"><Select value={view} onChange={(event) => setView(event.target.value)} options={periods} /></div></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><DashboardStatChip icon={<FaTasks />} label={t("tasks")} value={periodTasks.length} color="primary" /><DashboardStatChip icon={<FaCheckCircle />} label={t("completed")} value={completed} color="success" /><DashboardStatChip icon={<FaClock />} label={t("toProcess")} value={pending} color="warning" /><DashboardStatChip icon={<FaChartLine />} label={t("overallRate")} value={`${completionRate}%`} color="blue" /></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]"><Card><DashboardChartHeading icon={<FaChartLine />} title={isEmployee ? t("myActivity") : t("activityEvolution")} text={t("createdVsCompleted")} /><DashboardHoverLineChart data={buckets} showCompleted t={t} /></Card><Card><DashboardChartHeading icon={<FaCheckCircle />} title={t("statusBreakdown")} text={t("periodSummary")} /><DashboardDonutChart completed={completed} pending={pending} t={t} /></Card></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2"><Card><DashboardChartHeading icon={<FaChartLine />} title={isEmployee ? t("averageProductivity") : t("completionRate")} text={isEmployee ? t("employeeRatio") : t("completionPercent")} /><DashboardHoverLineChart data={buckets} valueKey={isEmployee ? "productivity" : "rate"} percent t={t} /></Card>{!isEmployee ? <Card><DashboardChartHeading icon={<FaChartLine />} title={t("averageProductivity")} text={t("employeeAverage")} /><DashboardHoverLineChart data={buckets} valueKey="productivity" percent t={t} /></Card> : <DashboardRecentTasks tasks={periodTasks.slice(0, 6)} t={t} />}</div>
    {!isEmployee && teams.length > 0 && <Card className="mt-6"><DashboardChartHeading icon={<FaUsers />} title={t("teamProductivity")} text={t("teamTasksOnly")} /><div className="grid gap-6 lg:grid-cols-2">{teams.slice(0, 4).map((team) => <div key={team.id}><p className="mb-2 text-sm font-semibold text-ink">{team.name}</p><DashboardHoverLineChart data={makeTeamBuckets(periodTasks, team, period, language, granularity)} valueKey="rate" percent t={t} /></div>)}</div></Card>}
    {!isEmployee && <div className="mt-6 grid gap-4 sm:grid-cols-3"><DashboardInsight label={t("activeEmployees")} value={employees.filter((employee) => employee.status !== "DISABLED").length} icon={<FaUsers />} /><DashboardInsight label={t("overdueTasks")} value={overdue} icon={<FaClock />} /><DashboardInsight label={t("averageProductivity")} value={employees.length ? `${Math.round(employeePerformance.reduce((sum, item) => sum + item.rate, 0) / employees.length)}%` : "0%"} icon={<FaChartLine />} /></div>}
  </div>;
}
function ChartHeading({ icon, title, text }) { return <div className="mb-5 flex items-start gap-3"><span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span><div><h2 className="font-semibold text-ink">{title}</h2><p className="mt-1 text-xs text-muted">{text}</p></div></div>; }
function StatChip({ icon, label, value, color }) { const styles = { primary: "bg-primary/10 text-primary", success: "bg-emerald-500/10 text-emerald-600", warning: "bg-amber-500/10 text-amber-600", blue: "bg-sky-500/10 text-sky-600" }; return <Card className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[color]}`}>{icon}</span><div><p className="text-xs text-muted">{label}</p><p className="text-2xl font-bold text-ink">{value}</p></div></Card>; }
function Insight({ icon, label, value }) { return <Card className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-primary">{icon}</span><div><p className="text-xs text-muted">{label}</p><p className="text-xl font-bold text-ink">{value}</p></div></Card>; }
function LineChart({ data, valueKey = "total", percent = false, showCompleted = false, t }) { const width = 700; const height = 250; const pad = { left: 35, right: 12, top: 15, bottom: 35 }; const max = percent ? 100 : Math.max(...data.map((item) => Math.max(item[valueKey], showCompleted ? item.completed : 0)), 1); const points = data.map((item, index) => { const x = pad.left + index * ((width - pad.left - pad.right) / Math.max(data.length - 1, 1)); const y = pad.top + (height - pad.top - pad.bottom) * (1 - item[valueKey] / max); return { ...item, x, y }; }); const completedPoints = data.map((item, index) => { const x = pad.left + index * ((width - pad.left - pad.right) / Math.max(data.length - 1, 1)); const y = pad.top + (height - pad.top - pad.bottom) * (1 - item.completed / max); return { ...item, x, y }; }); const line = points.map((point) => `${point.x},${point.y}`).join(" "); const completedLine = completedPoints.map((point) => `${point.x},${point.y}`).join(" "); const area = `${pad.left},${height - pad.bottom} ${line} ${points.at(-1)?.x || pad.left},${height - pad.bottom}`; return <div className="w-full overflow-hidden"><div className="mb-3 flex flex-wrap gap-4 text-xs text-muted"><Legend color={COLORS.primary} label={percent ? t("averageProductivity") : t("created")} value="" />{showCompleted && <Legend color={COLORS.success} label={t("completedPlural")} value="" />}</div><svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={t("statisticalChart")}><defs><linearGradient id={`area-${valueKey}-${showCompleted}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={COLORS.primary} stopOpacity=".25" /><stop offset="1" stopColor={COLORS.primary} stopOpacity="0" /></linearGradient></defs>{[0, .25, .5, .75, 1].map((step) => <line key={step} x1={pad.left} x2={width - pad.right} y1={pad.top + step * (height - pad.top - pad.bottom)} y2={pad.top + step * (height - pad.top - pad.bottom)} stroke={COLORS.grid} strokeDasharray="3 5" />)}<polygon points={area} fill={`url(#area-${valueKey}-${showCompleted})`} /><polyline points={line} fill="none" stroke={COLORS.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{showCompleted && <polyline points={completedLine} fill="none" stroke={COLORS.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}{points.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="4" fill="white" stroke={COLORS.primary} strokeWidth="2"><title>{`${point.label}: ${point[valueKey]}${percent ? "%" : ""}`}</title></circle>{showCompleted && <circle cx={point.x} cy={completedPoints.find((item) => item.label === point.label)?.y} r="3" fill={COLORS.success}><title>{`${point.label}: ${point.completed}`}</title></circle>}<text x={point.x} y={height - 12} textAnchor="middle" className="fill-muted text-[11px]">{point.label}</text></g>)}</svg></div>; }
function DonutChart({ completed, pending, t }) { const total = completed + pending; const radius = 52; const circumference = 2 * Math.PI * radius; const doneLength = total ? completed / total * circumference : 0; return <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center"><div className="relative h-40 w-40"><svg viewBox="0 0 140 140" className="h-full w-full -rotate-90"><circle cx="70" cy="70" r={radius} fill="none" stroke="#e9efec" strokeWidth="18" /><circle cx="70" cy="70" r={radius} fill="none" stroke={COLORS.success} strokeWidth="18" strokeDasharray={`${doneLength} ${circumference}`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl text-ink">{total ? Math.round(completed / total * 100) : 0}%</strong><span className="text-[11px] text-muted">{t("realization")}</span></div></div><div className="space-y-3 text-sm"><Legend color={COLORS.success} label={t("completedPlural")} value={completed} /><Legend color={COLORS.warning} label={t("remaining")} value={pending} /></div></div>; }
function Legend({ color, label, value }) { return <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /><span className="text-muted">{label}</span><strong className="ml-auto text-ink">{value}</strong></div>; }
function BarChart({ data }) { return <div className="space-y-4">{data.map((item) => <div key={item.uid}><div className="mb-1 flex justify-between gap-3 text-xs"><span className="max-w-[70%] truncate font-medium text-ink">{item.name || item.email}</span><span className="font-semibold text-primary">{item.rate}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{ width: `${item.rate}%` }} /></div><p className="mt-1 text-[11px] text-muted">{item.done}/{item.total} taches realisees</p></div>)}{data.length === 0 && <EmptyChart text="Pas encore de donnees par employe." />}</div>; }
function RecentTasks({ tasks, t }) { return <Card><DashboardChartHeading icon={<FaTasks />} title={t("recentActivity")} text={t("recentTasksDescription")} /><div className="space-y-2">{tasks.map((task) => <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{task.title}</p><p className="mt-1 text-xs text-muted">{formatTaskDate(task.createdAt)}</p></div><Badge tone={isTaskCompleted(task) ? "success" : "warning"}>{isTaskCompleted(task) ? t("done") : t("toProcess")}</Badge></div>)}{tasks.length === 0 && <EmptyChart text={t("noActivity")} />}</div></Card>; }
function EmptyChart({ text }) { return <p className="py-8 text-center text-sm text-muted">{text}</p>; }

function HoverLineChart({ data, valueKey = "total", percent = false, showCompleted = false, t }) {
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
