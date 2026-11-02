import type { AuthState } from "@/types/AuthState";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      sessionVersion: 0,
      canRefresh: true,
      actions: {
        login: (token, user) =>
          set((state) => ({
            accessToken: token,
            user,
            isAuthenticated: true,
            canRefresh: true,
            sessionVersion: state.sessionVersion + 1,
          })),
        refresh: (token, user) => set({ accessToken: token, user, isAuthenticated: true }),
        logout: () =>
          set((state) => ({
            accessToken: null,
            user: null,
            isAuthenticated: false,
            canRefresh: false,
            sessionVersion: state.sessionVersion + 1,
          })),
        setAccessToken: (token) => set({ accessToken: token }),
        updateUser: (user) => set({ user }),
      },
    }),
    {
      name: "quimia:auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthActions = () => useAuthStore((state) => state.actions);
