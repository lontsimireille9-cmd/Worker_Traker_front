import { auth } from "../firebase/config";

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const productionApiUrl = "https://worker-traker-back.onrender.com";
const API_BASE_URL =
  import.meta.env.PROD && configuredApiUrl?.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)
    ? productionApiUrl
    : configuredApiUrl || productionApiUrl;
const REQUEST_TIMEOUT_MS = 15000;

function normalizeApiPayload(payload) {
  if (payload === null || payload === undefined) return payload;
  if (Array.isArray(payload)) return payload;
  if (payload.data !== undefined) return normalizeApiPayload(payload.data);
  if (Array.isArray(payload.tasks)) return payload.tasks;
  if (Array.isArray(payload.items)) return payload.items;
  return payload;
}

async function request(path, options = {}) {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Le serveur met trop de temps à répondre. Vérifiez que l'API est disponible.");
    }
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion et l'URL de l'API.");
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || data.error || `Erreur API (${res.status})`);
    error.status = res.status;
    throw error;
  }

  return normalizeApiPayload(data);
}

export const api = {
  get: (path) => request(path),
  post: (path, body = {}) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body = {}) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
  download: async (path) => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    const res = await fetch(`${API_BASE_URL}/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(`Erreur de telechargement (${res.status})`);
    return res.blob();
  },
};
