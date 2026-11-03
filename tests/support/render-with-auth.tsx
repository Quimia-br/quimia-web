import { render, type RenderOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-provider";

/** Integration fixtures use the same session boundary as the application. */
export function renderWithAuth(ui: ReactNode, options?: RenderOptions): ReturnType<typeof render> {
  return render(<AuthProvider>{ui}</AuthProvider>, options);
}
