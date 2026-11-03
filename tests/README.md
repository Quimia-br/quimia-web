# Testes do web

`tests/` espelha `src/`. Um teste de `src/hooks/use-image-preview.ts` fica em `tests/hooks/use-image-preview.test.tsx`; um teste de `src/lib/utils/formatCnpj.ts` fica em `tests/lib/utils/formatCnpj.test.ts`.

O [inventário de cobertura](COVERAGE.md) relaciona a lógica restante aos testes diretos ou de integração e documenta os limites da suíte.

```text
tests/
  components/
  hooks/
  lib/
    utils/
  pages/
  services/
  support/
    setup.ts
```

## Comandos

```powershell
pnpm test
pnpm run test:watch
pnpm test tests/hooks
pnpm test tests/components/LoginForm.test.tsx
pnpm run typecheck
pnpm run check
pnpm run lint
pnpm run build
```

`typecheck` verifica a aplicação, as configurações e os testes. O build de produção continua independente dos arquivos de teste; o CI executa a checagem de tipos e o Vitest antes de publicar artefatos.

O runner é o Vitest fornecido pelo Vite+. Importe suas APIs de `vite-plus/test`;
a configuração dos testes fica em `vite.config.ts`.

`tsconfig.test.json` verifica os testes de aplicação com os matchers de
`@testing-library/jest-dom/vitest`. Os testes de proxy e de configuração da API são verificados separadamente
por `tsconfig.proxy-test.json`, porque importam a configuração Vite+, cujos tipos
de browser do Vitest 5 conflitam com os matchers DOM de jsdom quando carregados
no mesmo programa TypeScript. Ambos são executados por `pnpm run typecheck`.

## Convenções

- Importe código da aplicação com `@/`, mantendo os testes independentes da profundidade das pastas. Imports de suporte entre testes podem ser relativos.
- Use `.test.ts` para lógica sem JSX e `.test.tsx` para renderização de componentes ou hooks com wrappers JSX.
- O ambiente padrão é `jsdom`. Use `// @vitest-environment node` quando o teste precisar de Node, como o teste real do proxy.
- `support/setup.ts` registra os matchers DOM. Prepare recursos específicos (storage, matchMedia, canvas, reconhecimento de fala) no teste que depende deles e restaure-os ao terminar.
- Para React Query, crie um cliente isolado por teste e limpe seu cache. Desative retries quando o comportamento de retry não for o alvo do teste.
- Verifique comportamento, dados enviados/retornados, acessibilidade e liberação de recursos. Prefira substituir a rede ou a API do navegador e manter o código da aplicação real.
- Não crie testes de execução para tipos puros, reexports ou constantes visuais. Esses arquivos são verificados pelo TypeScript e pelos consumidores que dependem deles.

## Migração

Foram movidos os 48 arquivos existentes e confirmados os mesmos 349 casos após a migração. Depois dessa comparação, foram acrescentados 128 casos em 16 arquivos; a suíte passou com 477 testes em 64 arquivos.

O teste de proxy abre servidores locais e precisa de permissão de conexão a `127.0.0.1`. Em ambientes com poucos recursos, use `pnpm test --pool=threads --maxWorkers=2`.
