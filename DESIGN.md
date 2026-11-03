## Overview

Quimia é uma aplicação de gestão de produtos químicos, documentos FDS e estatísticas. Sua interface combina organização de dados com uma linguagem visual suave: fundo quase branco e levemente quente (`{colors.canvas}`), painéis brancos (`{colors.surface}`), texto em cinza profundo (`{colors.ink}`) e ações em ciano (`{colors.primary}`). O verde aparece na identidade, no foco e nos estados semânticos previstos; a informação continua sendo o centro da tela.

A geometria dá unidade ao produto. Painéis e menu têm cantos de `{rounded.panel}` (60px), cards internos usam `{rounded.card}` (42px) e campos, chips e botões de negócio assumem a forma de pílulas em `{rounded.full}`. A alternância entre painel branco e card próximo da cor do fundo cria camadas sem depender de sombras. Ícones de contorno e imagens de produtos com proporção preservada completam essa linguagem.

A tipografia usa Aeonik, principalmente nos pesos 400 e 500. Títulos de página são claros e diretos; labels, ações e títulos de cards recebem peso Medium. O espaço entre grupos tem mais importância do que divisórias decorativas. No tema escuro, o fundo fica cinza profundo, os painéis ficam um tom acima e o texto principal passa a branco. A troca para OpenDyslexic e a ampliação de texto fazem parte do sistema.

**Key Characteristics:**

- Fundo neutro quente, painéis de superfície base e cards internos próximos do canvas.
- Ciano de ação (`{colors.primary}`), verde de marca (`{colors.brand-primary}`) e foco verde (`{colors.focus}`), cada um com função própria.
- Painéis de 60px, cards de 42px e interação em pílulas ou círculos.
- Aeonik Regular/Medium, hierarquia por tamanho e peso, com suporte a OpenDyslexic.
- Profundidade por diferença de superfície; sombras restritas a componentes flutuantes específicos.
- Navegação lateral no desktop e menu lateral expansível pelo cabeçalho em telas pequenas.
- Brilho difuso da marca nas telas de autenticação; imagens reais dos produtos nas áreas de dados.

### Source & Token Convention

Valores de implementação: [CSS global](src/index.css) e [componentes existentes](docs/components/components.md). Referências do Figma consultadas em 2026-11-02:

- [Produtos em grade — Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=175-22)
- [Produtos em tabela — Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=239-1257)
- [Perfil — Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=406-6134)
- [BasicButton — Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=11-42)
- [Card — Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=427-1653)
- [MainTitle — Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=2-74)
- [Gráfico de barras — Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=384-1358)
- [Índice dos componentes](docs/components/components.md), [autenticação](docs/authentication.md), [cadastro de produto](docs/components/product-create-dialog.md) e [Perfil](docs/components/profile.md)

As referências `{colors.primary}`, `{typography.heading-1}`, `{spacing.xl}` e `{rounded.card}` são nomes documentais definidos nas seções abaixo. Elas não criam novas variáveis CSS. Use o mapeamento indicado e os componentes existentes ao implementar. As medidas descrevem a escala base de 100%; `rem` e `em` acompanham a ampliação de texto.

## Colors

Fontes: variáveis aplicadas no Figma a Produtos, Perfil, BasicButton e gráfico de barras; `:root` e `.dark` no CSS global. Os hexadecimais citados são referências retornadas pelo Figma; os valores OKLCH da tabela são os valores exatos usados pelo web.

### Brand & Accent

- **Verde de marca** (`{colors.brand-primary}` — Figma `#1eee97`): identidade do Quimia. Compartilha o valor atual de sucesso, mas mantém um papel semântico separado.
- **Ciano de marca** (`{colors.brand-secondary}` — Figma `#5adfea`): complemento da identidade. Use o token da função correspondente.
- **Ciano de ação** (`{colors.primary}` — Figma `#5adfea`): botões primários, chips selecionados, navegação ativa e seleção de tema. Usa texto escuro em `{colors.on-primary}` nos dois temas.
- **Hover e pressionado** (`{colors.primary-hover}` — Figma `#6ad6df`; `{colors.primary-pressed}` — `#02c1d6`): retorno de interação sem trocar a família cromática.
- **Acento verde** (`{colors.accent}` — Figma `#00dc9d`): acento da marca. O foco (`{colors.focus}`) tem o mesmo valor atual, com função independente.

### Surface

