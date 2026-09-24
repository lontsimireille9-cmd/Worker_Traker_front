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
            value={task.assigneeName || "Non assignée"}
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
