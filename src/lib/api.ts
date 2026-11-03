import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/auth-token";
import type { LoginResponse } from "@/types/AuthState";
import { resolveApiOrigin } from "@/lib/api-origin";

const path = "/api/v1";
const origin = import.meta.env.DEV ? "" : resolveApiOrigin(import.meta.env);

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean; _sessionVersion?: number };
let refreshRequest: { sessionVersion: number; promise: Promise<string> } | null = null;

function refreshAccessToken(sessionVersion: number) {
  if (refreshRequest?.sessionVersion !== sessionVersion) {
    const promise: Promise<string> = api
      .post<LoginResponse>("/empresas/auth/refresh")
      .then(({ data }) => {
        if (useAuthStore.getState().sessionVersion !== sessionVersion) {
          throw new axios.CanceledError("A sessão mudou durante a renovação.");
        }
        useAuthStore.getState().actions.refresh(data.accessToken, data.empresa);
        return data.accessToken;
      })
      .catch((error: unknown) => {
        if (useAuthStore.getState().sessionVersion !== sessionVersion) {
          throw new axios.CanceledError("A sessão mudou durante a renovação.");
        }
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          useAuthStore.getState().actions.logout();
        }
        throw error;
      })
      .finally(() => {
        if (refreshRequest?.promise === promise) refreshRequest = null;
      });
    refreshRequest = { sessionVersion, promise };
  }
  return refreshRequest.promise;
}

export function restoreAccessToken() {
  const { accessToken, canRefresh, sessionVersion } = useAuthStore.getState();
  if (!accessToken && canRefresh) return refreshAccessToken(sessionVersion);
}

export const api: AxiosInstance = axios.create({
  baseURL: `${origin}${path}`,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "quimia_csrf",
  xsrfHeaderName: "X-CSRF-TOKEN",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const request = config as RetryableRequest;
    const { accessToken: token, sessionVersion } = useAuthStore.getState();
    if (request._sessionVersion !== undefined && request._sessionVersion !== sessionVersion) {
      throw new axios.CanceledError("A sessão mudou antes do envio da requisição.");
    }
    request._sessionVersion = sessionVersion;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    throw error;
  },
  // Capture the initiating account before another login can change the store.
  { synchronous: true },
);

api.interceptors.response.use(
  (response) => {
    const config = response.config as RetryableRequest;
    if (
      !config.url?.includes("/empresas/auth/") &&
      config._sessionVersion !== useAuthStore.getState().sessionVersion
    ) {
      throw new axios.CanceledError("A resposta pertence a uma sessão anterior.");
    }
    return response;
  },
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequest;
    // Authentication errors must reach the caller without another login/refresh attempt.
    if (originalRequest.url?.includes("/empresas/auth/")) {
      return Promise.reject(error);
    }
    const { sessionVersion, canRefresh } = useAuthStore.getState();
    if (originalRequest._sessionVersion !== sessionVersion) {
      throw new axios.CanceledError("A requisição pertence a uma sessão anterior.");
    }
    if (!canRefresh) return Promise.reject(error);
    if (originalRequest._retry) {
      // A single feature endpoint may reject a valid, freshly renewed token.
      // Only the account check establishes that the session itself is invalid;
      // refresh rejection is handled by refreshAccessToken above.
      if (originalRequest.method === "get" && originalRequest.url === "/empresas/me") {
        useAuthStore.getState().actions.logout();
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const currentToken = useAuthStore.getState().accessToken;
    // A different request may have already renewed the token while this one was in flight.
    const token =
      currentToken && originalRequest.headers.Authorization !== `Bearer ${currentToken}`
        ? currentToken
        : await refreshAccessToken(sessionVersion);
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api(originalRequest);
  },
);