- **Canvas** (`{colors.canvas}` — Figma `#f7f6f5` no claro): fundo geral e preenchimento dos cards internos. No escuro, cinza profundo.
- **Surface** (`{colors.surface}` — Figma `#ffffff` no claro): painéis, menu, campos e popovers. No escuro, permanece mais clara que o canvas.
- **Secondary** (`{colors.secondary}` — Figma `#ececec`): ações secundárias e controles inativos. Hover em `{colors.secondary-hover}`; pressionado em `{colors.secondary-pressed}`.
- **Disabled Surface** (`{colors.disabled-surface}` — Figma `#e3e3e3`): superfície desabilitada e alias `muted`.
- **Hairline** (`{colors.hairline}`) e **Soft Hairline** (`{colors.hairline-soft}`): borda principal e sutil. A borda principal permanece igual nos dois temas.

### Text

- **Ink** (`{colors.ink}` — Figma `#404040` no claro): conteúdo principal e ícones; branco no escuro. `{colors.ink-secondary}` preserva o papel secundário mesmo tendo o mesmo valor atual.
- **Heading** (`{colors.heading}`): título de página, separado do foreground de conteúdo.
- **Subtle Ink** (`{colors.ink-subtle}` — Figma `#949494`): descrições de cards, cabeçalhos de tabela e conteúdo de menor ênfase.
- **Muted Text** (`{colors.text-muted}`): descrição de página e placeholder, conforme componente; branco a 60% no escuro.
- **On Primary** (`{colors.on-primary}`): texto escuro sobre ciano nos dois temas. `{colors.on-accent}` cumpre o papel equivalente sobre o acento.
- **On Color** (`{colors.on-color}`): branco no claro, preto no escuro. Não equivale a `{colors.primary-on-color}` nem a On Primary.
- **Disabled Ink** (`{colors.ink-disabled}`): conteúdo desabilitado. **On Error** (`{colors.on-error}`) preserva branco nos botões `critical`. `{colors.secondary-on-color}` mantém seu uso específico.

### Semantic

- **Success** (`{colors.success}`): verde nos componentes que o utilizam. O toast de sucesso atual usa símbolo sobre fundo secundário.
- **Warning** (`{colors.warning}`): atenção acompanhada de ícone ou texto.
- **Error** (`{colors.error}` — Figma `#ff2b7c`): erro de campo e ação crítica, sempre acompanhado do estado e da mensagem pertinente.
- **Focus** (`{colors.focus}`): anel verde de foco. Em erro, o componente pode usar o anel semântico de erro.

### Token Mapping & Dark Mode

Cada célula abaixo contém os argumentos de `oklch(...)`. “Igual” mantém o valor do claro. O tema é resolvido pela classe `.dark`; use classes semânticas em vez de fixar esses valores em cada componente.

