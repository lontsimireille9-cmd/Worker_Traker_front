import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Alert from "../components/ui/alert";
import Card from "../components/ui/card";

export default function CreateCompany() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/companies", { name, address, phone, email });
      await refreshProfile();
      navigate("/");
    } catch (err) {
      setError(err.message || "Impossible de créer l'entreprise.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl text-ink">Votre entreprise</h1>
          <p className="text-sm text-muted mt-1">Dernière étape avant d'ajouter vos employés.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              label="Nom de l'entreprise"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Atelier Dubois"
            />
            <Input
              id="address"
              label="Adresse"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="1 rue de l'Innovation"
            />
            <Input
              id="phone"
              label="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 00 00 00 00"
            />
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@entreprise.com"
            />

            {error && <Alert type="danger">{error}</Alert>}

            <Button type="submit" loading={loading} className="w-full" size="md">
              Créer l'entreprise
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
