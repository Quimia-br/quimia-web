# SendMessage

Entrada de texto para chat com IA, baseada no [SendMessage do Figma, 402:603](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV/Web-Componentes?node-id=402-603). Reutiliza o [InputGroup do shadcn](https://ui.shadcn.com/docs/components/base/input-group), `InputGroupTextarea`, `InputGroupAddon`, `InputGroupButton` e `Field`. Não exige Router, nuqs, instalação adicional ou um SDK de IA.

```tsx
import SendMessage from "@/components/SendMessage";

<SendMessage
  onSend={async (message) => {
    // Use o serviço real. Rejeite em caso de falha para preservar o rascunho.
    await chatService.send(message);
  }}
  colorScheme="primary"
/>
```

`chatService` é ilustrativo: implemente o serviço com o contrato real da API. O componente não conecta um endpoint fictício, não inclui credenciais e não fornece respostas de IA.

## Props

| Prop | Padrão / contrato |
| --- | --- |
| `onSend` | Obrigatório: `(message: string) => void \| Promise<void>`. Recebe texto com espaços externos removidos; quebras internas permanecem. |
| `value` + `onValueChange` | Rascunho controlado. Não combine com `defaultValue`. |
| `defaultValue` | `""`; rascunho inicial não controlado. |
| `onValueChange` | Opcional no modo não controlado; recebe `""` ao limpar após envio bem-sucedido. |
| `colorScheme` | `secondary`; também aceita `primary`, como no Figma. |
| `isGenerating` | `false`; resposta da IA em geração, bloqueando novos envios. |
| `onStop` | Opcional; com `isGenerating`, substitui enviar por parar. Deve interromper a operação real na integração. |
| `disabled` | `false`; bloqueia edição e controles, incluindo parar. |
| `voiceEnabled` | `true`; oculta o microfone com `false`. |
| `speechLang` | `pt-BR`; idioma do ditado. |
| `label` / `placeholder` | `Mensagem` / `Escreva uma mensagem`. |
| `maxLength` | Sem limite arbitrário por padrão. Defina conforme API; texto ditado acima do limite fica visível, inválido e não pode ser enviado. |
| `id` / `className` | ID automático e classes externas; largura padrão `w-full max-w-[424px]`. |

## Envio, rascunho e geração

- Enter envia; Shift+Enter cria linha. IME aguarda confirmação, inclusive `keyCode=229`. Botões têm `type="button"`, sem enviar um formulário externo.
- Mensagens vazias/whitespace não são enviadas. Um lock síncrono impede dupla submissão por clique/Enter antes mesmo da renderização do estado pendente.
- Durante a Promise de `onSend`, textarea somente leitura, indicador de envio e rascunho preservado. Sucesso limpa e retorna o foco; erro mantém texto e mostra mensagem recuperável, sem expor detalhes internos do serviço.
- Durante `isGenerating`, aparece parar se `onStop` existir; caso contrário, espera desabilitada. Enter não dispara parar. Parar continua disponível mesmo se a Promise de `onSend` durar toda a resposta.
- A próxima mensagem pode ser preparada durante geração depois de `onSend` resolver. Se sua Promise durar todo o streaming, o campo fica somente leitura até ela encerrar. Para liberar o rascunho imediatamente, separe a aceitação/envio da mensagem do streaming no serviço.
- Um novo `value` controlado recebido enquanto o envio anterior estava pendente é preservado. Desmontar impede callbacks tardios de limpeza; a integração continua responsável por abortar rede/requisições.
- Ao alternar conversas, use `key={conversation.id}` para criar uma entrada independente, limpar o estado interno e liberar o ditado da conversa anterior. Rascunhos persistidos por conversa devem ficar no estado da tela.

Modo controlado:

```tsx
const [draft, setDraft] = useState("");

<SendMessage
  value={draft}
  onValueChange={setDraft}
  onSend={(text) => chat.send(text)}
  isGenerating={chat.isGenerating}
  onStop={() => chat.abort()}
/>
```

## Ditado e aparência

O microfone adiciona ditado ao rascunho. Prévia não envia nada; o resultado final confirma o rascunho. Enviar aceita explicitamente o texto visível. Escape descarta prévia; editar cancela a sessão e ignora resultados atrasados. Suporte/permissão usam o mesmo `useSpeechInput` de SearchBar.

`AudioLines` anima durante fala detectada; Mic representa escuta, LoaderCircle início/finalização e CircleAlert erro. Feedback de voz é visual, com anúncio `sr-only` acessível. A animação usa Tailwind e respeita redução de movimento. A Web Speech API tem [suporte limitado](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition); não é gravação nem mensagem de áudio enviada à IA.

Dimensões atuais: largura máxima de 424 px e altura inicial de 64 px, padding horizontal 16 px/vertical 12 px, Aeonik Medium 14 px, microfone 24 px, enviar 20 px em botão circular 40 px e intervalo de 12 px entre controles. Os ajustes de altura e botão feitos no projeto foram preservados; o Figma original usa 66 e 42 px. Superfícies usam tokens; ícones são Lucide. Raio 33 px preserva a cápsula inicial.

## Scroll com Lina e posição das ações

O componente reutiliza o [ScrollArea Lina](https://lina.sameer.sh/) instalado em `ui/scroll-area.tsx`. A comparação pelo CLI com `https://lina.sameer.sh/r/lina-radix.json` confirmou a mesma implementação, com imports locais e um ajuste de foco na versão publicada. Não houve reinstalação nem sobrescrita de `ui/`.

- O textarea cresce com `field-sizing-content`; quem limita a área visível a 160 px e rola é o viewport do Lina. O textarea não tem scroll independente nesse modo.
- Desktop utiliza a scrollbar Radix do Lina; dispositivos com ponteiro de toque primário usam overflow nativo. Não há interceptação de wheel nem animação artificial da rolagem.
- As máscaras de 8 px indicam conteúdo além das bordas. Usam a superfície da variante (`card` ou `secondary`) para funcionar nos temas claro/escuro.
- Microfone e enviar ficam fora do viewport, em um grupo com `self-end` e `items-center`. O grupo permanece na base, com o botão enviar a 12 px da borda inferior; os centros dos dois ícones ficam alinhados verticalmente, mesmo com várias linhas. Os controles não desaparecem ao rolar.
- O wrapper interno do viewport Radix usa `display: block` nesta composição, para o textarea respeitar a largura disponível, inclusive com palavras longas. Há espaço para a scrollbar antes das ações.
- Navegadores sem `field-sizing: content` conservam o textarea com scroll nativo como fallback, evitando conteúdo cortado. Esse fallback não recebe a scrollbar customizada do Lina.

Referências consultadas pelo MCP Mobbin: [Google Gemini](https://mobbin.com/screens/057d8ba8-d787-4612-b7ce-ea3595a984ed) e [Langdock](https://mobbin.com/screens/b66870ae-8d47-493d-b1b6-e6c01173ad96). Ambas mostram texto multiline acima das ações. Foi aproveitada a estabilidade das ações na base; a disposição lateral e os tokens do protótipo original foram mantidos.

## Bibliotecas e próxima integração

- [AI Elements / PromptInput](https://elements.ai-sdk.dev/components/prompt-input): alternativa para anexos, modelos e ferramentas. Composição baseada em shadcn, integrada com AI SDK. Evite acrescentar controles ausentes do protótipo só porque a biblioteca os oferece.
- [AI SDK / useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat): estado das mensagens, streaming e cancelamento, desde que o backend implemente seu protocolo. Uma API existente pode exigir transport customizado.
- [assistant-ui / Thread](https://www.assistant-ui.com/elements/thread): primitives de conversa/composer e runtime para chat completo; faz mais sentido ao adotar a estrutura inteira do chat.
- [react-textarea-autosize](https://github.com/Andarist/react-textarea-autosize): considerar caso crescimento automático em navegadores antigos vire requisito. A implementação atual usa o primitive instalado e CSS nativo.

Na integração, defina transporte e erros/cancelamento, mantenha credenciais no backend, valide tamanho no servidor e diferencie aceitação da mensagem de resposta em geração. Anexos, gravação de áudio, Markdown e persistência de histórico ficam fora desta entrada de texto.

## Testes

O reconhecimento usa `useSpeechInput` e os ícones/estados animados usam `SpeechInputIcon`, ambos compartilhados com SearchBar. O chat conserva sua lógica própria de acrescentar o ditado ao rascunho. A animação `audio-wave` permanece no `@theme`; veja [ditado compartilhado](speech-input.md).

14 testes com primitives reais; reconhecimento de voz, matchMedia e ResizeObserver são simulados na fronteira do navegador no JSDOM. Cobrem vazio/whitespace, Enter/Shift+Enter/IME, dupla submissão, Promise/sucesso/falha/retry, modo controlado, geração/parar, limite em voz, cancelamento/eventos tardios, desmontagem e rascunho mais novo. Não foram criados testes dentro de `ui/`.

Verificação com Chrome e CSS real em 11/10/2026: desktop de 1280 px e contexto de toque de 375 px, nos temas claro/escuro. Com 18 linhas, o viewport limitou a área a 160 px e o contêiner chegou a 184 px; os centros dos controles coincidiram e o botão enviar permaneceu a 12 px da base. Wheel moveu o viewport, digitar no fim manteve o cursor visível, limpar restaurou 64 px e palavras longas não causaram overflow horizontal. Sem erros de JavaScript. Microfone físico, qualidade da transcrição e o fallback em um navegador antigo não foram verificados.

```powershell
pnpm test src/components/SendMessage.test.tsx --pool=threads --maxWorkers=1
```
