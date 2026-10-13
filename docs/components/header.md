# Header

Cabeçalho básico reutilizável com `MainTitle` e `ThemeToogle`. A simplificação do usuário removeu os slots de busca/ações; SearchBar deve ser composta separadamente na tela.

```tsx
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";

<Header title="Produtos" description="Gerencie seu catálogo" />
<SearchBar label="Pesquisar produtos" />
```

| Prop | Uso |
| --- | --- |
| `title` | Título obrigatório via MainTitle. |
| `description` | Descrição opcional. |
| `className` | Classes do header externo. |
| Props nativas de `header` | `id`, `aria-label`, eventos e outros atributos; `title` é reservado ao título e `children` não é exposto. |

Precisa do ThemeProvider global da aplicação por conter ThemeToogle; Header sozinho não exige Router. SearchBar precisa do Router e do NuqsAdapter. Home, Produtos, Estatísticas e Perfil já usam Header. O controle usa o tema efetivo exposto pelo provider e acompanha mudanças do sistema enquanto a preferência é `system`; veja [estado de Produtos](products-state.md).

Título e controle ficam em coluna no mobile e em linha a partir de `lg`. Use um título principal por tela. Dentro de `main`, `header` pertence àquela seção. Não foi identificado um componente isolado Header no Figma: esta composição reutiliza MainTitle e o controle existente de tema.

Quatro testes adjacentes verificam título/descrição, controle de tema sem busca implícita, alternância por clique/teclado e atributos nativos/classes, com ThemeProvider real.

```powershell
pnpm test src/components/Header.test.tsx --pool=threads --maxWorkers=1
```
