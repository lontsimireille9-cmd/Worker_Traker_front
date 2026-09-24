import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaClock,
  FaEdit,
  FaPlus,
  FaUsers,
  FaUser,
} from "react-icons/fa";

import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Button from "../components/ui/Button";
import SectionTasksDialog from "../components/projects/SectionTasksDialog";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const MANAGEMENT_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const Progress = ({ value }) => (
  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
    <div
      className="h-full bg-primary transition-all"
      style={{
        width: `${Math.min(100, Math.max(0, Number(value) || 0))}%`,
      }}
    />
  </div>
);

function isValidated(task) {
  return ["VALIDATED", "COMPLETED"].includes(
    String(task?.status || "").toUpperCase()
  );
}

function getProgress(tasks = []) {
  if (!tasks.length) return 0;

  return Math.round(
    (tasks.filter(isValidated).length / tasks.length) * 100
  );
}

function normalizeUid(profile) {
  return String(profile?.uid || profile?.id || "");
}

function getMemberId(member) {
  return String(
    member?.uid ||
      member?.id ||
      member?.userId ||
      member?.employeeId ||
      ""
  );
}

function getMemberName(member) {
  return (
    member?.name ||
    member?.displayName ||
    member?.fullName ||
    member?.email ||
    member?.uid ||
    member?.id ||
    "Utilisateur"
  );
}

function getTeamManagerId(team) {
  return String(
    team?.managerId ||
      team?.manager?.uid ||
      team?.manager?.id ||
      team?.manager?.userId ||
      team?.leaderId ||
      team?.leader?.uid ||
      team?.leader?.id ||
      team?.leader?.userId ||
      ""
  );
}

function normalizeSection(section, fallbackTeamId = "") {
  return {
    id: section?.id || null,

    projectTeamId:
      section?.projectTeamId ||
      section?.teamId ||
      fallbackTeamId ||
      "",

    name: section?.name || "",

    description: section?.description || "",

    weight:
      section?.weight === null || section?.weight === undefined
        ? ""
        : section.weight,

    assigneeId:
      section?.assigneeId ||
      section?.responsibleId ||
      section?.managerId ||
      "",
  };
}

/**
 * Retourne tous les membres d'une équipe.
 *
 * Le manager est ajouté même lorsqu'il n'est pas présent
 * dans team.members.
 */
function getTeamMembers(team) {
  if (!team) return [];

  const members = [];

  if (Array.isArray(team.members)) {
    members.push(...team.members);
  }

  if (team.manager) {
    members.push(team.manager);
  }

  if (team.leader) {
    members.push(team.leader);
  }

  const managerId = getTeamManagerId(team);

  if (managerId) {
    const managerFromMembers = members.find(
      (member) => getMemberId(member) === managerId
    );

    if (managerFromMembers) {
      members.push(managerFromMembers);
    }
  }

  const unique = new Map();

  for (const member of members) {
    const memberId = getMemberId(member);

    if (!memberId) continue;

    if (!unique.has(memberId)) {
      unique.set(memberId, {
        ...member,
        uid: memberId,
      });
    }
  }

  return Array.from(unique.values()).sort((a, b) =>
    getMemberName(a).localeCompare(getMemberName(b), "fr", {
      sensitivity: "base",
    })
  );
}

/**
 * Construit la liste globale des membres disponibles
 * pour attribuer une section.
 *
 * IMPORTANT :
 * L'utilisateur ne choisit plus l'équipe dans la section.
 * L'équipe est déjà définie par le projet.
 *
 * Chaque membre est associé automatiquement à son équipe.
 */
