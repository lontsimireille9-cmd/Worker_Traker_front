export const REPORT_COLORS = ["#1769E8", "#10B981", "#F59E0B", "#7C3AED", "#0891B2", "#64748B", "#EF4444", "#DB2777"];

function parseReportDate(value) {
  if (!value) return null;
  const date = new Date(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatReportDate(value, options = {}) {
  const date = parseReportDate(value);
  return date ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", ...options }).format(date) : "Date inconnue";
}

export function formatShortDay(value) {
  const date = parseReportDate(value);
  if (!date) return "—";
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", "").slice(0, 3);
  return `${String(date.getDate()).padStart(2, "0")} ${month}`;
}

export function getParticipation(employee, total) {
  return total ? Number(((employee.completed / total) * 100).toFixed(1)) : 0;
}

export function buildReportViewModel(report) {
  const periodDays = Number(report?.periodDays) || 1;
  const endDate = report?.endDate || report?.to || new Date().toISOString();
  const startDate = report?.startDate || report?.from || new Date(new Date(endDate).getTime() - (periodDays - 1) * 86400000).toISOString();
  const employees = (report?.byEmployee || []).map((employee, index) => ({
    ...employee,
    color: REPORT_COLORS[index % REPORT_COLORS.length],
    participation: getParticipation(employee, report.completedTasks || 0),
    daily: employee.daily || Array(periodDays).fill(0),
    dailyAverage: employee.dailyAverage ?? Number(((employee.completed || 0) / periodDays).toFixed(1)),
  }));
  const participationTotal = employees.reduce((sum, employee) => sum + employee.participation, 0);
  return { ...report, startDate, endDate, periodDays, daily: report?.daily || [], employees, participationTotal };
}
