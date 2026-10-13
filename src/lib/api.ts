import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/auth-token";
import type { LoginResponse } from "@/types/AuthState";

const path = "/api/v1";
const origin = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_KEY ?? "").replace(/\/$/, "");

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api.post<LoginResponse>("/empresas/auth/refresh")
      .then(({ data }) => {
        useAuthStore.getState().actions.login(data.accessToken, data.empresa);
        return data.accessToken;
      })
      .catch((error: unknown) => {
        useAuthStore.getState().actions.logout();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
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
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequest;
    // Authentication errors must reach the caller without another login/refresh attempt.
    if (originalRequest.url?.includes("/empresas/auth/")) {
      return Promise.reject(error);
    }
    if (originalRequest._retry) {
      useAuthStore.getState().actions.logout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const currentToken = useAuthStore.getState().accessToken;
    // A different request may have already renewed the token while this one was in flight.
    const token = currentToken && originalRequest.headers.Authorization !== `Bearer ${currentToken}`
      ? currentToken
      : await refreshAccessToken();
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api(originalRequest);
  }
);
