# Componentes do web

Guia dos componentes implementados diretamente em `src/components/`, com referências ao [Figma do projeto](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV/Web-Componentes?node-id=0-1). O arquivo de design permanece intacto.

## Guias de uso

| Guia | Componentes e composições |
| --- | --- |
| [Botões](buttons.md) | BasicButton |
| [Apresentação](components-display.md) | Card, CardHeader, FeedbackItem, Logo e MainTitle |
| [Formulários](components-forms.md) | ActionInput, TextField, FormTextField, LoginForm e SignupForm |
| [Navegação](components-navigation.md) | ShapeIcon, Menu, ProfileContainer, LinkButton e ThemeToogle |
| [Cabeçalho](header.md) | Header |
| [Imagens](image-components.md) | ImageContainer e ImageEditor |
| [Busca](search-bar.md) | SearchBar |
| [Filtros](chip.md) | Chip, ChipAction, ChipFilters, ProductSearchFields e FilterButton |
| [Paginação](page-indicator.md) | PageIndicator |
| [Mensagens](ballon-message.md) | BallonMessage |
| [Entrada do chat](send-message.md) | SendMessage |
| [Notificações](toast.md) | Toast |
| [Ditado compartilhado](speech-input.md) | SpeechInputIcon |
| [Gráficos](chart.md) | Chart e ChartSkeleton |
| [Estado de Produtos](products-state.md) | ThemeToogle, DataDisplayToggle e providers |

Cada guia descreve as props, os providers necessários, exemplos de composição, comportamento acessível e limites conhecidos. Os componentes de `ui/`, `smoothui/` e `evilcharts/` são primitives internos usados por essas APIs.

## Estado compartilhado e URL

- `SearchBar` mantém a busca em `q` com nuqs.
- `PageIndicator` mantém a página em `p`, com padrão 1.
- `ProductSearchFields` mantém os campos selecionados em `fields`.
- Tema é global; preferência de exibição e Toast pertencem ao escopo da tela de Produtos.
- `SpeechInputIcon` e `useSpeechInput` compartilham o feedback de voz usado por SearchBar e SendMessage.

## Executar os testes

```powershell
# Toda a suíte, em série para reduzir interferência entre testes de interface.
pnpm test --pool=threads --maxWorkers=1 --testTimeout=15000

# Um componente específico.
pnpm test src/components/BallonMessage.test.tsx

# Tipos, build e lint.
pnpm build
pnpm lint
```

Vitest e Testing Library verificam comportamento observável, navegação por teclado, semântica e integração com providers. O JSDOM não calcula layout; detalhes visuais e responsivos devem ser conferidos em navegador.
