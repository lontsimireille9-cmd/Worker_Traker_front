import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Layout from "./components/layouts/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateCompany from "./pages/CreateCompany";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectCreate from "./pages/ProjectCreate";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectAnalytics from "./pages/ProjectAnalytics";
import ProjectSection from "./pages/ProjectSection";
import Attendance from "./pages/Attendance";
import Tasks from "./pages/Tasks";
import History from "./pages/History";
import EmployeeTaskDetail from "./pages/EmployeeTaskDetail";
import Employees from "./pages/Employees";
import Teams from "./pages/Teams";
import TeamKpis from "./pages/TeamKpis";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Messages from "./pages/Messages";
import BusinessKpis from "./pages/BusinessKpis";

const MANAGER_ROLES = ["MANAGER", "ADMIN", "SUPER_ADMIN"];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/setup-company"
                element={
                  <ProtectedRoute>
                    <CreateCompany />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="projets" element={<Projects />} />
                <Route
                  path="projets/nouveau"
                  element={
                    <RoleRoute roles={MANAGER_ROLES}>
                      <ProjectCreate />
                    </RoleRoute>
                  }
                />
                <Route path="projets/:id" element={<ProjectDetails />} />
                <Route path="projets/:id/sections/:sectionId" element={<ProjectSection />} />
                <Route path="projets/:id/analytics" element={<ProjectAnalytics />} />
                <Route path="presence" element={<Attendance />} />
                <Route path="taches" element={<Tasks />} />
                <Route path="taches/employe/:employeeId" element={<EmployeeTaskDetail />} />
                <Route path="historique" element={<History />} />
                <Route path="historique/:date" element={<History />} />
                <Route
                  path="employes"
                  element={
                    <RoleRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                      <Employees />
                    </RoleRoute>
                  }
                />

                {/* Gestion opérationnelle des équipes */}
                <Route path="equipes" element={<Teams />} />

                {/* Page KPI réellement utilisée depuis la barre de navigation */}
                <Route
                  path="equipe"
                  element={
                    <RoleRoute roles={MANAGER_ROLES}>
                      <TeamKpis />
                    </RoleRoute>
                  }
                />

                <Route path="profil" element={<Profile />} />
                <Route path="parametres" element={<Settings />} />
                <Route
                  path="rapports"
                  element={
                    <RoleRoute roles={["SUPER_ADMIN"]}>
                      <Reports />
                    </RoleRoute>
                  }
                />
                <Route path="messages" element={<Messages />} />
                <Route path="activite-metier" element={<BusinessKpis />} />
              </Route>
            </Routes>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
