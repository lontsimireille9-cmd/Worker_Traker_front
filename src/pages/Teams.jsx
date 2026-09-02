import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Alert from "../components/ui/alert";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";
import Dialog from "../components/ui/dialog";

export default function Teams() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [teamMembersModalOpen, setTeamMembersModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", department: "", leaderId: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    api.get("/teams").then(setTeams).catch(() => setTeams([]));
    api.get("/employees").then(setUsers).catch(() => setUsers([]));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/teams", form);
      setSuccess("Équipe créée avec succès.");
      setForm({ name: "", department: "", leaderId: "" });
      load();
    } catch (err) {
      setError(err.message || "Impossible de créer l’équipe.");
    } finally {
      setLoading(false);
    }
  }

  const overdueTeams = useMemo(() => teams.filter((team) => team.deadlineReached), [teams]);

  function openLeaderModal(team) {
    setSelectedTeam(team);
    setForm((current) => ({ ...current, leaderId: team?.leaderId || "" }));
    setLeaderModalOpen(true);
  }

  function openTeamMembers(team) {
    setSelectedTeam(team);
    setTeamMembersModalOpen(true);
  }

  return (
    <div>
      <Title as="h1" variant="page" className="mb-1">
        Équipes & départements
      </Title>
      <p className="text-sm text-muted mb-8">
        Gérez les équipes, les départements et les retards éventuels sur les livrables.
      </p>

      {profile?.role !== "EMPLOYEE" && (
        <Card className="mb-8">
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            <div className="w-52">
              <Input
                id="team-name"
                label="Nom de l’équipe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="w-52">
              <Input
                id="team-dept"
                label="Département"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <div className="w-52">
              <label className="block text-sm font-medium mb-1.5 text-ink/70">Responsable</label>
              <Button type="button" variant="outline" onClick={() => openLeaderModal(null)}>
                {form.leaderId ? "Changer le responsable" : "Choisir un responsable"}
              </Button>
            </div>
            <Button type="submit" loading={loading}>
              Créer l’équipe
            </Button>
          </form>
          {success && <Alert type="success" className="mt-4">{success}</Alert>}
          {error && <Alert type="danger" className="mt-4">{error}</Alert>}
        </Card>
      )}

      <Card className="mb-6">
        <p className="text-sm font-medium text-ink">Alerte d’échéance</p>
        <p className="text-sm text-muted mt-1">
          {overdueTeams.length > 0
            ? `${overdueTeams.length} équipe(s) présente(nt) un retard ou un livrable non respecté.`
            : "Aucune équipe en retard pour le moment."}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => openTeamMembers(team)}
            className="text-left rounded-xl border border-line bg-surface p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">{team.name}</p>
                <p className="text-xs text-muted mt-1">Département : {team.department || "—"}</p>
              </div>
              <Badge tone={team.deadlineReached ? "warning" : "success"}>
                {team.deadlineReached ? "Retard" : "À l’heure"}
              </Badge>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted">
              <span>{team.memberIds?.length || 0} membre(s)</span>
              <span className="text-primary">Voir les membres</span>
            </div>
          </button>
        ))}
        {teams.length === 0 && <p className="text-sm text-muted">Aucune équipe pour le moment.</p>}
      </div>

      <Dialog open={leaderModalOpen} onClose={() => setLeaderModalOpen(false)} title="Choisir un responsable">
        <div className="space-y-3">
          {users.map((user) => (
            <button
              key={user.uid}
              type="button"
              onClick={() => {
                setForm((current) => ({ ...current, leaderId: user.uid }));
                setLeaderModalOpen(false);
              }}
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface"
            >
              <p className="font-medium">{user.name || user.email || user.uid}</p>
              <p className="text-xs text-muted">{user.role} • {user.email}</p>
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog open={teamMembersModalOpen} onClose={() => setTeamMembersModalOpen(false)} title={selectedTeam?.name || "Équipe"}>
        <div className="space-y-3">
          {(selectedTeam?.memberIds || []).length > 0 ? (
            selectedTeam.memberIds.map((memberId) => {
              const member = users.find((user) => user.uid === memberId);
              return (
                <div key={memberId} className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink">
                  <p className="font-medium">{member?.name || member?.email || memberId}</p>
                  <p className="text-xs text-muted">{member?.role || "Membre"}</p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted">Aucun membre renseigné pour cette équipe.</p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
