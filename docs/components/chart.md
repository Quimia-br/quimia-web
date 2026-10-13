# Chart e ChartSkeleton

`Chart` é o card de apresentação de um gráfico. Recebe título, descrição e conteúdo por `children`, sem importar evilcharts, buscar dados ou decidir qual gráfico renderizar. `ChartSkeleton` é um componente separado para carregamento: não é uma variante nem uma prop `loading` do Chart. Ambos reutilizam apenas as classes do frame em `src/lib/chart-card-styles.ts`.

## Composição com evilcharts

```tsx
import Chart from "@/components/Chart";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";
import { EChartsLineChart } from "@/components/evilcharts/charts/echarts-line-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";

const config = {
  vendas: {
    label: "Vendas",
    colors: {
      light: ["var(--brand-accent)"],
      dark: ["var(--brand-accent)"],
    },
  },
} satisfies ChartConfig;

type Row = { mes: string; vendas: number };

function SalesCard({ data, isPending }: { data: Row[]; isPending: boolean }) {
  if (isPending) return <ChartSkeleton label="Carregando vendas" />;

  return (
    <Chart
      title="Vendas"
      description="Evolução mensal dos pedidos"
      captionTitle="Pedidos concluídos"
      captionDescription="Valores referentes ao período selecionado"
      contentClassName="h-64"
    >
      <EChartsLineChart data={data} config={config} className="h-full w-full">
        <EChartsLineChart.Line dataKey="vendas" />
        <EChartsLineChart.XAxis dataKey="mes" />
        <EChartsLineChart.YAxis />
        <EChartsLineChart.Tooltip />
      </EChartsLineChart>
    </Chart>
  );
}
```

Use `className="h-full w-full"` no evilchart: seu motor precisa de uma área com altura definida. `contentClassName` controla a altura dessa área, com padrão de 207 px. A largura do card é fluida e vem do layout da tela; não é fixa em 350 px. Por exemplo, uma grade pode usar `grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3`.

EChartsBarChart e EChartsPieChart podem ocupar o mesmo slot; use a API declarativa específica de cada um. Um indicador numérico também pode ser passado por `children`. A configuração, seleção de séries, legenda e tooltip pertencem ao evilchart. O carregamento inicial pertence à tela, que escolhe `ChartSkeleton`. Nenhum estado, provider, store ou endpoint novo é necessário para o card. Erros e dados vazios também devem receber uma apresentação apropriada na tela, sem exibir uma série fictícia.

## Props de Chart

| Prop | Uso / padrão |
| --- | --- |
| `title` | Texto obrigatório do título e nome acessível do card. |
| `description` | Descrição opcional ligada por `aria-describedby`. |
| `children` | Gráfico ou conteúdo obrigatório, preservando a interatividade. |
| `icon` | Ícone Lucide opcional; não é exibido por padrão. Também aceita `false`. |
| `headingLevel` | Nível semântico do título, de 2 a 6; padrão 2. |
| `captionTitle`, `captionDescription` | Textos opcionais da legenda inferior. Sem ambos, não há footer. |
| `contentClassName` | Classes da área do gráfico; padrão `h-[207px]`. |
| `className`, atributos de `article`, `ref` | Layout, atributos nativos e referência do card. |

O card usa `article`, título semântico e IDs únicos. Não usa `role="img"` em volta dos controles do gráfico, para manter os botões acessíveis. O ícone é decorativo. Forneça uma descrição da tendência ou uma tabela acessível quando os valores precisarem ser consultados sem visualizar o gráfico.

## Props de ChartSkeleton

| Prop | Uso / padrão |
| --- | --- |
| `label` | Nome acessível do carregamento; padrão “Carregando gráfico”. |
| `showCaption` | Exibe o placeholder inferior; padrão `true`. |
| `contentClassName` | Classes do placeholder central; padrão `h-[229px]`. |
| `className`, atributos de `div`, `ref` | Layout e referência do estado de carregamento. |

O skeleton compõe o primitivo já instalado em `ui/skeleton`, com um status acessível, `aria-busy`, placeholders decorativos e animação desativada quando o usuário prefere movimento reduzido. O componente não depende de Chart nem de evilcharts.

## Referências visuais

[Barras, nó 384:1358](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=384-1358), [linha, nó 392:1604](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=392-1604), [indicador numérico, nó 400:1824](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=400-1824) e [skeleton, nó 451:2738](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=451-2738).

Frame com `surface-background`, padding 32 px, raio 42 px e gap 21 px. Título 20 px, descrição 14 px, ícone 24 px; legenda 16/12 px com gap 8 px. O exemplo de barras do Figma tem altura 391 px. Para a linha, use `contentClassName="h-[124px]"`; para o indicador numérico, `h-[117px]`. O skeleton tem altura 457 px, com placeholders 61/229/61 px e raio 24 px. Essas alturas são diferentes no próprio protótipo; se a tela exigir altura constante durante a troca, reserve espaço no layout ou ajuste os slots em ambos os componentes. O traçado do gráfico é dinâmico via evilcharts, sem imagens estáticas do protótipo.

## Verificação

```powershell
node ./node_modules/vitest/vitest.mjs run src/components/Chart.test.tsx src/components/ChartSkeleton.test.tsx --pool=threads --maxWorkers=1 --testTimeout=15000
```

Os seis testes focados passaram: semântica, IDs únicos, interatividade, props/ref, ícone e legenda opcionais, carregamento independente e redução de movimento. Lint dos cinco arquivos alterados e build passaram. No Chrome real, conferidos claro/escuro em 1280 e 375 px: card de referência 350×391, linha com slot reduzido 350×308, skeleton 350×457, título 20 px, ícone configurado 24 px, gráfico evilcharts montado em SVG, controles interativos e ausência de overflow ou erros; movimento reduzido desativa a animação do skeleton.

Na preparação da PR, os testes de filtros foram ajustados à limpeza opcional atual, sem restaurar o botão na composição de Produtos. Os componentes e testes do skeleton ficam em src/components/skeletons/. Não foram criados testes dentro de ui/, smoothui/ ou evilcharts/.
