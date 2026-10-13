# Products Preferences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Repair theme/display preferences and explain the state/provider architecture while preserving the Products screen being developed.
**Architecture:** Keep React Context. ThemeProvider stays app-wide; ProductsProviders keeps DataDisplayProvider and ToastProvider local. Share the identical validated persistence behavior, not the distinct theme/media-query and table/grid business rules.
**Tech Stack:** React 19, TypeScript, existing shadcn/Base UI Button, Vitest/Testing Library.
**Spec:** User request on 2026-10-12: review ThemeToogle, DataDisplayToggle, Zustand suitability, and app versus Products providers; decide and implement with subagent-driven-development. The concrete acceptance criteria below are the reachable specification.

## Global Constraints

- Work in C:/Users/eduardopolicarpo-ieg/quimia/web; preserve unrelated dirty/untracked files and existing visual classes/icons.
- Keep Context, existing public component/hook/provider names, defaults, and saved choices. No new dependencies; do not modify auth/Zustand, URL search/pagination, API, Figma, ui/, smoothui/, or evilcharts/.
- ThemeProvider is global in src/providers.tsx; DataDisplayProvider and ToastProvider remain scoped to Products. Keep storage keys quimia:theme and quimia:data-display, defaults system/table. Separate screens can supply separate display storage keys.
- Runtime enum validation and failed browser storage must not crash the screen or prevent toggling in memory. Contexts without a provider must throw a descriptive error.
- Implementer must not spawn subagents or commit, reset, stash, stage or move the user's work. Reports, snapshots and task diffs stand in for commit ranges in this dirty collaborative checkout.
- Write user-facing documentation in Portuguese. Test real providers/components, mocking only browser boundaries. No new tests inside ui/, smoothui/, or evilcharts/.

## Review Focus

- OS changes while theme=system: both html class and button's action label/icon update; explicit light/dark remains explicit.
- Corrupt saved preferences and unavailable storage: valid fallback and interactive toggles, never an arbitrary html class or a crash.
- Missing provider: developer-visible error rather than an inert no-op toggle.
- Display choices: table/grid changes visible to another consumer in the same scope and survives remount, without leaking to a different-key scope.
- Cleanup: matchMedia/storage subscriptions do not survive unmount or stack after rerender/StrictMode; browser storage events from unrelated keys/areas do not change this scope.

### Task 1: Repair persisted preferences and document Products ownership

**Files:**
- Modify src/hooks/use-theme.ts and src/lib/theme-provider.tsx: nullable guarded context, validated theme and centrally resolved effective theme.
- Modify src/hooks/use-data-display.ts and src/lib/data-display-provider.tsx: nullable guarded context and validated resilient persisted table/grid state.
- Create src/hooks/use-persisted-preference.ts if shared logic warrants it: typed, enum-validated preference read/write and lifecycle; no general store/event bus.
- Modify src/components/ThemeToogle.tsx: consume resolvedTheme instead of consulting matchMedia while rendering.
- Modify src/components/DataDisplayToggle.tsx: accessible action name; preserve appearance/current-mode icon.
- Modify src/pages/Products.tsx only for provider composition clarity: retain local providers, replace coupling to app ProvidersProps with ReactNode, preserve ongoing Products UI.
- Add/extend adjacent tests for ThemeToogle, DataDisplayToggle and the providers/helper; keep Header coverage.
- Create docs/products-state.md; update relevant theme/navigation/Header/components docs without rewriting historical verification records.

**Interfaces:**
- useTheme() remains default export with theme: Theme and setTheme(theme: Theme); add resolvedTheme: 'light' | 'dark'.
- useDataDisplay() remains default export with dataDisplay: DataDisplay and setDataDisplay(dataDisplay: DataDisplay).
- ThemeProvider props remain children/defaultTheme/storageKey; DataDisplayProvider remains children/defaultDataDisplay/storageKey.
- Both setters update the live preference even if persistence is denied. Invalid/missing persisted values use the configured fallback, not a type assertion. If adding storage synchronization, handle valid/invalid values, deletion/clear, matching localStorage area, ignore unrelated events and unsubscribe.
- OS subscription must have a stable listener and cleanup; useSyncExternalStore is suitable for matchMedia, or an equally sound bounded implementation. No SSR feature expansion; absent matchMedia must be handled safely for current tests/non-browser boundaries.
- Avoid speculative runtime reconfiguration of provider keys; document mounting a provider with key={storageKey} when switching scopes dynamically if keys are treated as initialization settings.

- [x] Step 1: Extend behavioral tests and observe RED before production edits. Test system light->dark->light, explicit choice ignoring OS changes, guard errors, invalid saved values, getItem/setItem exceptions, display click/keyboard/persistence/same-provider consumers, different storage-key isolation, and listener cleanup. If storage events are implemented, test matching and unrelated areas/keys plus removal/clear. Preserve existing 8 ThemeToogle/Header cases.
- [x] Step 2: Run focused Vitest serially and record meaningful pre-fix failures and their causes in task-1-report.md. Command: node ./node_modules/vitest/vitest.mjs run <target test files> --pool=threads --maxWorkers=1 --testTimeout=15000.
- [x] Step 3: Implement the smallest cohesive corrections above. Reuse actual identical persistence logic between the two providers; keep OS theme resolution specific. Keep current icons representing current state and give DataDisplayToggle the exact action label 'Alternar para visualização em grade' when table, 'Alternar para visualização em tabela' when grid. Both toggles must act as type=button inside forms.
- [x] Step 4: Run focused tests until green, then full suite once with the same serial flags. Lint every touched TS/TSX file using node ./node_modules/eslint/bin/eslint.js <files>. Controller will run build and browser integration after report; don't duplicate those checks.
- [x] Step 5: Document original findings, Context vs Zustand vs existing next-themes alternative, actual provider boundaries, defaults/keys, resolvedTheme/system behavior, how future table/grid renderers consume useDataDisplay, storage limitations, commands and verified results. next-themes is already installed, but retaining the small existing public Context integration avoids an adapter/migration just for this bounded repair; do not claim it could not work with Vite.
- [x] Step 6: Self-review current task diff and write report to the dispatched path with RED/GREEN commands/output, full-suite and lint evidence, changed files, concerns and verification limitations. Do not commit. Return under 15 lines with status, test summary, report path and concerns.
