# Toast

Componente do projeto com primitives Base UI, biblioteca já instalada e utilizada pela variante Base do [shadcn](https://ui.shadcn.com/docs/components/base/toast). Não requer outra dependência.

## Posição e ciclo de vida

O [componente do Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=402-1725) tem superfície pill, padding de 16 px, círculo de 42 px, ícone de 20 px, título de 20 px e fechar de 24 px. A descrição opcional usa 14 px. Sucesso sem descrição tem 74 px de altura; com descrição, 81 px quando o texto cabe numa linha. No celular, o texto quebra e a altura acompanha o conteúdo.

As aplicações mostram duas posições relativas ao conteúdo:

- [Produtos](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=405-2020): na faixa de ações, alinhado ao fim.
- [Perfil](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=440-3239): abaixo do cabeçalho, alinhado ao início.

Cada tela recebe um `ToastProvider` e **um** `ToastViewport`, colocado nesse ponto do layout. `align` aceita `start` (padrão), `center` e `end`. `className` controla a área disponível; não há coordenadas fixas nem um canto global escolhido pelo componente. As mensagens ocupam espaço no fluxo da tela, conforme as linhas do protótipo. A área fica oculta quando vazia.

O provider deve envolver os controles que notificam e o viewport. Coloque-o fora dos diálogos: um formulário em um portal mantém o contexto React e pode notificar a tela antes de fechar. Fechar o diálogo conserva a mensagem; desmontar a tela elimina suas mensagens. Providers distintos mantêm estados independentes. Duas regiões independentes exigem providers próprios; use o hook dentro da região que deseja notificar.

## Exemplo

```tsx
import { ToastProvider, ToastViewport } from "@/components/Toast";
import { useToast } from "@/hooks/use-toast";

function ProductActions({ save }: { save: () => Promise<void> }) {
  const toast = useToast();

  async function handleSave() {
    try {
      await toast.promise(save(), {
        loading: { title: "Salvando produto…" },
        success: { title: "Produto adicionado com sucesso." },
        error: {
          title: "Não foi possível adicionar o produto.",
          description: "Verifique sua conexão e tente novamente.",
          priority: "high",
        },
      });
      // Fechar o diálogo após o sucesso, caso a tela use um.
    } catch {
      // A notificação já apresentou o erro. O formulário pode continuar aberto.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" onClick={handleSave}>Salvar produto</button>
      <ToastViewport
        align="end"
        label="Avisos de produtos"
        className="basis-full sm:flex-1 sm:basis-auto"
      />
    </div>
  );
}

export function ProductScreen({ save }: { save: () => Promise<void> }) {
  return (
    <ToastProvider timeout={5000} limit={3}>
      {/* Header, tabela e diálogos podem ficar dentro deste escopo. */}
      <ProductActions save={save} />
    </ToastProvider>
  );
}
```

Em Perfil, coloque `<ToastViewport label="Avisos de perfil" />` abaixo do Header, dentro do provider da tela. A tela fornece a operação real e deve impedir envios duplicados enquanto ela estiver em andamento. Os exemplos não conectam endpoints nem exibem notificações fictícias nas páginas existentes.

## Controle das mensagens

`useToast()` expõe o manager real de Base UI: `toasts`, `add`, `update`, `close` e `promise`. Use dentro do provider. Tipos visuais: `success` (também padrão visual quando não há tipo), `error`, `warning`, `info` e `loading`.

```tsx
const toast = useToast();
toast.add({ title: "Perfil alterado com sucesso", type: "success" });

// Operação em etapas, sem duplicar a notificação.
const id = toast.add({ title: "Salvando…", type: "loading", timeout: 0 });
toast.update(id, { title: "Alterações salvas", type: "success", timeout: 5000 });
toast.close(id); // Sem ID, close() fecha todas as mensagens deste provider.

// Repetir add com o mesmo ID atualiza a mensagem existente.
toast.add({ id: "save-product", title: "Produto salvo", type: "success" });

// Ação opcional; a tela decide o que executar e quando fechar.
toast.add({
  title: "Não foi possível salvar.", type: "error", timeout: 0,
  actionProps: { children: "Tentar novamente", onClick: retry },
});
```

`promise` troca loading pelo resultado na mesma mensagem. Objetos com `title` seguem a hierarquia do Figma; strings fornecidas a `promise` são tratadas pela biblioteca como descrição e exibidas como texto principal quando não há título. A rejeição da operação continua sendo propagada: trate-a na tela sem disparar uma segunda notificação idêntica.

O timeout padrão é 5 segundos, com pausa durante hover/foco por teclado e quando a janela perde foco. `timeout: 0` mantém a mensagem até fechamento, atualização ou desmontagem. `limit` padrão é 3; excedentes antigos ficam ocultos e seguem o descarte da biblioteca. `priority: "high"` faz anúncio urgente; `type: "error"` define o visual, sem mudar a prioridade automaticamente.

## Acessibilidade e animação

Base UI cuida de anúncios, timer, acesso à região por F6, foco e fechamento. A prioridade alta usa uma região de anúncio urgente separada até o Toast receber foco, evitando anúncio duplicado. Os ícones são decorativos, o fechar tem nome em português e o foco tem anel visível.

Entrada e saída duram 200 ms com opacidade e deslocamento curto. Movimento reduzido remove transições e rotação de loading. Várias mensagens aparecem em coluna, respeitando a faixa de conteúdo usada no Figma.

## Testes

13 testes com provider e primitives reais: título/ícones, fechamento, anúncio urgente, descrição, atualização, mesmo ID, isolamento/desmontagem, expiração, persistência, pausa por foco, ação de recuperação e Promise com sucesso/falha. Nenhum teste novo dentro de `ui/`.

```powershell
pnpm test src/components/Toast.test.tsx --pool=threads --maxWorkers=1
```

Referência da API: [Base UI Toast](https://base-ui.com/react/components/toast).

Conferido no Chrome com CSS real em 1280 e 375 px, claro/escuro: dimensões desktop de 74/81 px, alinhamentos, quebra no celular sem overflow, F6, fechar por teclado, pausa/retomada por hover e foco, atualização de loading e movimento reduzido. Nenhum erro de JavaScript. Integração com as operações reais das telas depende dos respectivos formulários/serviços.