| Token                         | Variável CSS             | Claro                        | Escuro                |
| ----------------------------- | ------------------------ | ---------------------------- | --------------------- |
| `{colors.brand-primary}`      | `--brand-primary`        | `0.8377 0.1927 157.62`       | Igual                 |
| `{colors.brand-secondary}`    | `--brand-secondary`      | `0.835 0.1157 202.83`        | Igual                 |
| `{colors.accent}`             | `--brand-accent`         | `0.791748 0.169195 163.7995` | Igual                 |
| `{colors.primary}`            | `--primary-primary`      | `0.835 0.1157 202.8336`      | `0.835 0.1157 202.83` |
| `{colors.primary-hover}`      | `--primary-hover`        | `0.8157 0.1 202.66`          | Igual                 |
| `{colors.primary-pressed}`    | `--primary-pressed`      | `0.7422 0.1276 208.58`       | Igual                 |
| `{colors.primary-on-color}`   | `--primary-on-color`     | `1 0 0 / 60%`                | `1 0 0`               |
| `{colors.secondary}`          | `--secondary-primary`    | `0.9431 0 0`                 | `0.5032 0 0`          |
| `{colors.secondary-pressed}`  | `--secondary-secondary`  | `0.8141 0 0`                 | `0.3407 0 0`          |
| `{colors.secondary-hover}`    | `--secondary-hover`      | `0.8945 0 0`                 | `0.4313 0 0`          |
| `{colors.secondary-on-color}` | `--secondary-on-color`   | `0.7572 0 0`                 | `1 0 0 / 60%`         |
| `{colors.canvas}`             | `--surface-background`   | `0.9736 0.0017 67.8025`      | `0.3012 0 0`          |
| `{colors.surface}`            | `--surface-base`         | `1 0 0`                      | `0.4054 0 0`          |
| `{colors.disabled-surface}`   | `--surface-disabled`     | `0.9158 0 0`                 | `0.6133 0 0`          |
| `{colors.ink}`                | `--foreground-primary`   | `0.3715 0 0`                 | `1 0 0`               |
| `{colors.ink-secondary}`      | `--foreground-secondary` | `0.3715 0 0`                 | `1 0 0`               |
| `{colors.ink-subtle}`         | `--foreground-subtle`    | `0.6665 0 0`                 | Igual                 |
| `{colors.ink-disabled}`       | `--foreground-disabled`  | `0.7636 0 0`                 | `0.9219 0 0`          |
| `{colors.on-color}`           | `--foreground-on-color`  | `1 0 0`                      | `0 0 0`               |
| `{colors.on-error}`           | `--foreground-error`     | `1 0 0`                      | Igual                 |
| `{colors.heading}`            | `--text-primary`         | `0.3677 0 0`                 | `1 0 0`               |
| `{colors.text-muted}`         | `--text-secondary`       | `0.7444 0 0`                 | `1 0 0 / 60%`         |
| `{colors.hairline}`           | `--border-primary`       | `0.8853 0 0`                 | Igual                 |
| `{colors.hairline-soft}`      | `--border-secondary`     | `0.3715 0 0 / 10%`           | Igual                 |
| `{colors.focus}`              | `--border-focus`         | `0.791748 0.169195 163.7995` | Igual                 |
| `{colors.success}`            | `--feedback-success`     | `0.8377 0.1927 157.62`       | Igual                 |
| `{colors.warning}`            | `--feedback-warning`     | `0.8508 0.1265 77.37`        | Igual                 |
| `{colors.error}`              | `--feedback-error`       | `0.657 0.2434 5.43`          | Igual                 |
| `{colors.on-primary}`         | `--primary-foreground`   | `0.3715 0 0`                 | Igual                 |
| `{colors.on-accent}`          | `--accent-foreground`    | `0.3715 0 0`                 | Igual                 |
| `{colors.chart-1}`            | `--chart-1`              | `0.7335 0.1233 197.4922`     | Igual                 |
| `{colors.chart-2}`            | `--chart-2`              | `0.7103 0.1225 182.5067`     | Igual                 |
| `{colors.chart-3}`            | `--chart-3`              | `0.7416 0.1465 167.2149`     | Igual                 |
| `{colors.chart-4}`            | `--chart-4`              | `0.7727 0.1601 162.9132`     | Igual                 |
| `{colors.chart-5}`            | `--chart-5`              | `0.8009 0.1585 162.3831`     | `0.42 0.18 266`       |

`bg-background` resolve para Canvas; `bg-card`, `bg-popover` e `bg-input`, para Surface. `text-foreground` resolve para Ink; `text-muted-foreground`, para Subtle Ink. Os aliases de sidebar reutilizam a mesma paleta; o texto de seus estados primary/accent permanece escuro. `critical` usa On Error; o alias `destructive-foreground` segue Ink.

No Figma, `secondaryPressed` corresponde a `--secondary-secondary`; `primaryDisabled` é `#5adfea99`, realizado pelo botão atual com `primary-primary/60`. Os nomes `Primary` e `TextPrimary` de Perfil não têm equivalência automática com os tokens de texto do web. A quinta série de gráfico é verde no claro e azul no escuro conforme o CSS; seu equivalente escuro não foi conferido no Figma nesta consulta.

## Typography

### Font Family

**Aeonik** é a família principal, carregada de arquivos locais em [aeonik.css](src/assets/fonts/aeonik/aeonik.css). Regular 400 e Medium 500 definem a voz tipográfica. O stack padrão é `"Aeonik", sans-serif`, em `--app-font-family`, herdado por `font-base` e aplicado ao body.

**OpenDyslexic** é a alternativa de acessibilidade já implementada. Sua ativação altera a variável de família da aplicação. Novos componentes devem herdar essa variável.

### Hierarchy

As entrelinhas correspondem aos componentes indicados na escala base, incluindo as utilities do Tailwind instalado. Tokens de papel específico não devem ser generalizados para todo texto do mesmo tamanho.