function getProjectMembers(projectTeams = [], employees = []) {
  const members = [];
  const seen = new Map();

  for (const team of projectTeams) {
    const teamId = String(team?.id || "");
    const teamName = team?.name || "Équipe";

    if (!teamId) continue;

    const teamMembers = getTeamMembers(team);

    // Certaines équipes historiques ne renvoient pas `members` ni `memberIds`
    // dans la relation projectTeams. Les employés portent toutefois leur teamId.
    // On utilise donc aussi /employees comme source de secours.
    const sourceTeamIds = new Set(
      [team.teamId, team.sourceTeamId, team.id]
        .filter(Boolean)
        .map(String)
    );

    const employeeMembers = employees.filter((employee) => {
      const employeeTeamIds = [
        employee?.teamId,
        ...(Array.isArray(employee?.teamIds) ? employee.teamIds : []),
      ]
        .filter(Boolean)
        .map(String);

      return employeeTeamIds.some((employeeTeamId) =>
        sourceTeamIds.has(employeeTeamId)
      );
    });

    const allTeamMembers = [
      ...teamMembers,
      ...employeeMembers,
    ];

    for (const member of allTeamMembers) {
      const memberId = getMemberId(member);

      if (!memberId) continue;

      if (!seen.has(memberId)) {
        const item = {
          ...member,
          uid: memberId,
          projectTeamId: teamId,
          projectTeamName: teamName,
        };

        seen.set(memberId, item);
        members.push(item);
      } else {
        const existing = seen.get(memberId);

        if (!existing.projectTeamNames) {
          existing.projectTeamNames = [existing.projectTeamName];
        }

        if (!existing.projectTeamNames.includes(teamName)) {
          existing.projectTeamNames.push(teamName);
        }
      }
    }
  }

  return members.sort((a, b) =>
    getMemberName(a).localeCompare(getMemberName(b), "fr", {
      sensitivity: "base",
    })
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profile } = useAuth();

  const role = String(profile?.role || "").toUpperCase();

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

  const canManage = MANAGEMENT_ROLES.includes(role);
  const myUid = normalizeUid(profile);

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const [structureOpen, setStructureOpen] = useState(false);
  const [structure, setStructure] = useState([]);
  
  const [employees, setEmployees] = useState([]);
  const [responsiblePicker, setResponsiblePicker] = useState(null);
  const [sectionDialog, setSectionDialog] = useState(null);

  // Réparation d'un ancien projet créé sans relation projectTeams.
  const [teamPicker, setTeamPicker] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loadingAvailableTeams, setLoadingAvailableTeams] = useState(false);
  const [addingTeamId, setAddingTeamId] = useState("");
  const [teamPickerError, setTeamPickerError] = useState("");

