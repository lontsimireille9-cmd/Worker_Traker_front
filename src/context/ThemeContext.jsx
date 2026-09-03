import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export const DEFAULT_THEME = { primary: "#0B4F8A", primaryDark: "#06345D", accent: "#2F80ED", background: "#F4F8FC", surface: "#FFFFFF", text: "#16324F", font: "Inter" };
const FONT_STACKS = { Inter: "'Inter', Arial, sans-serif", Manrope: "'Manrope', Arial, sans-serif", "DM Sans": "'DM Sans', Arial, sans-serif", "Plus Jakarta Sans": "'Plus Jakarta Sans', Arial, sans-serif", Roboto: "'Roboto', Arial, sans-serif" };
const ThemeContext = createContext(null);

function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => { if (key !== "font") root.style.setProperty(`--theme-${key}`, value); });
  root.style.setProperty("--theme-font", FONT_STACKS[theme.font] || FONT_STACKS.Inter);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const { firebaseUser } = useAuth();

  useEffect(() => {
    let active = true;
    if (!firebaseUser) {
      setTheme(DEFAULT_THEME);
      return undefined;
    }
    api.get("/settings").then((data) => {
      if (active) setTheme({ ...DEFAULT_THEME, ...(data.theme || {}) });
    }).catch(() => {}).finally(() => applyTheme(theme));
    return () => { active = false; };
  }, [firebaseUser]);

  useEffect(() => applyTheme(theme), [theme]);

  async function saveTheme(next) {
    const data = await api.patch("/settings", { theme: next });
    const saved = { ...DEFAULT_THEME, ...(data.theme || next) };
    setTheme(saved);
    applyTheme(saved);
    return saved;
  }

  return <ThemeContext.Provider value={{ theme, setTheme, saveTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
