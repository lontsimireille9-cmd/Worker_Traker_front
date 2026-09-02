import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layouts/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateCompany from "./pages/CreateCompany";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Tasks from "./pages/Tasks";
import History from "./pages/History";
import EmployeeTaskDetail from "./pages/EmployeeTaskDetail";
import Employees from "./pages/Employees";
import Teams from "./pages/Teams";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="presence" element={<Attendance />} />
            <Route path="taches" element={<Tasks />} />
            <Route path="taches/employe/:employeeId" element={<EmployeeTaskDetail />} />
            <Route path="historique" element={<History />} />
            <Route path="historique/:date" element={<History />} />
            <Route path="employes" element={<Employees />} />
            <Route path="equipes" element={<Teams />} />
            <Route path="profil" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
