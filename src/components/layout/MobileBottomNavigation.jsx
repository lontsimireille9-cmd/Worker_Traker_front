import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";
import {
  FaCog,
  FaComments,
  FaChartBar,
  FaEllipsisH,
  FaHistory,
  FaHome,
  FaLayerGroup,
  FaTasks,
  FaTimes,
  FaUserCog,
  FaUsers,
  FaProjectDiagram,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function MobileBottomNavigation() {
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);

  const role = String(profile?.role || "").toUpperCase();
  const isEmployee = role === "EMPLOYEE";

  const essentialTabs = [
    { path: "/", label: t("home"), icon: <FaHome /> },
    { path: "/taches", label: t("tasks"), icon: <FaTasks /> },
    { path: "/messages", label: t("messages"), icon: <FaComments /> },
    { path: "/profil", label: t("profile"), icon: <FaUserCog /> },
  ];

  const secondaryTabs = [
    ...(isEmployee ? [{ path: "/historique", label: t("history"), icon: <FaHistory /> }] : []),
    { path: "/equipes", label: t("teams"), icon: <FaLayerGroup /> },
    { path: "/projets", label: "Projets", icon: <FaProjectDiagram /> },
    ...(role === "ADMIN" || role === "SUPER_ADMIN" ? [{ path: "/employes", label: t("employees"), icon: <FaUsers /> }] : []),
    { path: "/activite-metier", label: "Activité métier", icon: <FaChartBar /> },
    ...(role === "SUPER_ADMIN" ? [{ path: "/rapports", label: t("reports"), icon: <FaChartBar /> }] : []),
    { path: "/parametres", label: t("settings"), icon: <FaCog /> },
  ];

  function isActive(path) {
    return path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  }

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const secondaryActive = secondaryTabs.some((tab) => isActive(tab.path));

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Fermer le menu secondaire"
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      <div
        className={[
          "fixed bottom-[78px] left-3 right-3 z-50 rounded-2xl border border-line/80 bg-surface/95 p-2 shadow-2xl backdrop-blur-xl transition-all duration-200 lg:hidden",
          moreOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        ].join(" ")}
      >
        <div className="mb-1 flex items-center justify-between px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">Accès rapide</p>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
        <div className="grid max-h-[55dvh] grid-cols-2 gap-1 overflow-y-auto">
          {secondaryTabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={[
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-all",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-ink/70 hover:bg-surface-2 hover:text-ink",
                ].join(" ")}
              >
                <span className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs",
                  active ? "bg-white/15" : "bg-surface-2 text-primary",
                ].join(" ")}>
                  {tab.icon}
                </span>
                <span className="truncate font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navigation mobile"
      >
        <div className="mx-auto max-w-xl rounded-t-2xl border border-b-0 border-line/80 bg-surface/95 px-2 pt-2 shadow-[0_-10px_35px_rgba(18,24,27,0.10)] backdrop-blur-xl">
          <div className="flex h-[62px] items-center justify-around gap-1">
            {essentialTabs.map((tab) => {
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={[
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] transition-all",
                    active ? "bg-primary text-white shadow-sm" : "text-ink/50 hover:bg-surface-2 hover:text-ink",
                  ].join(" ")}
                >
                  <span className="text-sm leading-none">{tab.icon}</span>
                  <span className="max-w-full truncate font-medium">{tab.label}</span>
                </Link>
              );
            })}

            <Button
              type="button"
              variant="ghost"
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
              aria-label={moreOpen ? "Fermer les accès rapides" : "Ouvrir les accès rapides"}
              className={[
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] transition-all",
                moreOpen || secondaryActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-ink/50 hover:bg-surface-2 hover:text-ink",
              ].join(" ")}
            >
              <span className="text-sm leading-none">{moreOpen ? <FaTimes /> : <FaEllipsisH />}</span>
              <span className="font-medium">{moreOpen ? t("close") : t("more")}</span>
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
