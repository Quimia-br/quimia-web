# Auditoria dos critérios do projeto web

Data: 02/11/2026. Referência inicial: `9888cf7e99535e561ca169f41749fb558ca014bd`.

## Resultado e método

**Nota estimada inicial: 5,0/10 nos requisitos obrigatórios. Atendimento dos extras: 4,0/10.**

O enunciado não informa pesos nem como os extras alteram a nota. Para tornar a estimativa reproduzível, cada um dos 14 requisitos obrigatórios vale um ponto: atendido = 1, parcial = 0,5, ausente = 0. São 7/14 pontos, convertidos para dez. Os dez extras são avaliados separadamente; não inventei bônus nem uma fórmula oficial. Esta é uma estimativa conservadora de aderência à rubrica, não uma nota oficial nem uma medida da qualidade geral do produto.

"Parcial" também identifica o que tem evidência no código, mas ainda não pôde ser comprovado em execução. Não significa necessariamente que toda a funcionalidade esteja quebrada. Build, publicação e demonstração prática continuam sendo condições de entrega, independentemente da média.

**Exceção autorizada pelo usuário durante a auditoria: Render é uma plataforma de publicação válida.** Nenhum desconto é aplicado pela escolha do Render.

Foram inspecionados 194 arquivos `.ts`/`.tsx`, os serviços, rotas, formulários, armazenamento, configurações, testes, README e histórico Git. Houve análise da árvore sintática TypeScript para distinguir `any` real de palavras em comentários, e inspeção do site publicado em navegador. Durante a auditoria surgiram alterações concorrentes em `ProductCreateDialog.tsx`, `RecoveryEmailSent.tsx` e uma configuração local de diagnóstico. Não foram produzidas nem revertidas por esta auditoria. Os números estruturais descrevem a leitura inicial; as evidências de execução informam a configuração usada.

## Requisitos obrigatórios

