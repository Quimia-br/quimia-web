import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ViteThemeProvider } from "@space-man/react-theme-animation";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ViteThemeProvider
        defaultTheme="system"
        defaultColorTheme="default"
        storageKey="theme"
        colorStorageKey="color-theme"
      >
        {children}
      </ViteThemeProvider>
    </QueryClientProvider>
  );
}
