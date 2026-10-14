# BallonMessage

Referência: [variantes recebida e enviada no Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV/Web-Componentes?node-id=401-494).

```tsx
import BallonMessage from "@/components/BallonMessage";

<div className="flex flex-col gap-4">
  <BallonMessage message="Olá! Como podemos ajudar?" time="10:20" />
  <BallonMessage align="end" message={mensagem} time="10:21" />
</div>
```

| Prop | Padrão | Uso |
| --- | --- | --- |
| `message` | Obrigatória | String de texto. HTML é exibido literalmente; quebras de linha são preservadas. |
| `time` | Ausente | String de horário já formatada pela tela; não renderiza um horário vazio. |
| `align` | `start` | Recebida no início ou enviada no fim (`end`). |
| `variant` | `secondary` no início; `default` no fim | Override explícito das variantes oferecidas pelo primitive Bubble. |
| `className` | Ausente | Ajustes do contêiner, por exemplo largura máxima ou espaçamento. |

As demais props nativas do `Bubble` são encaminhadas ao contêiner. O conteúdo vem de `message`; o componente não aceita `children`.

O balão recebido usa fundo secundário e canto inferior esquerdo menor. O enviado usa fundo primário e canto inferior direito menor. O horário acompanha o lado do balão; a mensagem conserva alinhamento à esquerda e quebra palavras muito longas. Os cantos maiores usam 40 px e o menor usa a utilidade `rounded-lg` (8 px nos tokens atuais).

A margem automática do balão enviado permite posicioná-lo no fim tanto em uma coluna flex quanto em um contêiner de blocos. A largura continua limitada pelo primitive; a tela pode definir `className="max-w-[273px]"` para reproduzir a largura do exemplo do Figma. O tamanho da string não define um comprimento fixo para o balão.

## Correção e verificação

A implementação anterior dependia de um seletor de estado inválido para o canto inferior esquerdo do balão enviado. O conteúdo e o horário também não tinham posicionamento consistente quando alinhados ao fim. O wrapper agora usa seletores válidos, margem automática, conteúdo que ocupa a largura disponível e horário alinhado ao lado correto.

Os sete testes cobrem conteúdo/horário, ausência de horário, os dois alinhamentos e cores padrão, override de variante, texto literal e encaminhamento de props/linhas. A geometria foi confirmada separadamente no Chrome com CSS real em desktop/mobile e claro/escuro: posição no fim, cantos, margens internas do horário, quebra de tokens longos e três linhas preservadas. Essa conferência não equivale a testes visuais de todos os navegadores.
