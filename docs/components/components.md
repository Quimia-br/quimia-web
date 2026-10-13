# Componentes do web

Revisão dos componentes implementados diretamente em `src/components/`, com referências ao [Figma do projeto](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV/Web-Componentes?node-id=0-1). O arquivo de design permanece intacto.

## Uso e cobertura

Os componentes e composições listados abaixo têm cobertura em testes adjacentes; Chip e ChipAction são cobertos juntos por `Chip.test.tsx`, e ChipFilters por `ChipFilters.test.tsx`. Os guias explicam props, exemplos, providers necessários, comportamento e diferenças encontradas no Figma. Header é uma composição das telas; SpeechInputIcon é um helper visual extraído da busca e do chat; os demais são componentes do design do projeto.

| Guia | Componentes | Comportamentos cobertos |
| --- | --- | --- |
| [Botões](buttons.md) | BasicButton | Ícone decorativo, variantes, teclado, submit explícito, disabled e ref. Centralização conferida no navegador. |
| [Filtros](chip.md) | FilterButton | Nome acessível padrão/customizado, clique e teclado, disabled, atributos controlados de expansão e segurança em formulários. |
| [Gráficos](chart.md) | Chart, ChartSkeleton | Conteúdo interativo, título e descrição acessíveis, ícone/legenda opcionais, ref e carregamento independente. |
| [Mensagens](ballon-message.md) | BallonMessage | Conteúdo literal, horário opcional, alinhamento, variante explícita, quebras de linha e props nativas. |
| [Apresentação](components-display.md) | Card, CardHeader, FeedbackItem, Logo, MainTitle | Composição, conteúdo opcional, variantes, acessibilidade dos ícones e atualização do conteúdo. |
| [Formulários](components-forms.md) | ActionInput, TextField, FormTextField, LoginForm, SignupForm | Limpeza, senha, validação, descrições acessíveis, FormData, submissão, erros, rascunhos e navegação. |
| [Imagens](image-components.md) | ImageContainer, ImageEditor | Seleção, arquivos/URLs, cancelamento, confirmação, erros, grid, bloqueios e liberação de prévias. |
| [Navegação](components-navigation.md) | ShapeIcon, Menu, ProfileContainer, LinkButton, ThemeToogle | Rotas ativas, teclado, carregamento/erro de perfil, nome acessível e alternância de tema. |
| [Busca](search-bar.md) | SearchBar | URL `q`, debounce, Enter/limpeza, histórico, composição, ditado e recuperação de erros. |
| [Chip e grupos de filtros](chip.md) | Chip, ChipAction, ChipFilters, ProductSearchFields | Seleção múltipla genérica, URL `fields` na composição de Produtos, limpeza, teclado e histórico. |
| [Entrada do chat](send-message.md) | SendMessage | Envio assíncrono, rascunho, multiline/IME, ditado, erros e geração/parar. |
| [Cabeçalho](header.md) | Header | Título/descrição, controle de tema por clique/teclado e atributos nativos. |
| [Estado de Produtos](products-state.md) | ThemeToogle, DataDisplayToggle e providers | Escopos, padrões, persistência e resolução do tema do sistema. |
| [Paginação](page-indicator.md) | PageIndicator | URL `p` via nuqs, clique/teclado, histórico, limites da API, todas as páginas e proporções flex animadas. |
| [Notificações](toast.md) | Toast | Posição pela tela, isolamento, fechamento/tempo, atualização, anúncios, ação e Promise. |
| [Ditado compartilhado](speech-input.md) | SpeechInputIcon | Estados de fala, espera, erro e retorno ao repouso. |

A revisão de preferências de Produtos em 12/10/2026 terminou com 268 testes passando em 33 arquivos, incluindo 20 casos focados de ThemeToogle, Header, DataDisplayToggle e seus providers. Lint dos alterados, build e integração no Chrome (1280/375 px) passaram. Tema `system` acompanha o sistema via `useSyncExternalStore`; preferência inválida/bloqueio de storage têm fallback seguro; os dois hooks exigem provider. Tema permanece global, exibição/Toast permanecem locais a Produtos. Detalhes e limites no [guia de estado de Produtos](products-state.md).

