import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";

export default function Attendance() {
  const { profile } = useAuth();
  const [history, setHistory] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function loadHistory() {
    api.get("/attendance/me").then(setHistory).catch(() => {});
    if (["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(profile?.role)) {
      api.get("/attendance/team").then(setTeamAttendance).catch(() => setTeamAttendance([]));
    }
  }

  useEffect(loadHistory, []);

  async function handleClock(type) {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post(`/attendance/${type}`, {});
      setMessage(res.message);
      loadHistory();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Title as="h1" variant="page" className="mb-1">
        Présence
      </Title>
      <p className="text-sm text-muted mb-8">Pointez votre arrivée et votre départ.</p>

      {profile?.role !== "SUPER_ADMIN" && (
        <div className="flex gap-3 mb-6">
          <Button onClick={() => handleClock("clock-in")} loading={loading} variant="primary">
            Pointer l'arrivée
          </Button>
          <Button onClick={() => handleClock("clock-out")} loading={loading} variant="outline">
            Pointer le départ
          </Button>
        </div>
      )}

      {profile?.role === "SUPER_ADMIN" && (
        <div className="mb-6 rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          Le super administrateur ne pointe pas ses arrivées/départs. Il reçoit toutefois le rapport de présence de son équipe.
        </div>
      )}

      {message && <p className="text-sm text-ink/70 mb-6">{message}</p>}

      {teamAttendance.length > 0 && (
        <Card padding={false} className="overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-line bg-surface-2 text-sm font-medium text-ink">
            Rapport de présence / absence
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-muted text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Employé</th>
                <th className="text-left px-4 py-2">Rôle</th>
                <th className="text-left px-4 py-2">Statut</th>
                <th className="text-left px-4 py-2">Arrivée</th>
                <th className="text-left px-4 py-2">Départ</th>
              </tr>
            </thead>
            <tbody>
              {teamAttendance.map((entry) => (
                <tr key={entry.uid} className="border-t border-line">
                  <td className="px-4 py-2">{entry.name}</td>
                  <td className="px-4 py-2">{entry.role}</td>
                  <td className="px-4 py-2">
                    <Badge tone={entry.status === "ABSENT" ? "warning" : "success"}>{entry.status}</Badge>
                  </td>
                  <td className="px-4 py-2">{entry.clockIn ? new Date(entry.clockIn).toLocaleTimeString() : "—"}</td>
                  <td className="px-4 py-2">{entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card padding={false} className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Arrivée</th>
              <th className="text-left px-4 py-2">Départ</th>
              <th className="text-left px-4 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.date} className="border-t border-line">
                <td className="px-4 py-2">{h.date}</td>
                <td className="px-4 py-2">{h.clockIn ? new Date(h.clockIn).toLocaleTimeString() : "—"}</td>
                <td className="px-4 py-2">{h.clockOut ? new Date(h.clockOut).toLocaleTimeString() : "—"}</td>
                <td className="px-4 py-2">
                  <Badge tone={h.status === "LATE" ? "warning" : "success"}>{h.status}</Badge>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  Aucun pointage pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
