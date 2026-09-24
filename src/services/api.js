import { auth } from "../firebase/config";

/**
 * ============================================================
 * CONFIGURATION API
 * ============================================================
 */

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

const productionApiUrl = "https://worker-tracker-back.onrender.com";

const API_BASE_URL =
  import.meta.env.PROD &&
  configuredApiUrl?.match(
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
  )
    ? productionApiUrl
    : configuredApiUrl || productionApiUrl;

/**
 * ============================================================
 * RETRIES
 * ============================================================
 */

const MAX_RETRIES = 4;
const BASE_RETRY_DELAY_MS = 800;
const MAX_RETRY_DELAY_MS = 10000;

/**
 * ============================================================
 * RÉSEAU
 * ============================================================
 */

function getNetworkQuality() {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (!connection) {
    return {
      effectiveType: "unknown",
      downlink: null,
      rtt: null,
    };
  }

  return {
    effectiveType: connection.effectiveType || "unknown",
    downlink:
      typeof connection.downlink === "number"
        ? connection.downlink
        : null,
    rtt:
      typeof connection.rtt === "number"
        ? connection.rtt
        : null,
  };
}

function getAdaptiveRetryDelay(attempt) {
  const network = getNetworkQuality();

  let multiplier = 1;

  switch (network.effectiveType) {
    case "slow-2g":
      multiplier = 3;
      break;

    case "2g":
      multiplier = 2.5;
      break;

    case "3g":
      multiplier = 1.5;
      break;

    case "4g":
      multiplier = 1;
      break;

    default:
      multiplier = 1.25;
      break;
  }

  if (network.rtt !== null) {
    if (network.rtt > 1000) {
      multiplier *= 2;
    } else if (network.rtt > 500) {
      multiplier *= 1.5;
    }
  }

  const exponentialDelay =
    BASE_RETRY_DELAY_MS *
    Math.pow(2, Math.max(0, attempt - 1));

  const jitter = Math.random() * 300;

  return Math.min(
    exponentialDelay * multiplier + jitter,
    MAX_RETRY_DELAY_MS
  );
}

