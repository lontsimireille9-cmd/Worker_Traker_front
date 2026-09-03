import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaChartBar,
  FaHistory,
  FaHome,
  FaLayerGroup,
  FaTasks,
  FaUserCog,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const PRIMARY_ITEMS = [
  { path: "/", label: "Tableau de bord", icon: <FaHome /> },
  { path: "/taches", label: "Tâches", icon: <FaTasks /> },
];

const TEAM_ITEM = { path: "/equipes", label: "Équipes", icon: <FaLayerGroup /> };
const HISTORY_ITEM = { path: "/historique", label: "Historique", icon: <FaHistory /> };
const EMPLOYEES_ITEM = { path: "/employes", label: "Employés", icon: <FaUsers /> };
const ACCOUNT_ITEMS = [
  { path: "/profil", label: "Mon profil", icon: <FaUserCog /> },
  { path: "/parametres", label: "Paramètres", icon: <FaCog /> },
];
const REPORTS_ITEM = { path: "/rapports", label: "Rapports", icon: <FaChartBar /> };

export default function SidebarNavigation({ onToggle }) {
  const location = useLocation();
  const { profile, logout } = useAuth();
  const isEmployee = profile?.role === "EMPLOYEE";
  const isManager = ["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(profile?.role);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sidebarCollapsed") || "false");
    } catch {
      return false;
    }
  });

  const workItems = [
    ...PRIMARY_ITEMS,
    ...(isEmployee ? [HISTORY_ITEM] : []),
    TEAM_ITEM,
    ...(isManager ? [EMPLOYEES_ITEM] : []),
    ...(profile?.role === "SUPER_ADMIN" ? [REPORTS_ITEM] : []),
  ];

  useEffect(() => {
    onToggle?.(isCollapsed);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed, onToggle]);

  function isActive(path) {
    return path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  }

  function renderItem(item) {
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          title={isCollapsed ? item.label : undefined}
          className={[
            "group flex min-h-11 items-center rounded-xl px-3 py-2.5 transition-colors",
            isCollapsed ? "justify-center" : "gap-3",
            isActive(item.path)
              ? "bg-primary text-white shadow-sm"
              : "text-ink/65 hover:bg-surface-2 hover:text-ink",
          ].join(" ")}
        >
          <span className="flex w-5 flex-shrink-0 justify-center text-sm">{item.icon}</span>
          {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
        </Link>
      </li>
    );
  }

  const initials = (profile?.name || profile?.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface shadow-[8px_0_30px_rgba(18,24,27,0.03)] transition-[width] duration-300 lg:flex",
        isCollapsed ? "w-[82px]" : "w-72",
      ].join(" ")}
    >
      <div className="relative flex h-[76px] flex-shrink-0 items-center border-b border-line px-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary font-display text-sm font-semibold text-white">
          SE
        </div>
        {!isCollapsed && (
          <div className="ml-3 min-w-0">
            <p className="truncate font-display text-base text-ink">Suivi Employés</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Workspace</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-ink/60 shadow-sm transition hover:text-primary"
          title={isCollapsed ? "Étendre" : "Réduire"}
          aria-label={isCollapsed ? "Étendre la navigation" : "Réduire la navigation"}
        >
          {isCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label="Navigation principale">
        {!isCollapsed && <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Espace de travail</p>}
        <ul className="space-y-1">{workItems.map(renderItem)}</ul>
        <div className="my-5 border-t border-line" />
        {!isCollapsed && <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Compte</p>}
        <ul className="space-y-1">{ACCOUNT_ITEMS.map(renderItem)}</ul>
      </nav>

      <div className="flex-shrink-0 border-t border-line p-3">
        <div className={["flex items-center", isCollapsed ? "justify-center" : "gap-3"].join(" ")}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-sm font-bold text-secondary">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{profile?.name || "Utilisateur"}</p>
              <p className="truncate text-xs text-muted">{profile?.role || "Compte"}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={logout}
          title="Se déconnecter"
          aria-label="Se déconnecter"
          className={["mt-3 flex min-h-10 items-center rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700", isCollapsed ? "w-full justify-center" : "w-full gap-2 px-3"].join(" ")}
        >
          <FaSignOutAlt />
          {!isCollapsed && "Se déconnecter"}
        </button>
      </div>
    </aside>
  );
}