| Token                    | Size                              | Weight      | Line Height               | Letter Spacing                     | Use                             |
| ------------------------ | --------------------------------- | ----------- | ------------------------- | ---------------------------------- | ------------------------------- |
| `{typography.display}`   | 48px / 3rem                       | 500         | 1.1 em MainTitle ampliado | Sem ajuste próprio                 | Título ampliado na autenticação |
| `{typography.heading-1}` | 36px / 2.25rem                    | 500         | 1.1                       | Sem ajuste próprio                 | MainTitle padrão                |
| `{typography.heading-2}` | 24px / 1.5rem                     | 500         | 32px / 1.333              | Sem ajuste próprio                 | CardHeader                      |
| `{typography.title}`     | 20px / 1.25rem                    | 500         | 24px / 1.2                | 0 no Toast; -0.005em no EmptyState | Toast e estado vazio            |
| `{typography.subtitle}`  | 0.618em; ≈22.25px com pai de 36px | 400         | 1.2                       | Sem ajuste próprio                 | Descrição de MainTitle          |
| `{typography.body-lg}`   | 18px / 1.125rem                   | 400 herdado | 28px / 1.556              | Sem ajuste próprio                 | Descrição de CardHeader         |
| `{typography.body}`      | 16px / 1rem                       | 400 herdado | 24px / 1.5                | Sem ajuste próprio                 | Dados em Produtos               |
| `{typography.body-sm}`   | 14px / 0.875rem                   | Herdado     | 20px / 1.429              | Sem ajuste próprio                 | Texto base de ActionInput       |
| `{typography.button}`    | 18px / 1.125rem                   | 500         | 1.2                       | Sem ajuste próprio                 | BasicButton padrão              |
| `{typography.label}`     | 16px / 1rem                       | 500         | 24px / 1.5                | Sem ajuste próprio                 | TextField e navegação           |
| `{typography.chip}`      | 16px / 1rem                       | 500         | 19px                      | Sem ajuste próprio                 | Filtros                         |
| `{typography.caption}`   | 14px / 0.875rem                   | 500         | 17px                      | Sem ajuste próprio                 | Descrição de toast e EmptyState |

### Principles

- **Medium dá ênfase.** Preserve peso 500 em ações, títulos e labels.
- **Tracking natural como base.** Os nós consultados no Figma usam 0%; EmptyState possui ajuste local de -0.005em no título.
- **Texto pode crescer.** Permita quebra de linha e altura mínima em ações, inclusive com OpenDyslexic e ampliação de texto.
- **Nome e vocabulário.** Escreva Quimia, sem acento. Use rótulos e mensagens em português conforme o produto.

### Note on Font Substitutes

Use os arquivos de Aeonik já presentes no projeto. O fallback configurado é `sans-serif`; OpenDyslexic é a alternativa selecionável pelo usuário. Textos em canvas/SVG seguem [o helper dos gráficos](src/lib/chart-typography.ts), que acompanha fonte e escala e observa alterações de aparência.

## Layout

### Spacing System

A escala observada combina passos de 4px com medidas recorrentes de 6, 10 e 20px. Os nomes abaixo são documentais; não existem custom properties `--padding-*` no CSS atual. Use as utilities equivalentes.

| Token               | Value | Use                                                      |
| ------------------- | ----- | -------------------------------------------------------- |
| `{spacing.none}`    | 0px   | paddingNone no Figma                                     |
| `{spacing.xxs}`     | 4px   | Ajustes compactos, gap-1                                 |
| `{spacing.text}`    | 6px   | Título e descrição de CardHeader                         |
| `{spacing.xs}`      | 8px   | Gap do BasicButton padrão                                |
| `{spacing.icon}`    | 10px  | Chip e Dropdown                                          |
| `{spacing.sm}`      | 12px  | paddingSmall; shell em telas pequenas                    |
| `{spacing.md}`      | 16px  | paddingMedium; margem mobile e padding vertical do botão |
| `{spacing.content}` | 20px  | Gap de Card e entre menu/conteúdo no desktop             |
| `{spacing.lg}`      | 24px  | paddingBig; grupos e padding horizontal de Chip          |
| `{spacing.xl}`      | 32px  | paddingHuge; padding de Card e shell desktop             |
| `{spacing.xxl}`     | 48px  | gap-12 de AuthLayout                                     |

Medidas específicas, como 14, 37, 46 e 47px em formulários e modais, pertencem às composições correspondentes.

### Grid & Container

No desktop, o shell possui padding de 32 px e gap de 20 px entre o menu lateral e a coluna principal. Esta coluna usa gap de 24 px. O menu é uma superfície própria com raio de 60 px, até 160 px de largura e perfil no rodapé.

Painéis de resultados usam `surface-base` e raio de 60 px. Dentro deles, cards usam `surface-background`, raio de 42 px e padding de 32 px. Essa alternância de superfícies é central para a hierarquia do Quimia. Um Card isolado usa `bg-background`; não assuma que todo card é branco.

