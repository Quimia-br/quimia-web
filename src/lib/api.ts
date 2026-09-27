import axios from "axios";
import type { AxiosInstance } from "axios";
import { getAccessToken } from "@/lib/auth-token";

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "quimia_csrf",
  xsrfHeaderName: "X-CSRF-TOKEN",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
