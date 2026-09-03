import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MobileHeader from "./MobileHeader";
import MobileBottomNavigation from "./MobileBottomNavigation";
import SidebarNavigation from "./SidebarNavigation";

const MAIN_PATHS = {
  "/": "Tableau de bord",
  "/presence": "Présence",
  "/taches": "Tâches",
  "/historique": "Historique",
  "/employes": "Employés",
  "/equipes": "Équipes",
  "/profil": "Profil",
  "/parametres": "Parametres",
  "/entreprises": "Entreprises",
};

function getPageTitle(pathname) {
  if (pathname.startsWith("/historique")) {
    return "Historique";
  }

  if (pathname.startsWith("/taches/employe")) {
    return "Tâches";
  }

  return MAIN_PATHS[pathname] || "Suivi Employés";
}

function isMainRoute(pathname) {
  if (pathname.startsWith("/historique/")) {
    return false;
  }

  if (pathname.startsWith("/taches/employe/")) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(MAIN_PATHS, pathname);
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const title = getPageTitle(location.pathname);
  const showBackButton = !isMainRoute(location.pathname);

  return (
    <div className="min-h-screen flex bg-canvas">
      <MobileHeader title={title} showBackButton={showBackButton} onBack={() => navigate(-1)} />

      <div className="hidden md:block">
        <SidebarNavigation onToggle={setIsSidebarCollapsed} />
      </div>

      <main
        className={`flex-1 max-w-full px-4 pb-20 pt-16 transition-all duration-300 md:px-8 md:pb-8 md:pt-8 ${
          isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <Outlet />
      </main>

      <MobileBottomNavigation />
    </div>
  );
}
