import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";
import Button from "../components/ui/Button";
import Select from "../components/ui/select";
import TaskDetailsDialog from "../components/tasks/TaskDetailsDialog";
import {
  formatTaskDate,
  getTaskDisplayDate,
  getTaskDateKey,
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
  { value: "COMPLETED", label: "Faites" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "CANCELLED", label: "Annulées" },
];

function isValidated(task) {
  return (
    task.status === "COMPLETED" ||
    task.status === "VALIDATED"
  );
}

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
    api
      .get("/employees")
      .then(setEmployees)
      .catch(() => setEmployees([]));

    api
      .get("/tasks")
      .then(setTasks)
      .catch(() => setTasks([]));
  }, []);

  const employee = useMemo(
    () =>
      employees.find(
        (item) => item.uid === employeeId
      ),
    [employees, employeeId]
  );

  const employeeTasks = useMemo(
    () =>
      sortTasksByDisplayOrder(tasks).filter(
        (task) => task.assigneeId === employeeId
      ),
    [tasks, employeeId]
  );

  const metrics = useMemo(() => {
    const assigned = employeeTasks.length;
    const validated =
      employeeTasks.filter(isValidated).length;

    const effort = employeeTasks.reduce(
      (total, task) =>
        total + Number(task.estimatePoints || 1),
      0
    );

    const completedEffort = employeeTasks
      .filter(isValidated)
      .reduce(
        (total, task) =>
          total + Number(task.estimatePoints || 1),
        0
      );

    const overdue = employeeTasks.filter((task) => {
      if (!task.deadline || isValidated(task)) {
        return false;
      }

      return new Date(task.deadline) < new Date();
    }).length;

    const progress = assigned
      ? Math.round((validated / assigned) * 100)
      : 0;

    const effortProgress = effort
      ? Math.round((completedEffort / effort) * 100)
      : 0;

    return {
      assigned,
      validated,
      effort,
      completedEffort,
      overdue,
      progress,
      effortProgress,
    };
  }, [employeeTasks]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "ALL") {
      return employeeTasks;
    }

    return employeeTasks.filter(
      (task) => task.status === statusFilter
    );
  }, [employeeTasks, statusFilter]);

  const historyTasks = useMemo(() => {
    const todayKey = getTaskDateKey(new Date());

    return filteredTasks.filter(
      (task) =>
        isValidated(task) ||
        getTaskDateKey(task.createdAt) !== todayKey
    );
  }, [filteredTasks]);

  const historyGroups = useMemo(
    () => groupTasksByCreationDate(historyTasks),
    [historyTasks]
  );

  const sortedHistoryGroups = useMemo(
    () =>
      Object.entries(historyGroups).sort(
        ([dateA], [dateB]) =>
          dateB.localeCompare(dateA)
      ),
    [historyGroups]
  );

  async function reloadTasks() {
    const freshTasks = await api.get("/tasks");
    setTasks(freshTasks);
  }

  async function moveTask(task, direction) {
    const ordered = sortTasksByDisplayOrder(employeeTasks);
    const index = ordered.findIndex(
      (item) => item.id === task.id
    );

    const target =
      direction === "up"
        ? ordered[index - 1]
        : ordered[index + 1];

    if (!target) {
      return;
    }

    const sortOrder =
      direction === "up"
        ? Number(target.sortOrder || 0) + 1
        : Number(target.sortOrder || 0) - 1;

    await api.patch(`/tasks/${task.id}/order`, {
      sortOrder,
    });

    await reloadTasks();
  }

  if (profile?.role !== "SUPER_ADMIN") {
    return (
      <Card>
        <p className="text-sm text-muted">
          Cette page est réservée au super admin.
        </p>
      </Card>
    );
  }

  if (!employee) {
    return (
      <Card>
        <p className="text-sm text-muted">
          Employé introuvable.
        </p>

        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => navigate("/taches")}
        >
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/taches")}
            >
              Retour
            </Button>

            <Badge tone="info">
              {employee.role || "EMPLOYEE"}
            </Badge>
          </div>

          <Title
            as="h1"
            variant="page"
            className="mb-1"
          >
            {employee.name}
          </Title>

          <p className="text-sm text-muted">
            Matricule : {employee.matricule || "—"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={
              viewMode === "list"
                ? "primary"
                : "outline"
            }
            size="sm"
            onClick={() => setViewMode("list")}
          >
            Liste
          </Button>

          <Button
            variant={
              viewMode === "cards"
                ? "primary"
                : "outline"
            }
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            Petits blocs
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Tâches assignées"
          value={metrics.assigned}
          detail={`${metrics.validated} validée(s)`}
        />

        <MetricCard
          label="Progression"
          value={`${metrics.progress}%`}
          detail={`${metrics.validated}/${metrics.assigned} tâches`}
        />

        <MetricCard
          label="Charge réalisée"
          value={`${metrics.effortProgress}%`}
          detail={`${metrics.completedEffort}/${metrics.effort} points`}
        />

        <MetricCard
          label="Retards"
          value={metrics.overdue}
          detail="tâche(s) hors échéance"
        />
      </div>

      <div className="mb-6 rounded-xl border border-line bg-surface-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              Progression par tâches
            </p>

            <p className="text-xs text-muted">
              Une tâche validée contribue à 100%, sinon 0%.
            </p>
          </div>

          <span className="text-lg font-bold text-primary">
            {metrics.progress}%
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${metrics.progress}%`,
            }}
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={
            tab === "tasks" ? "primary" : "outline"
          }
          onClick={() => setTab("tasks")}
        >
          Tâches
        </Button>

        <Button
          variant={
            tab === "history" ? "primary" : "outline"
          }
          onClick={() => setTab("history")}
        >
          Historique
        </Button>
      </div>

      <div className="mb-6 max-w-sm">
        <Select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          options={STATUS_FILTERS}
        />
      </div>

      {tab === "tasks" ? (
        <div
          className={
            viewMode === "cards"
              ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          }
        >
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="cursor-pointer hover:border-primary/30"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {task.title}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    {task.description ||
                      "Aucune description."}
                  </p>

                  <p className="mt-2 text-xs text-muted">
                    {formatTaskDate(
                      getTaskDisplayDate(task)
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge
                    tone={getTaskTimelineTone(task)}
                  >
                    {getTaskTimelineLabel(task)}
                  </Badge>

                  <Badge
                    className="border border-line"
                  >
                    {getTaskStatusLabel(task.status)}
                  </Badge>

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

          {filteredTasks.length === 0 && (
            <p className="text-sm text-muted">
              Aucune tâche pour cet employé.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedHistoryGroups.map(
            ([dateKey, dayTasks]) => {
              const isOpen =
                expandedDate === dateKey;

              const completed =
                dayTasks.filter(isValidated).length;

              return (
                <Card key={dateKey}>
                  <Button
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedDate(
                        isOpen ? null : dateKey
                      )
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">
                          {formatTaskDate(
                            `${dateKey}T12:00:00`
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {dayTasks.length} tâche(s)
                          enregistrée(s)
                        </p>
                      </div>

                      <Badge
                        tone={
                          completed === dayTasks.length
                            ? "success"
                            : "warning"
                        }
                      >
                        {completed}/{dayTasks.length}
                      </Badge>
                    </div>
                  </Button>

                  {isOpen && (
                    <div className="mt-4 space-y-2">
                      {dayTasks.map((task) => (
                        <Button
                          key={task.id}
                          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-left hover:border-primary/30"
                          onClick={() =>
                            setSelectedTask(task)
                          }
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-ink">
                                {task.title}
                              </p>

                              <p className="text-xs text-muted">
                                {task.description ||
                                  "Aucune description."}
                              </p>
                            </div>

                            <Badge className="border border-line">
                              {getTaskStatusLabel(
                                task.status
                              )}
                            </Badge>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
              );
            }
          )}

          {sortedHistoryGroups.length === 0 && (
            <p className="text-sm text-muted">
              Aucun historique pour cet employé.
            </p>
          )}
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

function MetricCard({ label, value, detail }) {
  return (
    <Card>
      <p className="text-xs text-muted">{label}</p>

      <p className="mt-2 text-2xl font-bold text-primary">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted">
        {detail}
      </p>
    </Card>
  );
}