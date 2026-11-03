import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

afterEach(cleanup);
describe("overlay keyboard access", () => {
  it.each(["dialog", "sheet"] as const)(
    "names the %s close action in Portuguese and restores keyboard focus",
    async (kind) => {
      const user = userEvent.setup();
      render(
        kind === "dialog" ? (
          <Dialog>
            <DialogTrigger>Abrir</DialogTrigger>
            <DialogContent>
              <DialogTitle>Detalhes</DialogTitle>
              <DialogDescription>Revise as informações.</DialogDescription>
              <input aria-label="Nome" />
            </DialogContent>
          </Dialog>
        ) : (
          <Sheet>
            <SheetTrigger>Abrir</SheetTrigger>
            <SheetContent>
              <SheetTitle>Detalhes</SheetTitle>
              <SheetDescription>Revise as informações.</SheetDescription>
              <input aria-label="Nome" />
            </SheetContent>
          </Sheet>
        ),
      );
      const trigger = screen.getByRole("button", { name: "Abrir" });
      await user.click(trigger);
      const popup = await screen.findByRole("dialog", { name: "Detalhes" });
      const input = within(popup).getByLabelText("Nome");
      await waitFor(() => expect(input).toHaveFocus());
      const close = within(popup).getByRole("button", { name: "Fechar" });
      await user.tab();
      expect(close).toHaveFocus();
      await user.tab();
      await waitFor(() => expect(input).toHaveFocus());
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    },
  );
});
