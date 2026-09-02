import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaClock, FaTasks, FaUsers, FaLayerGroup, FaUserCog, FaHistory } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const BASE_TABS = [
  { path: "/", label: "Accueil", icon: <FaHome /> },
  { path: "/presence", label: "Présence", icon: <FaClock /> },
  { path: "/taches", label: "Tâches", icon: <FaTasks /> },
  { path: "/equipes", label: "Équipes", icon: <FaLayerGroup /> },
  { path: "/profil", label: "Profil", icon: <FaUserCog /> },
];

const EMPLOYEE_HISTORY_TAB = { path: "/historique", label: "Historique", icon: <FaHistory /> };
const MANAGER_TAB = { path: "/employes", label: "Employés", icon: <FaUsers /> };

export default function MobileBottomNavigation() {
  const location = useLocation();
  const { profile } = useAuth();
  const isEmployee = profile?.role === "EMPLOYEE";
  const isManager = ["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(profile?.role);
  const baseTabs = isEmployee ? [BASE_TABS[0], BASE_TABS[1], BASE_TABS[2], EMPLOYEE_HISTORY_TAB, BASE_TABS[3], BASE_TABS[4]] : BASE_TABS;
  const TABS = isManager ? [...baseTabs, MANAGER_TAB] : baseTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-surface shadow-lg md:hidden">
      <div className="flex h-16 items-center justify-around">
        {TABS.map((tab) => {
          const isActive = tab.path === "/" ? location.pathname === "/" : location.pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-1 flex-col items-center justify-center p-2 ${isActive ? "font-semibold text-primary" : "text-ink/60"}`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="mt-1 text-xs leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
