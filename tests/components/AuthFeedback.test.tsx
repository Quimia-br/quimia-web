import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import AuthFeedback from "@/components/AuthFeedback";

describe("AuthFeedback", () => {
  it.each(["success", "error"] as const)("renders the %s icon as SVG", (variant) => {
    const { container } = render(
      <AuthFeedback variant={variant} title="Resultado">
        <span>Continuar</span>
      </AuthFeedback>,
    );
    const icon = container.querySelector('[data-slot="auth-feedback-icon"]');
    expect(icon?.querySelector("svg")).not.toBeNull();
    expect(icon?.querySelector("img")).toBeNull();
  });
});
