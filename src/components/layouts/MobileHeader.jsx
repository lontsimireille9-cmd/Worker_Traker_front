import React from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import BrandLogo from "../BrandLogo";
import Button from "../ui/Button";

export default function MobileHeader({ title, showBackButton, onBack }) {
  const { logout } = useAuth();
  const { t } = useLanguage();
  return <header className="fixed left-0 right-0 top-0 z-50 border-b border-line bg-surface/95 shadow-sm backdrop-blur lg:hidden">
    <div className="flex h-14 items-center gap-2 px-3 sm:px-6">
      {showBackButton && <Button onClick={onBack} className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink/70 hover:bg-surface-2 hover:text-primary" aria-label={t("back")}><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Button>}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"><BrandLogo compact className="h-9 w-9" /></div>
      <h1 className="min-w-0 flex-1 truncate font-display text-lg text-ink">{title}</h1>
      <Button type="Button" onClick={logout} aria-label={t("logout")} title={t("logout")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 shadow-sm hover:bg-red-100"><FaSignOutAlt size={15} /></Button>
    </div>
  </header>;
}
