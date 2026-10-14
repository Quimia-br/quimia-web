# Chip e grupos reutilizáveis de filtros

`Chip` representa uma escolha selecionável; `ChipFilters` compõe uma lista de escolhas múltiplas. Ambos são reutilizáveis em qualquer domínio: o grupo recebe `options`, `value` e `onValueChange` controlados, sem ler URL nem definir o significado da seleção vazia. `clearable` habilita o botão de limpeza e é `false` por padrão. O nome acessível do grupo é `Filtros` por padrão; `label`, `clearLabel`, `disabled`, `id`, `className` e `aria-describedby` permitem adaptar a composição.

```tsx
import { useState } from "react";
import ChipFilters from "@/components/ChipFilters";

const colorOptions = [
  { value: "red", label: "Vermelho" },
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde", disabled: true },
] as const;

function ColorFilters() {
  const [colors, setColors] = useState<string[]>([]);
  return <>
    <ChipFilters
      clearable
      options={colorOptions}
      value={colors}
      onValueChange={setColors}
      label="Cores"
      clearLabel="Limpar cores"
    />
    <p>Cores selecionadas: {colors.length ? colors.join(", ") : "nenhuma"}</p>
  </>;
}
```

O exemplo usa estado local para cores e lê a seleção atual em `colors`, inclusive depois da limpeza. Outra tela pode usar seu próprio estado ou outra integração. A seleção múltipla mantém `aria-pressed` em cada Chip. As setas movem o foco dentro do grupo; Enter e Espaço alternam o item. O botão de limpeza é um `ChipAction` comum fora do ToggleGroup, desabilitado quando a seleção está vazia.

O [Chip do Figma, nó 405:2961](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=405-2961) fundamenta o formato de pílula, Aeonik Medium de 16 px, 24 px de espaço horizontal e 12 px vertical. Conforme a atualização solicitada, o chip ativo não tem mais X: usa `primary` e texto `primary-foreground`, mantendo a largura do rótulo. O estado sem seleção usa `surface-base` e `foreground-primary`. A linha de filtros em [Produtos, nó 435:2037](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=435-2037) mostra Nome, Tipo, Código de barras e Limpar filtros com 18 px entre controles. O [ícone de filtro, nó 435:1834](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=435-1834) continua em `FilterButton` com `Settings2` e a variante `onColor`.

`Chip` é um Toggle do Base UI com estado controlado (`pressed`) ou inicial (`defaultPressed`). Ele aceita `onPressedChange`, `value`, `disabled`, atributos nativos de botão e `ref`. A cor indica visualmente a seleção; o próprio Toggle mantém `aria-pressed` e responde a clique, Enter e Espaço. O botão nunca envia um formulário por acidente.

```tsx
<Chip defaultPressed>Nome</Chip>
<Chip pressed={selected} onPressedChange={setSelected}>Tipo</Chip>
<ChipAction onClick={clear}>Limpar filtros</ChipAction>
```

Na página Produtos, `ProductSearchFields` fornece a `ChipFilters` as opções Nome, Tipo e Código de barras, a seleção do hook e a explicação acessível de que a seleção vazia busca em todos os campos. Basta renderizar `<ProductSearchFields />` sob `NuqsAdapter`; `id`, `className` e `disabled` são repassados ao grupo genérico. O botão de filtros revela ou oculta a linha; fechar não apaga a seleção. Uma URL com `fields` selecionados inicia a linha aberta.

`useProductSearchFields()` lê e grava a chave `fields` pela integração nuqs da rota. Os IDs públicos são `name`, `type`, `barcode`; representam escolhas da interface, não nomes de colunas do banco. Por exemplo, `?q=vitamina&fields=name,type` expressa a busca de `q` em Nome **ou** Tipo. A lista é única e serializada sempre na ordem Nome, Tipo, Código de barras. Uma seleção vazia é o padrão: `fields` sai da URL e `effectiveFields` contém os três IDs, de modo que `q` busca em todos. Limpar filtros só limpa `fields`; `q` permanece. Alterar `fields` volta a página `p` para 1 na mesma atualização e adiciona uma entrada ao histórico. Repetir a seleção já aplicada não altera `p` nem o histórico. Outros parâmetros, inclusive repetidos, e o hash são preservados.

Um consumidor de resultados pode usar `fields` para mostrar a seleção aplicada e `effectiveFields` para montar a futura consulta. O objeto abaixo é um contrato de dados e chave de cache; nenhum endpoint é chamado:

```tsx
import { useProductSearchFields } from "@/hooks/use-product-search-fields";

function useProductSearchRequest(q: string, p: number) {
  const { fields, effectiveFields, setFields, clearFields } = useProductSearchFields();
  const request = { q, fields: effectiveFields, p };
  const queryKey = ["products", q, effectiveFields.join(","), p] as const;
  return { fields, effectiveFields, setFields, clearFields, request, queryKey };
}
```

Ainda não há endpoint de pesquisa de Produtos conectado. Quando seu contrato estiver disponível, a requisição deve enviar `q` e os campos efetivos, e o servidor deve combinar correspondências dos campos selecionados com **OR**. A paginação da resposta deve usar `p`; não se deve inferir campos de colunas de banco a partir destes IDs.

## Por que a seleção de Produtos está na URL

Os campos mudam os resultados da busca, portanto compõem o estado da consulta junto de `q` e `p`. A URL permite recarregar, compartilhar e usar Voltar/Avançar sem perder a seleção. A abertura do painel é estado local, pois só controla a apresentação. O componente genérico não exige URL: outro consumidor pode usar apenas `useState`.

Mantemos `fields` em vez de `f` pela legibilidade: a abreviação economiza poucos caracteres e não define que tipo de filtro representa. A lista `fields=name,type` é apropriada para estes três IDs fixos, que não contêm vírgulas. O [nuqs suporta arrays separados por vírgula e parâmetros repetidos](https://nuqs.dev/docs/parsers/built-in); usamos `parseAsArrayOf(parseAsStringLiteral(PRODUCT_SEARCH_FIELDS))` para validação e comparação de arrays, sem parser próprio. A normalização no hook remove duplicatas e define a ordem estável. `%2C` é a representação codificada normal da vírgula na URL, não outro formato. Se o futuro contrato de filtros aceitar valores livres, parâmetros repetidos como `tag=a&tag=b` são uma alternativa; essa necessidade não existe para os IDs atuais.

Uma alteração de chip durante o debounce preserva o texto pendente e o prazo da digitação. Voltar/Avançar, mudar de rota ou receber outro `q` externo descarta o rascunho e segue a URL. A lógica da SearchBar não conhece `fields` nem Produtos.

Verificação final: **56 testes focados em cinco arquivos**, **288 testes completos em 37 arquivos**, lint dos arquivos alterados sem diagnósticos e build aprovado (aviso preexistente de bundle acima de 500 kB). No Chrome real, temas claro/escuro em 1280 e 375 px passaram sem overflow ou erros: chip sem X e largura estável; teclado; seleção genérica com estado local; limpeza, reload e histórico; digitação antes de alterar um chip preserva o rascunho e aplica q/fields; Back cancela o rascunho e Forward restaura a busca. Nenhum endpoint de Produtos foi conectado.


Na composição atual de Produtos, a limpeza visual não é habilitada. O consumidor genérico pode optar por `clearable`; `clearFields` permanece disponível no hook para controles externos. Os testes de integração respeitam essa opção.
