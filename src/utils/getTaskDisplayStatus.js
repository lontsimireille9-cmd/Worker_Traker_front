const STATUS_LABELS = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  REVIEW: "En révision",
  COMPLETED: "Fait",
  REJECTED: "Rejetée",
  CANCELLED: "Annulée",
};

const STATUS_COLORS = {
  TODO: "bg-surface-2 text-ink/70 border-line",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTaskDate(value, options = {}) {
  const date = toDate(value);
  if (!date) return "Date non disponible";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...options,
  });
}

export function formatTaskDateTime(value) {
  const date = toDate(value);
  if (!date) return "Date non disponible";

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTaskDateKey(value) {
  const date = toDate(value);
  if (!date) return "date-inconnue";

  return date.toLocaleDateString("sv-SE");
}

export function getTaskStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function getTaskStatusColor(status) {
  return STATUS_COLORS[status] || "bg-surface-2 text-ink/70 border-line";
}

export function isTaskCompleted(task) {
  return task?.status === "COMPLETED";
}

export function getTaskTimelineLabel(task) {
  if (isTaskCompleted(task)) {
    return "Fait";
  }

  return `Pas fait depuis : ${formatTaskDate(task?.createdAt)}`;
}

export function getTaskTimelineTone(task) {
  return isTaskCompleted(task) ? "success" : "warning";
}

export function sortTasksByDisplayOrder(tasks = []) {
  return [...tasks].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : toDate(a.createdAt)?.getTime() || 0;
    const orderB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : toDate(b.createdAt)?.getTime() || 0;

    if (orderA !== orderB) {
      return orderB - orderA;
    }

    return (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0);
  });
}

export function groupTasksByCreationDate(tasks = []) {
  return sortTasksByDisplayOrder(tasks).reduce((groups, task) => {
    const key = getTaskDateKey(task.createdAt);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
    return groups;
  }, {});
}
