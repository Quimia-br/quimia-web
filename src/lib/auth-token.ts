import type { AuthState } from "@/types/AuthState";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
        setAccessToken: (token) =>
          set({ accessToken: token }),
      },
    }),
    {
      name: "quimia:auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthActions = () => useAuthStore((state) => state.actions);