Não foram criados ou alterados testes de `ui/`, `smoothui/` ou `evilcharts/`. Esses primitives são utilizados pelos componentes nos testes, sem serem substituídos por mocks. A suíte completa também executa testes que já existiam fora deste escopo.

## Correções de lógica

- `BallonMessage`: balão enviado encosta no fim do contêiner; horário acompanha o alinhamento; cantos e cores padrão seguem as duas variantes do Figma. Texto longo cabe no balão e conserva quebras de linha.
- `ActionInput`: limpar um valor não controlado também notifica `onChange` com o valor vazio.
- `TextField`: as opções `hide*` escondem textos visualmente sem removê-los da leitura assistiva.
- `FormTextField`: encaminha `name` ao input, respeita ID personalizado, combina descrições externas e internas e evita referência à descrição inexistente.
- `SignupForm`: senha de cadastro usa `autoComplete="new-password"`.
- `ShapeIcon`: aceita a função de `className` do router sem descartá-la.
- `ProfileContainer`: o link tem nome acessível também enquanto carrega ou quando a consulta falha.
- `ThemeToogle`: o nome descreve a ação disponível, e o tema `system` considera a preferência do navegador ao alternar.
- `Logo`: o desenho decorativo não acrescenta conteúdo ao nome acessível dos elementos que o contêm.

Diferenças de dimensões, tipografia, labels e opções ainda não implementadas estão detalhadas nos guias. Esta revisão funcional preserva o restante do layout existente. Em particular, `MainTitle`, campos, navegação e alguns tamanhos de feedback ainda têm diferenças visuais em relação ao Figma.

## Último componente implementado

[Chart e ChartSkeleton](chart.md): card genérico para conteúdo de evilcharts e componente independente de carregamento. Incluem testes adjacentes, documentação de composição, acessibilidade e props. O arquivo Chart, que estava vazio, foi concluído neste pedido.

## Executar e interpretar os testes

```powershell
# Toda a suíte, com execução serial para máquinas sob carga.
pnpm test --pool=threads --maxWorkers=1 --testTimeout=15000

# Somente um componente.
pnpm test src/components/BallonMessage.test.tsx

# Build de produção e lint dos arquivos diretamente na pasta.
pnpm build
node ./node_modules/eslint/bin/eslint.js "src/components/*.tsx"
```

Vitest e Testing Library verificam comportamento observável no DOM, acessibilidade estrutural e integração com providers reais. Requisições externas e operações sem implementação no JSDOM (carregamento de imagens, Cropper/canvas e URLs locais) são simuladas na fronteira apropriada. O helper de exportação da imagem tem testes próprios em `src/lib/utils/getCroppedImg.test.ts`.

O JSDOM não calcula layout: testes de classes não comprovam centralização ou fidelidade visual. `BallonMessage` e `BasicButton` foram conferidos no Chrome com CSS real, larguras de 900 e 375 px e temas claro/escuro. A conferência verificou cantos, posição do balão/horário, quebra de texto, ausência de overflow e centro do rótulo do botão. Os demais guias distinguem comparação de código/Figma de itens que ainda precisam de revisão visual no navegador.

## Resultado da revisão inicial — 10/10/2026

- Suíte completa: 160 testes passaram em 24 arquivos; 133 casos pertencem aos 19 componentes desta revisão.
- Lint dos arquivos diretamente em `src/components/*.tsx`: passou.
- `pnpm build`: passou; permanece o aviso de bundle principal acima de 500 kB (aproximadamente 804 kB minificado).
- Detector de UI nos nove componentes corrigidos: sem achados.
- React Doctor antes/depois em `--scope changed`: 51/100 e os mesmos 32 diagnósticos listados nesse escopo, em `evilcharts/`, `smoothui/`, `use-mobile` e `use-register`. Esse comando retorna código 1 devido aos diagnósticos existentes. O escopo baseado no Git não inclui todos os arquivos novos ainda não rastreados; ver a conferência seguinte abaixo.