| # | Critério | Situação | Pontos | Evidência e lacuna |
|---|---|---|---:|---|
| 1 | Vite, React e TypeScript; somente `.ts`/`.tsx` em `src/` | Parcial | 0,5 | Stack presente em `package.json`, `vite.config.ts`, `src/main.tsx` e `tsconfig.app.json`. Nenhum `.js`/`.jsx`. Pela leitura literal de **todos os arquivos**, ainda há CSS, fontes, imagem e vídeo em `src/`. Mover estilos e assets para fora de `src/` elimina a ambiguidade. A origem exata do template não foi comprovada apenas pela stack atual. |
| 2 | Componentes e páginas em pasta própria com `index.tsx` | Ausente | 0 | 100 dos 104 arquivos TSX em `src/components/` e todos os 15 de `src/pages/` não terminam em `/index.tsx`. A convenção precisa abranger também os componentes de bibliotecas copiados para o projeto. |
| 3 | Pelo menos seis componentes e separação de responsabilidades | Parcial | 0,5 | Há muito mais de seis componentes e exemplos bem separados, como `BasicButton`, `TextField`, `CardHeader`, `ProductImage`, `PageIndicator` e `FeedbackItem`. Porém seis componentes importam serviços em tempo de execução; `ProductCreateDialog`, `ProductFdsFlow` e formulários misturam apresentação, validação e coordenação de operações. |
| 4 | Interfaces para props e domínio em `src/types/`; sem `any` | Parcial | 0,5 | Nenhum nó `AnyKeyword` encontrado. Existem interfaces de domínio em `src/types/`. Há props inline, aliases `type` e contratos de relatórios declarados nos serviços, em vez da organização integral pedida. Exemplos: `ForgotPasswordForm`, `AuthLayout`, `DataGrid` e `src/services/relatorios.ts`. |
| 5 | Comunicação em serviços, `Promise<Tipo>`, `try/catch`, ambiente | Parcial | 0,5 | HTTP de domínio está centralizado e não foi encontrado `fetch` em páginas/componentes. Dos 16 serviços exportados por declaração de função, apenas `remove` declara retorno explícito; nenhum tem `try/catch` próprio. Os seis exports de relatórios também têm retorno inferido. Refresh HTTP está em `src/lib/api.ts`, fora de `services/`. `.env` está ignorado e não aparece nos arquivos rastreados; isso não equivale a uma auditoria de segredos de todo o histórico. |
| 6 | Estado local com `useState`, agrupamento e imutabilidade | Parcial | 0,5 | Objetos de campos e atualizações funcionais existem, por exemplo no perfil. Formulários usam TanStack Form e o fluxo de FDS distribui estados relacionados entre vários booleanos e refs. É preciso demonstrar o agrupamento pedido sem confundir estado remoto do React Query com estado local. Mutação de acumuladores locais não é, por si, mutação de estado React. |
| 7 | Dependências explícitas e corretas de `useEffect` | Parcial | 0,5 | Todos os 42 `useEffect`/`useLayoutEffect` analisados têm array literal explícito. A regra `react/exhaustive-deps` está configurada como aviso. Falta fechar a checagem oficial e o ensaio de mudança de dependência; a existência do array não comprova correção semântica. |
| 8 | Chaves de identidade do dado em listas dinâmicas | Parcial | 0,5 | `DataGrid` exige `getItemId` e `DataTable` exige `getRowId`. Contudo `ReportDataTable`, em `src/components/reports/ReportCard.tsx`, usa `key={index}` em linhas de relatórios cujo conteúdo/ordem muda. `ProductFdsReview` também usa índices na identidade das pendências. Skeletons estáticos não são a mesma violação. |
| 9 | Parâmetros de rota com `useParams` e guarda de ausência | Ausente | 0 | Nenhum uso de `useParams` e nenhuma rota com parâmetro de caminho. A recuperação de senha usa `useSearchParams`, que é apropriado para query string, mas não demonstra o requisito de parâmetro de rota. |
| 10 | Três rotas, navegação React Router e curinga `*` | Parcial | 0,5 | Há mais de três rotas, `Link`/`NavLink`/navegação do router e páginas de erro. Falta `path: "*"` em `src/routes.ts`. A renderização de `NotFound` pelo error boundary não substitui essa exigência explícita. |
| 11 | Acessibilidade básica AA | Parcial | 0,5 | Há botões nativos, rótulos associados em campos comuns, mensagens `role="alert"`, foco e recursos de acessibilidade. Inputs de arquivo usam `aria-label`, mas não têm o `label`/`htmlFor` exigido literalmente. Existem pares de tokens com contraste insuficiente. Não foi realizado ensaio integral de teclado em todas as telas autenticadas. |
| 12 | Carregando, sucesso e erro no DOM | Atendido no código | 1 | Formulários, resultados de produtos, perfil, relatórios e fluxo FDS apresentam estados de operação e erros; sucesso aparece em dados, feedbacks e toasts. Exemplos: `AuthFeedback`, `ProductsResults`, `HomeStatistics` e `Profile`. Não foi encontrado `alert()` ou `console.log` como tratamento de aplicação. O ensaio integrado com a API ainda precisa ser concluído. |
| 13 | Publicação funcional e link no README | Parcial | 0,5 | Links e configuração do Render existem. Abrir `https://quimia.app/` carregou a aplicação e navegou para login. Abrir diretamente `https://quimia.app/login` e recarregar essa rota produziu **Not Found**. O HTML publicado tinha `lang="en"`, enquanto o local já usa `pt-BR`: há divergência entre o artefato publicado e o checkout. |
| 14 | Vinte commits convencionais e quatro semanas | Atendido | 1 | 47 commits sem merges; 36 começam por `feat`, `fix`, `refactor` ou `docs` no formato convencional. Distribuídos por 13 datas, de 25/08/2026 a 02/11/2026. A duração e o mínimo quantitativo são atendidos sem criar ou retroagir commits. Algumas descrições são vagas, como `fix(web): ajuste de pastas`; manter mensagens específicas nas próximas entregas. |

Se a instituição interpretar a regra de extensão como aplicável somente ao código JavaScript/TypeScript, o item 1 passa a 1 ponto e a estimativa obrigatória sobe para **5,4/10**. A adequação proposta elimina a ambiguidade em vez de depender dessa interpretação.

## Extras

