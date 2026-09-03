import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { api } from "../services/api";

const ACTIVE_COMPANY_KEY = "suivi-active-company";
const AuthContext = createContext(null);

function readActiveCompany() {
  try {
    const stored = localStorage.getItem(ACTIVE_COMPANY_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(ACTIVE_COMPANY_KEY);
    return null;
  }
}

function clearCompanyState() {
  localStorage.removeItem(ACTIVE_COMPANY_KEY);
  api.clearCompanySession();
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeCompany, setActiveCompanyState] = useState(readActiveCompany);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setFirebaseUser(user);
    if (!user) {
      setProfile(null);
      setActiveCompanyState(null);
      clearCompanyState();
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const me = await api.get("/auth/me");
      setProfile(me);
      const stored = readActiveCompany();
      if (stored?.uid === user.uid && stored.sessionToken) {
        try {
          const company = await api.get("/companies/current");
          setActiveCompanyState({ ...stored, ...company, uid: user.uid });
        } catch {
          clearCompanyState();
          setActiveCompanyState(null);
        }
      } else {
        setActiveCompanyState(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }), []);

  async function login(email, password) {
    clearCompanyState();
    setActiveCompanyState(null);
    return signInWithEmailAndPassword(auth, String(email).trim(), password);
  }

  async function logout() {
    try {
      if (api.getCompanySession()) await api.post("/companies/lock");
    } catch {
      // La déconnexion Firebase reste prioritaire si la session entreprise est déjà expirée.
    }
    clearCompanyState();
    setProfile(null);
    setActiveCompanyState(null);
    await signOut(auth);
  }

  async function refreshProfile() {
    const me = await api.get("/auth/me");
    setProfile(me);
    return me;
  }

  function setActiveCompany(company, sessionToken, expiresAt) {
    const value = { ...company, uid: firebaseUser?.uid, sessionToken, expiresAt };
    localStorage.setItem(ACTIVE_COMPANY_KEY, JSON.stringify(value));
    api.setCompanySession(sessionToken);
    setActiveCompanyState(value);
  }

  function clearActiveCompany() {
    clearCompanyState();
    setActiveCompanyState(null);
  }

  return <AuthContext.Provider value={{ firebaseUser, profile, loading, login, logout, refreshProfile, activeCompany, setActiveCompany, clearActiveCompany }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
