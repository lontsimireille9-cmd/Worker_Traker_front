import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { firebaseUser, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink/40 text-sm">Chargement...</div>;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  // Un admin qui vient de s'inscrire n'a pas encore d'entreprise : on le
  // force à en créer une avant d'accéder au reste de l'app.
  const isAdminWithoutCompany =
    profile && ["ADMIN", "SUPER_ADMIN"].includes(profile.role) && !profile.companyId;

  if (isAdminWithoutCompany && location.pathname !== "/setup-company") {
    return <Navigate to="/setup-company" replace />;
  }

  return children;
}
