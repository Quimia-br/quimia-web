# Navegação, perfil e tema

Componentes de `src/components` que compõem a navegação e os links da aplicação. Os testes ficam ao lado dos componentes e exercitam as dependências reais; não adicionam testes em `ui/`, `smoothui/` ou `evilcharts/`.

## ShapeIcon

Link de navegação com ícone Lucide e rótulo visível. Importação: `import ShapeIcon from "@/components/ShapeIcon"`.

```tsx
import { Package } from "lucide-react";

<ul>
  <ShapeIcon to="/products" icon={Package} label="Produtos" />
</ul>
```

Deve estar dentro de um Router e de uma lista (`ul`/`SidebarMenu`), pois renderiza um `li`. Não consulta o contexto de `SidebarProvider` diretamente.

| Prop | Uso |
| --- | --- |
| `to` | Destino obrigatório, com o mesmo tipo de `NavLink`. |
| `icon` | Componente `LucideIcon` obrigatório, decorativo (`aria-hidden`). |
| `label` | Texto obrigatório; fornece o nome acessível por `aria-labelledby`. |
| `end` | Exige correspondência exata; padrão habilitado para `/`. Outras seções ficam ativas em subrotas. |
| `className` | Classes extras ou função que recebe o estado de `NavLink`; mantém as classes base. |
| Demais props de `NavLink` | Repassadas ao link, exceto `children`, substituído pelo ícone. |

O estado ativo usa `aria-current="page"`; o foco por teclado usa o token `sidebar-ring`. Rótulos repetidos mantêm IDs individuais. A revisão corrigiu o tratamento de `className` em função, que antes era passado diretamente ao combinador de classes.

**Figma:** [ShapeIcon primário, 178:147](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=178-147). Contexto e screenshot consultados. O desenho apresenta contêiner de 100 × 90 px, ícone de 32 px, intervalo de 8 px antes do rótulo e badge opcional. A implementação usa círculo de 72 px e ícone de 32 px, sem intervalo explícito, badge, ocultação do rótulo ou variante desabilitada. Esses desvios visuais/contratuais foram registrados; a revisão não acrescenta funcionalidades de badge nem altera a geometria atual.

**Testes (`ShapeIcon.test.tsx`):** nomes acessíveis/ícones decorativos, IDs separados, correspondência de subrotas e `end`, navegação com Tab/Enter, estado ativo, função `className` e atributo de link.

## Menu

Menu lateral com Home (`/`), Produtos (`/products`), Estatísticas (`/graphs`) e perfil (`/profile`). Importação: `import Menu from "@/components/Menu"`. Não recebe props.

```tsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <SidebarProvider>
      <Menu />
      <main>{children}</main>
    </SidebarProvider>
  </BrowserRouter>
</QueryClientProvider>
```

Requer `SidebarProvider`, Router e `QueryClientProvider`; o último atende a consulta de perfil. Os providers devem ser compartilhados com a aplicação. Usa `collapsible="none"`, portanto permanece visível em telas pequenas; não oferece um menu móvel alternativo. Seu elemento externo é um `div`, sem landmark de navegação próprio; o layout pode envolvê-lo em `<nav aria-label="Menu principal">`.

**Figma:** [Menu com primeiro item ativo, 193:174](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=193-174), pertencente à página Menu `193:379`. Contexto e screenshot consultados. Coincidem a superfície branca, raio de 60 px, padding de 32 px, itens empilhados e perfil no rodapé. O desenho tem largura de 160 px, altura de exemplo de 814 px e intervalo de 30 px entre itens; o código usa largura ajustada ao conteúdo com máximo de 160 px, altura vinculada ao layout e intervalo de 24 px, além dos paddings dos componentes Sidebar. O Figma utiliza rótulos genéricos; as rotas e nomes de seções vêm do produto.

**Testes (`Menu.test.tsx`):** renderização dos quatro destinos com componentes reais, apenas um item ativo em cada seção (inclusive subrotas) e navegação para Estatísticas.

## ProfileContainer

Link para `/profile`, com avatar de empresa e fallback de prédio. Importação: `import ProfileContainer from "@/components/ProfileContainer"`. Não recebe props.

```tsx
// Dentro de Router e QueryClientProvider:
<ul>
  <ProfileContainer />
</ul>
```

`useUser()` consulta `GET /empresas/me` pelo serviço real e cache `['auth', 'user']`. Enquanto carrega, apresenta skeleton; sem foto ou após erro, apresenta o fallback. Com imagem carregada, usa `fotoUrl` e `nome` como texto alternativo. Não apresenta mensagem de erro nem botão de repetir a consulta. O link agora tem nome acessível estável `Perfil` em todos os estados; antes, loading e fallback podiam deixá-lo sem nome. O destino continua ativo em subrotas de perfil.

