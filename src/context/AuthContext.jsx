import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setFirebaseUser(user);
    if (user) {
      try { setProfile(await api.get("/auth/me")); } catch { setProfile(null); }
    } else {
      setProfile(null);
    }
    setLoading(false);
  }), []);

  const login = (email, password) => signInWithEmailAndPassword(auth, String(email).trim(), password);
  const logout = () => signOut(auth);

  async function refreshProfile() {
    const me = await api.get("/auth/me");
    setProfile(me);
    return me;
  }

  return <AuthContext.Provider value={{ firebaseUser, profile, loading, login, logout, refreshProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
