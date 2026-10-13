# Chip and Product Search Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the Figma Chip as an accessible reusable filter toggle and connect product search field selection to URL state.
**Architecture:** Chip wraps installed Base UI Toggle; ChipAction provides the matching ordinary-action appearance for Clear. Generic ChipFilters owns reusable multiple-selection/group/clear UI, with options/value/onValueChange supplied by its consumer. ProductSearchFields is a thin application of ChipFilters with useProductSearchFields/nuqs. Theme/display/toast providers stay as they are; filter-panel visibility is local UI state.
**Tech Stack:** React 19, Tailwind v4, Lucide, @base-ui/react 1.8.0, nuqs 2.10.1, Vitest/Testing Library.
**Spec:** User asks Chip for filter toggles, implementation based on Figma component and Products > Filtros, accessible selected info; user confirmed chips choose fields for query q, with multiple selected.

## Global Constraints

- Preserve all unrelated user WIP, including freshly extracted AddButton/FilterButton. No commits, resets, staging, worktree moves, API changes or Figma writes. No subagents inside implementer/reviewers.
- No dependency installation. No new tests within ui/, smoothui/, evilcharts/. Preserve provider ownership and q/p integration.
- Figma Chip 405:2961: pill, padding x24/y12, Aeonik Medium16, label line19, selected background primary-primary with primary-foreground text, unselected surface-base with foreground-primary text, selected Lucide X20 after label with gap10. primary-foreground matches light Figma #404040 and preserves readable dark-on-cyan text in the dark theme. Intrinsic width (example Chip:82 unselected/112 selected), height43/44; allow long labels to wrap on narrow screens. Focus visible, disabled, mild token-based hover and reduced-motion-safe transitions.
- Figma Products filters row435:2037: Nome, Tipo, Código de barras, Limpar filtros; gap18. Both Nome/Tipo selected in the reference state, barcode unselected. Reference is a state example, not a mandated initial preference. Filter icon435:1834 remains current onColor appearance.
- Generic Chip supports Base UI pressed/defaultPressed/onPressedChange/value/disabled, native button attrs/ref; children is label. Use Toggle's actual group-resolved pressed state for selected X. Preserve stable accessible names and aria-pressed, no nested clickable X, no forced submit, no separate controlled state duplication.
- User steering: ChipFilters must be generic and usable by any screen. Its controlled API is options: readonly { value: TValue; label: ReactNode; disabled?: boolean }[], value: readonly TValue[], onValueChange(values: TValue[]): void, with TValue extends string. label defaults to Filtros (accessible group name), clearLabel defaults to Limpar filtros, disabled/id/className and accessible description forwarding as needed. No URL, product IDs, query/pagination, provider/store, or empty=all business rule inside ChipFilters. Clearing calls onValueChange([]).
- Empty selected field set means unrestricted search over all allowed fields. Default is empty; Clear returns empty while preserving q. IDs are name,type,barcode. URL key fields uses a comma-separated list. q/p/other params/hash must survive unrelated writes. Filter change resets p to default1 atomically and uses history push; an unchanged normalized selection does not reset p or add history.
- useProductSearchFields() returns fields: ProductSearchField[], effectiveFields: readonly ProductSearchField[], setFields(values: readonly ProductSearchField[]): void, clearFields(): void. fields are canonical valid unique IDs in name/type/barcode order. effectiveFields is all three when fields is empty. Use nuqs parser supporting enum arrays; no extra provider/localStorage/Zustand for applied fields.
- User-facing labels/docs in Portuguese. Query state expresses matching q across selected fields with OR; no real endpoint is connected without its contract.

## Review Focus

- Standalone and grouped Chip both reflect actual pressed state, including controlled rerenders and disabled selection.
- A cleared/last-deselected field set gives unrestricted search and removes fields from URL while retaining q and resetting p.
- Browser Back/Forward and multiple nuqs consumers stay in sync; search debounce preserves fields; rapid changes avoid stale page/query writes.
- Invalid/duplicate URL values are filtered/canonicalized in returned state; API callers use typed returned values rather than raw URL.
- Closing the filter panel preserves applied filters; reopening and reload preserve URL state; no hidden selection store.

### Task 1: Implement Chip and the Products search-field flow

