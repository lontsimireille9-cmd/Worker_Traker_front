import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSave, FaUsers } from "react-icons/fa";

import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Button from "../components/ui/Button";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export default function ProjectCreate() {
  const nav = useNavigate();
  const { profile } = useAuth();

  const [form, setForm] = useState({
    name: "",
    objective: "",
    description: "",
    priority: "MEDIUM",
    plannedEndDate: "",
  });

  const [teams, setTeams] = useState([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [teamsError, setTeamsError] = useState("");

  const canCreate = MANAGER_ROLES.includes(profile?.role);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      setLoadingTeams(true);
      setTeamsError("");

      try {
        const result = await api.get("/teams");

        if (!cancelled) {
          setTeams(
            (Array.isArray(result) ? result : []).filter((team) =>
              team?.id !== null && team?.id !== undefined && String(team.id).trim() !== ""
            )
          );
        }
      } catch (e) {
        if (!cancelled) {
          setTeams([]);
          setTeamsError(
            e.message ||
              "Impossible de récupérer les équipes. Vérifiez que l'API est disponible."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTeams(false);
        }
      }
    }

    loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTeams = useMemo(
    () =>
      teams.filter((team) =>
        selectedTeamIds.includes(String(team.id))
      ),
    [teams, selectedTeamIds]
  );

  function change(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /*
   * IMPORTANT :
   * Chaque checkbox possède son propre teamId.
   * On ne modifie QUE l'équipe concernée.
   */
  function toggleTeam(teamId) {
    const normalizedId = String(teamId);

    setSelectedTeamIds((current) => {
      if (current.includes(normalizedId)) {
        return current.filter((id) => id !== normalizedId);
      }

      return [...current, normalizedId];
    });
  }

  function isTeamSelected(teamId) {
    return selectedTeamIds.includes(String(teamId));
  }

  async function submit(event) {
    event.preventDefault();

    setError("");

    if (!canCreate) {
      setError("Vous n'avez pas les droits nécessaires pour créer un projet.");
      return;
    }

    if (selectedTeamIds.some((id) => !id || id === "null" || id === "undefined")) {
      setError("Une équipe sélectionnée possède un identifiant invalide. Rechargez la page et sélectionnez à nouveau les équipes.");
      return;
    }

    if (!form.name.trim()) {
      setError("Le nom du projet est requis.");
      return;
    }

    if (!selectedTeamIds.length) {
      setError("Sélectionnez au moins une équipe responsable du projet.");
      return;
    }

    setSaving(true);

    try {
      /*
       * Le backend reçoit directement les équipes sélectionnées.
       * Il s'occupe de créer les relations projectTeams.
       */
      const validTeamIds = selectedTeamIds.filter((id) => id && id !== "null" && id !== "undefined");

      const project = await api.post("/projects", {
        ...form,
        teamIds: validTeamIds,
      });

      nav(`/projets/${project.id}`);
    } catch (e) {
      setError(
        e.message ||
          "Impossible de créer le projet. Vérifiez que l'API est disponible."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <button
        type="button"
        onClick={() => nav("/projets")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <FaArrowLeft />
        Projets
      </button>

      <div className="mb-6">
        <Title as="h1" variant="page">
          Nouveau projet
        </Title>

        <p className="mt-1 text-sm text-muted">
          Créez le projet et sélectionnez les équipes qui participeront à sa
          réalisation.
        </p>
      </div>

      <Card className="bg-white">
        <form onSubmit={submit} className="space-y-6">
          {/* INFORMATIONS PROJET */}
          <div>
            <label
              htmlFor="project-name"
              className="text-xs font-semibold"
            >
              Nom
            </label>

            <input
              id="project-name"
              name="name"
              value={form.name}
              onChange={change}
              required
              disabled={saving}
              className="mt-2 w-full rounded-xl border border-line px-3 py-3 outline-none transition focus:border-primary"
              placeholder="Version mobile de Bridge Connector"
            />
          </div>

          <div>
            <label
              htmlFor="project-objective"
              className="text-xs font-semibold"
            >
              Objectif
            </label>

            <textarea
              id="project-objective"
              name="objective"
              value={form.objective}
              onChange={change}
              disabled={saving}
              rows={3}
              className="mt-2 w-full rounded-xl border border-line px-3 py-3 outline-none transition focus:border-primary"
              placeholder="Résultat métier attendu..."
            />
          </div>

          <div>
            <label
              htmlFor="project-description"
              className="text-xs font-semibold"
            >
              Description
            </label>

            <textarea
              id="project-description"
              name="description"
              value={form.description}
              onChange={change}
              disabled={saving}
              rows={4}
              className="mt-2 w-full rounded-xl border border-line px-3 py-3 outline-none transition focus:border-primary"
              placeholder="Description du projet..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="project-priority"
                className="text-xs font-semibold"
              >
                Priorité
              </label>

              <select
                id="project-priority"
                name="priority"
                value={form.priority}
                onChange={change}
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="project-end-date"
                className="text-xs font-semibold"
              >
                Échéance
              </label>

              <input
                id="project-end-date"
                type="date"
                name="plannedEndDate"
                value={form.plannedEndDate}
                onChange={change}
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-line px-3 py-3"
              />
            </div>
          </div>

          {/* EQUIPES */}
          <div className="border-t border-line pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FaUsers className="text-primary" />

                  <h2 className="text-sm font-bold">
                    Équipes responsables
                  </h2>
                </div>

                <p className="mt-1 text-xs text-muted">
                  Sélectionnez une ou plusieurs équipes. Elles pourront ensuite
                  contribuer aux sections et tâches du projet.
                </p>
              </div>

              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {selectedTeamIds.length} sélectionnée
                {selectedTeamIds.length > 1 ? "s" : ""}
              </span>
            </div>

            {teamsError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {teamsError}
              </div>
            )}

            {loadingTeams ? (
              <div className="mt-4 space-y-3">
                <div className="h-16 animate-pulse rounded-xl bg-surface-2" />
                <div className="h-16 animate-pulse rounded-xl bg-surface-2" />
                <div className="h-16 animate-pulse rounded-xl bg-surface-2" />
              </div>
            ) : teams.length === 0 ? (
              <div className="mt-4 rounded-xl border border-line bg-surface-2 p-5 text-center">
                <p className="text-sm font-semibold text-ink">
                  Aucune équipe disponible
                </p>

                <p className="mt-1 text-xs text-muted">
                  Créez d'abord une équipe avant de l'associer à un projet.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {teams.map((team) => {
                  const teamId = String(team.id);
                  const checked = isTeamSelected(teamId);

                  return (
                    <label
                      key={teamId}
                      htmlFor={`project-team-${teamId}`}
                      className={[
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-line bg-white hover:border-primary/30",
                      ].join(" ")}
                    >
                      {/* 
                       * FIX PRINCIPAL :
                       * Chaque input a un id UNIQUE.
                       * Il n'y a aucun name commun qui transforme
                       * les checkboxes en groupe radio.
                       */}
                      <input
                        id={`project-team-${teamId}`}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTeam(teamId)}
                        disabled={saving}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">
                          {team.name}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          Département :{" "}
                          {team.department || "Non renseigné"}
                        </p>

                        {team.memberIds?.length > 0 && (
                          <p className="mt-1 text-xs text-muted">
                            {team.memberIds.length} membre
                            {team.memberIds.length > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>

                      {checked && (
                        <span className="shrink-0 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white">
                          Sélectionnée
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            {selectedTeams.length > 0 && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold text-ink">
                  Équipes sélectionnées
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTeams.map((team) => (
                    <span
                      key={team.id}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink"
                    >
                      {team.name}
                    </span>
                  ))}
                </div>

                <p className="mt-3 text-[11px] text-muted">
                  Le poids du projet sera automatiquement réparti entre les
                  équipes sélectionnées. Vous pourrez ensuite gérer les
                  sections et les tâches depuis le projet.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => nav("/projets")}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={saving || loadingTeams}
            >
              <FaSave />

              {saving ? "Création..." : "Créer le projet"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}