Os frames desktop de Perfil e Produtos consultados têm 1440 px de largura, padding de 32 px e gap horizontal de 20 px. A largura do frame é uma referência de composição, não uma largura fixa da aplicação.

### Whitespace Philosophy

O espaço delimita grupos antes de qualquer divisor. Um painel em `{colors.surface}` reúne o conteúdo; cards em `{colors.canvas}` separam os assuntos; gaps menores mantêm unidos título, descrição e controle. Reserve espaço para validação e feedback sem sobrepor textos aos controles.

### Responsive Strategy

#### Breakpoints

| Condition                                            | Key Changes                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Abaixo de `md` (768 px na configuração padrão usada) | Padding de 24 px, menu lateral de 214 px aberto pelo cabeçalho, deslocando o conteúdo |
| A partir de `sm` (640 px)                            | DataGrid amplia padding; modal de produto amplia raio e espaçamento                      |
| A partir de `md` (768 px)                            | Shell em linha, menu lateral e padding externo de 32 px                                  |
| A partir de `lg` (1024 px)                           | Header pode alinhar título e ações em linha; AuthLayout adota composição de duas colunas |
| Perfil a partir de 750 px                            | Preferências passam a duas colunas; campos de edição podem ficar lado a lado             |
| Perfil a partir de 1100 px                           | Layout com três colunas e preferências em subgrid                                        |
| Texto em 175% ou 200%                                | CSS do Perfil força coluna única para informação, preferências e edição                  |
| Grid de dados                                        | Número de colunas responde ao espaço disponível, não apenas ao viewport                  |

Os breakpoints de 640, 768 e 1024px correspondem a `sm`, `md` e `lg` usados na aplicação. Os limiares de 750 e 1100px são regras locais do Perfil. AuthLayout também adapta título e gaps em até 480px.

#### Touch Targets

Os controles principais existentes oferecem áreas de 48–72px; BasicButton padrão tem mínimo de 61px. Para novos controles de toque, adote pelo menos 44 × 44px como orientação de projeto. Chips e ações auxiliares menores precisam ser considerados no contexto.

#### Collapsing Strategy

- Abaixo de `md`, shell com padding e gap de `{spacing.lg}`. O menu fica recolhido e abre pelo botão do cabeçalho; sua largura de 214 px desloca o conteúdo para a direita, conforme o protótipo mobile.
- No menu mobile aberto, controles passam de 72 px para 150 × 90 px e mantêm os rótulos visíveis. O botão do cabeçalho mede 50 px.
- Grades respondem à largura útil; barras de ações podem quebrar linha.
- Perfil e edição passam a uma coluna com texto em 175% ou 200%.
- Modais limitam altura ao viewport, com corpo rolável e ações alcançáveis. Tabelas permitem rolagem horizontal no contêiner.

#### Image Behavior

- Produtos usam `object-contain`, preservando a embalagem e o alinhamento à base quando previsto.
- A área de mídia na grade tem 229px de altura; miniaturas da tabela de Produtos medem 51 × 70px.
- ProductImage fornece fallback quando não há imagem ou o carregamento falha.
- Logos, SVGs próprios e brilho de autenticação reutilizam os assets locais.

#### Accessibility Preferences

As escalas disponíveis são 100%, 125%, 150%, 175% e 200%. [As preferências](src/lib/accessibility.ts) alteram tamanho raiz e família. Use `min-w-0`, reflow e rolagem interna no local apropriado; mantenha foco visível, labels associados, erros e operação por teclado. Ao criar combinações de cor novas, confira a legibilidade nos dois temas.

## Elevation & Depth

| Level    | Treatment                                                    | Use                          |
| -------- | ------------------------------------------------------------ | ---------------------------- |
| Canvas   | `{colors.canvas}`, sem sombra                                | Fundo geral                  |
| Panel    | `{colors.surface}`, raio `{rounded.panel}`                   | Menu e resultados            |
| Inset    | `{colors.canvas}`, raio `{rounded.card}`                     | Cards internos               |
| Floating | Sombra local `0 0 10px rgba(0,0,0,0.05)`                     | Popup de Dropdown            |
| Modal    | Overlay preto a 10%, blur discreto e popup acima do conteúdo | Dialog e cadastro de produto |

Os níveis nomeiam tratamentos visuais, não uma escala de z-index nem variáveis adicionais. Card e BasicButton inspecionados no Figma não têm efeitos. O Dialog primitive usa contorno sutil; a composição de cadastro de produto remove o ring.

### Decorative Depth

