import { api } from "@/services/api";
import { useAuthStore } from "@/lib/auth-token";
import { CanceledError } from "axios";
import { z } from "zod";
import {
  validateLogin,
  validateRegister,
  validateResetPassword,
} from "@/lib/utils/validation-auth";
import { emailSchema, positiveIdSchema } from "@/lib/utils/validation";
import { normalizeServiceError, parseResponse } from "./errors";
import type { EmpresaSummary } from "@/types/Empresa";
import type { LoginCredentials, RegisterRequest, ResetPasswordData } from "@/types/AuthState";

const path = "/empresas/auth";
const empresaSchema = z.object({
  id: positiveIdSchema,
  nome: z.string().min(1),
  email: z.email(),
});
const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().positive(),
  empresa: empresaSchema,
});

export async function register(credentials: RegisterRequest): Promise<EmpresaSummary> {
  try {
    const response = await api.post<unknown>(`${path}/register`, validateRegister(credentials));
    return parseResponse(response, empresaSchema, "invalid_registration_response");
  } catch (cause) {
    throw normalizeServiceError(cause, "auth.register");
  }
}

export async function login(credentials: LoginCredentials): Promise<EmpresaSummary> {
  try {
    const sessionVersion = useAuthStore.getState().sessionVersion;
    const response = await api.post<unknown>(`${path}/login`, validateLogin(credentials));
    const data = parseResponse(response, loginResponseSchema, "invalid_login_response");

    if (useAuthStore.getState().sessionVersion !== sessionVersion) {
      throw new CanceledError("A sessão mudou durante o login.");
    }
    useAuthStore.getState().actions.login(data.accessToken, data.empresa);

    return data.empresa;
  } catch (cause) {
    throw normalizeServiceError(cause, "auth.login");
  }
}

export async function logout(): Promise<void> {
  try {
    useAuthStore.getState().actions.logout();
    await api.post(`${path}/logout`);
  } catch (cause) {
    throw normalizeServiceError(cause, "auth.logout");
  }
}

export async function forgotPassword(email: string): Promise<void> {
  try {
    await api.post(`${path}/forgot-password`, {
      email: emailSchema.parse(email),
    });
  } catch (cause) {
    throw normalizeServiceError(cause, "auth.forgotPassword");
  }
}

export async function resetPassword(input: ResetPasswordData): Promise<void> {
  try {
    await api.post(`${path}/reset-password`, validateResetPassword(input));
  } catch (cause) {
    throw normalizeServiceError(cause, "auth.resetPassword");
  }
}
