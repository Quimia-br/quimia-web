import axios from "axios";
import type { AxiosInstance } from "axios";
import { useAuthStore } from "@/lib/auth-token";

const path = "/api/v1"

export const api: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_KEY}${path}`,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "quimia_csrf",
  xsrfHeaderName: "X-CSRF-TOKEN",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
