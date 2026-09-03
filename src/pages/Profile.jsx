import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Alert from "../components/ui/alert";
import Title from "../components/ui/title";

export default function Profile() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const canEditCompany = profile?.role === "SUPER_ADMIN";
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/profile/company").then((data) => { setCompany(data); setForm({ name: data.name || "", address: data.address || "", phone: data.phone || "", email: data.email || "" }); }).catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault(); setLoading(true); setError(""); setSuccess("");
    try { const updated = await api.patch("/profile/company", form); setCompany(updated); setSuccess(t("updatedProfile")); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return <div><Title as="h1" variant="page" className="mb-1">{t("profiles")}</Title><p className="mb-8 text-sm text-muted">{t("profileDescription")}</p><div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 text-lg font-semibold">{t("profile")}</h2><div className="space-y-3 text-sm"><Info label={t("name")} value={profile?.name} /><Info label="Email" value={profile?.email} /><Info label={t("role")} value={profile?.role} /><Info label={t("company")} value={company?.name} /></div></Card><Card><h2 className="mb-1 text-lg font-semibold">{t("companyProfile")}</h2><p className="mb-5 text-xs text-muted">{canEditCompany ? t("superAdminEdit") : t("viewOnly")}</p><form onSubmit={handleSubmit} className="space-y-4"><Input label={t("companyName")} disabled={!canEditCompany} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input label={t("address")} disabled={!canEditCompany} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /><Input label={t("phone")} disabled={!canEditCompany} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><Input label="Email" type="email" disabled={!canEditCompany} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{error && <Alert type="danger">{error}</Alert>}{success && <Alert type="success">{success}</Alert>}{canEditCompany && <Button type="submit" loading={loading}>{t("save")}</Button>}</form></Card></div></div>;
}

function Info({ label, value }) { return <div className="flex justify-between gap-4 border-b border-line pb-2"><span className="text-muted">{label}</span><span className="text-right font-medium text-ink">{value || "—"}</span></div>; }
