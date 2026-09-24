import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaPaperPlane, FaPlus } from "react-icons/fa";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Button from "../components/ui/Button";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

function validated(task) { return ["VALIDATED", "COMPLETED"].includes(task.status); }

export default function ProjectSection() {
  const { id: projectId, sectionId } = useParams();
  const nav = useNavigate();
  const { profile } = useAuth();
  const canManage = MANAGER_ROLES.includes(profile?.role);
  const [project, setProject] = useState(null);
  const [section, setSection] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const data = await api.get(`/projects/${projectId}`);
      setProject(data);
      const found = (data.teams || []).flatMap((team) => team.sections || []).find((item) => String(item.id) === String(sectionId));
      if (!found) throw new Error("Section introuvable ou vous n'avez pas accès à cette section.");
      setSection(found);
      setTasks(found.tasks || []);
    } catch (e) { setError(e.message || "Impossible de charger la section."); }
  }

  useEffect(() => { load(); }, [projectId, sectionId]);

  const progress = useMemo(() => tasks.length ? Math.round((tasks.filter(validated).length / tasks.length) * 100) : 0, [tasks]);
  const isAssignee = String(section?.assigneeId || "") === String(profile?.uid || profile?.id || "");
  const canWork = canManage || isAssignee;

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true); setError("");
    try {
      const task = await api.post("/tasks", {
        projectId,
        sectionId,
        teamId: section.teamId || null,
        projectTeamId: section.projectTeamId || null,
        title: title.trim(),
        // La tâche revient par défaut au responsable de la section.
        // Un manager peut ainsi préparer la section d'un membre sans
        // détourner automatiquement la tâche vers son propre compte.
        assigneeId: section.assigneeId || profile.uid,
        deadline: deadline || null,
        estimatePoints: 1,
      });
      setTasks((current) => [...current, task]);
      setTitle(""); setDeadline("");
    } catch (e) { setError(e.message || "Impossible de créer la tâche."); }
    finally { setSaving(false); }
  }

  async function updateStatus(task, status) {
    setSaving(true); setError("");
    try {
      const updated = await api.patch(`/tasks/${task.id}/status`, { status });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (e) { setError(e.message || "Impossible de modifier la tâche."); }
    finally { setSaving(false); }
  }

  async function submit(task) {
    setSaving(true); setError("");
    try {
      const updated = await api.post(`/tasks/${task.id}/submit`, {});
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (e) { setError(e.message || "Impossible de soumettre la tâche."); }
    finally { setSaving(false); }
  }

  async function validate(task, decision) {
    setSaving(true); setError("");
    try {
      const updated = await api.post(`/tasks/${task.id}/validate`, { decision });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (e) { setError(e.message || "Impossible de valider la tâche."); }
    finally { setSaving(false); }
  }

  if (error && !section) return <Card className="border-red-200 bg-red-50 text-red-700">{error}</Card>;
  if (!section) return <div className="mx-auto max-w-5xl animate-pulse"><div className="h-10 w-1/3 rounded bg-surface-2" /><div className="mt-5 h-96 rounded-2xl bg-surface-2" /></div>;

  return <div className="mx-auto max-w-5xl pb-10">
    <Link to={`/projets/${projectId}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><FaArrowLeft /> {project?.name || "Projet"}</Link>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Section du projet</p><Title as="h1" variant="page">{section.name}</Title><p className="mt-1 text-sm text-muted">{section.description || "Construisez ici la liste des tâches nécessaires à l'exécution de cette section."}</p><p className="mt-2 text-xs text-muted">Poids : {section.weight ?? 0}% · Progression : {progress}%</p></div>
      <div className="w-full sm:w-56"><div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div></div>
    </div>

    {error && <Card className="mt-5 border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>}

    {canWork && <Card className="mt-6"><h2 className="font-bold">Planifier les tâches de la section</h2><p className="mt-1 text-xs text-muted">Ajoutez les tâches que vous allez réellement accomplir pour atteindre cette section.</p><form onSubmit={addTask} className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Préparer le cahier des charges" className="rounded-xl border border-line px-3 py-3 text-sm" /><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="rounded-xl border border-line px-3 py-3 text-sm" /><Button type="submit" loading={saving} disabled={!title.trim()}><FaPlus /> Ajouter</Button></form></Card>}

    <div className="mt-6 space-y-3">
      {tasks.map((task) => <Card key={task.id} className="bg-white"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><p className="font-semibold">{task.title}</p><p className="mt-1 text-xs text-muted">{task.status} · {task.deadline ? new Date(task.deadline).toLocaleDateString("fr-FR") : "Sans échéance"}</p></div><div className="flex flex-wrap items-center gap-2">
        {validated(task) ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"><FaCheck /> Exécution validée</span> : canManage && ["SUBMITTED", "IN_VALIDATION", "CORRECTION"].includes(task.status) ? <><Button onClick={() => validate(task, "VALIDATE")} disabled={saving}><FaCheck /> Valider l'exécution</Button><Button variant="secondary" onClick={() => validate(task, "REJECT")} disabled={saving}>Demander correction</Button></> : isAssignee ? <>{task.status === "TODO" && <Button variant="secondary" onClick={() => updateStatus(task, "IN_PROGRESS")} disabled={saving}>Commencer</Button>}{["IN_PROGRESS", "CORRECTION"].includes(task.status) && <Button onClick={() => updateStatus(task, "VALIDATED")} disabled={saving}><FaCheck /> Valider l'exécution</Button>}</> : <span className="text-xs text-muted">En cours</span>}
      </div></div></Card>)}
      {!tasks.length && <Card className="py-14 text-center text-sm text-muted">Aucune tâche dans cette section. Commencez par définir la liste des tâches ci-dessus.</Card>}
    </div>
  </div>;
}
