import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MobileHeader from "./MobileHeader";
import MobileBottomNavigation from "./MobileBottomNavigation";
import SidebarNavigation from "./SidebarNavigation";
import { useLanguage } from "../../context/LanguageContext";

function getPageTitle(pathname, t) {
  if (pathname.startsWith("/historique")) return t("history");
  if (pathname.startsWith("/taches/employe")) return t("tasks");
  const titles = { "/": "dashboard", "/presence": "attendance", "/taches": "tasks", "/employes": "employees", "/equipes": "teams", "/profil": "profile", "/parametres": "settings", "/rapports": "reports", "/messages": "messages" };
  return t(titles[pathname] || "appName");
}

function isMainRoute(pathname) {
  if (pathname.startsWith("/historique/")) return false;
  if (pathname.startsWith("/taches/employe/")) return false;
  return ["/", "/presence", "/taches", "/employes", "/equipes", "/profil", "/parametres", "/rapports", "/messages"].includes(pathname);
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const title = getPageTitle(location.pathname, t);
  const showBackButton = !isMainRoute(location.pathname);
  const isMessagesRoute = location.pathname === "/messages";

  return (
    <div className="flex h-[100dvh] w-full min-w-0 overflow-hidden bg-canvas">
      <MobileHeader title={title} showBackButton={showBackButton} onBack={() => navigate(-1)} />
      <div className="hidden lg:block"><SidebarNavigation onToggle={setIsSidebarCollapsed} /></div>
      <main className={`min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y pb-24 pt-16 transition-all duration-300 lg:h-[100dvh] lg:pb-8 lg:pt-8 ${isMessagesRoute ? "p-0 pt-14 lg:pt-0" : "px-4 sm:px-6 lg:px-8"} ${isSidebarCollapsed ? "lg:ml-[82px]" : "lg:ml-72"}`}>
        <div className="min-w-0 max-w-full">{isMessagesRoute ? <Outlet /> : <Outlet />}</div>
      </main>
      <MobileBottomNavigation />
    </div>
  );
}
