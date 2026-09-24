import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { api } from "../services/api";

const AuthContext = createContext(null);

// Empêche plusieurs rafraîchissements rapprochés sans utiliser de setInterval.
const PROFILE_REFRESH_COOLDOWN = 15 * 1000;

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(false);
  const refreshPromiseRef = useRef(null);
  const lastRefreshAtRef = useRef(0);
  const profileRef = useRef(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const refreshProfile = useCallback(async ({ force = false } = {}) => {
    if (!auth.currentUser) return null;

    const now = Date.now();

    if (
      !force &&
      lastRefreshAtRef.current > 0 &&
      now - lastRefreshAtRef.current < PROFILE_REFRESH_COOLDOWN
    ) {
      return profileRef.current;
    }

    // Toutes les demandes simultanées de /auth/me partagent la même Promise.
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    lastRefreshAtRef.current = now;

    refreshPromiseRef.current = (async () => {
      try {
        const me = await api.get("/auth/me");

        if (mountedRef.current) {
          profileRef.current = me;
          setProfile(me);
        }

        return me;
      } catch (error) {
        if (error?.status === 401) {
          await signOut(auth).catch(() => undefined);

          if (mountedRef.current) {
            profileRef.current = null;
            setFirebaseUser(null);
            setProfile(null);
          }
        }

        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    let disposed = false;

    const handleAuthState = async (user) => {
      if (disposed || !mountedRef.current) return;

      setFirebaseUser(user);

      if (!user) {
        profileRef.current = null;
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        await refreshProfile({ force: true });
      } catch (error) {
        console.error(
          "Impossible de récupérer le profil utilisateur:",
          error
        );
      } finally {
        if (!disposed && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthState);

    // Rafraîchissement uniquement lorsque l'application redevient active.
    // Aucun intervalle permanent : cela évite la boucle /auth/me.
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        auth.currentUser
      ) {
        refreshProfile();
      }
    };

    const handleWindowFocus = () => {
      if (auth.currentUser) {
        refreshProfile();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      disposed = true;
      mountedRef.current = false;

      unsubscribe();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [refreshProfile]);

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(
      auth,
      String(email).trim(),
      password
    );

    setFirebaseUser(credential.user);

    // Le listener Firebase lance déjà /auth/me.
    // refreshProfile() réutilise la même Promise si elle est en cours.
    const me = await refreshProfile({ force: true });

    if (!me) {
      throw new Error("Impossible de récupérer le profil utilisateur.");
    }

    setLoading(false);
    return credential;
  }

  async function logout() {
    try {
      await signOut(auth);
    } finally {
      refreshPromiseRef.current = null;
      lastRefreshAtRef.current = 0;
      profileRef.current = null;

      setFirebaseUser(null);
      setProfile(null);
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
