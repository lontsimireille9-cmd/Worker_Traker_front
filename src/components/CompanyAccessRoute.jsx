import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CompanyAccessRoute({ children }) {
  const { activeCompany } = useAuth();
  const location = useLocation();
  const expired = activeCompany?.expiresAt && new Date(activeCompany.expiresAt).getTime() <= Date.now();
  if (!activeCompany?.id || !activeCompany?.sessionToken || expired) return <Navigate to="/entreprises" replace state={{ from: location.pathname }} />;
  return children;
}
