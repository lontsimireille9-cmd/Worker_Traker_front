import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaChartBar, FaCheckCircle, FaClock, FaExclamationTriangle, FaTasks, FaTimesCircle, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Button from "../components/ui/Button";
import { api } from "../services/api";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

function StatCard({ icon, label, value, suffix = "" }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-1 text-xl font-bold text-ink">
            {value}{suffix}
          </p>
        </div>
      </div>
    </Card>
  );
}

function Progress({ value }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">Effort validé</span>
        <span className="font-bold text-primary">{safe}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

function statusLabel(status) {
  const labels = {
    TODO: "À faire",
    IN_PROGRESS: "En cours",
    SUBMITTED: "Soumise",
    IN_VALIDATION: "En validation",
    VALIDATED: "Validée",
    REJECTED: "Rejetée",
    CORRECTION: "Correction",
    BLOCKED: "Bloquée",
    CANCELLED: "Annulée",
  };
  return labels[status] || status || "—";
}

export default function TeamKpis() {
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Profile is available through the API/session route indirectly; the page
    // is protected by RoleRoute, so we only use this value as a defensive guard.
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const result = await api.get(
          selectedTeamId ? `/teams/${encodeURIComponent(selectedTeamId)}/kpis` : "/teams/kpis"
        );
        if (!cancelled) {
          setData(result);
          setSelectedTeamId(result?.selectedTeamId || "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Impossible de récupérer les KPI de l'équipe.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedTeamId]);

  const team = data?.selectedTeam;
  const kpis = data?.kpis || {};
  const members = data?.members || [];
  const teams = data?.teams || [];

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => (b.kpis?.effortRate || 0) - (a.kpis?.effortRate || 0)),
    [members]
  );

  function changeTeam(event) {
    const value = event.target.value;
    setSelectedTeamId(value);
  }

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-2" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-surface-2" />)}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-surface-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <Button type="button" variant="outline" onClick={() => nav("/equipes")} className="mb-5">
          <FaArrowLeft /> Retour à la gestion des équipes
        </Button>
        <Card className="border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Impossible de charger les KPI</p>
          <p className="mt-1 text-sm">{error}</p>
        </Card>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-5xl">
        <Title as="h1" variant="page">KPI des équipes</Title>
        <Card className="mt-6 p-8 text-center">
          <FaUsers className="mx-auto text-3xl text-muted" />
          <p className="mt-3 font-semibold">Aucune équipe disponible</p>
          <p className="mt-1 text-sm text-muted">Créez d'abord une équipe dans la gestion des équipes.</p>
          <Button className="mt-5" onClick={() => nav("/equipes")}>Gestion des équipes</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Title as="h1" variant="page">KPI des équipes</Title>
          <p className="mt-1 text-sm text-muted">
            Suivi de l'activité, de la validation et de l'effort de chaque membre.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedTeamId}
            onChange={changeTeam}
            className="min-w-64 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
            aria-label="Sélectionner une équipe"
          >
            {teams.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={() => nav("/equipes")}>Gestion</Button>
        </div>
      </div>

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-ink">{team.name}</p>
            <p className="text-sm text-muted">
              {team.department || "Département non renseigné"} · {team.memberCount} membre{team.memberCount > 1 ? "s" : ""}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Effort validé : {kpis.effortRate || 0}%
          </span>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<FaTasks />} label="Tâches" value={kpis.total || 0} />
        <StatCard icon={<FaCheckCircle />} label="Tâches validées" value={kpis.validated || 0} />
        <StatCard icon={<FaChartBar />} label="Taux de validation" value={kpis.validationRate || 0} suffix="%" />
        <StatCard icon={<FaClock />} label="Dans les délais" value={kpis.onTimeRate || 0} suffix="%" />
        <StatCard icon={<FaCheckCircle />} label="1er passage" value={kpis.firstPassRate || 0} suffix="%" />
        <StatCard icon={<FaExclamationTriangle />} label="Bloquées" value={kpis.blocked || 0} />
        <StatCard icon={<FaTimesCircle />} label="En retard" value={kpis.overdue || 0} />
        <StatCard icon={<FaUsers />} label="Effort validé" value={kpis.effortRate || 0} suffix="%" />
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-ink">KPI de chaque membre</h2>
          <p className="mt-1 text-sm text-muted">Les KPI sont calculés à partir des tâches réellement rattachées à cette équipe.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {sortedMembers.map((member) => {
            const m = member.kpis || {};
            return (
              <Card key={member.uid} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{member.name}</p>
                    <p className="truncate text-xs text-muted">{member.email || member.role}</p>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
                    {m.total || 0} tâche{m.total > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-5">
                  <Progress value={m.effortRate} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div><p className="text-[11px] text-muted">Validées</p><p className="font-bold">{m.validated || 0}</p></div>
                  <div><p className="text-[11px] text-muted">Validation</p><p className="font-bold">{m.validationRate || 0}%</p></div>
                  <div><p className="text-[11px] text-muted">1er passage</p><p className="font-bold">{m.firstPassRate || 0}%</p></div>
                  <div><p className="text-[11px] text-muted">Délais</p><p className="font-bold">{m.onTimeRate || 0}%</p></div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
                  <div><p className="text-[11px] text-muted">Effort attribué</p><p className="font-semibold">{m.effortAssigned || 0}</p></div>
                  <div><p className="text-[11px] text-muted">Effort validé</p><p className="font-semibold">{m.effortValidated || 0}</p></div>
                  <div><p className="text-[11px] text-muted">Bloquées</p><p className="font-semibold">{m.blocked || 0}</p></div>
                  <div><p className="text-[11px] text-muted">En retard</p><p className="font-semibold">{m.overdue || 0}</p></div>
                </div>

                {member.tasks?.length > 0 && (
                  <details className="mt-5 border-t border-line pt-4">
                    <summary className="cursor-pointer text-xs font-semibold text-primary">Voir les tâches</summary>
                    <div className="mt-3 space-y-2">
                      {member.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
                          <span className="min-w-0 truncate text-xs text-ink">{task.title}</span>
                          <span className="shrink-0 text-[10px] font-semibold text-muted">{statusLabel(task.status)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </Card>
            );
          })}
        </div>

        {sortedMembers.length === 0 && (
          <Card className="p-8 text-center">
            <p className="font-semibold text-ink">Aucun membre dans cette équipe</p>
            <p className="mt-1 text-sm text-muted">Ajoutez des membres depuis la gestion des équipes.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
