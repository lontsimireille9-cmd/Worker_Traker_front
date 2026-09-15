import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Alert from "../components/ui/alert";
import Card from "../components/ui/card";

export default function CreateCompany() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/company", { name, address, phone, email });
      await refreshProfile();
      navigate("/");
    } catch (err) {
      setError(err.message || "Impossible de créer l'entreprise.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-canvas px-4"><div className="w-full max-w-sm"><div className="mb-8 text-center"><h1 className="font-display text-2xl text-ink">{t("yourCompany")}</h1><p className="mt-1 text-sm text-muted">{t("lastStep")}</p></div><Card><form onSubmit={handleSubmit} className="space-y-4"><Input id="name" label={t("companyName")} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Atelier Dubois" /><Input id="address" label={t("address")} value={address} onChange={(e) => setAddress(e.target.value)} /><Input id="phone" label={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} /><Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />{error && <Alert type="danger">{error}</Alert>}<Button type="submit" loading={loading} className="w-full">{t("createCompany")}</Button></form></Card></div></div>;
}
