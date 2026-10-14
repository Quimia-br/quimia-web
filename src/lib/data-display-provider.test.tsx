import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import useDataDisplay from "@/hooks/use-data-display";
import DataDisplayToggle from "@/components/DataDisplayToggle";
import { DataDisplayProvider } from "./data-display-provider";

const firstKey = "test:display:first";
const secondKey = "test:display:second";

function DisplayReader() {
  const { dataDisplay } = useDataDisplay();
  return <output>{dataDisplay}</output>;
}

afterEach(() => {
  localStorage.removeItem(firstKey);
  localStorage.removeItem(secondKey);
  vi.restoreAllMocks();
});

describe("DataDisplayProvider", () => {
  it("uses the fallback for an invalid saved value", () => {
    localStorage.setItem(firstKey, "cards");
    render(<DataDisplayProvider defaultDataDisplay="grid" storageKey={firstKey}><DisplayReader /></DataDisplayProvider>);
    expect(screen.getByText("grid")).toBeVisible();
  });

  it("updates in memory when browser storage denies reads and writes", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    render(<DataDisplayProvider storageKey={firstKey}><DisplayReader /><DataDisplayToggle /></DataDisplayProvider>);
    expect(screen.getByText("table")).toBeVisible();
    await userEvent.setup().click(screen.getByRole("button", { name: "Alternar para visualização em grade" }));
    expect(screen.getByText("grid")).toBeVisible();
  });

  it("isolates saved choices by key", async () => {
    const view = render(<DataDisplayProvider storageKey={firstKey}><DisplayReader /><DataDisplayToggle /></DataDisplayProvider>);
    await userEvent.setup().click(screen.getByRole("button", { name: "Alternar para visualização em grade" }));
    view.unmount();
    render(<DataDisplayProvider storageKey={secondKey}><DisplayReader /></DataDisplayProvider>);
    expect(screen.getByText("table")).toBeVisible();
    expect(localStorage.getItem(firstKey)).toBe("grid");
  });

  it("requires a provider", () => {
    expect(() => render(<DisplayReader />)).toThrow("useDataDisplay must be used within a DataDisplayProvider");
  });
});
