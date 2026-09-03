import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Alert from "../components/ui/alert";
import Title from "../components/ui/title";

export default function Profile() {
  const { profile } = useAuth();
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
    try { const updated = await api.patch("/profile/company", form); setCompany(updated); setSuccess("Profil entreprise mis à jour."); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return <div><Title as="h1" variant="page" className="mb-1">Profils</Title><p className="mb-8 text-sm text-muted">Consultez votre profil et les informations de votre entreprise.</p><div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 text-lg font-semibold">Mon profil</h2><div className="space-y-3 text-sm"><Info label="Nom" value={profile?.name} /><Info label="Email" value={profile?.email} /><Info label="Rôle" value={profile?.role} /><Info label="Entreprise" value={company?.name} /></div></Card><Card><h2 className="mb-1 text-lg font-semibold">Profil entreprise</h2><p className="mb-5 text-xs text-muted">{canEditCompany ? "Vous êtes SUPER_ADMIN : vous pouvez modifier ces informations." : "Consultation uniquement. Seul le SUPER_ADMIN peut modifier ces informations."}</p><form onSubmit={handleSubmit} className="space-y-4"><Input label="Nom de l'entreprise" disabled={!canEditCompany} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input label="Adresse" disabled={!canEditCompany} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /><Input label="Téléphone" disabled={!canEditCompany} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><Input label="Email" type="email" disabled={!canEditCompany} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />{error && <Alert type="danger">{error}</Alert>}{success && <Alert type="success">{success}</Alert>}{canEditCompany && <Button type="submit" loading={loading}>Enregistrer</Button>}</form></Card></div></div>;
}

function Info({ label, value }) { return <div className="flex justify-between gap-4 border-b border-line pb-2"><span className="text-muted">{label}</span><span className="text-right font-medium text-ink">{value || "—"}</span></div>; }