**Files:**
- Implement existing empty src/components/Chip.tsx with default Chip and named ChipAction; share visual classes internally, do not export a styles constant.
- Create src/components/Chip.test.tsx with real Toggle/ToggleGroup/Button, validating click/Enter/Space, controlled/uncontrolled, grouped multiple selection, disabled, ordinary clear action, ref/native attrs and form-safe button behavior.
- Create src/hooks/use-product-search-fields.ts defining ProductSearchField type and allowed IDs, parser, canonicalization and hook contract above.
- Create src/components/ChipFilters.tsx and ChipFilters.test.tsx: generic controlled Base UI ToggleGroup and Chips, plus ChipAction outside the group; accessible label, optional disabled options, no state mutation/business rules. Test a non-product domain with selection/keyboard/clear/disabled/custom labels and verify original input array not mutated; default clear disabled when value is empty.
- Create src/components/ProductSearchFields.tsx as a thin composition passing product options, hook values/callback and label Campos da busca to ChipFilters; sr-only product-specific explanation that no selection searches all fields. Props id?: string/className?: string/disabled?: boolean as appropriate.
- Create src/components/ProductSearchFields.test.tsx using real createBrowserRouter and NuqsAdapter; test initial URL, multiple selection, clear/last removal, p reset, q/other repeated params/hash retention, invalid/duplicate field values, history, another hook consumer, no-op set, group keyboard and controlled disabled. Exercise SearchBar + fields to prove debounced query updates don't discard selection.
- Extend src/components/FilterButton.tsx minimally to accept onClick, aria-expanded, aria-controls, disabled and an optional accessible title; keep Button appearance/Settings2; default accessible name Filtros de produtos and type=button.
- Modify src/pages/Products.tsx to toggle visibility of ProductSearchFields below ProductActions using local state, initializing open when URL already has selected fields. Keep selected fields on close; do not put visibility in URL or create a store. Give control/region a stable useId and aria-expanded/controls; preserve Header/providers/AddButton/SearchBar/Toast existing layout. Products can read useProductSearchFields and pass only visibility props to ProductActions; state comes exclusively from nuqs.
- Add src/pages/Products.test.tsx covering FilterButton disclosure and preservation of selected query fields with real router/adapter/global ThemeProvider; no fake API calls.
- Create docs/chip.md leading with reusable Chip + ChipFilters usage and access via consumer-owned value/onValueChange (useState and non-product options example); Figma references, standalone/grouped usage, then product URL hook/API query-key application, default/clear semantics, keyboard, IDs (not DB columns), OR behavior, endpoint contract, commands/results/limitations. Update docs/components.md table/pending Ship entry to actual Chip completed; replace brittle component-count sentence with coverage wording if useful; don't rewrite historical checks.

**Steps:**
- [x] Write behavioral tests and run them RED before production edits; observe meaningful failures rather than only missing exports/imports (small null stubs are allowed if needed to reach behavioral failures).
- [x] Implement the minimum coherent design above. Reuse installed Base UI primitives directly (no generic Button hover/size inheritance that changes Figma Chip).
- [x] Run focused tests serially: node ./node_modules/vitest/vitest.mjs run src/components/Chip.test.tsx src/components/ChipFilters.test.tsx src/components/ProductSearchFields.test.tsx src/pages/Products.test.tsx src/components/SearchBar.test.tsx --pool=threads --maxWorkers=1 --testTimeout=15000. Browser-native APIs absent in JSDOM may be mocked at the boundary. No mocked nuqs/provider internals.
- [x] Run lint on every changed TS/TSX. Full suite and build/browser are controller's work after your report; do not duplicate those checks.
- [x] Document usage, exact commands and known verified results (label pending controller verification honestly), self-review, then write task-1-report.md in the dispatched workspace with RED/GREEN/lint evidence, changed files and concerns. No commits; return concise status/test summary/report path.

## Atualização aprovada pelo usuário em 2026-10-12

O estado ativo não exibe mais X; cor e aria-pressed indicam seleção, sem alteração da largura. Esta instrução substitui a especificação visual inicial do ícone. ChipFilters mantém clearable=false por padrão e permite clearLabel; Produtos habilita a limpeza. fields permanece descritivo na URL, com array validado pelo parser nativo parseAsArrayOf(parseAsStringLiteral(...)), normalização de IDs e ordem canônica. Corrigir e validar a preservação do rascunho da busca durante alterações de filtros, sem mudar cancelamento em POP/rota/q externo.
