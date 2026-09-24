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
