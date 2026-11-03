# Justificativa técnica do Quimia Web

Este documento relaciona as decisões do projeto aos critérios da avaliação interdisciplinar e serve de apoio à apresentação. As verificações automáticas e a demonstração ao vivo complementam a leitura do código.

## Convenções acordadas

**Componentes e páginas em arquivos nomeados.** Conforme informado pelo grupo, o professor aceitou a organização atual, com arquivos como `src/components/BasicButton.tsx` e `src/pages/Products.tsx`, em lugar de exigir uma pasta com `index.tsx` para cada módulo. Essa organização preserva nomes claros na busca, nos imports e nos erros do compilador. Componentes relacionados de uma primitiva podem compartilhar o mesmo arquivo. A responsabilidade de cada módulo e a separação das camadas continuam sendo exigidas.

**Interfaces de props locais.** Por orientação do grupo, as props ficam junto ao componente que as recebe. Assim, contrato e apresentação podem ser revisados no mesmo arquivo. `src/types/` reúne entidades e contratos compartilhados do domínio, como `Produto`, `Empresa`, paginação, relatórios e estado do cadastro. Os tipos derivados das bibliotecas preservam os atributos dos controles nativos e os genéricos sem recorrer a `any`.

**Publicação no Render.** O grupo autorizou manter o Render como hospedagem. A configuração está em [`render.yaml`](render.yaml), e o endereço público está no [README](README.md). Rotas profundas precisam ser servidas pelo fallback de SPA configurado no serviço associado ao domínio.

## Base e separação de responsabilidades

A aplicação usa Vite, React e TypeScript com modo `strict`. O código de `src/` usa `.ts` e `.tsx`; estilos, fontes e mídia têm diretórios próprios. A organização divide as responsabilidades da seguinte forma:

| Local | Responsabilidade |
|---|---|
| `src/components/` | Apresentação, controles, composição visual e interações de foco. |
| `src/pages/` | Composição das telas e interpretação dos parâmetros de rota. |
| `src/hooks/` | Coordenação de estado, regras dos fluxos e operações assíncronas. |
| `src/services/` | Transporte HTTP, autenticação remota e contratos dos recursos. |
| `src/types/` | Entidades e contratos compartilhados por domínio. |
| `src/utils/` | Validação, normalização, persistência e funções puras. |

`BasicButton`, `TextField`, `CardHeader`, `ProductImage`, `PageIndicator` e `FeedbackItem` são exemplos de componentes com responsabilidades delimitadas. Os formulários consomem hooks como `useSignupForm`, `useLoginForm` e `useProfileEditor`; o cadastro de produtos usa `useProductCreateSession`, `useProductCreateForm` e `useFdsFlow`. A UI não importa serviços para realizar requisições.

## Serviços, validação e erros

O cliente HTTP e a renovação da sessão ficam em [`src/services/api.ts`](src/services/api.ts). Os recursos ficam separados em `auth.ts`, `empresas.ts`, `produto.ts` e `relatorios.ts`. As operações têm retornos explícitos `Promise<T>` e tratamento de falhas. A leitura compartilhada dos relatórios concentra o `try/catch`, evitando repetir o mesmo tratamento em cada delegação.

As respostas externas entram como `unknown` e são verificadas por schemas. [`src/services/errors.ts`](src/services/errors.ts) preserva metadados Axios, cancelamento e causa do erro; isso permite que o consumidor diferencie uma falha de rede, um 401, um 403 e uma resposta incompatível.

Os validadores de `src/utils/validation-*.ts` são chamados antes do transporte. Eles verificam e-mail, CNPJ, identificadores, limites, payloads de produto/perfil e arquivos. Os inputs também declaram tipo e tamanho máximo, com erros específicos por campo. Senhas preservam seu conteúdo; seu limite é conferido em bytes UTF-8. Imagens e PDFs são verificados por tamanho e assinatura, além da validação feita pela API.

`VITE_API_URL` vem do ambiente. Variáveis com prefixo `VITE_` são públicas no bundle e só podem conter configuração pública, como a origem da API. Credenciais privadas pertencem ao servidor ou aos segredos do serviço de deploy. O arquivo `.env` é ignorado pelo Git.

## Context e proteção de rotas

[`AuthProvider`](src/lib/auth-provider.tsx) publica a sessão por Context, e [`useAuth`](src/hooks/use-auth.ts) oferece o contrato tipado de consumo. O hook informa um erro explícito quando usado fora do Provider. `PrivateRoute` consome esse Context para decidir acesso e redirecionar ao login.

O Zustand permanece como detalhe interno do gerenciamento de sessão e dos interceptors. O token de acesso fica apenas em memória; cookies HttpOnly e CSRF mantêm o fluxo de renovação. A versão da sessão impede que respostas de um login, refresh ou alteração antiga sejam aplicadas depois de logout ou troca de empresa.

**Prop drilling resolvido:** páginas, ações de produto e diálogos precisam da identidade e da versão da mesma sessão. O Provider permite consumi-las em diferentes níveis sem encaminhar esses dados manualmente por `App`, layout, página, lista, cartão e diálogo. Tema e acessibilidade também possuem seus próprios Providers e hooks.

## Estado, reducer e efeitos

Campos relacionados são tratados em objetos e atualizados de forma imutável. O estado remoto, incluindo cache e invalidação, é gerenciado pelo TanStack Query; a interação local fica em hooks React e no formulário.

[`productRegistrationReducer`](src/lib/product-registration-reducer.ts) usa `State` e `Action` discriminados em [`ProductRegistrationState.ts`](src/types/ProductRegistrationState.ts). Ele atualiza atomicamente o rascunho, a disponibilidade e o aviso de recuperação. Restaurar esses dados com setters independentes permitiria apresentar um formulário pronto com um rascunho ou aviso de outra etapa. O reducer mantém essa relação explícita e deixa efeitos de armazenamento/rede fora da função pura.

