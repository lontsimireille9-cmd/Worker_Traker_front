import React, { useState } from "react";
import { FaHistory, FaUser } from "react-icons/fa";
import Button from "../ui/button";
import { getTaskStatusLabel, getTaskStatusColor } from "../../utils/getTaskDisplayStatus";

/**
 * Affiche l'historique des changements de statut d'une tâche.
 * Attend task.statusHistory = [{ status, changedAt, changedBy, reason }]
 */
export default function TaskStatusHistory({ task, loading = false }) {
  const [showHistory, setShowHistory] = useState(false);
  const history = task?.statusHistory || [];

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date non disponible";
    return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="bg-surface rounded-xl p-4 border border-line">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaHistory className="text-secondary" />
          <h3 className="text-sm font-semibold text-ink">Historique des statuts</h3>
        </div>
        <Button onClick={() => setShowHistory(!showHistory)} variant="outline" size="sm">
          {showHistory ? "Masquer" : "Afficher"}
        </Button>
      </div>

      {showHistory && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-sm text-muted">Chargement...</div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">Aucun historique disponible</p>
          ) : (
            history.map((entry, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-surface-2 rounded-lg border border-line">
                <span className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getTaskStatusColor(entry.status)}`}>
                  {getTaskStatusLabel(entry.status)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <FaUser className="text-[10px]" />
                      {entry.changedBy === "system" ? "Système" : entry.changedBy}
                    </span>
                    <span>{formatDate(entry.changedAt)}</span>
                  </div>
                  {entry.reason && <p className="text-xs text-muted mt-1 italic">{entry.reason}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