async function waitForNetwork() {
  if (navigator.onLine !== false) {
    return;
  }

  await new Promise((resolve) => {
    const handleOnline = () => {
      window.removeEventListener("online", handleOnline);
      resolve();
    };

    window.addEventListener("online", handleOnline);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return (
    status === 408 ||
    status === 425 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function isNetworkError(error) {
  if (!error) return false;

  if (error.name === "AbortError") {
    return false;
  }

  return (
    error instanceof TypeError ||
    error.name === "NetworkError" ||
    error.name === "FetchError"
  );
}

function getRetryAfterDelay(response) {
  const retryAfter = response.headers.get("Retry-After");

  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);

  if (Number.isFinite(seconds)) {
    return Math.min(
      seconds * 1000,
      MAX_RETRY_DELAY_MS
    );
  }

  const date = Date.parse(retryAfter);

  if (!Number.isNaN(date)) {
    const delay = date - Date.now();

    if (delay > 0) {
      return Math.min(
        delay,
        MAX_RETRY_DELAY_MS
      );
    }
  }

  return null;
}

/**
 * ============================================================
 * PAYLOAD
 * ============================================================
 */

function normalizeApiPayload(payload) {
  if (
    payload === null ||
    payload === undefined
  ) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload.data !== undefined) {
    return normalizeApiPayload(payload.data);
  }

  if (Array.isArray(payload.tasks)) {
    return payload.tasks;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return payload;
}

/**
 * ============================================================
 * PARSE RESPONSE
 * ============================================================
 */

async function parseResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response
      .json()
      .catch(() => ({}));
  }

  const text = await response
    .text()
    .catch(() => "");

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

/**
 * ============================================================
 * HTTP ERRORS
 * ============================================================
 */

function createHttpError(
  response,
  data
) {
  let message;

  if (
    data &&
    typeof data === "object"
  ) {
    message =
      data.message ||
      data.error ||
      `Erreur API (${response.status})`;
  } else {
    message =
      `Erreur API (${response.status})`;
  }

  const error = new Error(message);

  error.status = response.status;
  error.data = data;
  error.retryable =
    isRetryableStatus(response.status);

  return error;
}

/**
 * ============================================================
 * REQUÊTE
 * ============================================================
 */

const inflightGetRequests =
  new Map();

function getRequestKey(
  path,
  method
) {
  const uid =
    auth.currentUser?.uid ||
    "anonymous";

  return `${uid}:${method}:${path}`;
}

async function requestInternal(
  path,
  options = {}
) {
  const method =
    (
      options.method ||
      "GET"
    ).toUpperCase();

  const isReadRequest =
    method === "GET" ||
    method === "HEAD";

  const user =
    auth.currentUser;

  let token = null;

  try {
    token = user
      ? await user.getIdToken()
      : null;
  } catch (error) {
    console.error(
      "Impossible de récupérer le token Firebase :",
      error
    );

    throw new Error(
      "Votre session semble avoir un problème. Veuillez vous reconnecter."
    );
  }

  const headers = {
    "Content-Type":
      "application/json",

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),

    ...options.headers,
  };

  const externalSignal =
    options.signal;

  let lastError = null;

  for (
    let attempt = 0;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      await waitForNetwork();

      const controller =
        new AbortController();

      let removeAbortListener =
        null;

      if (externalSignal) {
        if (
          externalSignal.aborted
        ) {
          controller.abort();
        } else {
          const handleExternalAbort =
            () => {
              controller.abort();
            };

          externalSignal.addEventListener(
            "abort",
            handleExternalAbort,
            {
              once: true,
            }
          );

          removeAbortListener =
            () => {
              externalSignal.removeEventListener(
                "abort",
                handleExternalAbort
              );
            };
        }
      }

      let response;

      try {
        response = await fetch(
          `${API_BASE_URL}/api${path}`,
          {
            ...options,
            signal:
              controller.signal,
            headers,
            // Les lectures métier (projets, équipes, employés, etc.)
            // doivent toujours refléter Firestore. Évite qu'un 304
            // conserve une ancienne réponse, notamment après le
            // rattachement d'une équipe à un projet.
            ...(isReadRequest && !options.cache
              ? { cache: "no-store" }
              : {}),
          }
        );
      } finally {
        if (
          removeAbortListener
        ) {
          removeAbortListener();
        }
      }

      const data =
        await parseResponse(
          response
        );

      if (response.ok) {
        return normalizeApiPayload(
          data
        );
      }

      const httpError =
        createHttpError(
          response,
          data
        );

      if (
        !isReadRequest ||
        !isRetryableStatus(
          response.status
        )
      ) {
        throw httpError;
      }

      lastError = httpError;

      if (
        attempt >=
        MAX_RETRIES
      ) {
        break;
      }

      const serverDelay =
        getRetryAfterDelay(
          response
        );

      const retryDelay =
        serverDelay !== null
          ? serverDelay
          : getAdaptiveRetryDelay(
              attempt + 1
            );

      console.warn(
        `[API] ${method} ${path} → HTTP ${response.status}. ` +
          `Nouvelle tentative ${attempt + 1}/${MAX_RETRIES} ` +
          `dans ${Math.round(retryDelay)} ms.`
      );

      await sleep(
        retryDelay
      );
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        throw new Error(
          "La requête a été annulée."
        );
      }

      if (
        isNetworkError(error)
      ) {
        lastError = error;

        if (!isReadRequest) {
          throw new Error(
            "La connexion au serveur a été interrompue. " +
              "Vérifiez votre connexion puis réessayez."
          );
        }

        if (
          attempt <
          MAX_RETRIES
        ) {
          await waitForNetwork();

          const retryDelay =
            getAdaptiveRetryDelay(
              attempt + 1
            );

          console.warn(
            `[API] ${method} ${path} → problème réseau. ` +
              `Nouvelle tentative ${attempt + 1}/${MAX_RETRIES} ` +
              `dans ${Math.round(retryDelay)} ms.`
          );

          await sleep(
            retryDelay
          );

          continue;
        }

        throw new Error(
          "La connexion au serveur est instable. " +
            "Vérifiez votre connexion Internet puis réessayez."
        );
      }

      if (
        error?.retryable &&
        isReadRequest &&
        isRetryableStatus(
          error.status
        )
      ) {
        lastError = error;

        if (
          attempt <
          MAX_RETRIES
        ) {
          const retryDelay =
            getAdaptiveRetryDelay(
              attempt + 1
            );

          await sleep(
            retryDelay
          );

          continue;
        }
      }

      throw error;
    }
  }

  if (lastError?.status) {
    if (
      lastError.status === 503
    ) {
      throw new Error(
        "Le serveur est temporairement indisponible. " +
          "Il peut être en cours de démarrage."
      );
    }

    if (
      lastError.status === 429
    ) {
      throw new Error(
        "Trop de requêtes ont été envoyées. Veuillez patienter quelques instants."
      );
    }

    if (
      lastError.status >= 500
    ) {
      throw new Error(
        "Le serveur rencontre actuellement un problème. Veuillez réessayer dans quelques instants."
      );
    }

    throw lastError;
  }

  throw new Error(
    "Impossible de joindre le serveur. Vérifiez votre connexion Internet."
  );
}

/**
 * ============================================================
 * REQUEST WRAPPER
 * ============================================================
 */

async function request(
  path,
  options = {}
) {
  const method =
    (
      options.method ||
      "GET"
    ).toUpperCase();

  if (
    (
      method === "GET" ||
      method === "HEAD"
    ) &&
    !options.signal
  ) {
    const key =
      getRequestKey(
        path,
        method
      );

    const existing =
      inflightGetRequests.get(
        key
      );

    if (existing) {
      return existing;
    }

    const promise =
      requestInternal(
        path,
        options
      );

    inflightGetRequests.set(
      key,
      promise
    );

    promise
      .finally(() => {
        if (
          inflightGetRequests.get(
            key
          ) === promise
        ) {
          inflightGetRequests.delete(
            key
          );
        }
      })
      .catch(
        () => undefined
      );

    return promise;
  }

  return requestInternal(
    path,
    options
  );
}

