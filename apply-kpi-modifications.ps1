$ErrorActionPreference = "Stop"

Write-Host "Application des modifications KPI / Projets / Equipes / Taches..." -ForegroundColor Cyan

# ============================================================
# 1. TaskEditorDialog.jsx
# ============================================================
@"
import { useEffect, useState } from "react";
import Dialog from "../ui/dialog";
import Button from "../ui/Button";
import Input from "../ui/input";
import Textarea from "../ui/textarea";

const EMPTY_FORM = {
  title: "",
  description: "",
  assigneeId: "",
  projectId: "",
  sectionId: "",
  priority: "MEDIUM",
  deadline: "",
  estimatePoints: 1,
};

const PRIORITIES = [
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

export default function TaskEditorDialog({
  open,
  onClose,
  onSubmit,
  title = "Nouvelle tâche",
  submitLabel = "Enregistrer",
  initialValues = EMPTY_FORM,
  assignees = [],
  projects = [],
  sections = [],
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY_FORM,
        ...initialValues,
        title: initialValues?.title || "",
        description: initialValues?.description || "",
        assigneeId: initialValues?.assigneeId || "",
        projectId: initialValues?.projectId || "",
        sectionId: initialValues?.sectionId || "",
        priority: initialValues?.priority || "MEDIUM",
        deadline: initialValues?.deadline
          ? String(initialValues.deadline).slice(0, 10)
          : "",
        estimatePoints: initialValues?.estimatePoints || 1,
      });
    }
  }, [open, initialValues]);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      estimatePoints: Number(form.estimatePoints || 1),
    };

    onSubmit?.(payload);
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="task-title"
          label="Titre"
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Ex. Ranger la zone de stockage"
          required
        />

        <div>
          <label
            className="block text-sm font-medium mb-1.5 text-ink/70"
            htmlFor="task-description"
          >
            Description
          </label>

          <Textarea
            id="task-description"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            rows={4}
            placeholder="Décris précisément le travail attendu."
          />
        </div>

        {assignees.length > 0 && (
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-ink/70"
              htmlFor="task-assignee"
            >
              Employé destinataire
            </label>

            <select
              id="task-assignee"
              value={form.assigneeId}
              onChange={(event) => update("assigneeId", event.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Choisir un employé</option>

              {assignees.map((assignee) => (
                <option key={assignee.uid} value={assignee.uid}>
                  {assignee.name || assignee.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-ink/70"
              htmlFor="task-project"
            >
              Projet
            </label>

            <select
              id="task-project"
              value={form.projectId}
              onChange={(event) => update("projectId", event.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Sans projet</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {sections.length > 0 && (
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-ink/70"
              htmlFor="task-section"
            >
              Section
            </label>

            <select
              id="task-section"
              value={form.sectionId}
              onChange={(event) => update("sectionId", event.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Choisir une section</option>

              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-ink/70"
              htmlFor="task-priority"
            >
              Priorité
            </label>

            <select
              id="task-priority"
              value={form.priority}
              onChange={(event) => update("priority", event.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="task-estimate"
            label="Points / charge"
            type="number"
            min="1"
            value={form.estimatePoints}
            onChange={(event) => update("estimatePoints", event.target.value)}
          />
        </div>

        <Input
          id="task-deadline"
          label="Échéance"
          type="date"
          value={form.deadline}
          onChange={(event) => update("deadline", event.target.value)}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>

          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
"@ | Set-Content "src\components\tasks\TaskEditorDialog.jsx" -Encoding UTF8


# ============================================================
# 2. TaskDetailsDialog.jsx
# ============================================================
@"
import Dialog from "../ui/dialog";
import Button from "../ui/Button";
import Badge from "../ui/badge";
import {
  formatTaskDate,
  getTaskDisplayDate,
  getTaskStatusColor,
  getTaskStatusLabel,
  getTaskTimelineLabel,
  getTaskTimelineTone,
} from "../../utils/getTaskDisplayStatus";

export default function TaskDetailsDialog({
  open,
  onClose,
  task,
  onEdit,
  onValidate,
  onMoveUp,
  onMoveDown,
  allowEdit = false,
  allowValidate = false,
  allowReorder = false,
  title = "Détails de la tâche",
}) {
  if (!task) return null;

  const projectName =
    task.projectName ||
    task.project?.name ||
    task.project?.title ||
    "Sans projet";

  const sectionName =
    task.sectionName ||
    task.section?.name ||
    "Sans section";

  const teamName =
    task.teamName ||
    task.team?.name ||
    "Sans équipe";

  const priorityLabels = {
    LOW: "Basse",
    MEDIUM: "Moyenne",
    HIGH: "Haute",
    URGENT: "Urgente",
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-3xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-display text-ink">{task.title}</h3>

            <p className="mt-1 text-sm text-muted">
              {task.description || "Aucune description."}
            </p>
          </div>

          <Badge tone={getTaskTimelineTone(task)}>
            {getTaskTimelineLabel(task)}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoLine
            label="Statut"
            value={
              <Badge className={"border " + getTaskStatusColor(task.status)}>
                {getTaskStatusLabel(task.status)}
              </Badge>
            }
          />

          <InfoLine
            label="Assigné à"
            value={task.assigneeName || task.assigneeId || "Non assignée"}
          />

          <InfoLine label="Projet" value={projectName} />
          <InfoLine label="Équipe" value={teamName} />
          <InfoLine label="Section" value={sectionName} />

          <InfoLine
            label="Priorité"
            value={priorityLabels[task.priority] || task.priority || "Moyenne"}
          />

          <InfoLine
            label="Charge"
            value={
              task.estimatePoints
                ? String(task.estimatePoints) + " point(s)"
                : "1 point"
            }
          />

          <InfoLine
            label="Échéance"
            value={
              task.deadline
                ? formatTaskDate(task.deadline)
                : "Sans échéance"
            }
          />

          <InfoLine
            label={
              task.status === "COMPLETED"
                ? "Date de réalisation"
                : "Date de création"
            }
            value={formatTaskDate(getTaskDisplayDate(task))}
          />

          <InfoLine
            label="Ordre"
            value={
              Number.isFinite(Number(task.sortOrder))
                ? String(task.sortOrder)
                : "—"
            }
          />
        </div>

        <div className="rounded-xl border border-line bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                Contribution KPI
              </p>

              <p className="mt-1 text-sm font-medium text-ink">
                {task.status === "COMPLETED" || task.status === "VALIDATED"
                  ? "100% — tâche validée"
                  : "0% — tâche non validée"}
              </p>
            </div>

            <span className="text-lg font-bold text-primary">
              {task.status === "COMPLETED" || task.status === "VALIDATED"
                ? "100%"
                : "0%"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {allowEdit && (
              <Button variant="outline" onClick={() => onEdit?.(task)}>
                Modifier
              </Button>
            )}

            {allowValidate &&
              task.status !== "COMPLETED" &&
              task.status !== "VALIDATED" && (
                <Button onClick={() => onValidate?.(task)}>
                  Valider
                </Button>
              )}
          </div>

          {allowReorder && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMoveUp?.(task)}
              >
                Monter
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onMoveDown?.(task)}
              >
                Descendre
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
"@ | Set-Content "src\components\tasks\TaskDetailsDialog.jsx" -Encoding UTF8


# ============================================================
# 3. Projects.jsx
# ============================================================
@"
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaProjectDiagram } from "react-icons/fa";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Button from "../components/ui/Button";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function getProjectProgress(project) {
  if (typeof project.progress === "number") {
    return Math.round(project.progress);
  }

  const tasks = project.tasks || [];
  if (!tasks.length) return 0;

  const validated = tasks.filter(
    (task) => task.status === "COMPLETED" || task.status === "VALIDATED"
  ).length;

  return Math.round((validated / tasks.length) * 100);
}

export default function Projects() {
  const { profile } = useAuth();
  const canCreate = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(profile?.role);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/projects")
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const projectCards = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        calculatedProgress: getProjectProgress(project),
      })),
    [projects]
  );

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
            Organisation
          </p>

          <Title as="h1" variant="page">
            Projets
          </Title>

          <p className="text-sm text-muted">
            Suivez le périmètre, les équipes, les sections et la progression
            validée par les tâches.
          </p>
        </div>

        {canCreate && (
          <Link to="/projets/nouveau">
            <Button>
              <FaPlus />
              Nouveau projet
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <Card className="mt-6 border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-48 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projectCards.map((project) => {
            const progress = project.calculatedProgress;
            const taskCount =
              project.taskCount ??
              project.tasks?.length ??
              0;

            const validatedTaskCount =
              project.validatedTaskCount ??
              project.tasks?.filter(
                (task) =>
                  task.status === "COMPLETED" ||
                  task.status === "VALIDATED"
              ).length ??
              0;

            return (
              <Link key={project.id} to={"/projets/" + project.id}>
                <Card className="h-full bg-white transition hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FaProjectDiagram />
                    </span>

                    <span className="rounded-full bg-surface-2 px-2 py-1 text-[10px] font-bold">
                      {project.status}
                    </span>
                  </div>

                  <h2 className="mt-4 text-base font-bold text-ink">
                    {project.name}
                  </h2>

                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {project.objective ||
                      project.description ||
                      "Aucun objectif renseigné."}
                  </p>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {progress}%
                      </p>

                      <p className="text-[11px] text-muted">
                        progression validée
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-muted">
                      <p>
                        {validatedTaskCount}/{taskCount} tâches
                      </p>

                      <p>
                        {project.kpis?.overdue ||
                          project.overdueTaskCount ||
                          0}{" "}
                        retard
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: progress + "%" }}
                    />
                  </div>
                </Card>
              </Link>
            );
          })}

          {!projects.length && (
            <Card className="py-16 text-center text-sm text-muted md:col-span-2 xl:col-span-3">
              Aucun projet disponible.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
"@ | Set-Content "src\pages\Projects.jsx" -Encoding UTF8


# ============================================================
# 4. EmployeeTaskDetail.jsx
# ============================================================
@"
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
  { value: "COMPLETED", label: "Faites" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "CANCELLED", label: "Annulées" },
];

function isValidated(task) {
  return task.status === "COMPLETED" || task.status === "VALIDATED";
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
    api.get("/employees").then(setEmployees).catch(() => setEmployees([]));
    api.get("/tasks").then(setTasks).catch(() => setTasks([]));
  }, []);

  const employee = useMemo(
    () => employees.find((item) => item.uid === employeeId),
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
    const validated = employeeTasks.filter(isValidated).length;

    const effort = employeeTasks.reduce(
      (total, task) => total + Number(task.estimatePoints || 1),
      0
    );

    const completedEffort = employeeTasks
      .filter(isValidated)
      .reduce(
        (total, task) => total + Number(task.estimatePoints || 1),
        0
      );

    const overdue = employeeTasks.filter((task) => {
      if (!task.deadline || isValidated(task)) return false;
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
    if (statusFilter === "ALL") return employeeTasks;

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
        ([dateA], [dateB]) => dateB.localeCompare(dateA)
      ),
    [historyGroups]
  );

  async function reloadTasks() {
    const freshTasks = await api.get("/tasks");
    setTasks(freshTasks);
  }

  async function moveTask(task, direction) {
    const ordered = sortTasksByDisplayOrder(employeeTasks);
    const index = ordered.findIndex((item) => item.id === task.id);

    const target =
      direction === "up"
        ? ordered[index - 1]
        : ordered[index + 1];

    if (!target) return;

    const sortOrder =
      direction === "up"
        ? Number(target.sortOrder || 0) + 1
        : Number(target.sortOrder || 0) - 1;

    await api.patch(`/tasks/${task.id}/order`, { sortOrder });
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
        <p className="text-sm text-muted">Employé introuvable.</p>

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

          <Title as="h1" variant="page" className="mb-1">
            {employee.name}
          </Title>

          <p className="text-sm text-muted">
            Matricule : {employee.matricule || "—"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={viewMode === "list" ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            Liste
          </Button>

          <Button
            variant={viewMode === "cards" ? "primary" : "outline"}
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
            style={{ width: metrics.progress + "%" }}
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={tab === "tasks" ? "primary" : "outline"}
          onClick={() => setTab("tasks")}
        >
          Tâches
        </Button>

        <Button
          variant={tab === "history" ? "primary" : "outline"}
          onClick={() => setTab("history")}
        >
          Historique
        </Button>
      </div>

      <div className="mb-6 max-w-sm">
        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
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
                    {task.description || "Aucune description."}
                  </p>

                  <p className="mt-2 text-xs text-muted">
                    {formatTaskDate(getTaskDisplayDate(task))}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge tone={getTaskTimelineTone(task)}>
                    {getTaskTimelineLabel(task)}
                  </Badge>

                  <Badge
                    className={`border ${getTaskStatusColor(
                      task.status
                    )}`}
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
          {sortedHistoryGroups.map(([dateKey, dayTasks]) => {
            const isOpen = expandedDate === dateKey;
            const completed = dayTasks.filter(isValidated).length;

            return (
              <Card key={dateKey}>
                <Button
                  className="w-full text-left"
                  onClick={() =>
                    setExpandedDate(isOpen ? null : dateKey)
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">
                        {formatTaskDate(`${dateKey}T12:00:00`)}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {dayTasks.length} tâche(s) enregistrée(s)
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
                        onClick={() => setSelectedTask(task)}
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

                          <Badge
                            className={`border ${getTaskStatusColor(
                              task.status
                            )}`}
                          >
                            {getTaskStatusLabel(task.status)}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}

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
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </Card>
  );
}
"@ | Set-Content "src\pages\EmployeeTaskDetail.jsx" -Encoding UTF8


# ============================================================
# 5. ProjectDetails.jsx
# ============================================================
@"
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaPlus,
  FaUsers,
} from "react-icons/fa";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Button from "../components/ui/Button";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TaskDetailsDialog from "../components/tasks/TaskDetailsDialog";

const Progress = ({ value }) => (
  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
    <div
      className="h-full bg-primary transition-all"
      style={{
        width: `${Math.min(100, Math.max(0, value || 0))}%`,
      }}
    />
  </div>
);

function isValidated(task) {
  return (
    task.status === "COMPLETED" ||
    task.status === "VALIDATED"
  );
}

function getProgress(tasks = []) {
  if (!tasks.length) return 0;

  return Math.round(
    (tasks.filter(isValidated).length / tasks.length) * 100
  );
}

function flattenTeamTasks(team) {
  return (
    team?.sections?.flatMap((section) => section.tasks || []) || []
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile } = useAuth();

  const canManage = [
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER",
  ].includes(profile?.role);

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState({});
  const [status, setStatus] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const load = () =>
    api
      .get(`/projects/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, [id]);

  const projectMetrics = useMemo(() => {
    const teams = data?.teams || [];

    const allTasks = teams.flatMap(flattenTeamTasks);

    const fallbackTasks = data?.tasks || [];

    const tasks =
      allTasks.length > 0
        ? allTasks
        : fallbackTasks;

    return {
      tasks,
      taskCount: tasks.length,
      validated: tasks.filter(isValidated).length,
      progress: getProgress(tasks),
    };
  }, [data]);

  async function changeStatus(value) {
    setStatus(value);

    try {
      await api.patch(`/projects/${id}/status`, {
        status: value,
      });

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setStatus("");
    }
  }

  async function addTask(sectionId) {
    if (!taskTitle.trim()) return;

    setSaving(true);

    try {
      await api.post("/tasks", {
        projectId: id,
        sectionId,
        title: taskTitle.trim(),
        assigneeId: profile.uid,
        estimatePoints: 1,
      });

      setTaskTitle("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !data) {
    return (
      <Card className="border-red-200 bg-red-50 text-red-700">
        {error}
      </Card>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-12 w-1/3 rounded bg-surface-2" />
        <div className="mt-6 h-96 rounded-2xl bg-surface-2" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <button
        onClick={() => nav("/projets")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <FaArrowLeft />
        Projets
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
              {data.status}
            </span>

            <span className="text-xs text-muted">
              v{data.version || 1}
            </span>
          </div>

          <Title as="h1" variant="page" className="mt-2">
            {data.name}
          </Title>

          <p className="mt-1 max-w-3xl text-sm text-muted">
            {data.objective || data.description}
          </p>
        </div>

        {canManage && (
          <select
            value={data.status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={!!status}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
          >
            <option>DRAFT</option>
            <option>PLANNED</option>
            <option>ACTIVE</option>
            <option>PAUSED</option>
            <option>COMPLETED</option>
            <option>ARCHIVED</option>
            <option>CANCELLED</option>
          </select>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white">
          <p className="text-xs text-muted">Progression validée</p>

          <p className="mt-2 text-3xl font-bold text-primary">
            {projectMetrics.progress}%
          </p>

          <div className="mt-3">
            <Progress value={projectMetrics.progress} />
          </div>

          <p className="mt-2 text-xs text-muted">
            {projectMetrics.validated}/{projectMetrics.taskCount} tâches
          </p>
        </Card>

        <Card className="bg-white">
          <p className="text-xs text-muted">Tâches</p>

          <p className="mt-2 text-3xl font-bold">
            {projectMetrics.taskCount}
          </p>

          <p className="text-xs text-muted">
            dans le périmètre du projet
          </p>
        </Card>

        <Card className="bg-white">
          <p className="text-xs text-muted">Équipes</p>

          <p className="mt-2 text-3xl font-bold">
            {data.teams?.length || 0}
          </p>

          <FaUsers className="mt-2 text-primary" />
        </Card>

        <Card className="bg-white">
          <p className="text-xs text-muted">Échéance</p>

          <p className="mt-2 text-base font-bold">
            {data.plannedEndDate
              ? new Date(data.plannedEndDate).toLocaleDateString("fr-FR")
              : "Non définie"}
          </p>

          <FaClock className="mt-2 text-amber-500" />
        </Card>
      </div>

      <div className="mt-6 space-y-5">
        {data.teams?.map((team) => {
          const teamTasks = flattenTeamTasks(team);
          const teamProgress = getProgress(teamTasks);

          return (
            <Card key={team.id} className="bg-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-primary" />

                    <h2 className="font-bold">{team.name}</h2>
                  </div>

                  <p className="mt-1 text-xs text-muted">
                    Poids projet : {team.weight ?? 0}%
                  </p>
                </div>

                <div className="min-w-[180px]">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">
                      Progression équipe
                    </span>

                    <span className="font-bold text-primary">
                      {teamProgress}%
                    </span>
                  </div>

                  <div className="mt-2">
                    <Progress value={teamProgress} />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {team.sections?.map((section) => {
                  const sectionTasks = section.tasks || [];
                  const sectionProgress = getProgress(sectionTasks);

                  return (
                    <div
                      key={section.id}
                      className="rounded-xl border border-line"
                    >
                      <button
                        onClick={() =>
                          setOpen((current) => ({
                            ...current,
                            [section.id]: !current[section.id],
                          }))
                        }
                        className="flex w-full items-center justify-between gap-4 p-4 text-left"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {open[section.id] ? (
                            <FaChevronDown />
                          ) : (
                            <FaChevronRight />
                          )}

                          <div className="min-w-0">
                            <p className="text-sm font-bold">
                              {section.name}
                            </p>

                            <p className="text-xs text-muted">
                              Poids : {section.weight ?? 0}% ·{" "}
                              {sectionTasks.length} tâche(s)
                            </p>
                          </div>
                        </div>

                        <div className="w-32 shrink-0">
                          <div className="mb-1 flex justify-between text-[10px]">
                            <span className="text-muted">
                              Progression
                            </span>

                            <span className="font-bold text-primary">
                              {sectionProgress}%
                            </span>
                          </div>

                          <Progress value={sectionProgress} />
                        </div>
                      </button>

                      {open[section.id] && (
                        <div className="border-t border-line p-4">
                          <div className="space-y-2">
                            {sectionTasks.map((task) => (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => setSelectedTask(task)}
                                className="flex w-full flex-col gap-2 rounded-lg bg-surface-2 p-3 text-left transition hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold">
                                    {task.title}
                                  </p>

                                  <p className="text-xs text-muted">
                                    {task.status} ·{" "}
                                    {task.estimatePoints || 1} point(s) ·{" "}
                                    {task.assigneeName ||
                                      task.assigneeId ||
                                      "Non assignée"}
                                  </p>
                                </div>

                                {isValidated(task) ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                    <FaCheck />
                                    Validée · 100%
                                  </span>
                                ) : task.blocked ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                                    <FaExclamationTriangle />
                                    Bloquée · 0%
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted">
                                    {task.deadline
                                      ? new Date(
                                          task.deadline
                                        ).toLocaleDateString("fr-FR")
                                      : "Sans échéance"}{" "}
                                    · 0%
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>

                          {canManage && (
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                              <input
                                value={taskTitle}
                                onChange={(e) =>
                                  setTaskTitle(e.target.value)
                                }
                                className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm"
                                placeholder="Ajouter une tâche à cette section"
                              />

                              <Button
                                onClick={() => addTask(section.id)}
                                disabled={
                                  saving || !taskTitle.trim()
                                }
                              >
                                <FaPlus />
                                Ajouter
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {!data.teams?.length && (
          <Card className="bg-white py-16 text-center text-sm text-muted">
            Aucune équipe n'est encore rattachée à ce projet.
          </Card>
        )}
      </div>

      <div className="mt-6">
        <Link
          to={`/projets/${id}/analytics`}
          className="text-sm font-semibold text-primary"
        >
          Voir l'analyse détaillée du projet →
        </Link>
      </div>

      <TaskDetailsDialog
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        title="Détails de la tâche"
      />
    </div>
  );
}
"@ | Set-Content "src\pages\ProjectDetails.jsx" -Encoding UTF8


# ============================================================
# 6. Teams.jsx
# ============================================================
@"
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Alert from "../components/ui/alert";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";
import Dialog from "../components/ui/dialog";

function getTeamProgress(team) {
  const sections = team.sections || [];

  const tasks = sections.flatMap(
    (section) => section.tasks || []
  );

  if (tasks.length === 0) {
    return Number(team.progress || 0);
  }

  const validated = tasks.filter(
    (task) =>
      task.status === "COMPLETED" ||
      task.status === "VALIDATED"
  ).length;

  return Math.round((validated / tasks.length) * 100);
}

export default function Teams() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [teamMembersModalOpen, setTeamMembersModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    department: "",
    leaderId: "",
    memberIds: [],
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    api
      .get("/teams")
      .then(setTeams)
      .catch(() => setTeams([]));

    api
      .get("/employees")
      .then(setUsers)
      .catch(() => setUsers([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/teams", form);

      setSuccess("Équipe créée avec succès.");

      setForm({
        name: "",
        department: "",
        leaderId: "",
        memberIds: [],
      });

      load();
    } catch (err) {
      setError(
        err.message || "Impossible de créer l'équipe."
      );
    } finally {
      setLoading(false);
    }
  }

  const overdueTeams = useMemo(
    () => teams.filter((team) => team.deadlineReached),
    [teams]
  );

  function openLeaderModal(team) {
    setSelectedTeam(team);

    setForm((current) => ({
      ...current,
      leaderId: team?.leaderId || "",
    }));

    setLeaderModalOpen(true);
  }

  function openTeamMembers(team) {
    setSelectedTeam(team);
    setTeamMembersModalOpen(true);
  }

  function toggleMember(memberId) {
    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId)
        ? current.memberIds.filter((id) => id !== memberId)
        : [...current.memberIds, memberId],
    }));
  }

  return (
    <div>
      <Title as="h1" variant="page" className="mb-1">
        {t("teamsAndDepartments")}
      </Title>

      <p className="mb-8 text-sm text-muted">
        {t("teamsDescription")}
      </p>

      {profile?.role !== "EMPLOYEE" && (
        <Card className="mb-8">
          <form
            onSubmit={handleCreate}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="w-52">
              <Input
                id="team-name"
                label={t("teamName")}
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-sm font-medium text-ink/70">
                {t("teamMembers")}
              </p>

              <div className="max-h-28 overflow-y-auto rounded-xl border border-line bg-surface-2 p-2">
                {users.length > 0 ? (
                  users.map((user) => (
                    <label
                      key={user.uid}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface"
                    >
                      <input
                        type="checkbox"
                        checked={form.memberIds.includes(user.uid)}
                        onChange={() => toggleMember(user.uid)}
                        className="rounded border-line text-primary focus:ring-primary"
                      />

                      <span className="truncate">
                        {user.name || user.email}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="px-2 py-1 text-xs text-muted">
                    Aucun membre disponible.
                  </p>
                )}
              </div>
            </div>

            <div className="w-52">
              <Input
                id="team-dept"
                label={t("department")}
                value={form.department}
                onChange={(e) =>
                  setForm({
                    ...form,
                    department: e.target.value,
                  })
                }
              />
            </div>

            <div className="w-52">
              <label className="mb-1.5 block text-sm font-medium text-ink/70">
                {t("leader")}
              </label>

              <Button
                type="button"
                variant="outline"
                onClick={() => openLeaderModal(null)}
              >
                {form.leaderId
                  ? t("changeLeader")
                  : t("chooseLeader")}
              </Button>
            </div>

            <Button type="submit" loading={loading}>
              {t("createTeam")}
            </Button>
          </form>

          {success && (
            <Alert type="success" className="mt-4">
              {success}
            </Alert>
          )}

          {error && (
            <Alert type="danger" className="mt-4">
              {error}
            </Alert>
          )}
        </Card>
      )}

      <Card className="mb-6">
        <p className="text-sm font-medium text-ink">
          {t("deadlineAlert")}
        </p>

        <p className="mt-1 text-sm text-muted">
          {overdueTeams.length > 0
            ? `${overdueTeams.length} équipe(s) présentent un retard ou un livrable non respecté.`
            : t("noOverdueTeams")}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => {
          const progress = getTeamProgress(team);

          return (
            <Button
              key={team.id}
              type="button"
              onClick={() => openTeamMembers(team)}
              className="rounded-xl border border-line bg-surface p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {team.name}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Département : {team.department || "—"}
                  </p>
                </div>

                <Badge
                  tone={
                    team.deadlineReached
                      ? "warning"
                      : "success"
                  }
                >
                  {team.deadlineReached
                    ? "Retard"
                    : "À l'heure"}
                </Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">
                    Progression tâches
                  </span>

                  <span className="font-bold text-primary">
                    {progress}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>
                  {team.memberIds?.length || 0} membre(s)
                </span>

                <span className="text-primary">
                  {t("viewMembers")}
                </span>
              </div>
            </Button>
          );
        })}

        {teams.length === 0 && (
          <p className="text-sm text-muted">
            {t("noTeams")}
          </p>
        )}
      </div>

      <Dialog
        open={leaderModalOpen}
        onClose={() => setLeaderModalOpen(false)}
        title={t("chooseLeader")}
      >
        <div className="space-y-3">
          {users.map((user) => (
            <Button
              key={user.uid}
              type="button"
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  leaderId: user.uid,
                }));

                setLeaderModalOpen(false);
              }}
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface"
            >
              <p className="font-medium">
                {user.name || user.email || user.uid}
              </p>

              <p className="text-xs text-muted">
                {user.role} · {user.email}
              </p>
            </Button>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={teamMembersModalOpen}
        onClose={() => setTeamMembersModalOpen(false)}
        title={selectedTeam?.name || "Équipe"}
      >
        <div className="space-y-3">
          {(selectedTeam?.memberIds || []).length > 0 ? (
            selectedTeam.memberIds.map((memberId) => {
              const member = users.find(
                (user) => user.uid === memberId
              );

              return (
                <div
                  key={memberId}
                  className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink"
                >
                  <p className="font-medium">
                    {member?.name ||
                      member?.email ||
                      memberId}
                  </p>

                  <p className="text-xs text-muted">
                    {member?.role || "Membre"}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted">
              Aucun membre renseigné pour cette équipe.
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
"@ | Set-Content "src\pages\Teams.jsx" -Encoding UTF8


# ============================================================
# 7. Tasks.jsx
# ============================================================
@"
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Select from "../components/ui/select";
import Textarea from "../components/ui/textarea";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";
import TaskEditorDialog from "../components/tasks/TaskEditorDialog";
import TaskDetailsDialog from "../components/tasks/TaskDetailsDialog";
import {
  formatTaskDate,
  getTaskStatusColor,
  getTaskStatusLabel,
  getTaskTimelineLabel,
  getTaskTimelineTone,
  getTaskDisplayDate,
  sortTasksByDisplayOrder,
} from "../utils/getTaskDisplayStatus";

const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

export default function Tasks() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const role = profile?.role;
  const isEmployee = role === "EMPLOYEE";
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [superCreateOpen, setSuperCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [managerForm, setManagerForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    priority: "MEDIUM",
    projectId: "",
    deadline: "",
    estimatePoints: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [
        loadedTasks,
        loadedProjects,
        loadedEmployees,
      ] = await Promise.all([
        api.get("/tasks").catch(() => []),
        api.get("/projects").catch(() => []),
        api.get("/employees").catch(() => []),
      ]);

      setTasks(loadedTasks || []);
      setProjects(loadedProjects || []);
      setEmployees(loadedEmployees || []);
    } catch {
      setTasks([]);
      setProjects([]);
      setEmployees([]);
    }
  }

  const orderedTasks = useMemo(
    () => sortTasksByDisplayOrder(tasks),
    [tasks]
  );

  const employeeTasks = useMemo(
    () =>
      orderedTasks.filter(
        (task) => task.assigneeId === profile?.uid
      ),
    [orderedTasks, profile?.uid]
  );

  async function handleCreateEmployeeTask(values) {
    setLoading(true);

    try {
      await api.post("/tasks", values);
      setCreateOpen(false);
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  async function handleEditEmployeeTask(values) {
    if (!editTask) return;

    setLoading(true);

    try {
      await api.patch(`/tasks/${editTask.id}`, values);
      setEditTask(null);
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateTask(task) {
    await api.patch(`/tasks/${task.id}/status`, {
      status: "COMPLETED",
    });

    setActiveMenuTaskId(null);
    await loadData();
  }

  async function handleManagerCreate(event) {
    event.preventDefault();

    if (!managerForm.title || !managerForm.assigneeId) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/tasks", {
        ...managerForm,
        estimatePoints: Number(managerForm.estimatePoints || 1),
      });

      setManagerForm({
        title: "",
        description: "",
        assigneeId: "",
        priority: "MEDIUM",
        projectId: "",
        deadline: "",
        estimatePoints: 1,
      });

      await loadData();
    } finally {
      setLoading(false);
    }
  }

  async function handleSuperAdminCreate(values) {
    setLoading(true);

    try {
      await api.post("/tasks", {
        ...values,
        priority: values.priority || "MEDIUM",
        estimatePoints: Number(values.estimatePoints || 1),
      });

      setSuperCreateOpen(false);
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  if (isEmployee) {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Title as="h1" variant="page" className="mb-1">
              {t("tasks")}
            </Title>

            <p className="text-sm text-muted">
              {t("taskDescription")}
            </p>
          </div>

          <Button
            className="shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            {t("add")}
          </Button>
        </div>

        <div className="space-y-3">
          {employeeTasks.map((task) => (
            <Card
              key={task.id}
              className="relative cursor-pointer hover:border-primary/30"
              onClick={() =>
                setActiveMenuTaskId(
                  activeMenuTaskId === task.id
                    ? null
                    : task.id
                )
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">
                    {task.title}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    {task.description || t("noDescription")}
                  </p>

                  <p className="mt-2 text-xs text-muted">
                    {formatTaskDate(
                      getTaskDisplayDate(task)
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge tone={getTaskTimelineTone(task)}>
                    {getTaskTimelineLabel(task)}
                  </Badge>

                  <Badge
                    className={`border ${getTaskStatusColor(
                      task.status
                    )}`}
                  >
                    {getTaskStatusLabel(task.status)}
                  </Badge>
                </div>
              </div>

              {activeMenuTaskId === task.id && (
                <div
                  className="absolute right-4 top-4 z-10 w-44 rounded-xl border border-line bg-surface p-2 shadow-xl"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <Button
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditTask(task);
                      setActiveMenuTaskId(null);
                    }}
                  >
                    {t("edit")}
                  </Button>

                  <Button
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleValidateTask(task);
                    }}
                    disabled={task.status === "COMPLETED"}
                  >
                    {t("validate")}
                  </Button>
                </div>
              )}
            </Card>
          ))}

          {employeeTasks.length === 0 && (
            <p className="text-sm text-muted">
              {t("noTasks")}
            </p>
          )}
        </div>

        <TaskEditorDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateEmployeeTask}
          title={t("addTask")}
          submitLabel={t("create")}
          projects={projects}
          loading={loading}
        />

        <TaskEditorDialog
          open={!!editTask}
          onClose={() => setEditTask(null)}
          onSubmit={handleEditEmployeeTask}
          title={t("editTask")}
          submitLabel={t("save")}
          initialValues={editTask || undefined}
          projects={projects}
          loading={loading}
        />
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div>
        <div className="mb-6">
          <Title as="h1" variant="page" className="mb-1">
            {t("tasks")}
          </Title>

          <p className="text-sm text-muted">
            {t("selectEmployeeTasks")}
          </p>
        </div>

        <div className="mb-4 flex justify-end">
          <Button onClick={() => setSuperCreateOpen(true)}>
            {t("createTask")}
          </Button>
        </div>

        <TaskEditorDialog
          open={superCreateOpen}
          onClose={() => setSuperCreateOpen(false)}
          onSubmit={handleSuperAdminCreate}
          title={t("createTaskForEmployee")}
          submitLabel={t("assignTask")}
          assignees={employees}
          projects={projects}
          loading={loading}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <Link
              key={employee.uid}
              to={`/taches/employe/${employee.uid}`}
            >
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      {employee.name}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Matricule :{" "}
                      {employee.matricule || "—"}
                    </p>
                  </div>

                  <Badge
                    tone={
                      employee.role === "MANAGER"
                        ? "info"
                        : "neutral"
                    }
                  >
                    {employee.role}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}

          {employees.length === 0 && (
            <p className="text-sm text-muted">
              {t("noEmployeesFound")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Title as="h1" variant="page" className="mb-1">
          {t("tasks")}
        </Title>

        <p className="text-sm text-muted">
          {t("manageTasks")}
        </p>
      </div>

      <Card className="mb-8">
        <form
          onSubmit={handleManagerCreate}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <Input
            id="title"
            label={t("title")}
            value={managerForm.title}
            onChange={(event) =>
              setManagerForm({
                ...managerForm,
                title: event.target.value,
              })
            }
            placeholder="Nouvelle tâche"
            required
          />

          <div className="md:col-span-2">
            <label
              className="mb-1.5 block text-sm font-medium text-ink/70"
              htmlFor="description"
            >
              {t("description")}
            </label>

            <Textarea
              id="description"
              value={managerForm.description}
              onChange={(event) =>
                setManagerForm({
                  ...managerForm,
                  description: event.target.value,
                })
              }
              placeholder="Décris rapidement la tâche"
              rows={4}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">
              {t("employee")}
            </label>

            <Select
              value={managerForm.assigneeId}
              onChange={(event) =>
                setManagerForm({
                  ...managerForm,
                  assigneeId: event.target.value,
                })
              }
              options={[
                {
                  value: "",
                  label: t("employeeChoice"),
                },
                ...employees.map((employee) => ({
                  value: employee.uid,
                  label: employee.name,
                })),
              ]}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">
              {t("priority")}
            </label>

            <Select
              value={managerForm.priority}
              onChange={(event) =>
                setManagerForm({
                  ...managerForm,
                  priority: event.target.value,
                })
              }
              options={PRIORITY_OPTIONS}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">
              {t("project")}
            </label>

            <Select
              value={managerForm.projectId}
              onChange={(event) =>
                setManagerForm({
                  ...managerForm,
                  projectId: event.target.value,
                })
              }
              options={[
                {
                  value: "",
                  label: t("withoutProject"),
                },
                ...projects.map((project) => ({
                  value: project.id,
                  label: project.name,
                })),
              ]}
            />
          </div>

          <Input
            id="deadline"
            label="Échéance"
            type="date"
            value={managerForm.deadline}
            onChange={(event) =>
              setManagerForm({
                ...managerForm,
                deadline: event.target.value,
              })
            }
          />

          <Input
            id="estimatePoints"
            label="Points / charge"
            type="number"
            min="1"
            value={managerForm.estimatePoints}
            onChange={(event) =>
              setManagerForm({
                ...managerForm,
                estimatePoints: event.target.value,
              })
            }
          />

          <div className="xl:col-span-3">
            <Button type="submit" loading={loading}>
              {t("create")}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {orderedTasks.map((task) => (
          <Card
            key={task.id}
            className="cursor-pointer hover:border-primary/30"
            onClick={() => setSelectedTask(task)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">
                  {task.title}
                </p>

                <p className="mt-1 text-sm text-muted">
                  {t("assignedTo")}{" "}
                  {task.assigneeName || task.assigneeId}
                </p>

                {task.projectName && (
                  <p className="text-xs text-muted">
                    {t("project")} : {task.projectName}
                  </p>
                )}

                {task.sectionName && (
                  <p className="text-xs text-muted">
                    Section : {task.sectionName}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted">
                  {formatTaskDate(
                    getTaskDisplayDate(task)
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge tone={getTaskTimelineTone(task)}>
                  {getTaskTimelineLabel(task)}
                </Badge>

                <Badge
                  className={`border ${getTaskStatusColor(
                    task.status
                  )}`}
                >
                  {getTaskStatusLabel(task.status)}
                </Badge>

                <div
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  onMouseDown={(event) =>
                    event.stopPropagation()
                  }
                  onKeyDown={(event) =>
                    event.stopPropagation()
                  }
                >
                  <Select
                    value={task.status}
                    onChange={(event) =>
                      api
                        .patch(`/tasks/${task.id}/status`, {
                          status: event.target.value,
                        })
                        .then(loadData)
                    }
                    className="!w-auto text-xs"
                    options={TASK_STATUSES.map(
                      (taskStatus) => ({
                        value: taskStatus,
                        label:
                          getTaskStatusLabel(
                            taskStatus
                          ),
                      })
                    )}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}

        {orderedTasks.length === 0 && (
          <p className="text-sm text-muted">
            {t("noTasks")}
          </p>
        )}
      </div>

      <TaskDetailsDialog
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        title={t("taskDetails")}
      />
    </div>
  );
}
"@ | Set-Content "src\pages\Tasks.jsx" -Encoding UTF8


Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "MODIFICATIONS APPLIQUEES AVEC SUCCES" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "7 fichiers modifies :" -ForegroundColor Cyan
Write-Host " - Tasks.jsx"
Write-Host " - EmployeeTaskDetail.jsx"
Write-Host " - Projects.jsx"
Write-Host " - ProjectDetails.jsx"
Write-Host " - Teams.jsx"
Write-Host " - TaskEditorDialog.jsx"
Write-Host " - TaskDetailsDialog.jsx"
Write-Host ""
Write-Host "Lancement de la verification Vite..." -ForegroundColor Cyan
npm run build
