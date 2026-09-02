import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { api } from "../services/api";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Alert from "../components/ui/alert";
import Card from "../components/ui/card";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      console.log("EMAIL ENVOYÉ À FIREBASE :", JSON.stringify(email));
      console.log("PASSWORD LENGTH :", password.length);

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await api.post("/auth/register-profile", {
        uid: user.uid,
        name,
        email,
        role: "ADMIN",
      });
      navigate("/setup-company");
    /*} catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Cet email est déjà utilisé.");
      } else if (err.code === "auth/weak-password") {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setError("Impossible de créer le compte.");
      }*/
        } catch (err) {
    console.error("Erreur inscription Firebase :", err);
    console.error("Code :", err.code);
    console.error("Message :", err.message);

    if (err.code === "auth/email-already-in-use") {
      setError("Cet email est déjà utilisé.");
    } else if (err.code === "auth/weak-password") {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
    } else if (err.code === "auth/network-request-failed") {
      setError("Erreur réseau lors de la connexion à Firebase.");
    } else {
      setError(`Impossible de créer le compte : ${err.message}`);
    }
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl text-ink">Créer mon entreprise</h1>
          <p className="text-sm text-muted mt-1">Ce compte administrateur pourra ensuite ajouter vos employés.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="name" label="Votre nom" required value={name} onChange={(e) => setName(e.target.value)} />
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
            />

            {error && <Alert type="danger">{error}</Alert>}

            <Button type="submit" loading={loading} className="w-full" size="md">
              Créer mon compte
            </Button>

            <p className="text-center text-xs text-muted">
              Déjà un compte ?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
