import Dialog from "../ui/dialog";
import Button from "../ui/button";
import Badge from "../ui/badge";
import {
  formatTaskDate,
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
  if (!task) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} className="max-w-2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-display text-ink">{task.title}</h3>
            <p className="mt-1 text-sm text-muted">{task.description || "Aucune description."}</p>
          </div>
          <Badge tone={getTaskTimelineTone(task)} className="whitespace-nowrap">
            {getTaskTimelineLabel(task)}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoLine label="Date" value={formatTaskDate(task.createdAt)} />

          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <p className="text-xs uppercase tracking-wide text-muted">Statut</p>
            <Badge className={`mt-1 border ${getTaskStatusColor(task.status)}`}>{getTaskStatusLabel(task.status)}</Badge>
          </div>

          <InfoLine label="Assigné à" value={task.assigneeName || task.assigneeId || "—"} />
          <InfoLine label="Ordre" value={Number.isFinite(Number(task.sortOrder)) ? String(task.sortOrder) : "—"} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {allowEdit && (
              <Button variant="outline" onClick={() => onEdit?.(task)}>
                Modifier
              </Button>
            )}
            {allowValidate && task.status !== "COMPLETED" && (
              <Button onClick={() => onValidate?.(task)}>
                Valider
              </Button>
            )}
          </div>

          {allowReorder && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onMoveUp?.(task)}>
                Monter
              </Button>
              <Button variant="outline" size="sm" onClick={() => onMoveDown?.(task)}>
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
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