- **Brilho de marca:** asset local de autenticação atrás do conteúdo, com opacidade reduzida no escuro.
- **Imagem como conteúdo:** embalagens e fotos reais dão informação e volume sem preencher a interface com decoração.
- **Sobreposição funcional:** popup, modal e toast seguem sua composição existente.

### Motion

O movimento dá retorno à interação. Chips usam transição de cor de 150 ms; toasts usam opacidade e deslocamento de 200 ms com `ease-out`. Os [presets de animação existentes](src/components/smoothui/lib/animation.ts) oferecem spring de 250 ms com bounce de 0.1, versão rápida de 200 ms sem bounce e durações de 150–400 ms conforme complexidade.

Ao acrescentar movimento, respeite a preferência de movimento reduzido com `motion-reduce` ou `useReducedMotion`, mantendo o feedback textual e o estado final. Preserve a distinção entre transição de estado, indicador de processamento e decoração.

## Shapes

### Border Radius Scale

| Token                    | Value                                 | Use                                       |
| ------------------------ | ------------------------------------- | ----------------------------------------- |
| `{rounded.base}`         | 1rem / 16px na escala base            | --radius; não substitui os raios locais   |
| `{rounded.dropdown}`     | 32px                                  | Lista e opções de Dropdown                |
| `{rounded.dialog-small}` | 40px                                  | Modal de produto em telas pequenas        |
| `{rounded.card}`         | 42px                                  | Card e moldura de gráfico                 |
| `{rounded.panel}`        | 60px                                  | Menu, resultados e modal de produto em sm |
| `{rounded.full}`         | rounded-full; Figma radiusFull = 1000 | Pílulas e círculos                        |

### Photography Geometry

- A imagem do produto preserva sua silhueta; não recorte a embalagem para preencher o contêiner.
- O contêiner arredondado não exige aplicar o mesmo raio à imagem transparente.
- Avatares e ações de ícone usam círculos nos contextos previstos.
- Ícones Lucide mantêm contorno: em geral 20–24px nas ações e 32px na navegação desktop. Preserve os SVGs próprios, como os de Dropdown.

## Components

### Buttons

**`button-primary`** — ação principal via [BasicButton](src/components/BasicButton.tsx).

- Fundo `{colors.primary}`, texto `{colors.on-primary}` em `{typography.button}`, forma `{rounded.full}`.
- Mínimo de 61px; padding vertical de `{spacing.md}` e horizontal de 20px; ícone de 20px. Rótulos podem quebrar e aumentar a altura.
- Hover `{colors.primary-hover}`; pressionado `{colors.primary-pressed}`; foco com anel de 3px em `{colors.focus}`.
- Desabilitado: fundo primário a 60% e texto `{colors.ink-disabled}`.

**`button-secondary`** — cancelar, voltar e ações de menor prioridade.

- Mesmo formato; fundo `{colors.secondary}` e texto `{colors.ink}`.
- Hover `{colors.secondary-hover}`; pressionado `{colors.secondary-pressed}`; texto disabled semântico.

**`button-critical`** — ação crítica ou confirmação destrutiva.

- Fundo `{colors.error}`, texto `{colors.on-error}`, forma `{rounded.full}`. Hover/active reduzem brilho.
- Disabled reduz a opacidade do fundo e troca o texto. Preserve o contrato próprio de `critical`; `destructive` é uma variante distinta.

**`button-compact`** — variação dimensional.

- Mínimo de 48px; padding vertical de 12px e horizontal de `{spacing.md}`. BasicButton aplica texto de 18px; consumidores podem ajustar.
- Largura total por padrão; mantém os estados da variante escolhida.

**`icon-button`** — ação circular sem texto visível.

- Reutiliza Button em 48 ou 64px, aplicando `rounded-full` conforme a composição.
- `onColor` usa `{colors.on-color}` como fundo e `{colors.ink}` no ícone. Preserve nome acessível e foco.

### Cards & Containers

**`content-panel`** — moldura principal de resultados.

- Fundo `{colors.surface}`, cantos `{rounded.panel}` e espaço interno definido pela composição.
- Reúne grade, tabela, vazio ou erro; rolagem no contêiner apropriado.

**`feature-card`** — Card de conteúdo ou preferência.

- Fundo `{colors.canvas}`, raio `{rounded.card}`, padding de `{spacing.xl}` e gap de `{spacing.content}`.
- Cabeçalho opcional: ícone de 24px, título em `{typography.heading-2}`, descrição em `{typography.body-lg}` / `{colors.ink-subtle}`.
- Gap de `{spacing.text}` entre textos; 20px entre ícone e grupo textual no código atual.