| # | Critério | Situação | Pontos | Evidência e lacuna |
|---|---|---|---:|---|
| E1 | Context, Provider, hook e tipos | Atendido no código | 1 | Tema, acessibilidade e modo de visualização têm contextos, providers e hooks de consumo com guarda fora do provider. Falta somente ensaiar a explicação oral do prop drilling resolvido. |
| E2 | `useReducer`, State e Action em unions | Ausente | 0 | Nenhum `useReducer`. O cadastro/FDS já possui complexidade real para justificar uma máquina de estados, sem exemplo artificial. |
| E3 | Hook tipado, loading, erro e AbortController | Parcial | 0,5 | Hooks de consulta passam o `signal` gerenciado pelo TanStack Query ao serviço. Há cancelamento via AbortController em outras partes. Falta contrato explícito do hook de consulta, teste observável do abort ao desmontar e demonstração reunindo os requisitos. Usar uma biblioteca para gerenciar o controller não é, por si, defeito. |
| E4 | `React.lazy` e `Suspense` por página | Parcial | 0,5 | `GraphsRoute` carrega `Graphs` sob demanda. A maior parte das páginas é importada estaticamente em `routes.ts`. Lazy loading de controles de acessibilidade ou gráficos não cobre todas as páginas. |
| E5 | localStorage com `_versao`, verificação e migração/descarte | Ausente | 0 | Tema/modo usam strings; rascunhos de formulário usam JSON sem schema versionado. Acessibilidade tem `version: 1`, não `_versao`; o rascunho de produto tem validação/versionamento em IndexedDB, que não satisfaz o requisito específico de localStorage. `loadFormDraft<T>` mistura JSON não validado com o fallback. |
| E6 | `useCallback`/`useMemo` com justificativa e Profiler | Parcial | 0,5 | Há usos concretos: o seletor estável de rascunho evita disparar efeitos só por identidade, e `useImagePreview` estabiliza o store/assinatura. Faltam medições de antes/depois e roteiro que considere o React Compiler habilitado. Sem medição, não atribuir ganho inventado. |
| E7 | Dados externos seguros contra XSS | Não atendido | 0 | Há uso de JSX seguro em tabelas, mas o caminho API → nome do produto → eixo → `tooltipShell` preserva HTML externo sem escape. Os três `dangerouslySetInnerHTML` dos gráficos injetam CSS gerado e precisam ser avaliados separadamente: a simples ocorrência não prova XSS de dado externo. O risco concreto está nos tooltips HTML. |
| E8 | Validação/sanitização tipada em `src/utils/`, limites e erros por campo | Parcial | 0,5 | Existem schemas Zod e limites nos campos de produto/perfil. `src/utils/` não existe; regras estão nos componentes e `src/lib/utils/`. Cadastro/login não aplicam uniformemente limites e normalização. Serviços não garantem que o payload passou pelo validador. Senhas devem preservar seu conteúdo, sem `trim` indiscriminado. |
| E9 | PrivateRoute com autenticação via Context | Parcial | 0,5 | `ProtectedRoute` já protege rotas e distingue 401 de falhas de rede. Porém a autenticação vem de Zustand e `useUser`, sem AuthContext; há acesso ao store em páginas/componentes. O nome atual pode ser funcionalmente equivalente, mas a entrega deve expor o `PrivateRoute` e o Context pedidos. |
| E10 | Acessibilidade avançada completa e demonstração com leitor | Parcial | 0,5 | Base UI fornece primitivas de diálogo/menu; há foco programático em feedback e etapas FDS e atributos ARIA em filtros/menu móvel. Falta verificação de foco de entrada/retorno em todos os overlays, landmarks pedidos em todos os layouts e ensaio NVDA/VoiceOver. Nenhuma alegação de conformidade AA completa é sustentada só por inspeção estática. |

## Bloqueios reproduzidos

| Verificação | Resultado observado |
|---|---|
| `pnpm test` | Não inicia: import de `./build/mediapipe-assets.ts` ausente em `vite.config.ts:7`. |
| `pnpm run check` | Não inicia pelo mesmo import ausente. |
| `pnpm exec tsc -b` | Falha TS2307 pelo mesmo arquivo. |
| `pnpm run build` | Falha TS2307 antes de produzir o bundle. |
| `pnpm run typecheck` | Falha no primeiro `tsc -b`; também referencia `tsconfig.test.json` e `tsconfig.proxy-test.json`, ambos inexistentes. |
| `pnpm exec vp lint . --config doctor-validation.config.local.ts` | Comando alternativo retornou exit 0. Não substitui `pnpm run check`: usa configuração local não versionada e não valida o build oficial. |
| `pnpm exec vp test run --config doctor-validation.config.local.ts --maxWorkers=2` | O runner iniciou, mas as 87 suítes falharam na coleta, sem executar testes. Predominaram erros ENOENT de arquivos temporários do runner no ambiente sandbox; o teste de proxy também falhou pelo import ausente da configuração oficial. Isso não representa 87 falhas de comportamento da aplicação. |

