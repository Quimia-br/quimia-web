import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider } from "./lib/theme-provider";
import { AccessibilityProvider } from "./lib/accessibility-provider";
import AccessibilityTools from "./components/accessibility/AccessibilityTools";
import { AuthProvider } from "./lib/auth-provider";

export interface ProvidersProps {
  children: ReactNode;
}

function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <AccessibilityProvider>
        <ThemeProvider>
          {children}
          <AccessibilityTools />
        </ThemeProvider>
      </AccessibilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default Providers;
