# Feedback e lógica de ditado compartilhados

SearchBar e SendMessage já utilizavam `useSpeechInput`. Ele gerencia suporte do navegador, sessão de reconhecimento, iniciar/parar/cancelar, eventos de fala, resultados, erros e limpeza. Cada uso mantém sua própria sessão; compartilhar o hook não cria um microfone ou rascunho global.

O trecho visual também era igual: ambos escolhiam `Mic`, `AudioLines`, `LoaderCircle` ou `CircleAlert` pelos mesmos estados. Essa parte foi extraída para `SpeechInputIcon`, utilizada nos dois controles.

```tsx
import SpeechInputIcon from "@/components/SpeechInputIcon";
import { useSpeechInput } from "@/hooks/use-speech-input";

const speech = useSpeechInput({
  enabled: true,
  language: "pt-BR",
  scope: "my-screen",
  onFinal: applyTranscript,
});

<button
  type="button"
  aria-label={speech.active ? "Parar ditado" : "Iniciar ditado"}
  aria-pressed={speech.active}
  disabled={!speech.supported || speech.phase === "stopping"}
  onClick={() => speech.active ? speech.stop() : speech.start()}
>
  <SpeechInputIcon speech={speech} />
</button>
```

O exemplo ilustra o feedback; ao compor um novo controle, conserve também tratamento de erros e cancelamento ao desabilitar/navegar, como nos componentes existentes. `speech` exige somente `speaking`, `phase` e `error`. `className` permite ajustar o tamanho (padrão 24 px). O ícone tem `aria-hidden`; o botão e o anúncio acessível pertencem ao componente que o usa.

| Estado | Feedback |
| --- | --- |
| Falando | AudioLines com linhas animadas em loop |
| Iniciando ou encerrando | LoaderCircle |
| Erro sem sessão transitória | CircleAlert |
| Ocioso ou escutando, sem fala | Mic |

## Animações no theme

`--animate-audio-wave` e seu `@keyframes` permanecem no `@theme inline` de `src/index.css`. No Tailwind v4, o namespace `--animate-*` define utilities de animação; esse é um lugar adequado para uma animação reutilizada. O keyframe não gerencia reconhecimento nem estado de áudio. Veja [Theme variables — Tailwind](https://tailwindcss.com/docs/theme).

Agora somente `SpeechInputIcon` combina as classes das linhas, delays e respeito a movimento reduzido. Os consumidores definem tamanho do botão, cores, rótulos e regras de habilitação. Não há CSS específico duplicado nem biblioteca de voz adicional.

## O que continua específico

- SearchBar substitui o termo de busca, oferece prévia sem persistir resultados parciais, atualiza `q` por nuqs/debounce e retorna `p` à primeira página ao mudar a busca.
- SendMessage acrescenta o ditado ao rascunho e respeita limite de texto e estado de envio/geração.

Essas regras são diferentes e permanecem separadas. A reutilização está no reconhecimento e na apresentação dos estados, que eram iguais.

7 testes de `SpeechInputIcon` cobrem todos os estados e a troca de fala para repouso. As suítes de SearchBar e SendMessage verificam integração e aplicação do texto, com reconhecimento nativo simulado na fronteira. Não verificam microfone físico nem qualidade da transcrição.
