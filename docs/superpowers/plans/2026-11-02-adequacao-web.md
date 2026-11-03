# Adequação integral do Quimia Web — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans and dispatching-parallel-agents for independent file ownership. Track execution below; do not stage or commit unrelated user changes.

**Goal:** Implementar a adequação aprovada aos critérios acadêmicos, preservando produto, visual e Render.

**Architecture:** Manter React Query e o transporte com renovação de sessão; expor autenticação por Context. Separar apresentação de operações por hooks, persistência por schemas e fluxo FDS por reducer. Integrar as alterações existentes antes de movimentar arquivos.

**Tech Stack:** React 19, TypeScript 6, Vite+, React Router, TanStack Query/Form, Zod, Base UI.

**Spec:** `docs/adequacao-web-design.md`; rubrica e evidências iniciais em `docs/auditoria-web-2026-11-02.md`.

## Global Constraints

- Render aceito pelo usuário; nenhuma migração de hospedagem.
- Interfaces de props permanecem nos próprios componentes por orientação explícita do usuário.
- Sem `.js`/`.jsx`, `any` ou assets não TypeScript em `src/`; componentes e páginas em pasta com `index.tsx`.
- Preservar refresh/cookie HttpOnly/CSRF e proteção contra respostas de sessão antiga.
- Não inventar medições Profiler, ensaio com leitor de tela ou deploy aplicado sem acesso.
- Trabalhar no checkout feature atual para integrar as alterações existentes; não resetar nem sobrescrever trabalho concorrente. Sem commits automáticos nesta execução.

## Review Focus

- Logout durante refresh/login: resposta tardia não restaura sessão encerrada.
- Dados persistidos corrompidos, legados ou com versão futura: migração conhecida ou descarte, sem travar interface.
- Cancelamento FDS após criação remota: preservar compensação e identificador no servidor.
- Ranking reordenado, texto externo hostil e parâmetros de rota inválidos: identidade estável, texto seguro e ausência de chamada com ID inválido.
- Rota profunda, teclado e overlays: navegação direta, retorno de foco e landmarks sem main aninhado.

## Tarefas

### 1. Recuperar infraestrutura

- [ ] Restaurar `build/mediapipe-assets.ts`, `tsconfig.test.json`, `tsconfig.proxy-test.json` e qualquer dependência de build ausente. A falha TS2307 já foi reproduzida na auditoria.
- [ ] Validar `pnpm run typecheck`, `pnpm test`, `pnpm run build`; corrigir a causa do problema do runner em sandbox sem ignorar suítes.

### 2. Persistência versionada

- [ ] Testes de migração de strings/preferências e rascunhos, JSON corrompido, versão futura e storage indisponível.
- [ ] Criar utilitário tipado em `src/utils/storage.ts` com `_versao`, schema e migração; integrar hooks de preferências/rascunhos, acessibilidade e bootstrap de tema.
- [ ] Manter senhas/tokens fora do armazenamento; validar todos os campos recuperados.

### 3. Serviços e validação

- [ ] Centralizar contratos de relatórios em `src/types/Relatorios.ts`, retornos `Promise<T>` e erros com causa/cancelamento.
- [ ] Validadores por domínio em `src/utils/`, aplicados antes do transporte; testes de limites, normalização e senha preservada.
- [ ] Transporte e refresh em `src/services/`; atualizar consumidores sem alterar o contrato da API.

### 4. Autenticação, rotas e consulta cancelável

- [ ] Testar Provider/hook, PrivateRoute, erro recuperável e logout concorrente usando testes existentes e novos casos.
- [ ] Implementar `AuthProvider`, `useAuth` e `PrivateRoute`; remover decisões de autenticação diretamente do store nas páginas.
- [ ] Adicionar `useProductDetail` tipado, rota `/products/:productId` com guarda de presença/inteiro positivo, loading/erro/404/sucesso e Links na listagem.
- [ ] Lazy/Suspense em todas as páginas, curinga e teste de abort ao desmontar consulta.

### 5. Separação UI e reducer FDS

- [ ] Extrair operações de formulários/serviços para hooks, conservando interface visual e testes de formulários.
- [ ] Reducer tipado em unions para o fluxo real de cadastro/FDS, com testes de transições, recuperação e descarte.
- [ ] Agrupar campos locais relacionados, manter atualizações imutáveis e respostas assíncronas antigas inofensivas.

### 6. Estrutura, segurança e acessibilidade

- [ ] Converter componentes/páginas para pasta/index com atualização automática de imports relativos e aliases nos consumidores/testes; mover CSS/assets para fora de src.
- [ ] Remover HTML externo de tooltips; testes com rótulos hostis, chaves estáveis nas tabelas e pendências.
- [ ] Corrigir contraste de tokens, labels de upload, foco, landmarks, navegação de teclado e textos acessíveis em português.
- [ ] Adicionar verificação estrutural para evitar regressões objetivas da rubrica.

### 7. Verificação e entrega

- [ ] Rodar check/typecheck/test/build com configuração oficial e React Doctor. Revisar mudanças com um agente independente.
- [ ] Testar interface no navegador, rotas profundas e comportamento de erro/loading/sucesso; documentar limites de acesso à API e ao Render.
- [ ] Atualizar README e guia de demonstração (Context, reducer, dependências, cancelamento, Network, storage, segurança, Profiler e leitor de tela).
- [ ] Reavaliar os 24 critérios com evidências e pendências externas reais.

## Registro de execução

- Início: branch `feature/QUI-86e3db2n2`, HEAD inicial `9888cf7`. Há alterações preexistentes em componentes de produto, acessibilidade e gráficos, além de configuração local e teste de refatoração; preservar.
- Ruling: manter o checkout atual e integrar alterações preexistentes; um worktree limpo excluiria mudanças que fazem parte do trabalho do usuário. Não mover arquivos enquanto agentes ainda os editam.
- Ruling: aprovação de implementação recebida; não solicitar nova aprovação para etapas reversíveis do design aprovado.
