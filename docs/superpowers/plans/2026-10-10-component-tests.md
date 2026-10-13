# Plano de revisão e testes dos componentes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cobrir os 19 componentes implementados diretamente em `src/components/`, revisar contratos com o Figma, corrigir bugs comprovados e documentar o uso.

**Architecture:** Testes de comportamento junto aos componentes, com Vitest/Testing Library e dependências reais; simulação apenas nas fronteiras sem suporte em jsdom ou rede. Conferência de layout no navegador, porque jsdom não calcula geometria.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Base UI, Tailwind 4.

**Spec:** Pedido do usuário nesta conversa e arquivo Figma `eYfOhBxIZfbQaq7MygMTXV`.

## Restrições

- Não modificar o Figma; não criar testes em `ui/`, `smoothui/` ou `evilcharts/`.
- Preservar alterações existentes e interfaces dos componentes; não fazer commits.
- Conforme resposta do usuário, os seis arquivos vazios ficam documentados como pendentes: Chart, PageIndicator, SearchBar, SendMessage, Ship e Toast.
- Mudanças de lógica exigem reprodução do defeito antes da correção. Diferenças visuais sem mudança necessária ficam registradas.

## Execução

- [x] Apresentação: Card, CardHeader, FeedbackItem, Logo, MainTitle; testes e `docs/components-display.md`.
- [x] Navegação: ShapeIcon, Menu, ProfileContainer, LinkButton, ThemeToogle; testes e `docs/components-navigation.md`.
- [x] Formulários: ActionInput, TextField, FormTextField, LoginForm, SignupForm; testes e `docs/components-forms.md`.
- [x] Mensagens: reproduzir BallonMessage alinhado ao fim no navegador, testar conteúdo/props e corrigir alinhamento, cantos e horário conforme Figma; documentar.
- [x] Botões e imagens: ampliar os testes existentes nos fluxos sem cobertura; manter contratos já documentados.
- [x] Consolidar `docs/components.md` com cobertura, referências, bugs corrigidos e pendências. Verificar testes completos, build, lint dos arquivos alterados e regressões do React.

## Casos de revisão

Mensagens longas e multilinha; tema system; usuário ainda carregando ou sem foto; inputs controlados/não controlados e readonly; cancelamento/desmontagem da edição de imagem; uso dos componentes dentro de formulário; rotas aninhadas com item ativo.
