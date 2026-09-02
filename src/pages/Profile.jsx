import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/button";
import Card from "../components/ui/card";
import Input from "../components/ui/input";
import Alert from "../components/ui/alert";
import Title from "../components/ui/title";

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/profile/company")
      .then((company) => {
        setForm({
          name: company?.name || "",
          address: company?.address || "",
          phone: company?.phone || "",
          email: company?.email || "",
        });
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.patch("/profile/company", form);
      await refreshProfile();
      setSuccess("Profil entreprise mis à jour.");
    } catch (err) {
      setError(err.message || "Impossible d’enregistrer le profil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Title as="h1" variant="page" className="mb-1">
        Profil entreprise
      </Title>
      <p className="text-sm text-muted mb-8">
        Gérez les informations de votre société et les paramètres visibles par l’équipe.
      </p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="company-name" label="Nom de l’entreprise" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input id="company-address" label="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input id="company-phone" label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input id="company-email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {error && <Alert type="danger">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}
          <Button type="submit" loading={loading}>
            Enregistrer
          </Button>
        </form>
      </Card>

      <Card className="mt-6">
        <p className="text-sm font-medium text-ink">Informations de session</p>
        <p className="text-sm text-muted mt-2">Rôle : {profile?.role || "—"}</p>
        <p className="text-sm text-muted">Entreprise : {profile?.companyId || "—"}</p>
      </Card>
    </div>
  );
}
