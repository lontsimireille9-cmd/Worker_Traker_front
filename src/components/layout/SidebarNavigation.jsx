import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaComments,
  FaChartBar,
  FaHistory,
  FaHome,
  FaLayerGroup,
  FaProjectDiagram,
  FaTasks,
  FaUserCog,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import BrandLogo from "../BrandLogo";

export default function SidebarNavigation({ onToggle }) {
  const location = useLocation();
  const { profile, logout } = useAuth();
  const { t } = useLanguage();
  const role = String(profile?.role || "").toUpperCase();
  const isEmployee = role === "EMPLOYEE";
  const canManageEmployees = ["ADMIN", "SUPER_ADMIN"].includes(role);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sidebarCollapsed") || "false");
    } catch {
      return false;
    }
  });

  const workItems = [
    { path: "/", label: t("dashboard"), icon: <FaHome /> },
    { path: "/taches", label: t("tasks"), icon: <FaTasks /> },
    ...(isEmployee ? [{ path: "/historique", label: t("history"), icon: <FaHistory /> }] : []),
    { path: "/equipes", label: t("teams"), icon: <FaLayerGroup /> },
    { path: "/projets", label: "Projets", icon: <FaProjectDiagram /> },
    { path: "/messages", label: t("messages"), icon: <FaComments /> },
    { path: "/activite-metier", label: "Activité métier", icon: <FaChartBar /> },
    ...(canManageEmployees ? [{ path: "/employes", label: t("employees"), icon: <FaUsers /> }] : []),
    ...(role === "SUPER_ADMIN" ? [{ path: "/rapports", label: t("reports"), icon: <FaChartBar /> }] : []),
  ];

  const accountItems = [
    { path: "/profil", label: t("profile"), icon: <FaUserCog /> },
    { path: "/parametres", label: t("settings"), icon: <FaCog /> },
  ];

  useEffect(() => {
    onToggle?.(isCollapsed);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed, onToggle]);

  function isActive(path) {
    return path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  }

  function renderItem(item) {
    const active = isActive(item.path);

    return (
      <li key={item.path}>
        <Link
          to={item.path}
          title={isCollapsed ? item.label : undefined}
          aria-current={active ? "page" : undefined}
          className={[
            "group relative flex min-h-11 items-center overflow-hidden rounded-xl px-2.5 py-2 transition-all duration-200",
            isCollapsed ? "justify-center" : "gap-3",
            active
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-ink/60 hover:bg-surface-2 hover:text-ink",
          ].join(" ")}
        >
          {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-white/90" />}
          <span
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm transition-all",
              active ? "bg-white/15 text-white" : "bg-surface-2 text-ink/55 group-hover:bg-primary/10 group-hover:text-primary",
            ].join(" ")}
          >
            {item.icon}
          </span>
          {!isCollapsed && <span className="min-w-0 truncate text-sm font-medium">{item.label}</span>}
          {!isCollapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
        </Link>
      </li>
    );
  }

  const initials = (profile?.name || profile?.email || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line/80 bg-surface/95 shadow-[10px_0_35px_rgba(18,24,27,0.05)] backdrop-blur lg:flex",
        "transition-[width] duration-300 ease-out",
        isCollapsed ? "w-[84px]" : "w-72",
      ].join(" ")}
    >
      <div className="relative flex h-[82px] shrink-0 items-center border-b border-line/80 px-4">
        <div
          className={[
            "flex min-w-0 items-center rounded-2xl transition-all",
            isCollapsed ? "mx-auto h-11 w-11 justify-center overflow-hidden bg-primary/5" : "h-12 max-w-[200px]",
          ].join(" ")}
        >
          {isCollapsed ? (
            <BrandLogo compact className="h-10 w-10" />
          ) : (
            <BrandLogo className="h-12 w-auto max-w-full" />
          )}
        </div>

        <Button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="absolute -right-3 top-[29px] flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-ink/60 shadow-md transition hover:border-primary/30 hover:text-primary"
          title={isCollapsed ? "Étendre" : "Réduire"}
          aria-label={isCollapsed ? "Étendre la navigation" : "Réduire la navigation"}
        >
          {isCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
        </Button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label={t("mainNavigation")}>
        {!isCollapsed && (
          <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
            {t("workspace")}
          </p>
        )}
        <ul className="space-y-1.5">{workItems.map(renderItem)}</ul>

        <div className="my-5 flex items-center gap-2 px-2">
          <span className="h-px flex-1 bg-line" />
          {!isCollapsed && <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-muted">Compte</span>}
          <span className="h-px flex-1 bg-line" />
        </div>

        <ul className="space-y-1.5">{accountItems.map(renderItem)}</ul>
      </nav>

      <div className="shrink-0 border-t border-line/80 p-3">
        <div
          className={[
            "rounded-2xl bg-surface-2 p-2",
            isCollapsed ? "flex justify-center" : "",
          ].join(" ")}
        >
          <div className={["flex items-center", isCollapsed ? "justify-center" : "gap-3"].join(" ")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/10">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">{profile?.name || "Utilisateur"}</p>
                <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-muted">{profile?.role || "Compte"}</p>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={logout}
            title="Se déconnecter"
            aria-label="Se déconnecter"
            className={[
              "mt-2 flex min-h-9 items-center rounded-xl border border-red-200 bg-red-50 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700",
              isCollapsed ? "w-full justify-center" : "w-full justify-center gap-2",
            ].join(" ")}
          >
            <FaSignOutAlt />
            {!isCollapsed && "Se déconnecter"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
