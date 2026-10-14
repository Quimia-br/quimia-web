# Componentes de imagem

`ImageContainer` e `ImageEditor` seguem os componentes do Figma, sem modificar o arquivo de design. O export `ImagemContainer` continua disponível para telas existentes.

## Uso em formulário

```tsx
import { useState } from "react";
import { ImageContainer } from "@/components/ImageContainer";
import type { ImageValue } from "@/types/Image";

// O valor inicial pode ser a fotoUrl recebida da API.
const [imagem, setImagem] = useState<ImageValue>(empresa.fotoUrl || null);

<ImageContainer
  label="Foto da empresa"
  shape="circle"
  value={imagem}
  onChange={setImagem}
/>
```

O componente é controlado: o formulário mantém `value`, que aceita `File`, URL (`string`) ou `null`. Selecionar ou arrastar um arquivo abre uma edição temporária. Somente a confirmação chama `onChange` com o `File` recortado. Cancelar, Escape ou clicar fora preserva o valor anterior. Uma atualização externa de `value` descarta a edição aberta.

`Alterar` escolhe um novo arquivo; o botão de enquadramento edita a imagem atual, inclusive uma URL do Cloudinary. As ações aparecem por hover, foco de teclado e em dispositivos de toque.

| Propriedade de ImageContainer | Padrão | Comportamento |
| --- | --- | --- |
| `shape` | `circle` | `circle` ou `rectangle` (proporção 246/388). |
| `label` | `Imagem` | Texto do campo e nome acessível dos controles. |
| `value` | `null` | Imagem salva no estado do formulário. |
| `onChange` | obrigatório | Recebe o arquivo confirmado; aceita `Promise<void>`. |
| `maxFileSize` | 10 MB | Limite em bytes do arquivo selecionado. |
| `disabled` / `readOnly` | `false` | Exibe a imagem sem permitir seleção ou edição. |
| `error` | — | Mensagem de validação do formulário. |
| `className` | — | Ajusta a largura externa; a proporção permanece. |

Aceita JPEG, PNG e WebP, um arquivo por vez. Erros de seleção ou carregamento não substituem a imagem salva. URLs de arquivos locais são criadas ao montar a prévia e liberadas ao trocar o valor ou fechar a edição; URLs externas nunca são revogadas.

## Integração com Cloudinary/API

O componente prepara o arquivo. A API atual de empresa recebe `fotoUrl` em `updateMe`; não foi encontrado um endpoint de upload de arquivos no projeto. Portanto, o upload deve ser fornecido pela tela ou pelo serviço da aplicação, conforme a configuração do Cloudinary.

O fluxo de upload pode ser conectado ao `onChange`:

```tsx
// uploadImagem é o serviço de upload da aplicação, a ser conectado ao backend.
async function confirmarImagem(file: File | null) {
  if (!file) return;
  const resultado = await uploadImagem(file);
  await updateMe({
    nome: empresa.nome,
    email: empresa.email,
    fotoUrl: resultado.secure_url,
  });
  setImagem(resultado.secure_url);
}

<ImageContainer value={imagem} onChange={confirmarImagem} label="Foto da empresa" />
```

A resposta de upload inclui `secure_url`, utilizável como o novo valor. Veja a [documentação de upload do Cloudinary](https://cloudinary.com/documentation/image_upload_api_reference). A API de empresa exige HTTPS e limita `fotoUrl` a 200 caracteres; o serviço que persistir a imagem precisa respeitar esse contrato.

O editor aguarda a Promise do callback, mostra o progresso e impede novos envios ou fechamento durante o salvamento. Se o callback rejeitar, exibe a mensagem e permite tentar novamente com o mesmo recorte. Atualize o valor controlado após concluir o upload e a persistência, para preservar a imagem antiga em caso de falha. Uma sessão desmontada cancela a geração local; um upload que já começou no callback continua sendo responsabilidade do serviço.

## Recorte e editor independente

`ImageEditor` também pode ser usado diretamente com `open`, `onOpenChange`, `image` (`File | string | null`) e `onSave` (`File => void | Promise<void>`). Aceita `shape` (padrão `rectangle`), `defaultGrid` (padrão `true`), `maxOutputSize` (padrão `2048`) e `className`.

O zoom vai de 1× a 4×. É possível arrastar a imagem ou mover o enquadramento pelas setas do teclado; o slider também aceita teclado. O diálogo mantém foco protegido, tem nomes acessíveis e retorna o foco ao controle que o abriu.

O arquivo usa pixels naturais do recorte, sem multiplicar pela densidade da tela e sem aumentar uma imagem pequena. O maior lado é limitado a 2048 px; imagens maiores são reduzidas preservando a proporção. A saída é WebP com qualidade 0,9; caso o navegador gere PNG, extensão e MIME acompanham o formato real. O círculo é uma máscara de apresentação: seu arquivo exportado é quadrado, adequado para fotos de perfil.

Para editar uma URL remota, o servidor precisa permitir sua leitura com CORS. Falhas de carregamento ou de exportação são exibidas no diálogo e permitem cancelar e escolher um arquivo local.

## Testes e revisão com o Figma

Referências: [ImageContainer, 339:881](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=339-881) e [ImageEditor, 728:2650](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=728-2650).

`ImageContainer.test.tsx` possui 15 testes de arquivos/URLs, seleção inválida, confirmação, cancelamento, troca de valor, somente leitura, disabled, descarte da edição ao desabilitar, rejeição de múltiplos arquivos, erro externo acessível, Escape e liberação de URLs locais inclusive em StrictMode.

`ImageEditor.test.tsx` possui nove testes de carregamento, bloqueio até haver recorte válido, arquivo confirmado, rejeição do callback e nova tentativa, ausência de diálogo fechado/sem imagem, cancelamento durante carregamento, alternância do grid, falha de exportação e erro ao carregar a fonte. Cropper e exportação são simulados na fronteira porque JSDOM não calcula o recorte; os dez testes de `getCroppedImg.test.ts` verificam separadamente o helper de exportação. Não são testes de fidelidade visual do diálogo.

A comparação confirma as proporções circle/rectangle e a organização do editor com zoom, grid e confirmação. O protótipo também exibe quatro marcadores no slider que não estão na versão atual do código. Isso permanece como diferença visual documentada, sem restaurar controles removidos antes desta revisão. O blur aplicado ao hover da própria imagem pode não ser acionado enquanto a camada de ações estiver sob o ponteiro; conferir esse efeito no navegador antes de ajustar sua implementação.