Esses resultados registram a execução daquela revisão; devem ser refeitos após novas alterações.

## SearchBar, SendMessage e Header — 11/10/2026

- Suíte completa: 212 testes passaram em 27 arquivos. Após os últimos ajustes, os 52 testes dos três componentes passaram novamente: SearchBar 34, SendMessage 14 e Header 4.
- Lint dos dez arquivos envolvidos: passou. Build de produção com TypeScript/Vite: passou; permanece o aviso de bundle principal acima de 500 kB (aproximadamente 817 kB minificado).
- Chrome com CSS real, larguras de 1280 e 375 px, temas claro/escuro: sem erros de JavaScript ou overflow horizontal. Conferidos foco pela lupa, sincronização de `q` via nuqs, debounce, filtros/hash, envio/erro/parar, crescimento do textarea até 160 px e animação com redução de movimento.
- Voz simulada na fronteira do serviço nativo; microfone físico, permissão do sistema e qualidade de transcrição não foram verificados.
- React Doctor completo, antes dos últimos ajustes: 42/100, 43 diagnósticos. Corrigidos o retorno dentro de `try/finally` em `use-message-draft` e a ausência de ErrorBoundary na nova rota raiz. Os alertas de complexidade em SearchBar/SendMessage e os diagnósticos anteriores não foram suprimidos. A tentativa de repetir a varredura ficou indisponível por falha do launcher global do npx e acesso de rede negado ao registry; não há pontuação final confirmada.

Os guias dos componentes documentam os contratos e limites da integração. O adapter nuqs foi instalado na raiz das rotas; SendMessage depende de `onSend`/`onStop` fornecidos pela tela para conversar com a API real.

## SendMessage com Lina — 11/10/2026

- Reutilizado o ScrollArea Lina já instalado, conferido pelo diff do registry oficial. Texto e ações têm áreas independentes; enviar e microfone compartilham a base vertical.
- 212 testes passaram em 27 arquivos, incluindo os 14 casos de SendMessage com Lina e shadcn reais. APIs de medição/ponteiro ausentes no JSDOM são simuladas somente na fronteira.
- Lint dos dois arquivos alterados, TypeScript e build: passaram. Detector de UI: sem achados. Permanece o aviso de bundle principal acima de 500 kB (aproximadamente 862 kB minificado no estado atual do projeto).
- Chrome em 1280 px e contexto de toque de 375 px, com temas claro/escuro: conferidos limite do viewport de 160 px, alinhamento inferior dos botões, wheel, cursor durante digitação, limpeza, envio e texto sem espaços; sem overflow horizontal ou erros de JavaScript. Detalhes e referências Mobbin no [guia SendMessage](send-message.md).
- React Doctor `--scope changed`: 52/100, os mesmos 32 diagnósticos anteriores em `evilcharts/`, `smoothui/`, `use-mobile` e `use-register`; retorna código 1 por esses achados. Esse escopo do Git não inclui SendMessage ainda não rastreado; sua conferência direta foi feita por lint, build, testes e navegador.

## PageIndicator e alinhamento do SendMessage — 11/10/2026

- PageIndicator implementado com nuqs em `p`, padrão 1 e barras clicáveis. Recebe `totalPages` da tela/API, exibe no máximo cinco páginas próximas e corrige páginas inválidas/fora do total conhecido sem adicionar histórico.
- SearchBar atualiza a busca e retorna à primeira página em uma única alteração da URL. Reaplicar uma busca igual conserva a seleção.
- SendMessage mantém as ações na base e alinha seus centros com `items-center`; preservados altura inicial de 64 px e botão enviar de 40 px ajustados no projeto.
- Suíte completa: **236 testes passaram em 28 arquivos**, incluindo PageIndicator 22, SearchBar 36 e SendMessage 14. Lint dos seis arquivos envolvidos e build de produção passaram; permanece o aviso do bundle principal acima de 500 kB (aproximadamente 862 kB minificado).
- Chrome com CSS real, temas claro/escuro, 1280 e 375 px: conferidos variantes de duas a cinco páginas, total de 1000, histórico, filtros/hash e reset pela busca. Confirmado alinhamento dos centros dos controles do SendMessage, inclusive em multiline e contexto de toque. Sem erros de JavaScript ou overflow horizontal. Detector de UI nos dois componentes: sem achados.
- React Doctor `--scope changed`: 52/100, os mesmos 32 diagnósticos anteriores; código 1 por esses achados. O escopo do Git não inclui todos os arquivos novos, conferidos diretamente por testes, lint, build e navegador. O endpoint futuro de paginação não foi conectado: contrato e rota ainda não foram fornecidos.

