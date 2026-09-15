import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const me = await api.get("/auth/me");
        if (active) setProfile(me);
      } catch (error) {
        if (active) {
          setProfile(null);
          if (error.status === 401) await signOut(auth).catch(() => undefined);
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, String(email).trim(), password);
    const me = await api.get("/auth/me");
    setFirebaseUser(credential.user);
    setProfile(me);
    setLoading(false);
    return credential;
  }
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
