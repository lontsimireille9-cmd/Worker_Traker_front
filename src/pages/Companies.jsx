import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaBuilding, FaLock, FaPlus } from "react-icons/fa";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Button from "../components/ui/button";
import Alert from "../components/ui/alert";
import Badge from "../components/ui/badge";

export default function Companies() {
  const { profile, activeCompany, setActiveCompany, clearActiveCompany } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canCreate = ["ADMIN", "SUPER_ADMIN"].includes(profile?.role);

  async function load() { try { setCompanies(await api.get("/companies")); } catch (err) { setError(err.message); } }
  useEffect(() => { load(); }, []);

  async function unlock(event) {
    event.preventDefault(); setLoading(true); setError("");
    try { const result = await api.post(`/companies/${selected.id}/unlock`, { password }); setActiveCompany(result.company, result.sessionToken, result.expiresAt); setSelected(null); setPassword(""); navigate("/"); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function unlockEmployee(company) {
    setLoading(true); setError("");
    try { const result = await api.post(`/companies/${company.id}/unlock`, { password: "" }); setActiveCompany(result.company, result.sessionToken, result.expiresAt); navigate("/"); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function create(event) {
    event.preventDefault(); setError("");
    if (form.password.length < 8 || form.password !== form.confirm) { setError(form.password.length < 8 ? "Le mot de passe doit contenir au moins 8 caractères." : "Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try { await api.post("/companies", { name: form.name, password: form.password }); setForm({ name: "", password: "", confirm: "" }); setCreateOpen(false); await load(); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function lock() { await api.post("/companies/lock").catch(() => {}); clearActiveCompany(); }

  return <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Espace entreprise</p><h1 className="mt-1 text-3xl font-bold">Vos entreprises</h1><p className="mt-1 text-sm text-muted">Sélectionnez l’espace de travail à ouvrir.</p></div>{canCreate && <Button onClick={() => setCreateOpen((value) => !value)}><FaPlus className="mr-2" /> Nouvelle entreprise</Button>}</div>
    {error && <Alert type="danger" className="mb-5">{error}</Alert>}
    {createOpen && canCreate && <Card className="mb-6"><form onSubmit={create} className="grid gap-4 md:grid-cols-3"><Input label="Nom de l'entreprise" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input label="Mot de passe" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><Input label="Confirmer" type="password" minLength={8} required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /><div className="md:col-span-3 flex justify-end"><Button type="submit" loading={loading}>Créer l'entreprise</Button></div></form></Card>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{companies.map((company) => { const active = activeCompany?.id === company.id; return <Card key={company.id}><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><FaBuilding /></span><Badge tone={company.status === "ACTIVE" ? "success" : "danger"}>{company.status === "ACTIVE" ? "Active" : "Désactivée"}</Badge></div><h2 className="mt-5 text-lg font-semibold">{company.name}</h2><div className="mt-6 flex gap-2">{active ? <><Button className="flex-1" onClick={() => navigate("/")}><FaArrowRight className="mr-2" /> Ouvrir</Button><Button variant="ghost" onClick={lock}>Verrouiller</Button></> : <Button className="w-full" disabled={company.status !== "ACTIVE"} onClick={() => profile?.role === "EMPLOYEE" ? unlockEmployee(company) : (setSelected(company), setPassword(""))}><FaLock className="mr-2" /> Entrer</Button>}</div></Card>; })}</div>
    {!companies.length && <Card className="mt-5 text-center text-sm text-muted">Aucune entreprise disponible.</Card>}
    {selected && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><Card className="w-full max-w-md"><h2 className="mb-5 text-lg font-semibold">Ouvrir {selected.name}</h2><form onSubmit={unlock} className="space-y-4"><Input autoFocus label="Mot de passe de l'entreprise" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setSelected(null)}>Annuler</Button><Button type="submit" loading={loading}>Déverrouiller</Button></div></form></Card></div>}
  </div></div>;
}
