import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/shared/store/authStore";

// ---------------------------------------------------------------------------
// Instancia base
// ---------------------------------------------------------------------------
export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? "http://localhost:8000") + "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ---------------------------------------------------------------------------
// Request interceptor — adjunta el access token a cada petición
// ---------------------------------------------------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Acceso fuera de React con getState() — no provoca re-renders
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — refresh automático al recibir 401
//
// Problema a resolver: si hay N peticiones en vuelo cuando el token expira,
// todas recibirán 401. Sin la cola, todas intentarían hacer refresh en
// paralelo, lo que provocaría que solo la primera funcionara y las demás
// fallaran por replay del refresh token.
//
// Solución: la primera petición que recibe 401 inicia el refresh y bloquea
// el flag `isRefreshing`. Las siguientes se encolan en `failedQueue` y
// esperan. Cuando el refresh termina (éxito o error), se drena la cola.
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function drainQueue(token: string | null, err: unknown = null): void {
  failedQueue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(err);
  });
  failedQueue = [];
}

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    // Solo manejamos 401 en peticiones que no sean el propio refresh
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      original.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Ya hay un refresh en curso — encolar y esperar
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${newToken}`,
          };
          return api(original);
        })
        .catch((err) => Promise.reject(err));
    }

    // Esta petición inicia el refresh
    original._retry = true;
    isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    try {
      // Llamada directa con axios (no con la instancia `api`) para evitar
      // que el request interceptor adjunte el token expirado y entre en loop
      const { data } = await axios.post(
        `${(import.meta.env.VITE_API_URL ?? "http://localhost:8000")}/api/v1/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const newAccessToken: string = data.access_token;
      const newRefreshToken: string = data.refresh_token;

      useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);

      // Actualizar el header de la petición original y drenar la cola
      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      drainQueue(newAccessToken);

      return api(original);
    } catch (refreshError) {
      drainQueue(null, refreshError);
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