O fluxo FDS preserva o identificador da análise remota para compensar um cancelamento que ocorra durante o processamento. Abort de uma leitura e descarte de um documento já criado no servidor têm responsabilidades diferentes; os testes exercitam ambos os comportamentos nos locais apropriados.

Os efeitos declaram suas dependências. Uma demonstração útil é alterar a preferência de tema em `usePersistedPreference`/Provider ou trocar o proprietário do rascunho em `useProductRegistrationDraft`, observando que a sincronização depende dos valores declarados. A análise estática verifica a presença dos arrays; lint e testes verificam aspectos adicionais do comportamento.

## Rotas, lazy loading e cancelamento

O React Router fornece navegação por `Link`, `NavLink` e `useNavigate`, proteção de acesso e rota curinga `*` com retorno. [`RoutePages.tsx`](src/pages/RoutePages.tsx) declara as páginas com `lazy`, e `PageBoundary` fornece o `Suspense` e seu feedback de carregamento.

A rota `/products/:productId` recupera o parâmetro com `useParams`, verifica ausência e valida seu formato antes de consultar. IDs inválidos não geram requisição. Produto inexistente, falha de rede, carregamento e dados disponíveis têm apresentações distintas.

[`useProductDetail`](src/hooks/use-product-detail.ts) possui retorno explícito `UseQueryResult<Produto, Error>`. O hook encaminha o `AbortSignal` gerenciado pelo TanStack Query ao serviço e ao Axios. Ao desmontar o último consumidor de uma consulta pendente, a biblioteca aciona seu `AbortController`. Um teste observa esse abort; a aplicação preserva a gestão de cache da biblioteca.

Para demonstrar o carregamento por página, abrir o build de produção, desativar o cache no DevTools e navegar entre login, produtos, detalhes e relatórios, observando os chunks na aba Network. Componentes de layout e fallback são compartilhados para manter a navegação utilizável enquanto a página carrega.

## Persistência versionada

[`src/utils/storage.ts`](src/utils/storage.ts) grava envelopes no formato `{ "_versao": 1, "dados": ... }`. Cada leitor verifica a versão e o schema do payload. Formatos legados conhecidos são migrados; dados corrompidos ou de versões incompatíveis são descartados com segurança. Restrições do navegador ou falta de espaço preservam o uso em memória.

Tema, preferências de acessibilidade, modo de visualização, rascunhos de formulário e identidade pública usam essa fronteira. A hidratação da identidade recupera apenas os campos permitidos; tokens, senhas e versões internas da sessão não são aceitos do localStorage. Arquivos do rascunho de produto usam IndexedDB, que suporta `File`, com schema próprio.

Na apresentação, salvar uma preferência, inspecionar `_versao`, alterar a versão manualmente e recarregar demonstra o descarte seguro. Testes também cobrem JSON malformado, dados de tipo incorreto e tentativas de restaurar credenciais.

## Listas, conteúdo externo e performance

Produtos usam `id`; linhas de relatórios e pendências usam identidades derivadas dos dados. Índices de posição ficam restritos aos casos de estrutura estática. Alterar um ranking ou filtrar resultados preserva a identidade dos itens.

Tabelas e conteúdo de texto usam interpolação JSX. Os tooltips de gráficos também compõem seus textos em JSX e usam a serialização do React para escapar caracteres antes de fornecer o HTML exigido pelo ECharts. Um teste injeta um rótulo semelhante a uma tag de imagem e verifica que ele permanece texto. A aplicação não usa `dangerouslySetInnerHTML` para esses dados.

`useMemo` em `useImagePreview` mantém a identidade da assinatura do preview; `useCallback` em seletores de rascunho evita efeitos disparados somente porque uma função foi recriada. O valor do AuthContext também é memoizado para evitar propagar alterações sem mudança dos dados publicados. Essas são justificativas ligadas a trabalho e assinaturas reais.

A comparação de desempenho deve ser registrada no React DevTools Profiler, considerando que o React Compiler está habilitado. A apresentação deve mostrar os commits e durações observados ao repetir a mesma interação antes/depois da otimização. Ganhos numéricos só podem ser atribuídos depois dessa medição.

## Acessibilidade e evidências de entrega

A aplicação usa controles nativos, rótulos associados, texto alternativo, feedbacks no DOM, regiões de status e erros com `role="alert"`. Os layouts oferecem landmarks, salto para o conteúdo e foco de navegação. Diálogos e menus usam as primitivas existentes e gerenciamento de foco; o tema e os tokens de texto devem manter contraste nos dois modos.

Os testes verificam contratos de DOM, teclado, foco, contraste dos pares de tokens selecionados e estados dos fluxos. A conformidade WCAG 2.1 AA completa exige ainda percorrer os fluxos reais com teclado e leitor de tela. O ensaio com NVDA/VoiceOver, as medições do Profiler e a demonstração oral devem ser apresentados pelo grupo como evidências reais.

Comandos de verificação:

```sh
pnpm run check
pnpm run verify:rubric
pnpm test
pnpm run build
```

`verify:rubric` verifica regras objetivas da fonte, respeitando a estrutura flat e as props locais acordadas. A suíte de testes valida comportamento; o build verifica a entrega de produção. O histórico Git fornece as evidências dos commits e da distribuição do desenvolvimento ao longo das semanas.

A publicação deve ser conferida pelo endereço do README, incluindo acesso direto e refresh em rotas profundas. O `render.yaml` contém a regra de rewrite para `index.html`; sua aplicação no serviço e no domínio público precisa ser confirmada depois do deploy do artefato validado.