async function load() {
  try {
    setError("");

    const [result, employeesResult] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get("/employees"),
    ]);

    setData(result);

    const employeeList = Array.isArray(employeesResult)
      ? employeesResult
      : Array.isArray(employeesResult?.employees)
        ? employeesResult.employees
        : Array.isArray(employeesResult?.data)
          ? employeesResult.data
          : [];

    setEmployees(employeeList);

    let sections = [];

      /**
       * Nouveau format :
       * sections directement rattachées au projet.
       */
      if (Array.isArray(result?.sections)) {
        sections = result.sections.map((section) =>
          normalizeSection(section)
        );
      }

      /**
       * Compatibilité avec l'ancien format :
       * sections situées dans les équipes.
       */
      if (!sections.length && Array.isArray(result?.teams)) {
        sections = result.teams.flatMap((team) =>
          (team.sections || []).map((section) =>
            normalizeSection(section, team.id)
          )
        );
      }

      setStructure(sections);
    } catch (e) {
      setError(
        e?.message || "Impossible de récupérer le projet."
      );
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const projectTasks = useMemo(() => {
    const globalTasks = Array.isArray(data?.sections)
      ? data.sections.flatMap((section) => section.tasks || [])
      : [];

    const teamTasks = Array.isArray(data?.teams)
      ? data.teams.flatMap((team) =>
          (team.sections || []).flatMap(
            (section) => section.tasks || []
          )
        )
      : [];

    const merged = [...globalTasks, ...teamTasks];

    const seen = new Set();

    return merged.filter((task) => {
      const taskId = task?.id;

      if (!taskId) {
        return true;
      }

      if (seen.has(String(taskId))) {
        return false;
      }

      seen.add(String(taskId));

      return true;
    });
  }, [data]);

  const projectProgress =
    data?.progress !== undefined && data?.progress !== null
      ? Number(data.progress)
      : getProgress(projectTasks);

  const projectTeams = Array.isArray(data?.teams)
    ? data.teams
    : [];

  const hasStructure =
    structure.length > 0 ||
    (Array.isArray(data?.sections) && data.sections.length > 0) ||
    projectTeams.some(
      (team) =>
        Array.isArray(team.sections) &&
        team.sections.length > 0
    );

  /**
   * Équipes déjà sélectionnées lors de la création du projet.
   */
  const structureTeams = useMemo(() => {
    if (isSuperAdmin || isAdmin || isManager) {
      return projectTeams;
    }

    return [];
  }, [
    projectTeams,
    isSuperAdmin,
    isAdmin,
    isManager,
  ]);

  /**
   * Membres disponibles pour attribuer une section.
   *
   * IMPORTANT :
   * Il n'y a plus de sélection d'équipe dans le formulaire.
   */
  const projectMembers = useMemo(
    () => getProjectMembers(projectTeams, employees),
    [projectTeams, employees]
  );

  const canStructure = canManage;

  /**
   * Recherche une équipe du projet par son ID.
   */
  function getProjectTeam(teamId) {
    if (!teamId) return null;

    return (
      projectTeams.find(
        (team) => String(team.id) === String(teamId)
      ) || null
    );
  }

  /**
   * Membres d'une équipe précise.
   */
function getSectionMembers(teamId) {
  const team = getProjectTeam(teamId);

  if (!team) {
    return [];
  }

  /*
   * 1. Si le backend fournit déjà les objets membres,
   *    on les utilise directement.
   */
  const directMembers = getTeamMembers(team);

  /*
   * 2. Certaines réponses backend ne fournissent que
   *    memberIds. On reconstruit alors la liste à partir
   *    des employés chargés depuis /employees.
   */
  const memberIds = Array.isArray(team.memberIds)
    ? team.memberIds.map((id) => String(id))
    : [];

  const sourceTeamIds = new Set(
    [team.teamId, team.sourceTeamId, team.id]
      .filter(Boolean)
      .map(String)
  );

  const resolvedMembers = employees.filter((employee) => {
    const employeeId = getMemberId(employee);

    if (!employeeId) return false;

    if (memberIds.includes(employeeId)) return true;

    const employeeTeamIds = [
      employee?.teamId,
      ...(Array.isArray(employee?.teamIds) ? employee.teamIds : []),
    ]
      .filter(Boolean)
      .map(String);

    return employeeTeamIds.some((employeeTeamId) =>
      sourceTeamIds.has(employeeTeamId)
    );
  });

  /*
   * 3. On ajoute le manager/leader lorsqu'il existe
   *    dans les données de l'équipe.
   */
  const managerId = getTeamManagerId(team);

  const managerFromEmployees = employees.find(
    (employee) =>
      getMemberId(employee) === managerId
  );

  const allMembers = [
    ...directMembers,
    ...resolvedMembers,
  ];

  if (managerFromEmployees) {
    allMembers.push(managerFromEmployees);
  }

  /*
   * 4. Suppression des doublons.
   */
  const unique = new Map();

  for (const member of allMembers) {
    const memberId = getMemberId(member);

    if (!memberId) continue;

    if (!unique.has(memberId)) {
      unique.set(memberId, {
        ...member,
        uid: memberId,
      });
    }
  }

  return Array.from(unique.values()).sort((a, b) =>
    getMemberName(a).localeCompare(
      getMemberName(b),
      "fr",
      { sensitivity: "base" }
    )
  );
}

  /**
   * Trouve automatiquement l'équipe d'un membre.
   *
   * L'équipe n'est plus choisie manuellement dans la section.
   */
  function getMemberProjectTeam(memberId) {
    if (!memberId) return null;

    const normalizedId = String(memberId);

    const fromProjectMembers = projectMembers.find(
      (member) => getMemberId(member) === normalizedId
    );

    if (fromProjectMembers) return fromProjectMembers;

    for (const team of projectTeams) {
      const member = getSectionMembers(team.id).find(
        (candidate) => getMemberId(candidate) === normalizedId
      );

      if (member) {
        return {
          ...member,
          uid: normalizedId,
          projectTeamId: String(team.id),
          projectTeamName: team.name || team.teamName || "Équipe",
        };
      }
    }

    return null;
  }

  function openStructure() {
    setError("");

    if (!canStructure) {
      setError(
        "Vous n'avez pas les droits nécessaires pour structurer ce projet."
      );
      return;
    }

    if (!structure.length) {
      setStructure([
        {
          id: null,
          projectTeamId:
            structureTeams.length === 1
              ? String(structureTeams[0].id)
              : "",
          name: "",
          description: "",
          weight: "",
          assigneeId: "",
        },
      ]);
    }

    setStructureOpen(true);
  }

  function addSection() {
    setStructure((current) => [
      ...current,
      {
        id: null,
        projectTeamId: "",
        name: "",
        description: "",
        weight: "",
        assigneeId: "",
      },
    ]);
  }

  /**
   * Modification d'une section.
   *
   * Pour le responsable :
   * - l'utilisateur choisit seulement le membre ;
   * - son équipe est automatiquement récupérée ;
   * - projectTeamId est automatiquement mis à jour.
   */
  function updateSection(index, field, value) {
    setStructure((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (field === "assigneeId") {
          const selectedMember = getMemberProjectTeam(value);

          return {
            ...item,
            assigneeId: value,
            projectTeamId:
              selectedMember?.projectTeamId ||
              item.projectTeamId ||
              "",
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  }

  function removeSection(index) {
    setStructure((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  }

  function getStructureTotal() {
    return structure.reduce(
      (sum, section) =>
        sum + Number(section.weight || 0),
      0
    );
  }

  async function openTeamPicker() {
    setTeamPicker(true);
    setTeamPickerError("");
    setLoadingAvailableTeams(true);

    try {
      /*
       * Ne pas utiliser uniquement `data.teams` ici.
       * Le détail du projet peut provenir du cache HTTP (304) et afficher
       * temporairement 0 équipe alors que la relation existe bien dans
       * Firestore. La collection projectTeams est la source de vérité.
       */
      const [teamsResult, linkedResult] = await Promise.all([
        api.get("/teams"),
        api.get(`/project-management/projects/${id}/teams`),
      ]);

      const list = Array.isArray(teamsResult)
        ? teamsResult
        : Array.isArray(teamsResult?.teams)
          ? teamsResult.teams
          : Array.isArray(teamsResult?.data)
            ? teamsResult.data
            : [];

      const linkedTeams = Array.isArray(linkedResult)
        ? linkedResult
        : Array.isArray(linkedResult?.teams)
          ? linkedResult.teams
          : Array.isArray(linkedResult?.data)
            ? linkedResult.data
            : [];

      const linkedTeamIds = new Set(
        linkedTeams
          .map((team) =>
            String(team?.teamId || team?.sourceTeamId || "").trim()
          )
          .filter(Boolean)
      );

      /*
       * Synchronise immédiatement le détail local du projet avec la
       * source de vérité. Cela remet aussi le compteur "Équipes" à jour.
       */
      if (linkedTeams.length) {
        setData((current) =>
          current
            ? {
                ...current,
                teams: linkedTeams,
              }
            : current
        );
      }

      setAvailableTeams(
        list.filter((team) => {
          const teamId = String(team?.id || "").trim();
          return teamId && !linkedTeamIds.has(teamId);
        })
      );
    } catch (e) {
      setAvailableTeams([]);
      setTeamPickerError(
        e?.message || "Impossible de récupérer les équipes du projet."
      );
    } finally {
      setLoadingAvailableTeams(false);
    }
  }

  async function addTeamToProject(team) {
    const teamId = String(team?.id || "").trim();

    if (!teamId) return;

    setAddingTeamId(teamId);
    setTeamPickerError("");

    try {
      // Sans poids explicite, le backend attribue automatiquement le
      // poids restant. Pour un projet sans équipe, cela donne 100 %.
      await api.post(`/projects/${id}/teams`, {
        teamId,
      });

      setTeamPicker(false);
      setAvailableTeams([]);
      await load();
    } catch (e) {
      setTeamPickerError(
        e?.message || "Impossible de rattacher cette équipe au projet."
      );
    } finally {
      setAddingTeamId("");
    }
  }

  function validateStructure() {
    if (!structure.length) {
      return "Ajoutez au moins une section.";
    }

    if (!structureTeams.length) {
      return "Aucune équipe n'est disponible pour ce projet.";
    }

    for (const section of structure) {
      /**
       * Le responsable est obligatoire.
       */
      if (!section.assigneeId) {
        return `Sélectionnez un responsable pour la section « ${
          section.name || "sans nom"
        } ».`;
      }

      /**
       * L'équipe est déterminée automatiquement
       * à partir du membre sélectionné.
       */
      const selectedMember = getMemberProjectTeam(
        section.assigneeId
      );

      if (!selectedMember) {
        return `Le responsable sélectionné pour la section « ${
          section.name || "sans nom"
        } » n'appartient à aucune équipe de ce projet.`;
      }

      if (!section.projectTeamId) {
        return `Impossible de déterminer l'équipe du responsable de la section « ${
          section.name || "sans nom"
        } ».`;
      }

      if (
        String(section.projectTeamId) !==
        String(selectedMember.projectTeamId)
      ) {
        return `L'équipe du responsable de la section « ${
          section.name || "sans nom"
        } » est incohérente.`;
      }

      if (!String(section.name || "").trim()) {
        return "Chaque section doit avoir un nom.";
      }

      const weight = Number(section.weight);

      if (!Number.isFinite(weight) || weight <= 0) {
        return "Chaque section doit avoir un poids supérieur à 0 %.";
      }

      if (weight > 100) {
        return "Le poids d'une section ne peut pas dépasser 100 %.";
      }
    }

    const total = getStructureTotal();

    if (Math.abs(total - 100) > 0.01) {
      return `Les sections du projet doivent totaliser 100 %. Total actuel : ${Number(
        total.toFixed(2)
      )} %.`;
    }

    return "";
  }

  async function saveStructure() {
    const validation = validateStructure();

    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");

    const hadStructureBeforeSave = hasStructure;

    try {
      const sectionsToSave = structure.map(
        (section) => ({
          id: section.id || undefined,

          name: String(
            section.name || ""
          ).trim(),

          description: String(
            section.description || ""
          ).trim(),

          weight: Number(section.weight),

          assigneeId: String(
            section.assigneeId || ""
          ),

          /**
           * Déterminé automatiquement à partir
           * du membre responsable.
           */
          projectTeamId: String(
            section.projectTeamId
          ),
        })
      );

      await api.put(
        `/projects/${id}/structure`,
        {
          sections: sectionsToSave,
        }
      );

      if (!hadStructureBeforeSave) {
        setStatusSaving(true);

        try {
          await api.patch(
            `/projects/${id}/status`,
            {
              status: "PLANNED",
            }
          );
        } finally {
          setStatusSaving(false);
        }
      }

      setStructureOpen(false);

      await load();
    } catch (e) {
      setError(
        e?.message ||
          "Impossible d'enregistrer la structure."
      );
    } finally {
      setSaving(false);
      setStatusSaving(false);
    }
  }

  async function changeStatus(value) {
    setStatusSaving(true);
    setError("");

    try {
      await api.patch(
        `/projects/${id}/status`,
        {
          status: value,
        }
      );

      await load();
    } catch (e) {
      setError(
        e?.message ||
          "Impossible de modifier le statut."
      );
    } finally {
      setStatusSaving(false);
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

  const structureTotal = getStructureTotal();

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden pb-10">
      <button
        type="button"
        onClick={() => nav("/projets")}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <FaArrowLeft />
        Projets
      </button>

      {/* =========================================================
          EN-TÊTE
          ========================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
              {data.status}
            </span>

            <span className="text-xs text-muted">
              v{data.version || 1}
            </span>
          </div>

          <Title
            as="h1"
            variant="page"
            className="mt-2 break-words"
          >
            {data.name}
          </Title>

          <p className="mt-1 max-w-3xl break-words text-sm text-muted">
            {data.objective || data.description}
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 lg:w-auto">
          {canStructure && (
            <Button
              onClick={openStructure}
              variant="secondary"
            >
              {hasStructure ? (
                <FaEdit />
              ) : (
                <FaPlus />
              )}

              {hasStructure
                ? "Modifier la structure"
                : "Créer la structure"}
            </Button>
          )}

          {canManage && (
            <select
              value={data.status}
              onChange={(event) =>
                changeStatus(
                  event.target.value
                )
              }
              disabled={statusSaving}
              className="min-w-0 rounded-xl border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="DRAFT">
                DRAFT
              </option>

              <option value="PLANNED">
                PLANNED
              </option>

              <option value="ACTIVE">
                ACTIVE
              </option>

              <option value="PAUSED">
                PAUSED
              </option>

              <option value="COMPLETED">
                COMPLETED
              </option>

              <option value="ARCHIVED">
                ARCHIVED
              </option>

              <option value="CANCELLED">
                CANCELLED
              </option>
            </select>
          )}
        </div>
      </div>

      {error && (
        <Card className="mt-4 border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </Card>
      )}

      {/* =========================================================
          KPI
          ========================================================= */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs text-muted">
            Progression validée
          </p>

          <p className="mt-2 text-3xl font-bold text-primary">
            {projectProgress}%
          </p>

          <div className="mt-3">
            <Progress value={projectProgress} />
          </div>

          <p className="mt-2 text-xs text-muted">
            {
              projectTasks.filter(
                isValidated
              ).length
            }
            /{projectTasks.length} tâches validées
          </p>
        </Card>

        <Card>
          <p className="text-xs text-muted">
            Sections
          </p>

          <p className="mt-2 text-3xl font-bold">
            {structure.length}
          </p>

          <p className="text-xs text-muted">
            dans la structure
          </p>
        </Card>

        <Card>
          <p className="text-xs text-muted">
            Équipes
          </p>

          <p className="mt-2 text-3xl font-bold">
            {projectTeams.length}
          </p>

          <FaUsers className="mt-2 text-primary" />
        </Card>

        <Card>
          <p className="text-xs text-muted">
            Échéance
          </p>

          <p className="mt-2 text-base font-bold">
            {data.plannedEndDate
              ? new Date(
                  data.plannedEndDate
                ).toLocaleDateString(
                  "fr-FR"
                )
              : "Non définie"}
          </p>

          <FaClock className="mt-2 text-amber-500" />
        </Card>
      </div>

      {/* =========================================================
          STRUCTURE
          ========================================================= */}

      {canStructure && structureOpen && (
        <Card className="mt-6 min-w-0 border-primary/30 bg-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">
                Structure du projet
              </h2>

              <p className="mt-1 text-xs text-muted">
                Rattachez d'abord les équipes au projet,
                puis sélectionnez pour chaque section le
                membre qui en sera responsable.
              </p>
            </div>

            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Button
                variant="secondary"
                onClick={openTeamPicker}
              >
                <FaUsers />
                Ajouter une équipe
              </Button>

              <Button
                variant="secondary"
                onClick={addSection}
                disabled={!projectTeams.length}
              >
                <FaPlus />
                Ajouter une section
              </Button>

              <Button
                variant="secondary"
                onClick={() =>
                  setStructureOpen(false)
                }
              >
                Annuler
              </Button>

              <Button
                onClick={saveStructure}
                loading={saving}
              >
                Enregistrer
              </Button>
            </div>
          </div>

          {/* =====================================================
              TOTAL
              ===================================================== */}

          <div
            className={`mt-5 rounded-xl border p-4 ${
              Math.abs(
                structureTotal - 100
              ) <= 0.01
                ? "border-green-200 bg-green-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  Poids total de la structure
                </p>

                <p className="text-xs text-muted">
                  Toutes les sections doivent
                  totaliser exactement 100 %.
                </p>
              </div>

              <p
                className={`text-xl font-bold ${
                  Math.abs(
                    structureTotal - 100
                  ) <= 0.01
                    ? "text-green-700"
                    : "text-amber-700"
                }`}
              >
                {Number(
                  structureTotal.toFixed(2)
                )}
                %
              </p>
            </div>

            <div className="mt-3">
              <Progress
                value={structureTotal}
              />
            </div>
          </div>

          {/* =====================================================
              SECTIONS
              ===================================================== */}

          <div className="mt-5 space-y-3">
            {structure.map(
              (item, index) => {
                const selectedMember =
                  getMemberProjectTeam(
                    item.assigneeId
                  );

                const selectedTeam =
                  item.projectTeamId
                    ? getProjectTeam(
                        item.projectTeamId
                      )
                    : selectedMember
                    ? getProjectTeam(
                        selectedMember.projectTeamId
                      )
                    : null;

                const managerId =
                  selectedTeam
                    ? getTeamManagerId(
                        selectedTeam
                      )
                    : "";

                return (
                  <div
                    key={
                      item.id ||
                      `new-section-${index}`
                    }
                    className="min-w-0 rounded-xl border border-line bg-surface-2 p-3 sm:p-4"
                  >
                    <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_120px_40px]">

                      {/* =================================================
                          NOM
                          ================================================= */}

                      <input
                        value={item.name}
                        onChange={(event) =>
                          updateSection(
                            index,
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="Nom de la section"
                        className="min-w-0 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
                      />

                      {/* =================================================
                          RESPONSABLE
                          ================================================= */}

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            setResponsiblePicker({ index })
                          }
                          className="flex min-h-10 w-full items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 text-left text-sm hover:border-primary hover:bg-primary/5"
                        >
                          {selectedMember ? (
                            <>
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {getMemberName(selectedMember)
                                  .split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part) => part[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">
                                  {getMemberName(selectedMember)}
                                </p>
                                <p className="truncate text-[11px] text-muted">
                                  {selectedMember.projectTeamNames?.join(" / ") || selectedMember.projectTeamName || "Équipe"}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <FaUser className="shrink-0 text-muted" />
                              <span className="text-muted">Responsable de section</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* =================================================
                          POIDS
                          ================================================= */}

                      <input
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={item.weight}
                        onChange={(event) =>
                          updateSection(
                            index,
                            "weight",
                            event.target.value
                          )
                        }
                        placeholder="Poids %"
                        className="min-w-0 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
                      />

                      {/* =================================================
                          SUPPRESSION
                          ================================================= */}

                      <button
                        type="button"
                        onClick={() =>
                          removeSection(
                            index
                          )
                        }
                        className="min-h-10 rounded-lg text-red-600 hover:bg-red-50"
                        aria-label="Supprimer la section"
                      >
                        ×
                      </button>

                      {/* =================================================
                          DESCRIPTION
                          ================================================= */}

                      <textarea
                        value={
                          item.description
                        }
                        onChange={(event) =>
                          updateSection(
                            index,
                            "description",
                            event.target.value
                          )
                        }
                        placeholder="Description (facultatif)"
                        className="min-h-[80px] min-w-0 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm lg:col-span-4"
                        rows={2}
                      />

                      {/* =================================================
                          INFO RESPONSABLE / ÉQUIPE
                          ================================================= */}

                      {selectedMember && (
                        <div className="min-w-0 rounded-lg border border-primary/10 bg-primary/5 p-3 text-xs lg:col-span-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                            <div className="min-w-0 break-words">
                              <span className="font-semibold">
                                Responsable :
                              </span>{" "}
                              {getMemberName(
                                selectedMember
                              )}
                            </div>

                            <div className="min-w-0 break-words">
                              <span className="font-semibold">
                                Équipe :
                              </span>{" "}
                              {selectedMember.projectTeamNames?.join(
                                " / "
                              ) ||
                                selectedMember.projectTeamName ||
                                selectedTeam?.name ||
                                "Non définie"}
                            </div>
                          </div>

                          {managerId &&
                            getMemberId(
                              selectedMember
                            ) === managerId && (
                              <p className="mt-1 text-muted">
                                Ce membre est le
                                manager de son équipe.
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}

            {!structure.length && (
              <div className="rounded-xl border border-dashed border-line p-8 text-center">
                <p className="text-sm text-muted">
                  Aucune section dans la
                  structure.
                </p>

                <Button
                  className="mt-4"
                  onClick={addSection}
                >
                  <FaPlus />
                  Ajouter une section
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {teamPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => !addingTeamId && setTeamPicker(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="font-bold">Ajouter une équipe au projet</h3>
                <p className="mt-1 text-xs text-muted">
                  Sélectionnez une équipe autorisée pour ce projet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !addingTeamId && setTeamPicker(false)}
                className="rounded-lg px-3 py-2 text-lg text-muted hover:bg-surface-2"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {teamPickerError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {teamPickerError}
                </div>
              )}

              {loadingAvailableTeams ? (
                <div className="space-y-3">
                  <div className="h-16 animate-pulse rounded-xl bg-surface-2" />
                  <div className="h-16 animate-pulse rounded-xl bg-surface-2" />
                  <div className="h-16 animate-pulse rounded-xl bg-surface-2" />
                </div>
              ) : availableTeams.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableTeams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      disabled={Boolean(addingTeamId)}
                      onClick={() => addTeamToProject(team)}
                      className="rounded-xl border border-line p-4 text-left transition hover:border-primary hover:bg-primary/5 disabled:cursor-wait disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <FaUsers />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {team.name || "Équipe"}
                          </p>
                          <p className="text-xs text-muted">
                            {Array.isArray(team.memberIds)
                              ? team.memberIds.length
                              : 0}{" "}
                            membre
                            {Array.isArray(team.memberIds) && team.memberIds.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {addingTeamId === String(team.id) && (
                        <p className="mt-3 text-xs font-semibold text-primary">
                          Rattachement en cours...
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line p-8 text-center">
                  <FaUsers className="mx-auto text-2xl text-muted" />
                  <p className="mt-3 text-sm font-semibold">
                    Aucune équipe disponible à ajouter
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Toutes les équipes accessibles sont déjà rattachées à ce projet,
                    ou aucune équipe n'est disponible pour votre compte.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {responsiblePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => setResponsiblePicker(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="font-bold">Choisir le responsable</h3>
                <p className="mt-1 text-xs text-muted">Sélectionnez un membre d'une équipe rattachée à ce projet.</p>
              </div>
              <button type="button" onClick={() => setResponsiblePicker(null)} className="rounded-lg px-3 py-2 text-lg text-muted hover:bg-surface-2">×</button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {!projectTeams.length ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-8 text-center">
                  <FaUsers className="mx-auto text-2xl text-amber-600" />
                  <p className="mt-3 text-sm font-semibold text-amber-900">
                    Aucune équipe n'est rattachée à ce projet
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Ce projet semble avoir été créé sans relation d'équipe.
                    Rattachez une équipe avant d'attribuer une section.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setResponsiblePicker(null);
                      openTeamPicker();
                    }}
                  >
                    <FaUsers />
                    Ajouter une équipe au projet
                  </Button>
                </div>
              ) : (
                <>
                  {projectTeams.map((team) => {
                    const members = getSectionMembers(team.id);

                    return (
                      <div key={team.id} className="mb-5 last:mb-0">
                        <div className="mb-2 flex items-center gap-2">
                          <FaUsers className="text-primary" />
                          <div className="min-w-0">
                            <h4 className="font-semibold">
                              {team.name || team.teamName || "Équipe"}
                            </h4>
                            <p className="text-[11px] text-muted">
                              {members.length} membre{members.length > 1 ? "s" : ""} disponible{members.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        {members.length ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {members.map((member) => {
                              const memberId = getMemberId(member);
                              const isSelected =
                                structure[responsiblePicker.index]?.assigneeId === memberId;
                              const isManager =
                                getTeamManagerId(team) === memberId;

                              return (
                                <button
                                  key={`${team.id}-${memberId}`}
                                  type="button"
                                  onClick={() => {
                                    updateSection(
                                      responsiblePicker.index,
                                      "assigneeId",
                                      memberId
                                    );
                                    setResponsiblePicker(null);
                                  }}
                                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                                    isSelected
                                      ? "border-primary bg-primary/10"
                                      : "border-line hover:border-primary hover:bg-primary/5"
                                  }`}
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                    {getMemberName(member)
                                      .split(" ")
                                      .filter(Boolean)
                                      .slice(0, 2)
                                      .map((part) => part[0])
                                      .join("")
                                      .toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold">
                                      {getMemberName(member)}
                                    </p>
                                    <p className="truncate text-xs text-muted">
                                      {member.email ||
                                        member.matricule ||
                                        "Membre de l'équipe"}
                                    </p>
                                    {isManager && (
                                      <p className="mt-0.5 text-[11px] font-semibold text-primary">
                                        Manager de l'équipe
                                      </p>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <span className="text-xs font-bold text-primary">
                                      Sélectionné
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-semibold text-amber-900">
                              Cette équipe n'a aucun membre disponible
                            </p>
                            <p className="mt-1 text-xs text-amber-800">
                              L'équipe est bien rattachée au projet, mais aucun
                              membre n'a pu être récupéré pour cette équipe.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!projectTeams.some((team) => getSectionMembers(team.id).length) && (
                    <div className="mt-3 rounded-xl border border-dashed border-line p-6 text-center">
                      <FaUsers className="mx-auto text-2xl text-muted" />
                      <p className="mt-3 text-sm font-semibold">
                        Aucune équipe du projet ne possède de membre disponible
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Vérifiez les membres de chaque équipe depuis la page Équipes.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ÉQUIPES DU PROJET
          ========================================================= */}

      <div className="mt-6 space-y-5">
        {projectTeams.map((team) => {
          const teamTasks = (
            team.sections || []
          ).flatMap(
            (section) =>
              section.tasks || []
          );

          const teamManagerId =
            getTeamManagerId(team);

          const manager =
            (team.members || []).find(
              (member) =>
                getMemberId(member) ===
                teamManagerId
            ) ||
            team.manager ||
            team.leader;

          return (
            <Card
              key={team.id}
              className="min-w-0 bg-white"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FaUsers className="shrink-0 text-primary" />

                    <h2 className="break-words font-bold">
                      {team.name}
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-muted">
                    Poids projet :{" "}
                    {team.weight ?? 0}%
                  </p>

                  <p className="mt-1 break-words text-xs text-muted">
                    Responsable :{" "}
                    {getMemberName(
                      manager
                    ) !== "Utilisateur"
                      ? getMemberName(
                          manager
                        )
                      : teamManagerId ||
                        "Non défini"}
                  </p>
                </div>

                <div className="w-full min-w-0 lg:w-[220px]">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">
                      Progression équipe
                    </span>

                    <span className="font-bold text-primary">
                      {getProgress(
                        teamTasks
                      )}
                      %
                    </span>
                  </div>

                  <div className="mt-2">
                    <Progress
                      value={getProgress(
                        teamTasks
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(team.sections || []).map(
                  (section) => {
                    const assignedToMe =
                      String(
                        section.assigneeId ||
                          ""
                      ) === myUid;

                    const canAccessSection =
                      canManage ||
                      assignedToMe;

                    return (
                      <div
                        key={section.id}
                        role={canAccessSection ? "button" : undefined}
                        tabIndex={canAccessSection ? 0 : undefined}
                        onClick={
                          canAccessSection
                            ? () =>
                                setSectionDialog({
                                  ...section,
                                  projectId: id,
                                  projectTeamId:
                                    section.projectTeamId || team.id,
                                  teamId:
                                    section.teamId || team.teamId,
                                })
                            : undefined
                        }
                        onKeyDown={
                          canAccessSection
                            ? (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  setSectionDialog({
                                    ...section,
                                    projectId: id,
                                    projectTeamId:
                                      section.projectTeamId || team.id,
                                    teamId:
                                      section.teamId || team.teamId,
                                  });
                                }
                              }
                            : undefined
                        }
                        className={`min-w-0 rounded-xl border border-line p-4 transition ${
                          canAccessSection
                            ? "cursor-pointer hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="break-words font-bold">
                              {
                                section.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              Poids :{" "}
                              {section.weight ??
                                0}
                              % ·{" "}
                              {section.tasks
                                ?.length ||
                                0}{" "}
                              tâche(s)
                            </p>

                            <p className="mt-1 break-words text-xs text-muted">
                              Responsable :{" "}
                              {section.assignee
                                ?.name ||
                                section.assignee
                                  ?.displayName ||
                                section.assigneeId ||
                                "Non attribuée"}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {assignedToMe && (
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                                Ma section
                              </span>
                            )}

                            {canAccessSection && (
                              <Button
                                variant="secondary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSectionDialog({
                                    ...section,
                                    projectId: id,
                                    projectTeamId: section.projectTeamId || team.id,
                                    teamId: section.teamId || team.teamId,
                                  });
                                }}
                              >
                                Ouvrir la section
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3">
                          <Progress
                            value={getProgress(
                              section.tasks ||
                                []
                            )}
                          />

                          <p className="mt-1 text-right text-xs text-muted">
                            {getProgress(
                              section.tasks ||
                                []
                            )}
                            %
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* =========================================================
          AUCUNE STRUCTURE
          ========================================================= */}

      {!hasStructure && (
        <Card className="mt-6 py-10 text-center text-sm text-muted">
          <p>
            La structure du projet n&apos;a
            pas encore été créée.
          </p>

          {canStructure && (
            <Button
              className="mt-4"
              onClick={openStructure}
            >
              <FaPlus />
              Créer la structure
            </Button>
          )}
        </Card>
      )}

      {sectionDialog && (
        <SectionTasksDialog
          open={Boolean(sectionDialog)}
          onClose={() => setSectionDialog(null)}
          projectId={id}
          section={sectionDialog}
          canManage={canManage}
        />
      )}

      {/* =========================================================
          ANALYTICS
          ========================================================= */}

      <div className="mt-6">
        <Link
          to={`/projets/${id}/analytics`}
          className="text-sm font-semibold text-primary"
        >
          Voir l'analyse détaillée du projet →
        </Link>
      </div>
    </div>
  );
}