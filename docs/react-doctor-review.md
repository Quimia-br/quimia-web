# Revisão do React Doctor

Varredura completa do web com React Doctor latest, relatório JSON schema 3. A versão e o escopo foram mantidos na comparação; a revisão final detectou React, analisou 169 arquivos e terminou completa, sem checks ignorados.

| Medida | Antes | Depois |
| --- | --- | --- |
| Score informado pelo scanner | 47/100 | 91/100 |
| Erros | 17 | 0 |
| Avisos | 29 | 1 |

## Correções

- Leituras/mutações de refs removidas da renderização dos gráficos. Ciclos de vida separados em hooks focados, mantendo suas APIs compostas.
- Listeners do ECharts e do zrender são removidos no cleanup; callbacks de seleção deixaram de executar efeitos dentro de setters de estado.
- Helpers imperativos e estilos separados dos componentes para preservar Fast Refresh. Hooks de sidebar e message-scroller passaram para `hooks/`.
- Legendas clicáveis usam botões nativos, nome acessível, `aria-pressed` e foco por teclado.
- Barras de progresso animam transformação, mantendo o valor limitado entre 0 e 100; Motion usa `LazyMotion` e os elementos de `motion/react-m`.
- `AnimatePresence` permanece montado durante a troca do ícone do switch. Ramos visuais complexos separados em componentes locais.
- Envio e recorte compartilham apenas a execução assíncrona com cleanup em `finally`, preservando locks e cancelamento. Há testes de sucesso, erro e tarefa pendente para essa utilidade.
- O breakpoint mobile usa `useSyncExternalStore`, com assinatura e remoção do listener verificadas em teste.
- Defaults incompatíveis com o React Compiler foram movidos para expressões no corpo ou constantes do módulo.

## Aviso revisado

`query-mutation-missing-invalidation` em `use-register.ts` permanece visível. É um falso positivo documentado em [false-positives.md](../.react-doctor/false-positives.md): cadastro cria outra empresa sem autenticar ou alterar o perfil atual. O cache de `authKeys.user()` é atualizado no login e limpo no logout. Não foi adicionada uma invalidação sem dado afetado, e nenhuma regra foi desligada ou suprimida.

Os testes de mutations cobrem cadastro sem autenticação e preservação da identidade existente ao cadastrar outra empresa. A conclusão deve ser revista se o cadastro passar a emitir sessão ou se surgir uma query de listagem/contagem de empresas.

## Validação

Lint global e build passaram. A suíte do escopo da PR passou com 292 testes em 40 arquivos; os dois testes de Card/CardHeader, deixados fora desta PR, não entram nessa contagem. Após incorporar main, o lockfile foi regenerado e validado com instalação frozen, mantendo Axios 1.20.0. A conferência final de linha, barras, donut, teclado e imagens consta na descrição da PR. Os prints usam componentes reais e dados ilustrativos; não usam contas nem tokens reais.