**`product-card`** — DataGridCard na grade de produtos.

- Reutiliza feature-card; padding de 24px em telas pequenas e 32px em `sm`.
- Mídia e ações alinhadas à base; imagem proporcional em área de 229px de altura.

**`data-table`** — listagem com relações entre colunas.

- Cabeçalhos em `{colors.ink-subtle}`; texto de Produtos em `{typography.body}`; padding vertical de 16px nas células dessa página.
- Nomes podem quebrar; descrições truncadas preservam o texto completo em `title`. Mantenha semântica e rolagem horizontal.

### Inputs & Forms

**`text-input`** — TextField e ActionInput.

- Fundo `{colors.surface}`, texto `{colors.ink}`, placeholder `{colors.text-muted}` e forma `{rounded.full}`.
- ActionInput: altura base de 48px, padding inicial de 24px, texto em `{typography.body-sm}` e ação à direita quando aplicável.
- Label em `{typography.label}`, gap de `{spacing.md}` e descrição/erro associados. Autenticação e cadastro podem usar 64px e texto de 16px.

**`text-input-focused / text-input-invalid`** — estados do campo.

- Foco: anel de 3px em `{colors.focus}`. Erro: anel semântico em `{colors.error}` e mensagem associada.

**`search-bar`** — busca com limpar e voz conforme contexto.

- Reutiliza SearchBar e sua forma pill; preserve ditado, permissão, indisponibilidade, erro e limpeza.

**`dropdown`** — seleção única.

- Gatilho de 66px em `{colors.surface}`, forma `{rounded.full}`, texto de 16px/500 e indicador circular de 42px em `{colors.secondary}`.
- Lista e opções em `{rounded.dropdown}`; padding das opções de `{spacing.lg}`; gap entre opções de `{spacing.md}`.
- Foco/expansão com anel verde; realce `{colors.secondary-hover}`; disabled semântico. Consulte [o guia](docs/components/dropdown.md).

### Navigation

**`sidebar`** — navegação principal no desktop.

- Superfície `{colors.surface}`, raio `{rounded.panel}`, padding de `{spacing.xl}` e perfil no rodapé.
- Controle de 72px, ícone de 32px, label de 16px/500. Inativo em `{colors.secondary}`; ativo em `{colors.primary}` com `{colors.on-primary}`.
- Preserve `aria-current` e anel de foco.

**`mobile-navigation`** — navegação lateral expansível de 214 px, acionada pelo botão no cabeçalho.

- Abaixo de `md`, abre pelo botão de 50 px no cabeçalho; controles de 150 × 90 px e rótulos visíveis. Fecha ao selecionar um destino ou pressionar Escape.

**`page-header`** — título, descrição opcional e controle de tema.

- Título em `{typography.heading-1}` / `{colors.heading}`; descrição em `{typography.subtitle}` / `{colors.text-muted}`.
- Permite quebra e coluna; pode passar a linha em `lg`.

### Signature Components

**`filter-chip`** — filtro selecionável.

- Texto `{typography.chip}`, forma `{rounded.full}`, padding vertical de 12px e horizontal de `{spacing.lg}`; mínimo de 43px.
- Inativo em `{colors.surface}` / `{colors.ink}`; ativo em `{colors.primary}` / `{colors.on-primary}`. O ativo atual não acrescenta X.

**`chart-card`** — moldura de gráfico.

- Fundo `{colors.canvas}`, raio `{rounded.card}`, padding de `{spacing.xl}` e gap específico de 21px.
- Séries usam `{colors.chart-1}` a `{colors.chart-5}`. Fonte e tamanho acompanham preferências; legenda e valores complementam cor.

**`product-dialog`** — cadastro e análise de FDS.

- Raio `{rounded.dialog-small}` em telas pequenas e `{rounded.panel}` em `sm`; padding de 24px, passando a 60px horizontal e 50px vertical.
- Fundo próximo do canvas nas etapas iniciais e superfície base na revisão. Altura limitada ao viewport, corpo rolável e ações alcançáveis. Consulte [o fluxo](docs/components/product-create-dialog.md).

**`toast`** — retorno contextual.

- Fundo `{colors.surface}`, raio `{rounded.full}`, padding de `{spacing.md}`; símbolo circular de 42px e ícone de 20px.
- Título em `{typography.title}`; descrição em `{typography.caption}` / `{colors.ink-subtle}`.
- Na faixa de ações em Produtos e abaixo do cabeçalho em Perfil; sucesso usa símbolo sobre fundo secundário.

