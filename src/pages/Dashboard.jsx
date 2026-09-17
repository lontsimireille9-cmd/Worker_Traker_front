import { useEffect, useMemo, useState } from "react";
import { FaArrowDown, FaArrowUp, FaChartLine, FaCheckCircle, FaClock, FaMinus, FaTasks, FaUsers } from "react-icons/fa";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import DashboardChartHeading from "../components/dashboard/ChartHeading";
import DashboardStatChip from "../components/dashboard/StatChip";
import DashboardHoverLineChart from "../components/dashboard/HoverLineChart";

const COMPARISONS = [
  { key: "DD", label: "D&D", title: "Jour actuel contre jour précédent" },
  { key: "DW", label: "D&W", title: "Jour actuel contre le même jour la semaine précédente" },
  { key: "WW", label: "W&W", title: "Semaine actuelle contre semaine précédente" },
  { key: "WM", label: "W&M", title: "Semaine actuelle contre mois actuel" },
  { key: "MM", label: "M&M", title: "Mois actuel contre mois précédent" },
  { key: "MY", label: "M&Y", title: "Mois actuel contre année actuelle" },
  { key: "YY", label: "Y&Y", title: "Année actuelle contre année précédente" },
];

const COLORS = { success: "#10B981", warning: "#F59E0B" };

