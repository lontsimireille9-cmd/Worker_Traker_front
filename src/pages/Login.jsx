import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Alert from "../components/ui/alert";
import Card from "../components/ui/card";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("employee"); // "employee" | "admin"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [matricule, setMatricule] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdminSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmployeeSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { email: resolvedEmail } = await api.post("/auth/resolve-matricule", { matricule });
      await login(resolvedEmail, code);
      navigate("/");
    } catch {
      setError("Matricule ou code incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-display text-sm mb-3">
            SE
          </div>
          <h1 className="font-display text-2xl text-ink">Suivi Employés</h1>
          <p className="text-sm text-muted mt-1">Connectez-vous à votre espace</p>
        </div>

        <div className="flex mb-4 rounded-lg border border-line overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setMode("employee")}
            className={`flex-1 py-2 transition ${mode === "employee" ? "bg-primary text-white" : "bg-surface text-ink/60"}`}
          >
            Employé
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`flex-1 py-2 transition ${mode === "admin" ? "bg-primary text-white" : "bg-surface text-ink/60"}`}
          >
            Administration
          </button>
        </div>

        <Card>
          {mode === "employee" ? (
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <Input
                id="matricule"
                label="Matricule"
                required
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="Ex: EMP-0234"
              />
              <Input
                id="code"
                type="password"
                label="Code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code remis par votre administrateur"
              />
              {error && <Alert type="danger">{error}</Alert>}
              <Button type="submit" loading={loading} className="w-full" size="md">
                Se connecter
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
              />
              <Input
                id="password"
                type="password"
                label="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {error && <Alert type="danger">{error}</Alert>}
              <Button type="submit" loading={loading} className="w-full" size="md">
                Se connecter
              </Button>
              <p className="text-center text-xs text-muted">
                Pas encore de compte ?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Créer mon entreprise
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
