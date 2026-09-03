import { FaTasks } from "react-icons/fa";
import Card from "../ui/card";
import Badge from "../ui/badge";
import { formatTaskDate, isTaskCompleted } from "../../utils/getTaskDisplayStatus";
import ChartHeading from "./ChartHeading";
import EmptyChart from "./EmptyChart";

export default function RecentTasks({ tasks, t }) {
  return <Card><ChartHeading icon={<FaTasks />} title={t("recentActivity")} text={t("recentTasksDescription")} /><div className="space-y-2">{tasks.map((task) => <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{task.title}</p><p className="mt-1 text-xs text-muted">{formatTaskDate(task.createdAt)}</p></div><Badge tone={isTaskCompleted(task) ? "success" : "warning"}>{isTaskCompleted(task) ? t("done") : t("toProcess")}</Badge></div>)}{tasks.length === 0 && <EmptyChart text={t("noActivity")} />}</div></Card>;
}
