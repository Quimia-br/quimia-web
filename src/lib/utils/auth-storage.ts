import { z } from "zod";
import type { PersistStorage } from "zustand/middleware";
import type { AuthState } from "@/types/AuthState";
import {
  isStorageRecord,
  readStoredValue,
  removeStoredValue,
  writeStoredValue,
  type StorageSchema,
} from "@/lib/utils/storage";

type RememberedIdentity = Pick<AuthState, "user" | "isAuthenticated">;
const identityPayload = z
  .object({
    user: z
      .object({ id: z.number().int().positive(), nome: z.string(), email: z.email() })
      .nullable(),
    isAuthenticated: z.boolean(),
  })
  .refine((value) => value.isAuthenticated === (value.user !== null));

function parseIdentity(value: unknown): RememberedIdentity | undefined {
  const parsed = identityPayload.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

const identitySchema: StorageSchema<RememberedIdentity | null> = {
  version: 1,
  parse: parseIdentity,
  migrate: (legacy) =>
    isStorageRecord(legacy) && (legacy.version === 0 || legacy.version === undefined)
      ? parseIdentity(legacy.state)
      : undefined,
};

/** Zustand cannot hydrate arbitrary stored keys such as accessToken or sessionVersion. */
export const authIdentityStorage: PersistStorage<RememberedIdentity> = {
  getItem: (name) => {
    const state = readStoredValue(name, identitySchema, null);
    return state === null ? null : { state, version: 1 };
  },
  setItem: (name, value) => writeStoredValue(name, value.state, identitySchema),
  removeItem: removeStoredValue,
};
