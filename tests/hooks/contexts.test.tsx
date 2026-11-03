import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import useTheme from "@/hooks/use-theme";
import useDataDisplay from "@/hooks/use-data-display";
import { useSidebar } from "@/hooks/use-sidebar";

afterEach(cleanup);

describe("context guards", () => {
  it.each([
    { name: "useTheme", useContextHook: useTheme, provider: "ThemeProvider" },
    { name: "useDataDisplay", useContextHook: useDataDisplay, provider: "DataDisplayProvider" },
    { name: "useSidebar", useContextHook: useSidebar, provider: "SidebarProvider" },
  ])(
    "rejects $name outside its provider with an actionable error",
    ({ useContextHook, provider }) => {
      expect(() => renderHook(() => useContextHook())).toThrow(new RegExp(`within a ${provider}`));
    },
  );
});