function startOfDay(value = new Date()) { const date = new Date(value); date.setHours(0, 0, 0, 0); return date; }
function startOfWeek(value = new Date()) { const date = startOfDay(value); const day = date.getDay() || 7; date.setDate(date.getDate() - day + 1); return date; }
function startOfMonth(value = new Date()) { const date = startOfDay(value); date.setDate(1); return date; }
function startOfYear(value = new Date()) { const date = startOfDay(value); date.setMonth(0, 1); return date; }
function addDays(value, days) { const date = new Date(value); date.setDate(date.getDate() + days); return date; }
function endOfCurrentDay() { const date = new Date(); date.setHours(23, 59, 59, 999); return date; }
function comparisonWindows(key) {
  const today = startOfDay();
  const week = startOfWeek();
  const month = startOfMonth();
  const year = startOfYear();
  const previousMonth = new Date(month); previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousYear = new Date(year); previousYear.setFullYear(previousYear.getFullYear() - 1);
  const currentDay = { start: today, end: endOfCurrentDay() };
  if (key === "DW") return { current: currentDay, previous: { start: addDays(today, -7), end: addDays(today, -7) } };
  if (key === "WW") return { current: { start: week, end: endOfCurrentDay() }, previous: { start: addDays(week, -7), end: addDays(week, -1) } };
  if (key === "WM") return { current: { start: week, end: endOfCurrentDay() }, previous: { start: month, end: endOfCurrentDay() } };
  if (key === "MM") return { current: { start: month, end: endOfCurrentDay() }, previous: { start: previousMonth, end: addDays(month, -1) } };
  if (key === "MY") return { current: { start: month, end: endOfCurrentDay() }, previous: { start: year, end: endOfCurrentDay() } };
  if (key === "YY") return { current: { start: year, end: endOfCurrentDay() }, previous: { start: previousYear, end: addDays(year, -1) } };
  return { current: currentDay, previous: { start: addDays(today, -1), end: addDays(today, -1) } };
}
function inRange(task, range) { const time = new Date(task.createdAt || 0).getTime(); return time >= range.start.getTime() && time <= range.end.getTime(); }
function isCompleted(task) { return task.status === "COMPLETED" || task.completed === true; }
function summarize(tasks, range) { const filtered = tasks.filter((task) => inRange(task, range)); const completed = filtered.filter(isCompleted).length; return { total: filtered.length, completed, pending: filtered.length - completed, rate: filtered.length ? Math.round(completed / filtered.length * 100) : 0 }; }
function trend(current, previous) { const difference = current - previous; return { tone: difference > 0 ? "up" : difference < 0 ? "down" : "stable", icon: difference > 0 ? <FaArrowUp /> : difference < 0 ? <FaArrowDown /> : <FaMinus /> }; }
function makeIndicators(current, previous, employeePerformance) { return [
  { key: "tasks", label: "Tâches", value: current.total, trend: trend(current.total, previous.total).icon, tone: trend(current.total, previous.total).tone },
  { key: "completed", label: "Tâches terminées", value: current.completed, trend: trend(current.completed, previous.completed).icon, tone: trend(current.completed, previous.completed).tone },
  { key: "rate", label: "Taux de réalisation", value: `${current.rate}%`, trend: trend(current.rate, previous.rate).icon, tone: trend(current.rate, previous.rate).tone },
  ...employeePerformance.map((employee) => ({ key: employee.uid, label: employee.name || employee.email, value: `${employee.current}%`, trend: trend(employee.current, employee.previous).icon, tone: trend(employee.current, employee.previous).tone })),
]; }
function ComparisonSelector({ active, onChange }) { return <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1 sm:w-auto">{COMPARISONS.map((item) => <button key={item.key} type="button" onClick={() => onChange(item.key)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${active === item.key ? "bg-primary text-white" : "text-muted hover:bg-surface-2 hover:text-ink"}`}>{item.label}</button>)}</div>; }

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedKey, setSelectedKey] = useState("DD");
  const isEmployee = profile?.role === "EMPLOYEE";
  useEffect(() => { api.get("/tasks").then(setTasks).catch(() => setTasks([])); if (!isEmployee) api.get("/employees").then(setEmployees).catch(() => setEmployees([])); }, [isEmployee]);
  const selected = COMPARISONS.find((item) => item.key === selectedKey) || COMPARISONS[0];
  const windows = comparisonWindows(selected.key);
  const current = useMemo(() => summarize(tasks, windows.current), [tasks, selectedKey]);
  const previous = useMemo(() => summarize(tasks, windows.previous), [tasks, selectedKey]);
  const employeePerformance = useMemo(() => employees.map((employee) => {
    const rate = (items) => items.length ? Math.round(items.filter(isCompleted).length / items.length * 100) : 0;
    return { ...employee, current: rate(tasks.filter((task) => inRange(task, windows.current) && task.assigneeId === employee.uid)), previous: rate(tasks.filter((task) => inRange(task, windows.previous) && task.assigneeId === employee.uid)) };
  }), [employees, tasks, selectedKey]);
  const indicators = makeIndicators(current, previous, isEmployee ? [] : employeePerformance);
  const chartData = [{ label: "Avant", total: previous.total, completed: previous.completed }, { label: "Actuel", total: current.total, completed: current.completed }];

  return <div className="mx-auto max-w-7xl pb-8">
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Performance</p><Title as="h1" variant="page" className="mt-1 mb-1">{t("hello")} {profile?.name?.split(" ")[0] || t("you")}</Title><p className="text-sm text-muted">{selected.title}</p></div><ComparisonSelector active={selected.key} onChange={setSelectedKey} /></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><DashboardStatChip icon={<FaTasks />} label="Tâches" value={current.total} color="primary" /><DashboardStatChip icon={<FaCheckCircle />} label="Terminées" value={current.completed} color="success" /><DashboardStatChip icon={<FaClock />} label="À traiter" value={current.pending} color="warning" /><DashboardStatChip icon={<FaChartLine />} label="Réalisation" value={`${current.rate}%`} color="blue" /></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]"><Card className="bg-white"><DashboardChartHeading icon={<FaChartLine />} title={selected.label} text={selected.title} /><DashboardHoverLineChart data={chartData} valueKey="total" showCompleted t={t} indicators={indicators} /></Card><Card className="bg-white"><DashboardChartHeading icon={<FaCheckCircle />} title="Évolution de la réalisation" text="Comparaison de la période active" /><div className="flex h-48 items-center justify-center"><div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(${COLORS.success} ${current.rate}%, ${COLORS.warning} 0)` }}><div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-2xl font-bold text-ink">{current.rate}%</div></div></div><div className="flex justify-center gap-5 text-xs text-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Terminées</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />À traiter</span></div></Card></div>
    {!isEmployee && <Card className="mt-6 bg-white"><DashboardChartHeading icon={<FaUsers />} title="Performance des employés" text="Évolution par rapport à la période précédente" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{employeePerformance.map((employee) => { const item = trend(employee.current, employee.previous); return <div key={employee.uid} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{employee.name || employee.email}</p><p className="text-xs text-muted">{employee.previous}% avant → {employee.current}% actuel</p></div><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.tone === "up" ? "bg-emerald-50 text-emerald-600" : item.tone === "down" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{item.icon}</span></div>; })}</div></Card>}
  </div>;
}