Uso e decisões visuais no [guia PageIndicator](page-indicator.md), [SearchBar](search-bar.md) e [SendMessage](send-message.md).

## PageIndicator fluido com Motion — 11/10/2026

- Removidos o limite de cinco páginas, a largura mínima/fixa e os estilos de hover do Button. Todas as páginas dividem a largura disponível com flex; a atual recebe três partes para cada parte das demais. O intervalo se adapta ao espaço quando o total aumenta.
- Botões HTML transparentes preservam a navegação por nuqs e o teclado. O foco altera a cor da própria barra. Motion anima a proporção por 240 ms, sem animação de entrada; movimento reduzido aplica a mudança imediatamente.
- Conferência no Chrome em 1280 e 375 px, temas claro/escuro: hover transparente, foco da barra, proporção 3:1, quadros intermediários da animação, movimento reduzido, histórico e busca. Testado também total de 1000 sem limitar páginas nem causar overflow horizontal.
- Testes finais de PageIndicator e SearchBar: 58 passaram. A repetição sob carga paralela teve um timeout no histórico do JSDOM; a execução serial isolada passou, assim como Back/Forward no Chrome real.
- Lint, TypeScript e build passaram; continua o aviso de bundle acima de 500 kB. Detector de UI: sem achados. React Doctor no escopo alterado manteve 52/100 e os 32 diagnósticos anteriores; esse escopo ainda não inclui todos os arquivos novos.

O [guia PageIndicator](page-indicator.md) descreve a implementação atual; o registro anterior documenta a versão inicial.

## Toast e feedback de voz compartilhado — 11/10/2026

- Toast usa primitives Base UI já instalados, com visual do Figma e provider/viewport local à tela. Guias mostram as posições de Produtos e Perfil; as páginas atuais ainda têm somente Header e não foram conectadas a operações de API.
- Extraído `SpeechInputIcon` do feedback idêntico de SearchBar e SendMessage. `useSpeechInput` já era compartilhado; aplicação do texto permanece específica de cada componente. A animação global `audio-wave` permanece no `@theme` do Tailwind.
- Suíte completa: **256 testes passaram em 30 arquivos**, incluindo Toast 13 e SpeechInputIcon 7. Os 13 casos de Toast passaram novamente após ajuste de tipagem do teste. Lint dos sete arquivos envolvidos e build TypeScript/Vite passaram; permanece o aviso de bundle principal acima de 500 kB (aproximadamente 816 kB minificado no estado atual do projeto).
- Chrome com CSS real, 1280 e 375 px, temas claro/escuro: conferidos alinhamentos no layout, círculo de 42 px, fechar de 24 px, título de 20 px, alturas desktop de 74/81 px e quebra no celular sem overflow. Animação de voz vem do componente compartilhado.
- Conferência funcional no Chrome: F6, fechamento por teclado, pausa/retomada do timeout por hover e foco por teclado, loading atualizado na mesma mensagem e movimento reduzido. Sem erros de JavaScript. Microfone físico não foi utilizado.
- Detector de UI: sem achados. React Doctor `--scope changed`: 52/100, mesmos 32 diagnósticos anteriores e código 1 por esses achados. O escopo baseado no Git não inclui os novos arquivos ainda não rastreados; eles foram conferidos diretamente por lint, build, testes e navegador.

Contratos e exemplos no [guia Toast](toast.md) e no [guia de ditado compartilhado](speech-input.md).
