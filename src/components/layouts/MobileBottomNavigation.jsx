import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaCog,
  FaChartBar,
  FaEllipsisH,
  FaHistory,
  FaHome,
  FaLayerGroup,
  FaTasks,
  FaTimes,
  FaUserCog,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function MobileBottomNavigation() {
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);
  const isEmployee = profile?.role === "EMPLOYEE";
  const isManager = ["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(profile?.role);
  const essentialTabs = [{ path: "/", label: t("home"), icon: <FaHome /> }, { path: "/taches", label: t("tasks"), icon: <FaTasks /> }, { path: "/profil", label: t("profile"), icon: <FaUserCog /> }];
  const secondaryTabs = [
    ...(isEmployee ? [{ path: "/historique", label: t("history"), icon: <FaHistory /> }] : []),
    { path: "/equipes", label: t("teams"), icon: <FaLayerGroup /> },
    ...(isManager ? [{ path: "/employes", label: t("employees"), icon: <FaUsers /> }] : []),
    { path: "/parametres", label: t("settings"), icon: <FaCog /> },
    ...(profile?.role === "SUPER_ADMIN" ? [{ path: "/rapports", label: t("reports"), icon: <FaChartBar /> }] : []),
  ];

  function isActive(path) {
    return path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  }

  function handleMoreClick() {
    setMoreOpen((value) => !value);
  }

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Fermer le menu secondaire"
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}
      <div
        className={[
          "fixed bottom-[68px] left-3 right-3 z-50 rounded-2xl border border-line bg-surface p-2 shadow-xl transition-all duration-200 lg:hidden",
          moreOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        ].join(" ")}
      >
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{t("quickAccess")}</p>
        <div className="grid grid-cols-2 gap-1">
          {secondaryTabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              onClick={() => setMoreOpen(false)}
              className={[
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                isActive(tab.path) ? "bg-primary text-white" : "text-ink/70 hover:bg-surface-2",
              ].join(" ")}
            >
              <span className="w-5 text-center text-sm">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(18,24,27,0.08)] backdrop-blur lg:hidden" aria-label="Navigation mobile">
        <div className="mx-auto flex h-[68px] max-w-xl items-center justify-around gap-1">
          {essentialTabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={[
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] transition-colors",
                isActive(tab.path) ? "bg-primary/10 font-semibold text-primary" : "text-ink/55 hover:bg-surface-2 hover:text-ink",
              ].join(" ")}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span className="max-w-full truncate">{tab.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={handleMoreClick}
            aria-expanded={moreOpen}
            aria-label={moreOpen ? "Fermer les accès rapides" : "Ouvrir les accès rapides"}
            className={[
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] transition-colors",
              moreOpen || secondaryTabs.some((tab) => isActive(tab.path)) ? "bg-primary/10 font-semibold text-primary" : "text-ink/55 hover:bg-surface-2 hover:text-ink",
            ].join(" ")}
          >
            <span className="text-base leading-none">{moreOpen ? <FaTimes /> : <FaEllipsisH />}</span>
            <span>{moreOpen ? t("close") : t("more")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
