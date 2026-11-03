import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vite-plus/test";
import ProductFdsReview from "@/components/ProductFdsReview";
import { pendingAnalysis } from "../fixtures/fds";
import type { FdsAnalysis } from "@/types/Produto";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const first = pendingAnalysis.pendencias[0];
const second = {
  ...first,
  secao: "04",
  composto: { indice: 1, nome: "Etanol", casNumero: "64-17-5" },
};

it("keeps an unfinished correction with its pending item when the list is reordered", () => {
  const analysis: FdsAnalysis = { ...pendingAnalysis, pendencias: [first, second] };
  const onCorrect = vi.fn();
  const { rerender } = render(
    <ProductFdsReview
      analysis={analysis}
      corrections={[]}
      disabled={false}
      onCorrect={onCorrect}
    />,
  );
  const firstCard = screen.getByRole("article", { name: "Seção 03: Unidade de concentração" });
  fireEvent.click(within(firstCard).getByRole("button", { name: "Marcar como resolvido" }));
  fireEvent.change(within(firstCard).getByLabelText("Unidade de concentração"), {
    target: { value: "%" },
  });

  rerender(
    <ProductFdsReview
      analysis={{ ...analysis, pendencias: [second, first] }}
      corrections={[]}
      disabled={false}
      onCorrect={onCorrect}
    />,
  );

  const reorderedCard = screen.getByRole("article", { name: "Seção 03: Unidade de concentração" });
  expect(within(reorderedCard).getByLabelText("Unidade de concentração")).toHaveValue("%");
  fireEvent.click(within(reorderedCard).getByRole("button", { name: "Salvar correção" }));
  expect(onCorrect).toHaveBeenCalledWith(0, { indice: 0, unidadeConcentracao: "%" });
  expect(
    within(screen.getByRole("article", { name: "Seção 04: Unidade de concentração" })).queryByRole(
      "textbox",
    ),
  ).not.toBeInTheDocument();
});

it("keeps duplicate pending items and evidence without duplicate React keys", () => {
  const consoleError = vi.spyOn(console, "error");
  const pending = { ...first, evidencias: [first.evidencias[0], first.evidencias[0]] };
  render(
    <ProductFdsReview
      analysis={{ ...pendingAnalysis, pendencias: [pending, pending] }}
      corrections={[]}
      disabled={false}
      onCorrect={() => {}}
    />,
  );
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getAllByText(first.evidencias[0].textoEvidencia)).toHaveLength(4);
  expect(consoleError).not.toHaveBeenCalled();
});

it("starts a fresh correction when a different analysis has the same pending content", () => {
  const { rerender } = render(
    <ProductFdsReview
      analysis={pendingAnalysis}
      corrections={[]}
      disabled={false}
      onCorrect={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Marcar como resolvido" }));
  fireEvent.change(screen.getByLabelText("Unidade de concentração"), { target: { value: "%" } });
  rerender(
    <ProductFdsReview
      analysis={{ ...pendingAnalysis, analiseId: "another-pdf" }}
      corrections={[]}
      disabled={false}
      onCorrect={() => {}}
    />,
  );
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Marcar como resolvido" })).toBeInTheDocument();
});
