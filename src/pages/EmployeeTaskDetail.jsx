import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";
import Select from "../components/ui/select";
import TaskDetailsDialog from "../components/tasks/TaskDetailsDialog";
import {
  formatTaskDate,
  getTaskDateKey,
  getTaskStatusColor,
  getTaskStatusLabel,
  getTaskTimelineLabel,
  getTaskTimelineTone,
  groupTasksByCreationDate,
  sortTasksByDisplayOrder,
} from "../utils/getTaskDisplayStatus";

const STATUS_FILTERS = [
  { value: "ALL", label: "Tous" },
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "REVIEW", label: "En révision" },
  { value: "COMPLETED", label: "Faits" },
  { value: "REJECTED", label: "Rejetés" },
  { value: "CANCELLED", label: "Annulés" },
];

export default function EmployeeTaskDetail() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [tab, setTab] = useState("tasks");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedDate, setExpandedDate] = useState(null);

  useEffect(() => {
    api.get("/employees").then(setEmployees).catch(() => setEmployees([]));
    api.get("/tasks").then(setTasks).catch(() => setTasks([]));
  }, []);

  const employee = useMemo(() => employees.find((item) => item.uid === employeeId), [employees, employeeId]);
  const employeeTasks = useMemo(() => sortTasksByDisplayOrder(tasks).filter((task) => task.assigneeId === employeeId), [tasks, employeeId]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "ALL") {
      return employeeTasks;
    }

    return employeeTasks.filter((task) => task.status === statusFilter);
  }, [employeeTasks, statusFilter]);

  const historyTasks = useMemo(() => {
    const todayKey = getTaskDateKey(new Date());
    return filteredTasks.filter((task) => task.status === "COMPLETED" || getTaskDateKey(task.createdAt) !== todayKey);
  }, [filteredTasks]);

  const historyGroups = useMemo(() => groupTasksByCreationDate(historyTasks), [historyTasks]);
  const sortedHistoryGroups = useMemo(
    () => Object.entries(historyGroups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA)),
    [historyGroups]
  );

  async function reloadTasks() {
    const freshTasks = await api.get("/tasks");
    setTasks(freshTasks);
  }

  async function moveTask(task, direction) {
    const ordered = sortTasksByDisplayOrder(employeeTasks);
    const index = ordered.findIndex((item) => item.id === task.id);
    const target = direction === "up" ? ordered[index - 1] : ordered[index + 1];
    if (!target) {
      return;
    }

    const sortOrder = direction === "up" ? Number(target.sortOrder || 0) + 1 : Number(target.sortOrder || 0) - 1;
    await api.patch(`/tasks/${task.id}/order`, { sortOrder });
    await reloadTasks();
  }

  if (profile?.role !== "SUPER_ADMIN") {
    return (
      <Card>
        <p className="text-sm text-muted">Cette page est réservée au super admin.</p>
      </Card>
    );
  }

  if (!employee) {
    return (
      <Card>
        <p className="text-sm text-muted">Employé introuvable.</p>
        <Button variant="ghost" className="mt-3" onClick={() => navigate("/taches")}>
          Retour
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/taches")}>
              Retour
            </Button>
            <Badge tone="info">{employee.role || "EMPLOYEE"}</Badge>
          </div>
          <Title as="h1" variant="page" className="mb-1">
            {employee.name}
          </Title>
          <p className="text-sm text-muted">
            {employee.department ? `${employee.department} • ` : ""}
            {employee.position || "Poste non renseigné"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={viewMode === "list" ? "primary" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            Liste
          </Button>
          <Button variant={viewMode === "cards" ? "primary" : "outline"} size="sm" onClick={() => setViewMode("cards")}>
            Petits blocs
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant={tab === "tasks" ? "primary" : "outline"} onClick={() => setTab("tasks")}>
          Tâches
        </Button>
        <Button variant={tab === "history" ? "primary" : "outline"} onClick={() => setTab("history")}>
          Historique
        </Button>
      </div>

      <div className="mb-6 max-w-sm">
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} options={STATUS_FILTERS} />
      </div>

      {tab === "tasks" ? (
        <div className={viewMode === "cards" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
          {filteredTasks.map((task) => (
            <Card key={task.id} className="cursor-pointer hover:border-primary/30" onClick={() => setSelectedTask(task)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="mt-1 text-sm text-muted">{task.description || "Aucune description."}</p>
                  <p className="mt-2 text-xs text-muted">{formatTaskDate(task.createdAt)}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge tone={getTaskTimelineTone(task)}>{getTaskTimelineLabel(task)}</Badge>
                  <Badge className={`border ${getTaskStatusColor(task.status)}`}>{getTaskStatusLabel(task.status)}</Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveTask(task, "up");
                      }}
                    >
                      Monter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveTask(task, "down");
                      }}
                    >
                      Descendre
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredTasks.length === 0 && <p className="text-sm text-muted">Aucune tâche pour cet employé.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedHistoryGroups.map(([dateKey, dayTasks]) => {
            const isOpen = expandedDate === dateKey;
            const completed = dayTasks.filter((task) => task.status === "COMPLETED").length;
            return (
              <Card key={dateKey}>
                <button className="w-full text-left" onClick={() => setExpandedDate(isOpen ? null : dateKey)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{formatTaskDate(`${dateKey}T12:00:00`)}</p>
                      <p className="mt-1 text-xs text-muted">{dayTasks.length} tâche(s) enregistrée(s)</p>
                    </div>
                    <Badge tone={completed === dayTasks.length ? "success" : "warning"}>
                      {completed}/{dayTasks.length}
                    </Badge>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-2">
                    {dayTasks.map((task) => (
                      <button
                        key={task.id}
                        className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-left hover:border-primary/30"
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-ink">{task.title}</p>
                            <p className="text-xs text-muted">{task.description || "Aucune description."}</p>
                          </div>
                          <Badge className={`border ${getTaskStatusColor(task.status)}`}>{getTaskStatusLabel(task.status)}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}

          {sortedHistoryGroups.length === 0 && <p className="text-sm text-muted">Aucun historique pour cet employé.</p>}
        </div>
      )}

      <TaskDetailsDialog
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        title={`Tâche de ${employee.name}`}
        allowReorder
        onMoveUp={(task) => moveTask(task, "up")}
        onMoveDown={(task) => moveTask(task, "down")}
      />
    </div>
  );
}
