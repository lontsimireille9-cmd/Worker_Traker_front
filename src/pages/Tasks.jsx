import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/button";
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
  sortTasksByDisplayOrder,
} from "../utils/getTaskDisplayStatus";

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "REJECTED", "CANCELLED"];
const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Basse" },
  { value: "MEDIUM", label: "Moyenne" },
  { value: "HIGH", label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

export default function Tasks() {
  const { profile } = useAuth();
  const role = profile?.role;
  const isEmployee = role === "EMPLOYEE";
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
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
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const [loadedTasks, loadedProjects, loadedEmployees] = await Promise.all([
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

  const orderedTasks = useMemo(() => sortTasksByDisplayOrder(tasks), [tasks]);
  const employeeTasks = useMemo(() => orderedTasks.filter((task) => task.assigneeId === profile?.uid), [orderedTasks, profile?.uid]);

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
    await api.patch(`/tasks/${task.id}/status`, { status: "COMPLETED" });
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
      await api.post("/tasks", managerForm);
      setManagerForm({
        title: "",
        description: "",
        assigneeId: "",
        priority: "MEDIUM",
        projectId: "",
      });
      await loadData();
    } finally {
      setLoading(false);
    }
  }

  if (isEmployee) {
    return (
      <div>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Title as="h1" variant="page" className="mb-1">
              Tâches
            </Title>
            <p className="text-sm text-muted">Ajoute les tâches que tu as réalisées pendant la journée.</p>
          </div>

          <Button onClick={() => setCreateOpen(true)}>Ajouter</Button>
        </div>

        <div className="space-y-3">
          {employeeTasks.map((task) => (
            <Card
              key={task.id}
              className="relative cursor-pointer hover:border-primary/30"
              onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="mt-1 text-sm text-muted">{task.description || "Aucune description."}</p>
                  <p className="mt-2 text-xs text-muted">{formatTaskDate(task.createdAt)}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge tone={getTaskTimelineTone(task)}>{getTaskTimelineLabel(task)}</Badge>
                  <Badge className={`border ${getTaskStatusColor(task.status)}`}>{getTaskStatusLabel(task.status)}</Badge>
                </div>
              </div>

              {activeMenuTaskId === task.id && (
                <div
                  className="absolute right-4 top-4 z-10 w-44 rounded-xl border border-line bg-surface p-2 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditTask(task);
                      setActiveMenuTaskId(null);
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleValidateTask(task);
                    }}
                    disabled={task.status === "COMPLETED"}
                  >
                    Valider
                  </button>
                </div>
              )}
            </Card>
          ))}

          {employeeTasks.length === 0 && <p className="text-sm text-muted">Aucune tâche pour le moment.</p>}
        </div>

        <TaskEditorDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateEmployeeTask}
          title="Ajouter une tâche"
          submitLabel="Créer"
          loading={loading}
        />

        <TaskEditorDialog
          open={!!editTask}
          onClose={() => setEditTask(null)}
          onSubmit={handleEditEmployeeTask}
          title="Modifier la tâche"
          submitLabel="Enregistrer"
          initialValues={editTask || undefined}
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
            Tâches
          </Title>
          <p className="text-sm text-muted">Clique sur le profil d'un employé pour voir ses tâches et son historique.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <Link key={employee.uid} to={`/taches/employe/${employee.uid}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{employee.name}</p>
                    <p className="mt-1 text-sm text-muted">{employee.department || "Département non renseigné"}</p>
                    <p className="mt-1 text-xs text-muted">{employee.position || "Poste non renseigné"}</p>
                  </div>
                  <Badge tone={employee.role === "MANAGER" ? "info" : "neutral"}>{employee.role}</Badge>
                </div>
              </Card>
            </Link>
          ))}

          {employees.length === 0 && <p className="text-sm text-muted">Aucun employé trouvé.</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Title as="h1" variant="page" className="mb-1">
          Tâches
        </Title>
        <p className="text-sm text-muted">Gère les tâches, l'ordre et les statuts de ton équipe.</p>
      </div>

      <Card className="mb-8">
        <form onSubmit={handleManagerCreate} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            id="title"
            label="Titre"
            value={managerForm.title}
            onChange={(event) => setManagerForm({ ...managerForm, title: event.target.value })}
            placeholder="Nouvelle tâche"
            required
          />

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              value={managerForm.description}
              onChange={(event) => setManagerForm({ ...managerForm, description: event.target.value })}
              placeholder="Décris rapidement la tâche"
              rows={4}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Employé</label>
            <Select
              value={managerForm.assigneeId}
              onChange={(event) => setManagerForm({ ...managerForm, assigneeId: event.target.value })}
              options={[
                { value: "", label: "Choisir un employé" },
                ...employees.map((employee) => ({ value: employee.uid, label: employee.name })),
              ]}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Priorité</label>
            <Select
              value={managerForm.priority}
              onChange={(event) => setManagerForm({ ...managerForm, priority: event.target.value })}
              options={PRIORITY_OPTIONS}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Projet</label>
            <Select
              value={managerForm.projectId}
              onChange={(event) => setManagerForm({ ...managerForm, projectId: event.target.value })}
              options={[
                { value: "", label: "Sans projet" },
                ...projects.map((project) => ({ value: project.id, label: project.name })),
              ]}
            />
          </div>

          <div className="xl:col-span-3">
            <Button type="submit" loading={loading}>
              Créer
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {orderedTasks.map((task) => (
          <Card key={task.id} className="cursor-pointer hover:border-primary/30" onClick={() => setSelectedTask(task)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{task.title}</p>
                <p className="mt-1 text-sm text-muted">Assigné à {task.assigneeName || task.assigneeId}</p>
                {task.projectName && <p className="text-xs text-muted">Projet : {task.projectName}</p>}
                <p className="mt-2 text-xs text-muted">{formatTaskDate(task.createdAt)}</p>
              </div>

              <div className="flex items-center gap-3">
                <Badge tone={getTaskTimelineTone(task)}>{getTaskTimelineLabel(task)}</Badge>
                <Badge className={`border ${getTaskStatusColor(task.status)}`}>{getTaskStatusLabel(task.status)}</Badge>
                <div
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Select
                    value={task.status}
                    onChange={(event) => api.patch(`/tasks/${task.id}/status`, { status: event.target.value }).then(loadData)}
                    className="!w-auto text-xs"
                    options={TASK_STATUSES.map((status) => ({ value: status, label: getTaskStatusLabel(status) }))}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}

        {orderedTasks.length === 0 && <p className="text-sm text-muted">Aucune tâche pour le moment.</p>}
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
