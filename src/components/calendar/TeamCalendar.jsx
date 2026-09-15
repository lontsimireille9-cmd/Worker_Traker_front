import React, { useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaClock } from "react-icons/fa";
import Card from "../ui/card";
import Badge from "../ui/badge";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Calendrier mensuel générique.
 * - attendance: [{ date: "YYYY-MM-DD", status }]
 * - tasks: [{ id, title, deadline: "YYYY-MM-DD", status }]
 * Affiche un point pour chaque jour ayant une présence et/ou une tâche due.
 */
export default function TeamCalendar({ attendance = [], tasks = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const attendanceByDate = useMemo(() => {
    const map = {};
    attendance.forEach((a) => {
      map[a.date] = a;
    });
    return map;
  }, [attendance]);

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.deadline) return;
      const key = t.deadline.slice(0, 10);
      map[key] = map[key] ? [...map[key], t] : [t];
    });
    return map;
  }, [tasks]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [year, month]);

  function dateKey(day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function changeMonth(delta) {
    setCurrentDate(new Date(year, month + delta, 1));
    setSelectedDay(null);
  }

  const selectedKey = selectedDay ? dateKey(selectedDay) : null;
  const selectedTasks = selectedKey ? tasksByDate[selectedKey] || [] : [];
  const selectedAttendance = selectedKey ? attendanceByDate[selectedKey] : null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-surface-2 text-ink/70">
          <FaChevronLeft />
        </button>
        <h3 className="font-display text-lg text-ink capitalize">
          {currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-surface-2 text-ink/70">
          <FaChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-2">
        {WEEKDAYS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = dateKey(day);
          const hasAttendance = !!attendanceByDate[key];
          const dayTasks = tasksByDate[key] || [];
          const isSelected = selectedDay === day;

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`relative aspect-square rounded-lg text-sm flex flex-col items-center justify-center transition ${
                isSelected ? "bg-primary text-white" : "hover:bg-surface-2 text-ink"
              }`}
            >
              {day}
              <span className="absolute bottom-1 flex gap-0.5">
                {hasAttendance && <span className="h-1 w-1 rounded-full bg-secondary" />}
                {dayTasks.length > 0 && <span className="h-1 w-1 rounded-full bg-accent" />}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-5 pt-4 border-t border-line space-y-3">
          <p className="text-sm font-medium text-ink">
            {new Date(year, month, selectedDay).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>

          {selectedAttendance && (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <FaCheckCircle /> Présence enregistrée ({selectedAttendance.status})
            </div>
          )}

          {selectedTasks.length === 0 && !selectedAttendance && (
            <p className="text-sm text-muted">Rien de prévu ce jour.</p>
          )}

          {selectedTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink">
                <FaClock className="text-accent" /> {t.title}
              </span>
              <Badge tone="accent">{t.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