/**
 * ============================================================
 * API PUBLIQUE
 * ============================================================
 */

export const api = {
  /**
   * GET
   */
  get: (
    path,
    options = {}
  ) =>
    request(path, {
      ...options,
      method: "GET",
    }),

  /**
   * POST
   */
  post: (
    path,
    body = {},
    options = {}
  ) =>
    request(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(
        body
      ),
    }),

  /**
   * PUT
   *
   * IMPORTANT :
   * Nécessaire pour :
   *
   * PUT /projects/:id/structure
   */
  put: (
    path,
    body = {},
    options = {}
  ) =>
    request(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(
        body
      ),
    }),

  /**
   * PATCH
   */
  patch: (
    path,
    body = {},
    options = {}
  ) =>
    request(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(
        body
      ),
    }),

  /**
   * DELETE
   */
  delete: (
    path,
    options = {}
  ) =>
    request(path, {
      ...options,
      method: "DELETE",
    }),

  /**
   * DOWNLOAD
   */
  download: async (
    path,
    options = {}
  ) => {
    const user =
      auth.currentUser;

    let token = null;

    try {
      token = user
        ? await user.getIdToken()
        : null;
    } catch {
      throw new Error(
        "Votre session semble avoir un problème. Veuillez vous reconnecter."
      );
    }

    const headers = {
      ...(token
        ? {
            Authorization:
              `Bearer ${token}`,
          }
        : {}),

      ...options.headers,
    };

    let lastError = null;

    for (
      let attempt = 0;
      attempt <= MAX_RETRIES;
      attempt++
    ) {
      try {
        await waitForNetwork();

        const controller =
          new AbortController();

        let removeAbortListener =
          null;

        if (options.signal) {
          if (
            options.signal.aborted
          ) {
            controller.abort();
          } else {
            const handleAbort =
              () =>
                controller.abort();

            options.signal.addEventListener(
              "abort",
              handleAbort,
              {
                once: true,
              }
            );

            removeAbortListener =
              () => {
                options.signal.removeEventListener(
                  "abort",
                  handleAbort
                );
              };
          }
        }

        let response;

        try {
          response = await fetch(
            `${API_BASE_URL}/api${path}`,
            {
              ...options,
              method: "GET",
              signal:
                controller.signal,
              headers,
            }
          );
        } finally {
          if (
            removeAbortListener
          ) {
            removeAbortListener();
          }
        }

        if (response.ok) {
          return response.blob();
        }

        const data =
          await parseResponse(
            response
          );

        const error =
          createHttpError(
            response,
            data
          );

        if (
          !isRetryableStatus(
            response.status
          )
        ) {
          throw error;
        }

        lastError = error;

        if (
          attempt >=
          MAX_RETRIES
        ) {
          break;
        }

        const serverDelay =
          getRetryAfterDelay(
            response
          );

        const retryDelay =
          serverDelay !== null
            ? serverDelay
            : getAdaptiveRetryDelay(
                attempt + 1
              );

        await sleep(
          retryDelay
        );
      } catch (error) {
        if (
          error?.name ===
          "AbortError"
        ) {
          throw new Error(
            "Le téléchargement a été annulé."
          );
        }

        if (
          isNetworkError(error)
        ) {
          lastError = error;

          if (
            attempt <
            MAX_RETRIES
          ) {
            await waitForNetwork();

            const retryDelay =
              getAdaptiveRetryDelay(
                attempt + 1
              );

            await sleep(
              retryDelay
            );

            continue;
          }

          throw new Error(
            "Le téléchargement n'a pas pu être effectué. " +
              "Vérifiez votre connexion Internet puis réessayez."
          );
        }

        throw error;
      }
    }

    if (
      lastError?.status >=
      500
    ) {
      throw new Error(
        "Le serveur ne peut pas effectuer le téléchargement actuellement."
      );
    }

    throw new Error(
      "Le téléchargement n'a pas pu être effectué."
    );
  },
};

/**
 * ============================================================
 * INFORMATIONS CONNEXION
 * ============================================================
 */

export function getConnectionInfo() {
  const network =
    getNetworkQuality();

  return {
    online:
      navigator.onLine,
    effectiveType:
      network.effectiveType,
    downlinkMbps:
      network.downlink,
    rttMs:
      network.rtt,
  };
}

export function onConnectionChange(
  callback
) {
  if (
    typeof callback !==
    "function"
  ) {
    return () => {};
  }

  const handleOnline =
    () => {
      callback({
        ...getConnectionInfo(),
        online: true,
      });
    };

  const handleOffline =
    () => {
      callback({
        ...getConnectionInfo(),
        online: false,
      });
    };

  window.addEventListener(
    "online",
    handleOnline
  );

  window.addEventListener(
    "offline",
    handleOffline
  );

  return () => {
    window.removeEventListener(
      "online",
      handleOnline
    );

    window.removeEventListener(
      "offline",
      handleOffline
    );
  };
}