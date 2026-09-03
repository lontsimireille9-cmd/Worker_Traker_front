import { auth } from "../firebase/config";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://worker-traker-back.onrender.com";
const COMPANY_SESSION_KEY = "suivi-company-session";

function getCompanySession() {
  return localStorage.getItem(COMPANY_SESSION_KEY);
}

function clearCompanyStorage() {
  localStorage.removeItem(COMPANY_SESSION_KEY);
  localStorage.removeItem("suivi-active-company");
}

async function request(path, options = {}) {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  const companySession = getCompanySession();
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(companySession ? { "X-Company-Session": companySession } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if ([401, 423].includes(res.status) && !path.startsWith("/auth/") && !path.startsWith("/companies")) {
      clearCompanyStorage();
      window.dispatchEvent(new CustomEvent("company-session-expired"));
    }
    const error = new Error(data.message || data.error || `Erreur API (${res.status})`);
    error.status = res.status;
    throw error;
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body = {}) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body = {}) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  setCompanySession(token) {
    if (token) localStorage.setItem(COMPANY_SESSION_KEY, token);
    else localStorage.removeItem(COMPANY_SESSION_KEY);
  },
  getCompanySession,
  clearCompanySession() {
    localStorage.removeItem(COMPANY_SESSION_KEY);
  },
};
