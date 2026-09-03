import { useEffect, useMemo, useState } from "react";
import { FaArrowUp, FaCheckCircle, FaClock, FaClipboardList, FaExclamationTriangle, FaUsers } from "react-icons/fa";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";
import Select from "../components/ui/select";
import {
  formatTaskDate,
  getTaskStatusLabel,
  getTaskTimelineLabel,
  getTaskTimelineTone,
  isTaskCompleted,
  sortTasksByDisplayOrder,
} from "../utils/getTaskDisplayStatus";

const PERIODS = [
  { value: "30", label: "30 derniers jours" },
  { value: "90", label: "3 derniers mois" },
  { value: "180", label: "6 derniers mois" },
  { value: "365", label: "12 derniers mois" },
];

function getDateValue(value) {
  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function inPeriod(task, days) {
  return getDateValue(task.createdAt) >= Date.now() - Number(days) * 24 * 60 * 60 * 1000;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [period, setPeriod] = useState("30");
  const isEmployee = profile?.role === "EMPLOYEE";

  useEffect(() => {
    api.get("/tasks").then(setTasks).catch(() => setTasks([]));
    if (!isEmployee) api.get("/employees").then(setEmployees).catch(() => setEmployees([]));
  }, [isEmployee]);

  const periodTasks = useMemo(() => sortTasksByDisplayOrder(tasks.filter((task) => inPeriod(task, period))), [tasks, period]);
  const completed = periodTasks.filter(isTaskCompleted).length;
  const pending = periodTasks.filter((task) => !isTaskCompleted(task)).length;
  const completionRate = periodTasks.length ? Math.round((completed / periodTasks.length) * 100) : 0;
  const late = periodTasks.filter((task) => !isTaskCompleted(task) && getDateValue(task.createdAt) < Date.now() - 24 * 60 * 60 * 1000).length;

  const employeePerformance = useMemo(() => employees.map((employee) => {
    const employeeTasks = periodTasks.filter((task) => task.assigneeId === employee.uid);
    const done = employeeTasks.filter(isTaskCompleted).length;
    return { ...employee, total: employeeTasks.length, done, rate: employeeTasks.length ? Math.round((done / employeeTasks.length) * 100) : 0 };
  }).filter((employee) => employee.total > 0).sort((a, b) => b.rate - a.rate || b.done - a.done), [employees, periodTasks]);

  const recentTasks = periodTasks.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pilotage de performance</p>
          <Title as="h1" variant="page" className="mt-1 mb-1">Bonjour {profile?.name?.split(" ")[0] || "à vous"}</Title>
          <p className="text-sm text-muted">{isEmployee ? "Voici vos résultats et votre activité." : "Une vue claire de l’activité et de la réalisation de l’entreprise."}</p>
        </div>
        <div className="w-full sm:w-56"><Select value={period} onChange={(event) => setPeriod(event.target.value)} options={PERIODS} /></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<FaClipboardList />} label="Tâches suivies" value={periodTasks.length} tone="primary" helper="sur la période sélectionnée" />
        <MetricCard icon={<FaCheckCircle />} label="Taux de réalisation" value={`${completionRate}%`} tone="success" helper={`${completed} tâche(s) terminée(s)`} />
        <MetricCard icon={<FaClock />} label="À traiter" value={pending} tone="warning" helper="tâches non terminées" />
        <MetricCard icon={<FaExclamationTriangle />} label="En retard" value={late} tone="danger" helper="créées il y a plus d’un jour" />
      </div>

      {!isEmployee && <div className="mt-5 grid gap-4 sm:grid-cols-2"><MetricCard icon={<FaUsers />} label="Employés actifs" value={employees.filter((employee) => employee.status !== "DISABLED").length} tone="info" helper="dans l’entreprise" /><MetricCard icon={<FaArrowUp />} label="Productivité moyenne" value={employeePerformance.length ? `${Math.round(employeePerformance.reduce((sum, employee) => sum + employee.rate, 0) / employeePerformance.length)}%` : "0%"} tone="primary" helper="taux moyen des employés actifs" /></div>}

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-ink">Activité récente</h2><p className="mt-1 text-xs text-muted">Les tâches les plus récemment enregistrées.</p></div><Badge tone="info">{periodTasks.length} total</Badge></div>
          <div className="space-y-2">{recentTasks.map((task) => <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{task.title}</p><p className="mt-1 text-xs text-muted">{isEmployee ? formatTaskDate(task.createdAt) : `${task.assigneeName || task.assigneeId} · ${formatTaskDate(task.createdAt)}`}</p></div><Badge tone={getTaskTimelineTone(task)}>{getTaskTimelineLabel(task)}</Badge></div>)}{recentTasks.length === 0 && <p className="py-8 text-center text-sm text-muted">Aucune activité sur cette période.</p>}</div>
        </Card>

        {!isEmployee ? <Card><div className="mb-5"><h2 className="text-lg font-semibold text-ink">Performance des employés</h2><p className="mt-1 text-xs text-muted">Comparaison basée sur les tâches attribuées.</p></div><div className="space-y-4">{employeePerformance.slice(0, 8).map((employee) => <div key={employee.uid}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-ink">{employee.name || employee.email}</span><span className="font-semibold text-primary">{employee.rate}%</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${employee.rate}%` }} /></div><p className="mt-1 text-xs text-muted">{employee.done}/{employee.total} terminée(s)</p></div>)}{employeePerformance.length === 0 && <p className="py-8 text-center text-sm text-muted">Les performances apparaîtront après l’attribution de tâches.</p>}</div></Card> : <Card><div className="mb-5"><h2 className="text-lg font-semibold text-ink">Mon indicateur principal</h2><p className="mt-1 text-xs text-muted">Votre taux de réalisation sur la période.</p></div><div className="flex items-center gap-5"><div className="flex h-28 w-28 items-center justify-center rounded-full border-[12px] border-primary/15 text-2xl font-bold text-primary" style={{ borderTopColor: completionRate > 0 ? "var(--theme-primary, #1F3A5F)" : undefined }}>{completionRate}%</div><div><p className="font-medium text-ink">{completed} tâche(s) réalisée(s)</p><p className="mt-1 text-sm text-muted">{pending} tâche(s) restante(s)</p><p className="mt-3 text-xs text-muted">Cet indicateur vous aide à suivre votre propre progression.</p></div></div></Card>}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, helper, tone }) {
  const tones = { primary: "bg-primary/10 text-primary", success: "bg-emerald-500/10 text-emerald-600", warning: "bg-amber-500/10 text-amber-600", danger: "bg-red-500/10 text-red-600", info: "bg-sky-500/10 text-sky-600" };
  return <Card className="relative overflow-hidden"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone] || tones.primary}`}>{icon}</div><p className="text-sm text-muted">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-ink">{value}</p><p className="mt-2 text-xs text-muted">{helper}</p></Card>;
}

