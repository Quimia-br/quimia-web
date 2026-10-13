# SearchBar

Busca reutilizável que mantém o termo aplicado em `?q=` usando `nuqs`. Precisa estar dentro do Router e do `NuqsAdapter` de React Router v7, além do CSS global. A aplicação já fornece o adapter em `QueryStateLayout`. Referência visual: [SearchBar no Figma, 182:1356](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV/Web-Componentes?node-id=182-1356).

```tsx
import SearchBar from "@/components/SearchBar";

<SearchBar label="Pesquisar produtos" />

<SearchBar
  label="Pesquisar no estoque"
  placeholder="Nome do produto"
  variant="secondary"
  debounceMs={500}
  speechLang="pt-BR"
/>
```

## Props

| Prop | Padrão | Uso |
| --- | --- | --- |
| `label` | `Label` | Nome acessível do campo e da região de busca; também é o placeholder padrão. Defina um nome específico na tela, como “Pesquisar produtos”. |
| `placeholder` | Valor de `label` | Orientação visual quando o campo está vazio. |
| `variant` | `primary` | Superfície `primary` (card) ou `secondary`, correspondente a `theme` do Figma. |
| `debounceMs` | `400` | Intervalo em milissegundos depois da última alteração; zero aplica no próximo timer. |
| `voiceEnabled` | `true` | Habilita a ação de ditado quando o campo está vazio. |
| `speechLang` | `pt-BR` | Idioma enviado ao serviço de reconhecimento do navegador. |
| `disabled` | `false` | Bloqueia edição/ações e interrompe o ditado. Commits pendentes ficam pausados enquanto desabilitado. |
| `id` | Gerado com `useId` | ID do input e base dos IDs de ajuda/erro acessíveis. |
| `className` | Ausente | Classes do contêiner externo; padrão `w-full max-w-[398px]`. |

Não recebe `value`, `defaultValue` ou `onChange` externos: a URL é a fonte do termo aplicado, e o componente mantém apenas um rascunho local enquanto o usuário edita.

## Como a busca funciona

1. Ao montar, lê `q` por `useQueryStates` com `parseAsString.withDefault("")`. Um link como `/products?q=vitamina+C` abre com `vitamina C` no campo. Montar não provoca navegação.
2. A digitação atualiza o campo imediatamente. `useSearchQuery` cria um timer para aplicar o termo; cada alteração cancela o anterior. Com o padrão de 400 ms, digitar várias letras rapidamente produz uma atualização ao parar.
3. A lupa está em um `label htmlFor`, sem botão nem parada de teclado: clicar nela foca o campo e não antecipa a pesquisa. Enter aplica o texto sem esperar o debounce; limpar remove `q` e retorna o foco ao input. Nenhuma dessas ações envia um formulário externo. A escrita da URL ainda passa pelo batching/rate limit padrão do nuqs (normalmente até 50 ms).
4. O setter do nuqs faz a serialização, conserva outros filtros (inclusive repetidos) e remove `q` vazio com `null`. Ao aplicar uma busca diferente, atualiza `q` e remove `p` juntos: a tabela retorna à página 1 sem uma atualização intermediária com a página antiga. Reaplicar o mesmo termo conserva `p`. Espaços nas extremidades são removidos ao aplicar; espaços internos permanecem.
5. Opções `history: "replace"`, `scroll: false`, `clearOnDefault: true`, `shallow: false` preservam caminho/hash e sincronizam a URL com o React Router e seus consumers/loaders. A digitação não acrescenta uma entrada ao histórico por pesquisa. Voltar retorna à página/entrada anterior.
6. Uma navegação externa assume o valor da nova URL e descarta o rascunho/timer anterior. Desmontar cancela timers. Durante composição de texto por IME, aguarda `compositionend` antes de aplicar.

Exemplo: `/products?tag=suplemento&sort=name#results` passa a `/products?tag=suplemento&sort=name&q=creatina#results`.

