# Componentes de apresentação

Uso dos componentes diretos `Card`, `CardHeader`, `FeedbackItem`, `Logo` e `MainTitle`. Todos são exports padrão de `@/components/<Nome>`; precisam do CSS global `src/index.css` para fontes Aeonik, tokens de cor e utilitários Tailwind. Não exigem Router, QueryClient ou outro provider próprio.

## Card

Agrupa conteúdo com cabeçalho opcional. O título usa `h2`; a tela deve definir o título principal em outro local.

| Prop | Tipo / padrão | Uso |
| --- | --- | --- |
| `title` | `string`, opcional | Exibe `CardHeader` quando não vazio. |
| `description` | `string`, opcional | Texto abaixo do título; só aparece se houver `title`. |
| `icon` | `ReactNode`, opcional | Ícone do cabeçalho; só aparece se houver `title`. |
| `children` | `ReactNode`, opcional | Conteúdo e ações compostos pela tela. |
| `className` | `string`, opcional | Estilos do contêiner externo, não do cabeçalho. |

```tsx
import Card from "@/components/Card";
import { Circle } from "lucide-react";

<Card title="Produtos" description="Itens cadastrados" icon={<Circle aria-hidden="true" />}>
  <p>3 produtos disponíveis</p>
  <button type="button" onClick={abrirCadastro}>Cadastrar produto</button>
</Card>
```

Sem `title` (ou com `title=""`), o componente omite todo o cabeçalho, incluindo descrição e ícone. Não fornece região acessível, rodapé dedicado nem atributos DOM arbitrários; componha essas estruturas nos filhos ou em um elemento externo quando necessário.

**Figma revisado:** [Card, 427:1653](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=427-1653). Contexto e imagem confirmam padding de 32 px, raio de 42 px, espaçamento vertical de 20 px e fundo de superfície compatíveis com o código. O desenho tem slots separados `head`, `content` e `footer`, flags de visibilidade e largura de 365 px; a implementação usa `children`, título opcional e largura definida pelo contexto. Esses recursos não foram adicionados nesta revisão. O placeholder rosa é um slot do design, não conteúdo de produção.

**Testes:** composição de título/descrição/ícone/conteúdo, cabeçalho ausente sem título ou com título vazio, remoção do cabeçalho após atualização, classes no contêiner correto e ativação por teclado de controles fornecidos nos filhos.

## CardHeader

Cabeçalho reutilizável com `h2` e descrição opcional; não inclui superfície ou padding de card.

| Prop | Tipo / padrão | Uso |
| --- | --- | --- |
| `title` | `string`, obrigatório | Nome da seção, anunciado como heading de nível 2. |
| `description` | `string`, opcional | Parágrafo complementar; string vazia não gera parágrafo. |
| `icon` | `ReactNode`, opcional | Preserva a semântica definida pelo chamador. |
| `className` | `string`, opcional | Estilos do contêiner do cabeçalho. |

```tsx
import CardHeader from "@/components/CardHeader";
import { Circle } from "lucide-react";

<CardHeader title="Resumo" description="Informações da conta" icon={<Circle aria-hidden="true" />} />
```

Quando o ícone apenas repete o título, passe `aria-hidden="true"`. Se transmitir informação adicional, forneça um nome acessível no próprio ícone. O componente não acrescenta rótulo ao ícone.

**Figma revisado:** [CardHead, 427:1661](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=427-1661). Ícone de 24 px, título de 24 px, descrição de 18 px e distância de 6 px entre textos correspondem às classes atuais. Diferenças pendentes: o desenho usa 10 px entre ícone e texto; o código usa 20 px (`gap-5`). No Figma, descrição é truncada em uma linha e tem peso Medium; no código pode quebrar linha e herda o peso normal. Foram preservados os estilos atuais. O ícone é um slot dinâmico, portanto não foi substituído pelo círculo de exemplo do Figma.

**Testes:** heading de nível 2, descrição presente/ausente/vazia, nome acessível do ícone, atualização e remoção de conteúdo anterior e propagação de classes.

## FeedbackItem

Apresenta um ícone dentro de um círculo. É um elemento visual; não anuncia alterações automaticamente e não define texto de sucesso/erro.

| Prop | Tipo / padrão | Uso |
| --- | --- | --- |
| `icon` | `ReactNode`, obrigatório | Ícone escolhido pela tela. |
| `variant` | `default` (padrão), `success`, `error` | Cor neutra ou cor e anel de feedback. |
| `size` | `big`, `medium` (padrão), `small` | Tamanhos existentes de 288, 224 e 160 px com escala Tailwind padrão. |
| `className` | `string`, opcional | Ajustes de apresentação no círculo. |

```tsx
import FeedbackItem from "@/components/FeedbackItem";
import { CircleCheck } from "lucide-react";

<section>
  <FeedbackItem variant="success" size="medium" icon={<CircleCheck aria-hidden="true" />} />
  <h1>Cadastro concluído</h1>
</section>
```

