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
import Select from "../components/ui/select";
import { DEPARTMENTS } from "../constants/departments";

function getTeamProgress(team) {
  const sections = team.sections || [];
  const tasks = sections.flatMap((section) => section.tasks || []);

  if (tasks.length === 0) {
    return Number(team.progress || 0);
  }

  const validated = tasks.filter(
    (task) => task.status === "COMPLETED" || task.status === "VALIDATED"
  ).length;

  return Math.round((validated / tasks.length) * 100);
}

function getUserName(user) {
  return user?.name || user?.email || user?.uid || "Utilisateur";
}

export default function Teams() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const isSuperAdmin = profile?.role === "SUPER_ADMIN";
  const canCreateTeams = ["SUPER_ADMIN", "ADMIN"].includes(
    profile?.role
  );

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [teamMembersModalOpen, setTeamMembersModalOpen] = useState(false);
  const [managerTargetTeam, setManagerTargetTeam] = useState(null);
  const [managerSaving, setManagerSaving] = useState(false);
  const [roleSaving, setRoleSaving] = useState(null);
  const [teamKpiModalOpen, setTeamKpiModalOpen] = useState(false);
  const [teamKpiData, setTeamKpiData] = useState(null);
  const [teamKpiLoading, setTeamKpiLoading] = useState(false);
  const [teamKpiError, setTeamKpiError] = useState("");

  const [form, setForm] = useState({
    name: "",
    department: "PROJECT",
    leaderId: "",
    memberIds: [],
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const [teamResult, userResult] = await Promise.all([
        api.get("/teams"),
        api.get("/employees"),
      ]);

      setTeams(Array.isArray(teamResult) ? teamResult : []);
      setUsers(Array.isArray(userResult) ? userResult : []);
    } catch (err) {
      setTeams([]);
      setUsers([]);
      setError(err.message || "Impossible de charger les équipes.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Le nom de l’équipe est requis.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/teams", {
        ...form,
        // Le responsable doit toujours être membre de son équipe.
        memberIds: form.leaderId
          ? [...new Set([...form.memberIds, form.leaderId])]
          : form.memberIds,
      });

      setSuccess(
        form.leaderId
          ? "Équipe créée. Le responsable sélectionné est maintenant MANAGER."
          : "Équipe créée avec succès."
      );

      setForm({
        name: "",
        department: "PROJECT",
        leaderId: "",
        memberIds: [],
      });

      await load();
    } catch (err) {
      setError(err.message || "Impossible de créer l’équipe.");
    } finally {
      setLoading(false);
    }
  }

  const overdueTeams = useMemo(
    () => teams.filter((team) => team.deadlineReached),
    [teams]
  );

  function openLeaderModal() {
    if (!isSuperAdmin) return;
    setLeaderModalOpen(true);
  }

  function selectLeader(user) {
    setForm((current) => ({
      ...current,
      leaderId: user.uid,
      // Le responsable devient automatiquement membre de l'équipe.
      memberIds: [...new Set([...current.memberIds, user.uid])],
    }));

    setLeaderModalOpen(false);
  }

  async function openTeamKpis(team) {
    setSelectedTeam(team);
    setTeamKpiModalOpen(true);
    setTeamKpiLoading(true);
    setTeamKpiError("");
    setTeamKpiData(null);

    try {
      const result = await api.get(`/teams/${encodeURIComponent(team.id)}/kpis`);
      setTeamKpiData(result);
    } catch (err) {
      setTeamKpiError(err.message || "Impossible de récupérer les KPI de l'équipe.");
    } finally {
      setTeamKpiLoading(false);
    }
  }

  function openTeamMembers(team) {
    setSelectedTeam(team);
    setTeamMembersModalOpen(true);
  }

  function openManagerSelector(team) {
    if (!isSuperAdmin) return;

    setManagerTargetTeam(team);
    setTeamMembersModalOpen(false);
  }

  async function selectExistingTeamManager(user) {
    if (!managerTargetTeam || !isSuperAdmin) return;

    setError("");
    setSuccess("");
    setManagerSaving(true);

    try {
      const updated = await api.patch(
        `/teams/${managerTargetTeam.id}/leader`,
        { leaderId: user.uid }
      );

      setSuccess(
        `${getUserName(user)} est maintenant le manager de l’équipe ${managerTargetTeam.name}.`
      );

      setManagerTargetTeam(null);

      setTeams((current) =>
        current.map((team) =>
          team.id === managerTargetTeam.id
            ? {
                ...team,
                ...(updated || {}),
                leaderId: user.uid,
                memberIds: [
                  ...new Set([...(team.memberIds || []), user.uid]),
                ],
              }
            : team
        )
      );

      await load();
    } catch (err) {
      setError(err.message || "Impossible de modifier le manager.");
    } finally {
      setManagerSaving(false);
    }
  }

  async function changeMemberRole(team, member, nextRole) {
    if (!isSuperAdmin) return;

    setError("");
    setSuccess("");
    setRoleSaving(member.uid);

    try {
      await api.patch(
        `/teams/${team.id}/members/${member.uid}/role`,
        { role: nextRole }
      );

      setSuccess(
        `${getUserName(member)} est maintenant ${nextRole === "MANAGER" ? "MANAGER" : "EMPLOYEE"}.`
      );

      await load();

      const refreshedTeam = teams.find((item) => item.id === team.id);
      if (refreshedTeam) {
        setSelectedTeam({ ...refreshedTeam });
      }
    } catch (err) {
      setError(err.message || "Impossible de modifier le statut du membre.");
    } finally {
      setRoleSaving(null);
    }
  }

  function toggleMember(memberId) {
    // Le responsable ne doit pas pouvoir être retiré des membres.
    if (form.leaderId === memberId) return;

    setForm((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId)
        ? current.memberIds.filter((id) => id !== memberId)
        : [...current.memberIds, memberId],
    }));
  }

  const leaderCandidates = users.filter((user) =>
    ["EMPLOYEE", "MANAGER"].includes(user.role)
  );

  return (
    <div>
      <Title as="h1" variant="page" className="mb-1">
        {t("teamsAndDepartments")}
      </Title>

      <p className="mb-8 text-sm text-muted">{t("teamsDescription")}</p>

      {profile?.role === "MANAGER" && (
        <Alert type="info" className="mb-6">
          En tant que manager, vous pouvez consulter votre équipe et les KPI de ses membres. La création et la modification des équipes sont réservées au SUPER_ADMIN et à l'ADMIN.
        </Alert>
      )}

      {canCreateTeams && (
        <Card className="mb-8">
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="w-52">
              <Input
                id="team-name"
                label={t("teamName")}
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
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
                        disabled={form.leaderId === user.uid}
                        onChange={() => toggleMember(user.uid)}
                        className="rounded border-line text-primary focus:ring-primary"
                      />
                      <span className="truncate">
                        {getUserName(user)}
                        {form.leaderId === user.uid ? " · Responsable" : ""}
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

            <div className="w-64">
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Département</label>
              <Select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                options={DEPARTMENTS.map((department) => ({ value: department.value, label: department.label }))}
              />
            </div>

            <div className="w-64">
              <label className="mb-1.5 block text-sm font-medium text-ink/70">
                Manager / responsable
              </label>

              {isSuperAdmin ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={openLeaderModal}
                  className="w-full justify-start truncate"
                >
                  {form.leaderId
                    ? getUserName(
                        users.find((user) => user.uid === form.leaderId)
                      )
                    : "Choisir un employé responsable"}
                </Button>
              ) : (
                <p className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
                  Le SUPER_ADMIN choisit le manager.
                </p>
              )}
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
        <p className="text-sm font-medium text-ink">{t("deadlineAlert")}</p>
        <p className="mt-1 text-sm text-muted">
          {overdueTeams.length > 0
            ? `${overdueTeams.length} équipe(s) présentent un retard ou un livrable non respecté.`
            : t("noOverdueTeams")}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => {
          const progress = getTeamProgress(team);
          const manager = users.find((user) => user.uid === team.leaderId);

          return (
            <Card key={team.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <button
                type="button"
                onClick={() => openTeamKpis(team)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{team.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      Département : {team.department || "—"}
                    </p>
                  </div>

                  <Badge tone={team.deadlineReached ? "warning" : "success"}>
                    {team.deadlineReached ? "Retard" : "À l'heure"}
                  </Badge>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Progression tâches</span>
                    <span className="font-bold text-primary">{progress}%</span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-4 text-xs text-muted">
                  <span>{team.memberIds?.length || 0} membre(s)</span>
                </div>

                <div className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    Manager
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-ink">
                    {manager ? getUserName(manager) : "Aucun manager"}
                  </p>
                </div>
              </button>

              {isSuperAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => openManagerSelector(team)}
                >
                  {manager ? "Changer le manager" : "Choisir le manager"}
                </Button>
              )}
            </Card>
          );
        })}

        {teams.length === 0 && (
          <p className="text-sm text-muted">{t("noTeams")}</p>
        )}
      </div>

      {/* Sélection du manager lors de la création */}
      <Dialog
        open={leaderModalOpen}
        onClose={() => setLeaderModalOpen(false)}
        title="Choisir le manager de l’équipe"
      >
        <div className="space-y-3">
          {leaderCandidates.length > 0 ? (
            leaderCandidates.map((user) => (
              <Button
                key={user.uid}
                type="button"
                onClick={() => selectLeader(user)}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface"
              >
                <p className="font-medium">{getUserName(user)}</p>
                <p className="text-xs text-muted">
                  {user.role} · {user.email || ""}
                </p>
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">
              Aucun employé disponible pour être manager.
            </p>
          )}
        </div>
      </Dialog>

      {/* Choix du manager d'une équipe existante */}
      <Dialog
        open={Boolean(managerTargetTeam)}
        onClose={() => setManagerTargetTeam(null)}
        title={
          managerTargetTeam
            ? `Choisir le manager — ${managerTargetTeam.name}`
            : "Choisir le manager"
        }
      >
        <div className="space-y-3">
          {managerTargetTeam &&
            leaderCandidates
              .filter((user) =>
                (managerTargetTeam.memberIds || []).includes(user.uid)
              )
              .map((user) => (
                <Button
                  key={user.uid}
                  type="button"
                  disabled={managerSaving}
                  onClick={() => selectExistingTeamManager(user)}
                  className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                >
                  <p className="font-medium">{getUserName(user)}</p>
                  <p className="text-xs text-muted">
                    {user.role}
                    {user.uid === managerTargetTeam.leaderId
                      ? " · Manager actuel"
                      : ""}
                  </p>
                </Button>
              ))}

          {managerTargetTeam &&
            leaderCandidates.filter((user) =>
              (managerTargetTeam.memberIds || []).includes(user.uid)
            ).length === 0 && (
              <p className="text-sm text-muted">
                Ajoutez d’abord un employé à cette équipe.
              </p>
            )}
        </div>
      </Dialog>

      {/* Membres + changement de statut */}
      <Dialog
        open={teamMembersModalOpen}
        onClose={() => setTeamMembersModalOpen(false)}
        title={selectedTeam?.name || "Équipe"}
      >
        <div className="space-y-3">
          {(selectedTeam?.memberIds || []).length > 0 ? (
            selectedTeam.memberIds.map((memberId) => {
              const member = users.find((user) => user.uid === memberId);
              const isLeader = selectedTeam?.leaderId === memberId;

              return (
                <div
                  key={memberId}
                  className="rounded-lg border border-line bg-surface-2 px-3 py-3 text-sm text-ink"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {getUserName(member) || memberId}
                      </p>
                      <p className="text-xs text-muted">
                        {isLeader ? "MANAGER · Responsable" : member?.role || "EMPLOYEE"}
                      </p>
                    </div>

                    {isSuperAdmin && !isLeader && member && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={roleSaving === member.uid}
                        onClick={() =>
                          changeMemberRole(
                            selectedTeam,
                            member,
                            member.role === "MANAGER" ? "EMPLOYEE" : "MANAGER"
                          )
                        }
                      >
                        {member.role === "MANAGER"
                          ? "Passer EMPLOYEE"
                          : "Passer MANAGER"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted">
              Aucun membre renseigné pour cette équipe.
            </p>
          )}

          {isSuperAdmin && selectedTeam && (
            <Button
              type="button"
              className="w-full"
              onClick={() => openManagerSelector(selectedTeam)}
            >
              {selectedTeam.leaderId
                ? "Changer le manager"
                : "Choisir le manager"}
            </Button>
          )}
        </div>
      </Dialog>
      <Dialog
        open={teamKpiModalOpen}
        onClose={() => {
          setTeamKpiModalOpen(false);
          setTeamKpiData(null);
          setTeamKpiError("");
        }}
        title={selectedTeam?.name ? `Équipe — ${selectedTeam.name}` : "KPI de l'équipe"}
      >
        {teamKpiLoading ? (
          <div className="flex min-h-56 flex-col items-center justify-center text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="mt-4 text-sm font-semibold">Chargement des KPI des membres…</p>
            <p className="mt-1 text-xs text-muted">Calcul des tâches et de la progression de l'équipe.</p>
          </div>
        ) : teamKpiError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Impossible de charger les KPI</p>
            <p className="mt-1 text-sm">{teamKpiError}</p>
          </div>
        ) : teamKpiData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted">Membres</p><p className="mt-1 text-xl font-bold">{teamKpiData.team?.memberCount || 0}</p></div>
              <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted">Tâches</p><p className="mt-1 text-xl font-bold">{teamKpiData.summary?.total || 0}</p></div>
              <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted">Validées</p><p className="mt-1 text-xl font-bold">{teamKpiData.summary?.validated || 0}</p></div>
              <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted">Effort validé</p><p className="mt-1 text-xl font-bold text-primary">{teamKpiData.summary?.effortRate || 0}%</p></div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">KPI des membres</h4>
              <div className="space-y-2">
                {(teamKpiData.members || []).map((member) => {
                  const k = member.kpis || {};
                  return (
                    <div key={member.uid} className="rounded-xl border border-line bg-surface-2 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{member.name}</p>
                          <p className="truncate text-xs text-muted">{member.email || member.role || "EMPLOYEE"}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">{k.effortRate || 0}%</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div><p className="text-[10px] text-muted">Tâches</p><p className="font-bold">{k.total || 0}</p></div>
                        <div><p className="text-[10px] text-muted">Validées</p><p className="font-bold">{k.validated || 0}</p></div>
                        <div><p className="text-[10px] text-muted">Validation</p><p className="font-bold">{k.validationRate || 0}%</p></div>
                        <div><p className="text-[10px] text-muted">Retard</p><p className="font-bold">{k.overdue || 0}</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(teamKpiData.members || []).length === 0 && (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-center">
                  <p className="font-semibold text-amber-800">Cette équipe n'a pas de membre disponible.</p>
                  <p className="mt-1 text-xs text-amber-700">Vérifiez les membres de l'équipe et leur rattachement à l'entreprise.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Dialog>

    </div>
  );
}
