import { useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaClock,
  FaPlus,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import Button from "../ui/Button";
import Card from "../ui/card";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const DONE = new Set(["COMPLETED", "VALIDATED"]);

function statusLabel(status) {
  if (status === "COMPLETED" || status === "VALIDATED") return "Réalisée";
  if (status === "IN_PROGRESS") return "En cours";
  if (status === "SUBMITTED" || status === "IN_VALIDATION") return "En validation";
  if (status === "CORRECTION") return "À corriger";
  return "À faire";
}

function progressOf(tasks) {
  if (!tasks.length) return 0;
  const done = tasks.filter((task) => DONE.has(String(task.status || "").toUpperCase())).length;
  return Math.round((done / tasks.length) * 100);
}

export default function SectionTasksDialog({ open, onClose, projectId, section, canManage = false }) {
  const { profile } = useAuth();
  const myUid = String(profile?.uid || profile?.id || "");
  const isAssignee = String(section?.assigneeId || "") === myUid;
  const canWork = canManage || isAssignee;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");

  async function loadTasks() {
    if (!projectId || !section?.id) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.get(`/project-management/projects/${projectId}/sections/${section.id}/tasks`);
      setTasks(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e?.message || "Impossible de charger les tâches de la section.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setTitle("");
      setDeadline("");
      loadTasks();
    }
  }, [open, projectId, section?.id]);

  const progress = useMemo(() => progressOf(tasks), [tasks]);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim() || !canWork) return;
    setSaving(true);
    setError("");
    try {
      const task = await api.post("/tasks", {
        projectId,
        sectionId: section.id,
        teamId: section.teamId || null,
        projectTeamId: section.projectTeamId || null,
        title: title.trim(),
        description: "",
        assigneeId: isAssignee ? myUid : section.assigneeId,
        deadline: deadline || null,
        estimatePoints: 1,
        weight: 1,
        priority: "MEDIUM",
      });
      setTasks((current) => [...current, task]);
      setTitle("");
      setDeadline("");
    } catch (e) {
      setError(e?.message || "Impossible de créer la tâche.");
    } finally {
      setSaving(false);
    }
  }

  async function completeTask(task) {
    if (!canWork || DONE.has(String(task.status || "").toUpperCase())) return;
    setBusyId(task.id);
    setError("");
    try {
      const updated = await api.patch(`/tasks/${task.id}/status`, { status: "COMPLETED" });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (e) {
      setError(e?.message || "Impossible de valider cette tâche.");
    } finally {
      setBusyId("");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9500] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Section du projet</p>
            <h2 className="mt-1 truncate text-xl font-bold text-ink">{section?.name || "Section"}</h2>
            <p className="mt-1 text-xs text-muted">Poids : {section?.weight ?? 0}% · {progress}% réalisé</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" aria-label="Fermer">
            <FaTimes />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]">
          <aside className="min-h-0 overflow-y-auto border-b border-line p-4 lg:border-b-0 lg:border-r">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">Liste des tâches</h3>
                <p className="text-xs text-muted">Les tâches réalisées alimentent la progression.</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{progress}%</span>
            </div>

            {loading ? (
              <div className="flex min-h-40 items-center justify-center text-sm text-muted">
                <FaSpinner className="mr-2 animate-spin" /> Chargement des tâches…
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const done = DONE.has(String(task.status || "").toUpperCase());
                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={!canWork || busyId === task.id || done}
                      onClick={() => completeTask(task)}
                      className={`w-full rounded-xl border p-3 text-left transition ${done ? "border-emerald-200 bg-emerald-50" : "border-line bg-white hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${done ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-line text-muted"}`}>
                          {busyId === task.id ? <FaSpinner className="animate-spin" /> : done ? <FaCheck /> : <FaClock />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-sm font-semibold text-ink">{task.title}</span>
                          <span className="mt-1 block text-[11px] text-muted">{statusLabel(task.status)}{task.deadline ? ` · ${new Date(task.deadline).toLocaleDateString("fr-FR")}` : ""}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}

                {!tasks.length && (
                  <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
                    Aucune tâche n'est encore définie pour cette section.
                  </div>
                )}
              </div>
            )}
          </aside>

          <section className="min-h-0 overflow-y-auto p-5">
            <div className="mb-5">
              <h3 className="text-lg font-bold">Réalisation de la section</h3>
              <p className="mt-1 text-sm text-muted">Ajoute les actions concrètes qui composent ta section. Chaque tâche réalisée fait progresser automatiquement la section et les KPI associés.</p>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted">Progression</p>
                  <p className="mt-1 text-3xl font-bold text-primary">{progress}%</p>
                </div>
                <div className="w-40">
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-right text-xs text-muted">{tasks.filter((task) => DONE.has(String(task.status || "").toUpperCase())).length}/{tasks.length} tâches réalisées</p>
                </div>
              </div>
            </Card>

            {canWork && (
              <form onSubmit={addTask} className="mt-5 rounded-xl border border-line bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FaPlus className="text-primary" />
                  <h4 className="font-bold">Ajouter une tâche</h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_170px_auto]">
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Contrôler le stock de la boutique" className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary" required />
                  <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  <Button type="submit" loading={saving} disabled={!title.trim()}><FaPlus /> Ajouter</Button>
                </div>
              </form>
            )}

            {!canWork && (
              <Card className="mt-5 border-amber-200 bg-amber-50 text-sm text-amber-800">
                Cette section est consultable, mais seul son responsable ou un gestionnaire peut modifier sa liste de tâches.
              </Card>
            )}

            {error && <Card className="mt-5 border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>}

            <div className="mt-5 rounded-xl border border-line bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Règle de calcul</p>
              <p className="mt-2 text-sm text-ink">La progression actuelle de la section est calculée à partir des tâches réalisées : tâches réalisées / tâches totales. Le poids de la section reste ensuite appliqué au calcul du projet et aux KPI.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
