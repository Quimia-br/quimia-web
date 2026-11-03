import { AxiosError, isAxiosError, isCancel } from "axios";
import type { AxiosResponse } from "axios";
import { z } from "zod";

export class ServiceError extends Error {
  readonly operation: string;
  constructor(operation: string, cause: unknown) {
    super(`Não foi possível concluir a operação ${operation}.`, { cause });
    this.name = "ServiceError";
    this.operation = operation;
  }
}

export function normalizeServiceError(cause: unknown, operation: string): Error {
  // Preserve metadata consumed by forms, auth guards, retries, and cancellation.
  if (
    isAxiosError(cause) ||
    isCancel(cause) ||
    cause instanceof z.ZodError ||
    (cause instanceof Error && cause.name === "AbortError")
  )
    return cause;
  return new ServiceError(operation, cause);
}

export function parseResponse<T>(
  response: AxiosResponse<unknown>,
  schema: z.ZodType<T>,
  message: string,
): T {
  const parsed = schema.safeParse(response.data);
  if (parsed.success) return parsed.data;
  const error = new AxiosError(
    message,
    AxiosError.ERR_BAD_RESPONSE,
    response.config,
    response.request,
    response,
  );
  error.cause = parsed.error;
  throw error;
}
