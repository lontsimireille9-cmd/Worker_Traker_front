import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import TeamCalendar from "../components/calendar/TeamCalendar";

export default function Dashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    api.get("/tasks").then(setTasks).catch(() => {});
    api.get("/attendance/me").then(setAttendance).catch(() => {});
  }, []);

  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todo = tasks.filter((t) => t.status === "TODO").length;

  return (
    <div>
      <Title as="h1" variant="page" className="mb-1">
        Bonjour {profile?.name?.split(" ")[0] || ""}
      </Title>
      <p className="text-sm text-muted mb-8">Voici un aperçu de votre activité.</p>

      <div className="grid grid-cols-3 gap-4 max-w-2xl mb-8">
        <StatCard label="À faire" value={todo} />
        <StatCard label="En cours" value={inProgress} />
        <StatCard label="Terminées" value={completed} />
      </div>

      <div className="max-w-md">
        <TeamCalendar attendance={attendance} tasks={tasks} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card>
      <p className="text-xs text-muted mb-2">{label}</p>
      <p className="font-display text-3xl text-primary">{value}</p>
    </Card>
  );
}
