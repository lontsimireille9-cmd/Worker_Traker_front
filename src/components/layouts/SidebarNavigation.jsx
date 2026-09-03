import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaClock, FaTasks, FaUsers, FaChevronLeft, FaChevronRight, FaLayerGroup, FaUserCog, FaHistory } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const BASE_NAV_ITEMS = [
  { path: "/", label: "Tableau de bord", icon: <FaHome /> },
  { path: "/presence", label: "Présence", icon: <FaClock /> },
  { path: "/taches", label: "Tâches", icon: <FaTasks /> },
  { path: "/equipes", label: "Équipes", icon: <FaLayerGroup /> },
  { path: "/profil", label: "Profil", icon: <FaUserCog /> },
];

const EMPLOYEE_HISTORY_ITEM = { path: "/historique", label: "Historique", icon: <FaHistory /> };
const COMPANY_NAV_ITEM = { path: "/entreprises", label: "Entreprises", icon: <FaLayerGroup /> };
const SETTINGS_NAV_ITEM = { path: "/parametres", label: "Parametres", icon: <FaUserCog /> };
const MANAGER_NAV_ITEM = { path: "/employes", label: "Employés", icon: <FaUsers /> };

export default function SidebarNavigation({ onToggle }) {
  const location = useLocation();
  const { profile, logout } = useAuth();
  const isEmployee = profile?.role === "EMPLOYEE";
  const isManager = ["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(profile?.role);
  const baseItems = isEmployee ? [BASE_NAV_ITEMS[0], BASE_NAV_ITEMS[1], BASE_NAV_ITEMS[2], EMPLOYEE_HISTORY_ITEM, BASE_NAV_ITEMS[3], BASE_NAV_ITEMS[4]] : BASE_NAV_ITEMS;
  const NAV_ITEMS = [...baseItems, ...(isManager ? [MANAGER_NAV_ITEM, COMPANY_NAV_ITEM] : []), SETTINGS_NAV_ITEM];
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    onToggle?.(isCollapsed);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed, onToggle]);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-surface border-r border-line transition-all duration-300 z-40 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="relative flex items-center border-b border-line p-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm text-white">
          SE
        </div>
        {!isCollapsed && <span className="ml-3 font-display text-ink">Suivi Employés</span>}

        <button
          onClick={() => setIsCollapsed((current) => !current)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-surface p-1.5 shadow-sm transition hover:shadow"
          title={isCollapsed ? "Étendre" : "Réduire"}
        >
          {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
        </button>
      </div>

      <nav className="p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center rounded-lg px-3 py-2.5 transition ${
                  isActive(item.path) ? "bg-primary/10 text-primary font-medium" : "text-ink/70 hover:bg-surface-2"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <span className="text-base">{item.icon}</span>
                {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`absolute bottom-0 left-0 right-0 border-t border-line p-4 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
        <div className={`flex items-center ${isCollapsed ? "flex-col gap-2" : "gap-3"}`}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary/20 font-semibold text-secondary">
            {(profile?.name || "U").charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{profile?.name}</p>
              <p className="text-xs text-muted">{profile?.role}</p>
            </div>
          )}
        </div>
        <button onClick={logout} className={`text-xs text-accent hover:underline ${isCollapsed ? "mt-2" : "mt-3"}`}>
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
