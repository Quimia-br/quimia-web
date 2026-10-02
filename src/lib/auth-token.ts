import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { EmpresaSummary } from "@/types/Empresa";

interface AuthState {
  accessToken: string | null;
  user: EmpresaSummary | null;
  isAuthenticated: boolean;
  actions: {
    login: (token: string, user: EmpresaSummary) => void;
    logout: () => void;
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      actions: {
        login: (token, user) =>
          set({ accessToken: token, user, isAuthenticated: true }),
        logout: () =>
          set({ accessToken: null, user: null, isAuthenticated: false }),
      },
    }),
    {
      name: "quimia:auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthActions = () => useAuthStore((state) => state.actions);