**`empty-state`** — ausência de dados e erros recuperáveis.

- Composição centralizada, símbolo em área de 100 × 90px, título em `{typography.title}` e descrição em `{typography.caption}`.
- Explica a situação e oferece ação pertinente. Use skeleton durante a espera e tentativa novamente quando o carregamento falhar.

**`accessibility-preferences`** — texto, fonte e tema.

- Cards em `{colors.canvas}` dentro do painel `{colors.surface}`; seleção em ciano.
- Escalas de 100–200%, OpenDyslexic e Claro/Escuro/Sistema integram Perfil.

### Examples (illustrative)

Estas composições reutilizam os componentes do produto, sem introduzir features ou medidas adicionais.

**`ex-products-grid`** — page-header → busca/filtros → content-panel com product-card → paginação. Moldura em `{colors.surface}` e cards em `{colors.canvas}`.

**`ex-products-table`** — mesma faixa de ações e painel, com data-table. Mantém estados de carregamento, vazio e erro.

**`ex-profile-preferences`** — informação da conta ao lado de accessibility-preferences, com reflow para uma coluna em texto ampliado.

**`ex-auth-form`** — AuthLayout com brilho decorativo, MainTitle, TextField e BasicButton; formulário com largura limitada e adaptação em telas pequenas.

**`ex-fds-review`** — product-dialog com revisão rolável, feedback contextual e ações; superfície conforme a etapa.

### Figma & Implementation

| Referência                | Figma consultado                                                      | Web atual / decisão de aplicação                                                                      |
| ------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| BasicButton               | 61 px de altura, texto de 24 px, gap de 10 px                         | Mínimo de 61 px, texto padrão de 18 px e gap de 8 px; preserve o componente em telas novas            |
| MainTitle isolado         | Título de 52 px e descrição de 36 px                                  | Título padrão de 36 px e subtítulo relativo de `0.618em`; telas do Figma também usam títulos de 36 px |
| CardHeader                | Guia existente registra gap de 10 px entre ícone e texto              | Código usa 20 px; consulte [o histórico de comparação](docs/components/components-display.md)         |
| Tokens textuais no Perfil | Retorno inclui `Primary` e `TextPrimary`, além de `foregroundPrimary` | Nomes não têm equivalência automática; o título web usa `--text-primary` e conteúdo usa foreground    |
| Pressionado secundário    | `secondaryPressed`                                                    | Token implementado é `--secondary-secondary`                                                          |
| Variáveis de estado       | `primaryDisabled` no conjunto de botões                               | Código usa modificador de opacidade em `primary-primary`, sem variável própria                        |
| `--chart-5`               | Não foi validado um equivalente escuro nesta consulta                 | CSS usa verde no claro e azul no escuro                                                               |

Essas diferenças não autorizam mudanças globais durante a criação de uma tela. Se a tarefa for sincronizar Figma e implementação, trate cada diferença como uma decisão específica e atualize este documento junto da fonte alterada.

## Do's and Don'ts

### Do

- Escreva **Quimia**, sem acento, em títulos, descrições e metadados.
- Use tokens semânticos e as variantes dos componentes
- Preserve ciano nas ações e verde nos papéis previstos
- Alterne painel base e card interno próximo do fundo
- Preserve raios de 42/60 px e controles pill onde já definidos
- Herde Aeonik/OpenDyslexic e a escala do usuário
- Reutilize Header, BasicButton, TextField e composições de dados
- Adapte espaço, quebra e rolagem ao conteúdo
- Mantenha brilhos e assets no contexto em que existem
- Use conteúdo e nomenclatura do produto em português
- Preserve os tokens e os estados relevantes nos dois temas, com foco, texto ampliado e conteúdo longo.

### Don't

- Não fixar hexadecimais nos componentes novos
- Não trocar a ação primária por verde apenas por ser a cor da marca
- Não uniformizar todas as superfícies com uma só cor
- Não aplicar um raio genérico a todos os elementos
- Não adicionar outra família ou travar tamanhos contra a preferência
- Não reconstruir seus estados em cada página
- Não ocultar informação essencial para manter uma altura fixa
- Não espalhar gradientes, brilhos e sombras decorativas pelos dados
- Não levar placeholders ou textos de demonstração do Figma para produção
- Não trate `{colors.on-primary}`, `{colors.on-color}` e `{colors.primary-on-color}` como equivalentes.
- Não transporte tipografia, paleta ou componentes comerciais de outro produto para o Quimia.
- Não imponha tracking negativo ou caixa alta como regra geral; preserve os ajustes locais documentados.