Forneça texto visível para explicar o resultado. Se o ícone for a única informação, forneça `role="img"` e `aria-label` no ícone. Para resultados assíncronos, a região `aria-live` pertence à tela que gerencia a mudança. Variantes não criam `role="alert"` nem inserem mensagens.

**Figma revisado:** [success/big, 334:704](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=334-704), [success/medium, 405:1955](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=405-1955) e [error/big, 334:706](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=334-706). Contextos e imagens mostram tamanhos de 298/222 px, borda interna de 5 px e ícone de 49 px. Código usa 288/224 px, anel externo de 3 px e SVG de 48 px. O desenho success/big mostra check preto, enquanto o contêiner do código aplica cor de sucesso ao SVG que herdar `currentColor`; o ícone continua controlado pela tela. `default` e `small` não possuem referências nas variantes da página 334:711 revisada. Diferenças visuais preservadas e registradas para decisão de design.

**Testes:** ícone com nome acessível, variante/tamanho existentes sem perda de semântica, ícone decorativo com resultado textual, atualização de ícone e classes externas. Não há snapshot nem alegação de validação de dimensões pelo jsdom.

## Logo

Marca vetorial decorativa, com proporção intrínseca `516:604`. As duas formas continuam usando os tokens `brand-primary` e `brand-secondary`.

| Prop | Tipo / padrão | Uso |
| --- | --- | --- |
| `className` | `string`, opcional | Define tamanho, posição e efeitos conforme a tela. |

```tsx
import Logo from "@/components/Logo";

<Logo className="w-24" />
```

O SVG recebe `aria-hidden="true"` e `focusable="false"`: os usos atuais em Login, Signup, GenericError e NotFound são ilustrações de marca/decorativas. Não use este componente sozinho para dar nome a um link ou botão; forneça texto acessível no controle externo. Ele não aceita `title`, `aria-label` ou outros atributos DOM como props.

**Correção desta revisão:** marca decorativa removida da árvore de acessibilidade e explicitamente não focável, sem alteração dos paths, cores ou geometria. Os testes reproduziram a ausência desses atributos antes da correção.

**Figma revisado:** [logo quimia 1, 1:55](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=1-55); também inspecionados os metadados de [295:692](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=295-692), outro frame com duas formas equivalentes em estrutura. A imagem e o contexto de 1:55 apresentam a composição desfocada, com dimensão de frame 1438 × 1493 px; o efeito fica nas classes da tela no código. Essa referência não permite afirmar equivalência exata dos paths da marca nítida. Não foi encontrada, nesse recorte revisado, referência isolada sem efeitos; asset, proporção e paths existentes foram preservados.

**Testes:** ocultação decorativa, exclusão do foco de teclado e mudança de tamanho por classes sem mudança da proporção intrínseca.

## MainTitle

Título de página (`h1`) com descrição opcional agrupada em `hgroup`. Evite usar várias instâncias como títulos principais de uma mesma tela sem definir a hierarquia da página.

| Prop | Tipo / padrão | Uso |
| --- | --- | --- |
| `title` | `string`, obrigatório | Texto do heading de nível 1. |
| `description` | `string`, opcional | Texto de apoio; ausente ou vazio não gera parágrafo. |
| `className` | `string`, opcional | Aplica classes ao `hgroup`; permite ajustar a escala herdada e layout. |

```tsx
import MainTitle from "@/components/MainTitle";

<MainTitle title="Produtos cadastrados" description="Gerencie os itens da sua empresa" className="max-w-2xl" />
```

Não existe prop `titleClassName`. `title` e `description` são tratados como texto pelo React, sem interpretação de HTML. O estilo padrão do título permanece `font-medium text-display text-text-primary`.

**Figma revisado:** [MainTitle, 2:72](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=2-72). O desenho mostra Aeonik Medium de 52 px, descrição Regular de 36 px e gap de 16 px. A implementação usa escala herdada do grupo (`text-4xl` por padrão), subtítulo `0.618em`, line-heights de tokens e não define gap no grupo. Em `src/index.css`, `--text-display--line-height` está declarado, mas `--text-display` não tem tamanho definido. O resultado visual depende do CSS gerado e do tamanho herdado da tela; divergência registrada sem redesenhar a tipografia.

**Testes:** heading principal e descrição, descrição ausente/vazia, customização do grupo, atualização com remoção de conteúdo anterior e tratamento literal de strings HTML. Foi removido o teste contraditório que alegava `titleClassName` sem fornecê-lo e esperava ausência de `text-display`; o comportamento e as classes de produção foram preservados.

## Limites da revisão

Referências consultadas em 10/10/2026, em modo de leitura: metadados, contextos de design e screenshots dos nós indicados. Nenhum arquivo do Figma foi modificado. Comparações dimensionais acima relacionam propriedades do Figma e fontes/classes do projeto; os testes RTL/Vitest rodam em jsdom e não validam renderização visual, contraste efetivo, fontes carregadas ou comportamento responsivo no navegador. Diferenças visuais listadas permanecem pendentes de uma revisão de telas renderizadas.