O README também referencia `docs/authentication.md`, `docs/components/` e `docs/contributing/`, que não existiam no início da auditoria. A tabela de ambiente fala em `VITE_API_KEY`, mas código, `.env.example` e `render.yaml` usam `VITE_API_URL`. A nota no fim do README que manda trocar o Render está desatualizada: o Render já declara a variável usada pelo código.

### Risco de XSS dos gráficos

Evidência: `src/services/relatorios.ts` aceita nomes com `z.string()`; `TopProductsReport` monta `produto` com nomes da API; o formatter em `echarts-bar-chart.tsx` converte o rótulo bruto para string e o encaminha a `tooltipShell`. Em `echarts-tooltip.tsx`, o rótulo é interpolado diretamente em HTML.

Uma execução isolada da função **extraída do próprio código**, sem renderizar DOM nem executar o conteúdo, confirmou que o rótulo `<img src=x onerror="alert(1)">` permanece literalmente na saída HTML. Isso confirma a falta de escape nessa fronteira; não foi realizado ataque contra o site publicado nem um exploit autenticado no navegador.

O ECharts documenta que `tooltip.formatter` pode produzir HTML bruto e exige cuidado com dados não confiáveis. Preferir renderização sem HTML bruto, com dados tratados como texto, ou componente JSX para o tooltip. [Diretrizes de segurança do ECharts](https://echarts.apache.org/handbook/en/best-practices/security/).

### Contraste

Cálculo estático de pares neutros definidos nos tokens, usando luminância relativa:

| Texto / fundo | Contraste aproximado | Resultado |
|---|---:|---|
| `oklch(0.6665 0 0)` / branco | 3,03:1 | Falha para texto normal. |
| `oklch(0.6665 0 0)` / `oklch(0.4054 0 0)` | 2,97:1 | Falha para texto normal e grande. |
| `oklch(0.7444 0 0)` / branco | 2,27:1 | Falha para texto normal e grande. |

Esses números identificam pares problemáticos, não todos os elementos renderizados. O contraste final precisa ser medido sobre o fundo efetivo, considerando transparências, estados e ambos os temas. Os limites são 4,5:1 para texto normal e 3:1 para texto grande. [WCAG 2.1, critério 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html).

## Ordem de adequação

1. Recuperar a toolchain oficial: plugin de assets, configurações TypeScript de testes e execução limpa de check/test/build.
2. Corrigir o caminho de HTML externo dos gráficos e testar entradas hostis sem executá-las.
3. Padronizar pastas e contratos; extrair lógica de negócio e acesso a serviços para hooks/controladores.
4. Consolidar autenticação em Provider/Context e expor PrivateRoute preservando refresh, cookies, CSRF e a invalidação por versão da sessão.
5. Usar reducer no fluxo real de cadastro/FDS e testar transições inválidas, recuperação, cancelamento e troca de sessão.
6. Completar rotas: curinga, parâmetro real validado e lazy/Suspense por página.
7. Centralizar validação e armazenamento versionado, com migração dos formatos existentes.
8. Fechar contraste, teclado, rótulos, semântica e foco; testar fluxos com leitor de tela.
9. Corrigir o fallback de SPA do domínio publicado no Render e confirmar que o artefato corresponde ao commit validado.
10. Atualizar README e preparar roteiro de defesa com demonstrações de dependências, Network, Profiler, Context, reducer e acessibilidade.

## Condição para excelência

Todos os itens obrigatórios e extras devem ter evidência de implementação e execução. Além de checks verdes, é necessário abrir cada rota por URL/refresh, percorrer os fluxos com teclado, simular erro/sucesso/carregamento, abortar consulta ao sair da página, testar dados persistidos incompatíveis e demonstrar XSS como texto. A apresentação com NVDA/VoiceOver e as medições no Profiler precisam de registros reais. Não basta acrescentar hooks sem uso, tipos vazios, testes que só espelham o código ou afirmar AA completo no README.
