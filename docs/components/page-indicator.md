# PageIndicator

Indicador de páginas clicável baseado no [PageIndicator do Figma, 309:319](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV/Web-Componentes?node-id=309-319), com as adaptações de tamanho e animação solicitadas. Usa nuqs para manter a página selecionada em `?p=` e botões HTML transparentes animados com Motion. O Figma permanece intacto.

```tsx
import PageIndicator from "@/components/PageIndicator";

<PageIndicator
  totalPages={pagination?.totalPages ?? 0}
  disabled={isFetching}
/>
```

`pagination` é a resposta fornecida pela tela: o componente não faz uma requisição própria. O endpoint e seu contrato ainda precisam ser definidos. Precisa do Router, do `NuqsAdapter` de React Router v7 e do CSS global; a aplicação já instala o adapter em `QueryStateLayout`.

## Props

| Prop | Contrato |
| --- | --- |
| `totalPages` | Obrigatório; inteiro positivo retornado pela API para a busca e quantidade por página atuais. Passe `0` enquanto o total ainda não estiver disponível. |
| `disabled` | `false`; bloqueia os cliques durante uma operação da tela. |
| `label` | `"Paginação"`; nome acessível da região de navegação. |
| `className` | Classes externas para posicionamento; por padrão ocupa toda a largura disponível. |

## URL e navegação

- A página padrão é **1**. `/products` e `/products?p=1` representam a primeira página; navegar de volta para ela remove `p` da URL. Montar um link válido não acrescenta histórico.
- `p` é uma escolha válida de nome para o projeto; não há um nome obrigatório para parâmetros de paginação. A URL é baseada em 1. Se a API usar índices baseados em zero, converta para `page - 1` no serviço.
- Cada clique usa `useQueryState("p", pageQueryParser)` pelo hook `usePageQuery`, com `history: "push"`. Voltar/avançar restaura a seleção. Caminho, hash, busca e filtros repetidos são preservados, sem rolar a tela.
- Valores como `0`, negativos, decimais, texto, `2abc`, notação exponencial e números fora do intervalo seguro caem na primeira página. Com um total positivo conhecido, a URL inválida é reparada com `replace`.
- Uma página acima do total é ajustada à última disponível, também com `replace`. Um total desconhecido ou `0` não apaga uma página salva enquanto os metadados carregam. O estado vazio da tabela pertence à tela; o indicador fica oculto com zero ou uma página.
- SearchBar aplica `q` e remove `p` na mesma atualização via `useQueryStates`. Reaplicar uma busca sem mudanças conserva a página atual.

O parser reutilizável está em `src/hooks/use-page-query.ts`. A configuração usa `clearOnDefault: true`, `scroll: false` e `shallow: false`, para manter a URL e os consumidores do React Router sincronizados. Referência: [estado com valor padrão no nuqs](https://nuqs.dev/docs/basic-usage).

## Integrar com a tabela e a API

Leia a mesma página na tela, sem manter um segundo estado local:

```tsx
import { usePageQuery } from "@/hooks/use-page-query";

const { page, changePage } = usePageQuery(pagination?.totalPages);

// A consulta da tabela deve usar page, q e pageSize em sua queryKey.
// Um controle externo pode chamar changePage(page + 1).
```

O serviço da tela deve obter o total usando os mesmos filtros e `pageSize` da listagem. Se receber `totalItems`, calcule `Math.ceil(totalItems / pageSize)` com uma quantidade por página positiva. Se o endpoint já devolver `totalPages`, passe esse valor diretamente.

Inclua `q`, `pageSize` e a página aplicada nas chaves de consulta da tabela. Encaminhe o `signal` ao serviço para cancelar requisições obsoletas. Não trate uma resposta antiga de metadados como o total da nova busca; enquanto o novo total estiver desconhecido, omita-o no hook e passe `0` ao indicador. Se a tela também guardar `pageSize` na URL, altere-o junto com `p: null` em um único setter de `useQueryStates`.

## Aparência e acessibilidade

Todas as páginas retornadas pela API são exibidas; não há limite de cinco nem janela móvel. Cada barra pode navegar diretamente para sua página.

O contêiner ocupa a largura disponível (`w-full`), sem largura fixa ou mínima em pixels. As barras usam `flex-1`; a atual recebe `flexGrow: 3` e as demais `flexGrow: 1`, dividindo o espaço útil na proporção 3:1. A largura pode ser definida pela tela com um wrapper, como `<div className="w-full max-w-sm">`, quando quiser um indicador compacto.

Preservados: barras de 4 px de altura, cantos arredondados, padding horizontal de 12 px e tokens do tema. O intervalo é de até 8 px e diminui proporcionalmente quando há muitas páginas em pouco espaço, evitando overflow horizontal sem esconder páginas. Os botões têm 36 px de altura e fundo transparente, inclusive no hover. O foco de teclado muda apenas a cor da própria barra para `border-focus`. Não há estilos herdados de `ui/Button`.

A troca da seleção anima `flexGrow` nos dois sentidos: a nova página cresce de 1 para 3 enquanto a anterior diminui de 3 para 1. Ambas usam 500 ms e a curva `[0.4, 0, 0.2, 1]`, distribuindo o movimento ao longo da transição, sem animação de entrada. A cor da barra acompanha com uma transição Tailwind de 500 ms e `ease-in-out`, evitando uma troca visual instantânea. Usa `LazyMotion`, `domAnimation` e `m.button` da dependência Motion já instalada. Com preferência por movimento reduzido, proporção e cor mudam imediatamente. Referências: [animação com Motion](https://motion.dev/docs/react-animation), [useReducedMotion](https://motion.dev/docs/react-use-reduced-motion) e [LazyMotion](https://motion.dev/docs/react-lazy-motion).

Os controles mantêm nome “Página N de total”, `aria-current="page"`, acionamento por Enter/Espaço e anúncio acessível da seleção. Como todas as páginas dividem o espaço disponível, a largura de cada alvo diminui conforme o total aumenta; a tela define o espaço apropriado para a quantidade de páginas que apresenta.

## Testes

22 casos com Router, NuqsAdapter e Motion reais: URL inicial, clique/teclado, filtros repetidos/hash, retorno à primeira página, Back/Forward, todas as páginas disponíveis e navegação direta para a última, parâmetros inválidos, limites da API, navegação externa, disabled, carregamento dos metadados e redução do total.

Chrome com CSS real: larguras de 1280 e 375 px, temas claro/escuro, variantes de duas a cinco e doze páginas, além de total de 1000. Conferidos largura fluida, proporção 3:1, hover transparente, preferência de movimento reduzido, histórico, preservação dos filtros e reset de `p` ao pesquisar; sem overflow horizontal ou erros de JavaScript. O endpoint futuro não foi testado nem conectado.

No refinamento da animação, uma captura por frame confirmou crescimento e redução simultâneos, monotônicos e sem overshoot, além de cores intermediárias durante a troca. A nova curva mantém o início mais gradual do que a anterior (`[0.22, 1, 0.36, 1]`). Validado nos dois temas em desktop e mobile, incluindo mudança sem transição com movimento reduzido. Os 22 testes de PageIndicator e o lint passaram novamente. React Doctor no escopo alterado manteve os diagnósticos anteriores.

```powershell
pnpm test src/components/PageIndicator.test.tsx --pool=threads --maxWorkers=1
```