O debounce do rascunho é um timer nativo com limpeza no efeito, antes de chamar o setter do nuqs. Isso mantém outros `useQueryState("q")` consumidores no termo já aplicado, permite cancelar uma composição/navegação/ditado e evita requisições por letra em uma listagem com TanStack Query. Não se combina um segundo debounce do nuqs com esse timer. `useDeferredValue` não garante esse intervalo. Veja as [opções do nuqs](https://nuqs.dev/docs/options).

Para usar fora da árvore de rotas atual, monte o adapter **dentro** do Router:

```tsx
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { Outlet } from "react-router-dom";

function RootLayout() {
  return <NuqsAdapter><Outlet /></NuqsAdapter>;
}
```

## Consumir o termo na tela

O componente altera a URL; a tela decide como obter/exibir resultados. A tela atual de Produtos ainda não tem uma listagem conectada à API nem SearchBar montada; adicione-a onde a busca fizer sentido. Não foi criado um endpoint de produtos.

Exemplo de filtro local com dados fornecidos pela tela:

```tsx
import { parseAsString, useQueryState } from "nuqs";
import SearchBar from "@/components/SearchBar";

function ProductsList({ items }: { items: { id: number; nome: string }[] }) {
  const [q] = useQueryState("q", parseAsString.withDefault(""));
  const normalized = q.toLocaleLowerCase("pt-BR");
  const visible = items.filter((item) =>
    item.nome.toLocaleLowerCase("pt-BR").includes(normalized),
  );

  return (
    <>
      <SearchBar label="Pesquisar produtos" />
      <p role="status">{visible.length} produtos encontrados</p>
      <ul>{visible.map((item) => <li key={item.id}>{item.nome}</li>)}</ul>
    </>
  );
}
```

Para uma listagem remota com TanStack Query, inclua `q` na `queryKey`, passe o termo ao serviço conforme o contrato real da API e encaminhe o `signal` para cancelar requisições obsoletas. Não conecte uma segunda busca a cada `onChange`: consuma o termo já aplicado da URL.

## Ditado por voz

`useSpeechInput` usa a [Web Speech API / SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), incluindo a implementação prefixada `webkitSpeechRecognition` quando presente. Cada SearchBar possui sua própria sessão; não há reconhecimento global compartilhado.

- O microfone só inicia depois de um clique explícito. Configura idioma, uma sessão de fala (`continuous=false`), prévias (`interimResults=true`) e uma alternativa.
- A prévia aparece no campo, mas não atualiza a URL. Os resultados são reconstruídos a partir da lista completa para evitar palavras duplicadas quando o navegador revisa uma hipótese. Somente a transcrição final entra no mesmo debounce da digitação.
- Durante a sessão, o controle passa a “Parar ditado”, com fundo suave e ícone verdes. `LoaderCircle` indica início/finalização; `Mic` indica escuta; `AudioLines` aparece durante fala detectada, com as linhas animadas em loop. Os eventos `speechstart`/`speechend` controlam o estado; não há medição de volume nem acesso adicional ao áudio. A animação termina ao parar, cancelar ou encerrar a sessão e respeita `prefers-reduced-motion`. Não há texto de instrução/status visível nem mudança de altura da barra. Estados continuam anunciados via `sr-only` para leitores de tela.
- Enter aceita explicitamente o texto visível, inclusive uma prévia, e encerra o ditado. Escape descarta a prévia. Digitar manualmente cancela a sessão para evitar sobrescrita por eventos atrasados.
- Navegar, desabilitar, remover a ação de voz, alterar o idioma ou desmontar libera o microfone e ignora callbacks da sessão anterior.
- Permissão negada, microfone indisponível, ausência de fala e falha de rede são indicados por `CircleAlert` na cor de erro no controle de voz, com detalhe no tooltip e anúncio acessível, sem um parágrafo visível. A busca digitada permanece disponível. Em navegador sem suporte, o botão fica desabilitado com explicação acessível. Use `voiceEnabled={false}` para ocultá-lo.

A disponibilidade da API não garante que o serviço de reconhecimento esteja operacional. O suporte é limitado; dependendo do navegador, o áudio pode ser enviado ao serviço de transcrição do fornecedor e exigir conexão. Este componente não grava nem envia áudio para a API do projeto e não promete transcrição local/offline. Veja as [limitações documentadas pela MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

## Bibliotecas consideradas

- [use-debounce](https://github.com/xnimorz/use-debounce): fornece callbacks com cancelamento, flush e maxWait. Útil se esses contratos forem necessários em vários componentes. Aqui o timer fica próximo da lógica de rota e tem cancelamento nos testes.
- [react-speech-recognition](https://github.com/JamesBrill/react-speech-recognition): oferece hooks e suporte a polyfills; também usa Web Speech API por padrão. A biblioteca sozinha não resolve a ausência de suporte nativo. Um polyfill/serviço pode ampliar cobertura, exigindo integração, credenciais e decisões sobre processamento de áudio.

`nuqs` 2.10.1 foi adicionado a pedido do usuário. Foram reutilizados React, React Router, InputGroup/Button e Lucide. `SpeechInputIcon` concentra ícones e animação de voz, compartilhados com SendMessage, assim como o hook de reconhecimento. O keyframe e `--animate-audio-wave` ficam no `@theme` de `src/index.css`, conforme Tailwind v4; não há CSS específico do componente. A aplicação do texto e os controles permanecem próprios de cada componente. Veja [ditado compartilhado](speech-input.md).

## Figma e testes

Mantidos: raio de 60 px, largura de exemplo de 398 px, Aeonik Medium de 18 px, ícones de 24 px, superfícies primary/secondary e foco verde. O protótipo tem 70 px de altura; o componente usa 64 px (`h-16`), conforme ajuste do usuário preservado nesta revisão. `filled` e `focus` são estados reais do valor/foco. Vazio mostra microfone; preenchido mostra limpar. A sessão ativa e os erros acrescentam comportamento não descrito nos oito estados estáticos do Figma. Os controles têm alvo de 40 px em volta dos ícones de 24 px.

Os 36 testes adjacentes usam **createBrowserRouter e NuqsAdapter reais**, timers e primitives reais. O clock de performance permanece monotônico para o rate limiter global do nuqs. Apenas o reconhecimento de voz é simulado, pois JSDOM não tem microfone/serviço. Cobrem URL inicial, debounce, outro consumidor nuqs, Enter/limpeza, foco pela lupa, encoding sem parâmetros acidentais, filtros repetidos/hash, histórico, navegação/desmontagem, IME, StrictMode, suporte nativo/prefixado, prévia/final, resultados revisados, detecção/início/fim de fala, feedback sem textos visíveis, parar/cancelar, erros, retry e liberação da sessão.

```powershell
pnpm test src/components/SearchBar.test.tsx --pool=threads --maxWorkers=1
```

Os testes de DOM não comprovam a qualidade da transcrição nem a permissão real do sistema. Conferir o ditado manualmente em um navegador compatível, com microfone e permissão disponíveis, continua necessário para essa parte da integração.