**Figma:** [Avatar padrão, 179:958](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=179-958), página Avatar `193:469`, e [perfil dentro do Menu, 182:1216](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=182-1216). Contextos e screenshots de Avatar e Menu consultados. O avatar isolado mede 80 px; no Menu, é uma instância de 50 px dentro de contêiner de 74 px. O código utiliza avatar de 48 px, contêiner de 64 px e ícone Lucide `Building` de 24 px; o desenho do avatar isolado especifica ícone de 32 px. O estado carregando e os erros de rede não são definidos nesses nós do Figma.

**Testes (`ProfileContainer.test.tsx`):** loading com link nomeado, resposta real do serviço via adapter HTTP controlado, imagem/nome da empresa e preenchimento do cache, erro de consulta, fallback sem foto, Tab/Enter e perfil ativo em subrota. Apenas a rede e a decodificação de imagens do navegador são controladas; `useUser`, QueryClient, Router e Avatar permanecem reais.

## LinkButton

Link do Router com variantes visuais de botão. Importação: `import LinkButton from "@/components/LinkButton"`. Requer Router; o nome acessível normalmente vem dos `children`.

```tsx
<LinkButton to="/signup">Crie já</LinkButton>
<LinkButton to="/products" variant="secondary" size="lg">
  Produtos
</LinkButton>
```

| Prop | Uso |
| --- | --- |
| `to` | Destino obrigatório de `Link`. |
| `children` | Rótulo e/ou conteúdo do link. |
| `variant` | Variante de `buttonVariants`; padrão `link`. |
| `size` | Tamanho de `buttonVariants`; padrão `default`. |
| `className` | Classes extras. O componente adiciona `text-base`. |
| Demais props de `Link` | Incluem `state`, `replace`, `target`, `rel` e atributos acessíveis. |

Renderiza um `a`, adequado para navegação. Não recebe `disabled` como uma prop de botão; ações devem usar um componente de botão. Texto de contexto antes do link pertence ao chamador.

**Figma:** [link de cadastro no login, 34:25](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=34-25). Contexto e screenshot consultados. É um texto de tela de 20 px em Aeonik Medium, com introdução sutil e chamada `Crie já` em foreground primário; não é um componente publicado chamado LinkButton. O padrão do código é de 16 px, com padding/altura do tamanho padrão, underline em hover/foco e fonte da aplicação. Não há equivalência visual exata demonstrada para todas as variantes que `LinkButton` aceita.

**Testes (`LinkButton.test.tsx`):** semântica de link e rótulo filho, destino, aparência padrão, Tab/Enter com router state e variantes/atributos de âncora.

## ThemeToogle

Botão circular que alterna o tema efetivo para claro ou escuro. Mantém-se a grafia pública atual `ThemeToogle`. Importação: `import ThemeToogle from "@/components/ThemeToogle"`. Não recebe props.

```tsx
// Dentro do ThemeProvider montado em src/providers.tsx:
<ThemeToogle />
```

Requer o `ThemeProvider` global da aplicação, que fornece `ThemeProviderContext`, aplica a classe no elemento `html` e persiste a escolha no localStorage. O estado inicial pode ser `light`, `dark` ou `system`; neste último, o provider acompanha `prefers-color-scheme: dark` e expõe `resolvedTheme`. O botão usa esse valor para gravar um tema explícito oposto ao tema efetivo. A revisão corrigiu o caso de sistema escuro que antes selecionava escuro novamente, além dos nomes acessíveis para `Alternar para tema claro` e `Alternar para tema escuro`. Lua/sol permanecem indicadores do tema atual.

O componente não oferece voltar para `system`. Enquanto a escolha é `system`, mudanças de preferência do sistema atualizam a classe e o botão. Veja [estado de Produtos](products-state.md) para chaves, padrões e limites da persistência.

**Figma:** [IconButton onColor médio, 182:1283](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=182-1283), página IconButton `183:2114`. Contexto e screenshot consultados. A composição circular branca com ícone de 24 px corresponde à variante `onColor`; o desenho mede 70 px e a implementação `icon-md` mede 64 px. O desenho usa ícone genérico configurável. Não foi identificado um nó específico para alternância de tema; texto acessível, estados claro/escuro e persistência são contratos do código.

**Testes (`ThemeToogle.test.tsx`):** quatro combinações de tema/preferência do sistema usando o provider real, interação por teclado, classe aplicada ao `html`, persistência e nome da próxima ação; ícones decorativos.

## Verificação

```powershell
node ./node_modules/vitest/vitest.mjs run src/components/ShapeIcon.test.tsx src/components/Menu.test.tsx src/components/ProfileContainer.test.tsx src/components/LinkButton.test.tsx src/components/ThemeToogle.test.tsx --maxWorkers=1
```

São 21 casos de comportamento, com controle apenas das fronteiras de navegador/rede necessárias ao jsdom. A comparação com Figma registra valores do contexto e screenshots do design versus classes atuais; os testes não demonstram equivalência visual por pixel, contraste calculado nem layout real de navegador.
