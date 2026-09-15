import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";
import Select from "../components/ui/select";
import Button from "../components/ui/button";
import TaskDetailsDialog from "../components/tasks/TaskDetailsDialog";
import {
  formatTaskDate,
  getTaskDateKey,
  getTaskStatusLabel,
  getTaskStatusColor,
  getTaskTimelineLabel,
  getTaskTimelineTone,
  groupTasksByCreationDate,
  sortTasksByDisplayOrder,
} from "../utils/getTaskDisplayStatus";

const STATUS_FILTERS = [
  { value: "ALL", label: "Toutes" },
  { value: "COMPLETED", label: "Faites" },
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "REVIEW", label: "En révision" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "CANCELLED", label: "Annulées" },
];

export default function History() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { date } = useParams();
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    api.get("/tasks").then(setTasks).catch(() => {});
  }, []);

  const visibleTasks = useMemo(() => {
    const employeeTasks = sortTasksByDisplayOrder(tasks).filter((task) => task.assigneeId === profile?.uid);
    const filtered = statusFilter === "ALL" ? employeeTasks : employeeTasks.filter((task) => task.status === statusFilter);
    return filtered;
  }, [tasks, profile?.uid, statusFilter]);

  const groups = useMemo(() => groupTasksByCreationDate(visibleTasks), [visibleTasks]);
  const selectedTasks = useMemo(() => {
    if (!date) {
      return [];
    }

    return visibleTasks.filter((task) => getTaskDateKey(task.createdAt) === date);
  }, [date, visibleTasks]);

  const isEmployee = profile?.role === "EMPLOYEE";
  if (!isEmployee) {
    return (
      <Card>
        <p className="text-sm text-muted">{t("historyReserved")}</p>
      </Card>
    );
  }

  if (date) {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Title as="h1" variant="page" className="mb-1">
              Historique du {formatTaskDate(`${date}T12:00:00`)}
            </Title>
            <p className="text-sm text-muted">{t("historyDateDescription")}</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/historique")}>{t("backToHistory")}</Button>
        </div>

        <div className="mb-6 max-w-sm">
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={STATUS_FILTERS}
          />
        </div>

        <div className="space-y-3">
          {selectedTasks.map((task) => (
            <Card
              key={task.id}
              className="cursor-pointer hover:border-primary/30"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="text-xs text-muted mt-1">{task.description || "Aucune description."}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={getTaskTimelineTone(task)}>{getTaskTimelineLabel(task)}</Badge>
                  <Badge className={`border ${getTaskStatusColor(task.status)}`}>{getTaskStatusLabel(task.status)}</Badge>
                </div>
              </div>
            </Card>
          ))}

          {selectedTasks.length === 0 && <p className="text-sm text-muted">Aucune tâche pour cette date.</p>}
        </div>

        <TaskDetailsDialog
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          title={t("taskDetails")}
        />
      </div>
    );
  }

  const dateEntries = Object.entries(groups);
  const sortedDateEntries = dateEntries.sort(([dateA], [dateB]) => dateB.localeCompare(dateA));

  return (
    <div>
      <div className="mb-6">
        <Title as="h1" variant="page" className="mb-1">
          {t("history")}
        </Title>
        <p className="text-sm text-muted">{t("historyDescription")}</p>
      </div>

      <div className="mb-6 max-w-sm">
        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={STATUS_FILTERS}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedDateEntries.map(([dateKey, dayTasks]) => {
          const completed = dayTasks.filter((task) => task.status === "COMPLETED").length;
          return (
            <Card key={dateKey} className="cursor-pointer hover:border-primary/30" onClick={() => navigate(`/historique/${dateKey}`)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{formatTaskDate(`${dateKey}T12:00:00`)}</p>
                  <p className="text-xs text-muted mt-1">{dayTasks.length} {t("tasksRecorded")}</p>
                </div>
                <Badge tone={completed === dayTasks.length ? "success" : "warning"}>
                  {completed}/{dayTasks.length}
                </Badge>
              </div>
            </Card>
          );
        })}

        {sortedDateEntries.length === 0 && <p className="text-sm text-muted">{t("noHistory")}</p>}
      </div>
    </div>
  );
}
