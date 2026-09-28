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

  const isCompleted = ["COMPLETED", "VALIDATED"].includes(
    String(task.status || "").toUpperCase()
  );

  const points = Number(task.estimatePoints ?? task.weight ?? 1) || 1;
  const kpiPercent = isCompleted ? 100 : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      className="max-w-2xl"
    >
      <div className="flex max-h-[78vh] min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-5 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-xl font-display text-ink">
                  {task.title}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {task.description || "Aucune description."}
                </p>
              </div>

              <Badge
                tone={getTaskTimelineTone(task)}
                className="whitespace-nowrap"
              >
                {getTaskTimelineLabel(task)}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoLine
                label={task.projectName ? "Projet" : "Projet"}
                value={task.projectName || "Sans projet"}
              />

              <InfoLine
                label="Équipe"
                value={task.teamName || "Sans équipe"}
              />

              <InfoLine
                label="Section"
                value={task.sectionName || "Sans section"}
              />

              <InfoLine
                label="Priorité"
                value={getPriorityLabel(task.priority)}
              />

              <InfoLine
                label="Charge"
                value={`${points} point(s)`}
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
                label={isCompleted ? "Date de réalisation" : "Date de création"}
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

              <div className="rounded-xl border border-line bg-surface-2 p-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-muted">
                  Statut
                </p>
                <Badge
                  className={`mt-1 border ${getTaskStatusColor(task.status)}`}
                >
                  {getTaskStatusLabel(task.status)}
                </Badge>
              </div>

              <InfoLine
                label="Assigné à"
                value={task.assigneeName || task.assigneeId || "—"}
              />

              <div className="rounded-xl border border-line bg-surface-2 p-3 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">
                      Contribution KPI
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {kpiPercent}% —{" "}
                      {isCompleted
                        ? "tâche validée"
                        : "tâche non validée"}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {kpiPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-line bg-white pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {allowEdit && (
                <Button
                  variant="outline"
                  onClick={() => onEdit?.(task)}
                >
                  Modifier
                </Button>
              )}

              {allowValidate && !isCompleted && (
                <Button
                  onClick={() => onValidate?.(task)}
                >
                  Valider la tâche
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
      </div>
    </Dialog>
  );
}

function getPriorityLabel(priority) {
  const labels = {
    LOW: "Basse",
    MEDIUM: "Moyenne",
    HIGH: "Haute",
    URGENT: "Urgente",
  };

  return labels[String(priority || "").toUpperCase()] || priority || "—";
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <p className="text-xs uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-ink">
        {value}
      </p>
    </div>
  );
}
