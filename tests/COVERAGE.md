# Inventário de cobertura

Este inventário descreve onde o comportamento do TypeScript é exercitado. Um arquivo não precisa ter um teste com nome idêntico quando seu contrato já é verificado por um consumidor real. Não representa uma porcentagem de instrumentação.

## Lógica em arquivos `.ts`

| Código em `src/` | Testes em `tests/` | Comportamento protegido |
| --- | --- | --- |
| `hooks/use-form-draft.ts` | `hooks/use-form-draft.test.tsx`, formulários de login/cadastro | Merge com defaults, persistência seletiva, limpeza e storage indisponível |
| `hooks/use-image-preview.ts` | `hooks/use-image-preview.test.tsx`, `components/ImageContainer.test.tsx` | Ownership de object URLs, substituição, desmontagem e URLs existentes |
| `hooks/use-persisted-preference.ts` | `hooks/use-persisted-preference.test.tsx`, providers de tema/visualização | Preferência válida/inválida, persistência e fallback em memória |
| `hooks/use-touch-primary.ts`, `hooks/use-mobile.ts` | Testes correspondentes em `hooks/` | Capacidade do dispositivo, mudanças e cancelamento das inscrições |
| `hooks/use-message-draft.ts` | `hooks/use-message-draft.test.tsx`, `components/SendMessage.test.tsx` | Lock síncrono, envio assíncrono, edição controlada, retry e desmontagem |
| `hooks/use-speech-input.ts` | `hooks/use-speech-input.test.tsx`, componentes SearchBar/SendMessage | Sessões de voz, escopo, callbacks tardios e erros do navegador |
| `hooks/use-page-query.ts` | `components/PageIndicator.test.tsx` | Página da URL, reparação de links, limites e histórico |
| `hooks/use-search-query.ts` | `components/SearchBar.test.tsx` | Debounce, composição IME, cancelamento e histórico |
| `hooks/use-product-search-fields.ts` | `components/ProductSearchFields.test.tsx`, `pages/Products.test.tsx` | Campos válidos, combinação de filtros, URL e reset de página |
| `hooks/use-login.ts`, `hooks/use-logout.ts`, `hooks/use-user.ts` | `hooks/auth-mutations.test.tsx`, `lib/ProtectedRoute.test.tsx`, `App.test.tsx` | Cache de perfil, troca de sessão, falhas e navegação real |
| `hooks/use-theme.ts`, `hooks/use-data-display.ts`, `hooks/use-sidebar.ts` | `hooks/contexts.test.tsx`, providers e componentes | Guardas de contexto e alterações observadas pelos consumidores |
| `hooks/use-toast.ts` | `components/Toast.test.tsx` | Toast no provider da tela, interação, expiração e limpeza |
| `lib/api.ts` | `lib/api.test.ts`, services, mutations e App | Headers, renovação compartilhada, cancelamento e rejeição de sessão antiga |
| `lib/api-origin.ts` | `lib/api-origin.test.ts`, `lib/api-config.test.ts`, `lib/dev-proxy.test.ts` | Validação/normalização da origem, compatibilidade e proxy real |
| `lib/auth-token.ts` | `lib/auth-token.test.ts`, testes de autenticação | Transições, persistência sem token e restauração em memória |
| `lib/utils/formatCnpj.ts` | `lib/utils/formatCnpj.test.ts` | Máscara, tamanho, checksum e schema |
| `lib/utils/getCroppedImg.ts`, `lib/utils/withFinally.ts` | Testes correspondentes em `lib/utils/` | Exportação/cancelamento de imagem e limpeza em sucesso/erro |
| `services/auth.ts`, `services/empresas.ts`, `services/produto.ts` | Testes correspondentes em `services/`, testes de autenticação | Contratos HTTP, payloads, multipart, PATCH parcial e falhas |
| `routes.ts` | `App.test.tsx` | Destinos reais, deep link, páginas públicas, 404 e navegação autenticada |
| `components/evilcharts/ui/echarts-brush-utils.ts` | Teste correspondente em `components/evilcharts/ui/` | Range do zoom, geometria, reutilização e remoção do overlay |
| `components/evilcharts/ui/echarts-legend-utils.ts` | Teste correspondente em `components/evilcharts/ui/` | Cor sólida/gradiente e preservação da máscara |

## Composição e TSX

Os 48 arquivos migrados mantêm os casos de componentes, formulários, imagens, filtros e providers. `App.test.tsx` acrescenta integração da aplicação com router, QueryClient, tema, layout, páginas e autenticação reais. `pages/RouteErrorBoundary.test.tsx` diferencia 404 de falhas inesperadas. Os utilitários exportados por `echarts-chart.tsx` recebem testes de cores, CSS, tema, gradientes e fallback sem canvas.

## Arquivos sem um teste de execução próprio

- `types/*.ts` e `vite-env.d.ts`: declarações sem execução; verificação pelo TypeScript da aplicação e dos testes.
- `hooks/use-message-scroller.ts`: reexport da biblioteca, sem lógica local; consumidores usam o comportamento da dependência.
- `lib/chart-card-styles.ts`, `components/smoothui/lib/animation.ts` e `components/ui/button-variants.ts`: configuração visual declarativa; consumidores e tipagem verificam seu uso.
- `lib/query-client.ts` e `lib/sidebar-context.ts`: composição/configuração de bibliotecas; exercitados pela aplicação, menu e guardas de contexto.
- `main.tsx`: bootstrap de React; a composição renderizada é verificada por `App.test.tsx`.
- Primitives de `components/ui/` e componentes incorporados de Smooth UI/EvilCharts são exercitados pelos consumidores utilizados na aplicação. Não se reproduzem os testes internos das bibliotecas para cada wrapper.
- `ResetPassword` e a ação de `AddButton` ainda são placeholders; testes não inventam funcionalidades que ainda não existem.

## Limites

JSDOM não comprova layout responsivo ou pintura de gráficos em canvas. Os testes de gráficos verificam cálculos, CSS, objetos zrender e liberação de recursos, sem simular pixels de um renderizador. Testes HTTP com adapter não comprovam compatibilidade com um servidor publicado. A API e a incompatibilidade atual dos filtros foram mantidas fora desta entrega.
