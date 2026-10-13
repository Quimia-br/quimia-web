# Campos e formulários

Escopo: componentes implementados diretamente em `src/components`. As dependências de `ui/` e `smoothui/` são usadas de verdade, mas não recebem testes próprios neste trabalho. As referências abaixo foram consultadas no Figma em 10/10/2026; a revisão combina screenshots do design e código atual, sem afirmar equivalência visual de pixels no navegador.

## ActionInput

Campo nativo com ação de limpar ou mostrar/ocultar senha. Não precisa de provider. Aceita props de `<input>` e encaminha `ref` para o elemento nativo. `className` personaliza o grupo externo.

| Prop | Uso |
| --- | --- |
| `value`, `onChange` | Modo controlado; o responsável atualiza o valor recebido no evento. |
| `defaultValue` | Valor inicial do modo não controlado. |
| `clearLabel` | Nome acessível e título da ação de limpar. |
| `clickLabel` | Alternativa antiga para `clearLabel`; tem prioridade menor. |
| `onClear` | Notificação após limpar. |
| `onClick` | Callback antigo da ação de limpar; não representa clicar no campo. |
| `type="password"` | Troca a ação de limpar pela ação de visibilidade. |
| `disabled`, `readOnly` | Removem as ações de limpar e visibilidade. |

```tsx
import { useState } from "react";
import ActionInput from "@/components/ActionInput";

function CompanySearch() {
  const [search, setSearch] = useState("");
  return (
    <ActionInput
      aria-label="Buscar empresa"
      clearLabel="Limpar busca"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
    />
  );
}
```

Limpar dispara `onChange` com o valor vazio também no modo não controlado, depois chama `onClear`/`onClick` e devolve o foco ao campo. Os botões usam `type="button"`, preservando o formulário; a ação de senha reposiciona o cursor no fim do valor.

Testes: texto vazio/preenchido, limpeza controlada e não controlada, notificação do valor vazio, foco, ref, rótulo personalizado, compatibilidade do callback antigo, ausência de ações em campos desabilitados/somente leitura, visibilidade de senha, cursor e ausência de submit acidental.

Figma: a ação X aparece no variante preenchido [4:119](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=4-119); cadastro [334:287](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=334-287) mostra ação de senha. Mantida a implementação com Lucide. Pendências visuais: design usa ícones de 24 px e campos de aproximadamente 64–72 px; implementação usa ícones de 16 px e grupo `h-12`. Os nomes acessíveis padrão das ações continuam em inglês, e a API de senha não oferece rótulos personalizados. A comparação não altera dimensões ou ícones nesta revisão funcional.

## TextField

Compõe `ActionInput` com label, descrição ou erro. Não precisa de provider. Herda suas props e acrescenta:

| Prop | Uso |
| --- | --- |
| `label` | Label ligado ao ID fornecido ou gerado pelo componente. |
| `description` | Orientação acessível quando não existe erro. |
| `error` | Mensagem com `role="alert"`; ativa `aria-invalid` e substitui a descrição. |
| `hideLabel`, `hideDescription`, `hideErrorDescription` | Ocultação visual com `sr-only`, preservando a leitura assistiva. |

```tsx
import TextField from "@/components/TextField";

<TextField
  name="email"
  type="email"
  label="E-mail"
  description="Use o e-mail da empresa"
  autoComplete="email"
/>
```

Uma descrição externa passada por `aria-describedby` é combinada com o ID da orientação/erro interno. Sem erro, `aria-invalid` explícito continua sendo respeitado. Vários campos recebem IDs distintos.

Testes: label/descrição, prioridade e anúncio do erro, conservação da cor do label, referência externa, limpeza de estado controlado, texto oculto apenas visualmente, IDs únicos e retorno à descrição depois de remover erro. Nos casos `hide*`, os testes combinam nome/descrição acessível com a classe `sr-only`, pois o JSDOM não aplica o CSS Tailwind.

Figma: [default 2:87](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=2-87), [filled 4:119](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=4-119), [focused 2:89](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=2-89), [filled/focused 4:133](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=4-133), [error 4:107](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=4-107), [filled/error 4:146](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=4-146). O label permanece na cor primária no erro, coerente com o componente. Pendências: o design usa texto/descrição de 16 px, padding de 24 px e bordas de foco/erro de 3 px; os primitives atuais usam texto menor em parte desses elementos e rings. É necessária uma decisão visual conjunta antes de alterar os tokens e o contrato compartilhado.

## FormTextField

Compõe os primitives reais de `smoothui/form`. `name` e `label` são obrigatórios; `description` é opcional e as demais props seguem `ActionInput`. O wrapper encaminha o `name` ao input nativo, mantém IDs personalizados e combina orientação externa com as mensagens geradas pelo provider. Referências a descrições ausentes são removidas.

O provider visual `<Form>` recebe `errors` como mapa `{ [name]: mensagem }` e `onFormSubmit`. A integração com TanStack usa `<form.Field>` e `value`/`onChange`/`onBlur` explícitos; `FormTextField` não registra automaticamente um campo no TanStack.

```tsx
import { useForm } from "@tanstack/react-form";
import Form from "@/components/smoothui/form";
import FormTextField from "@/components/FormTextField";

function CompanyForm() {
  const form = useForm({
    defaultValues: { nome: "" },
    onSubmit: async ({ value }) => {
      console.log(value.nome);
    },
  });

  return (
    <Form onFormSubmit={(event) => {
      event.preventDefault();
      void form.handleSubmit();
    }}>
      <form.Field name="nome">
        {(field) => (
          <FormTextField
            name={field.name}
            label="Nome da empresa"
            description="Informe a razão social"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>
      <button type="submit">Salvar</button>
    </Form>
  );
}
```

Testes usam o provider real e TanStack real: associações acessíveis com erro e descrição, envio em `FormData`, ID explícito, orientação externa, ausência de ID de descrição inexistente, alteração/limpeza do estado e submit do valor atualizado. Nenhum primitive foi mockado ou editado.

Figma: corresponde à composição de TextField usada em login/cadastro. Pendência: o `FormLabel` do primitive muda para vermelho no erro, enquanto [4:107](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=4-107) mantém o label na cor primária. Os gaps e textos herdados também diferem do TextField direto; registradas as diferenças sem editar `smoothui/`.

## LoginForm

Não recebe props. Precisa de `QueryClientProvider`, router com rota `/login` e `localStorage` disponível. Usa `useLogin` real, TanStack Form e validação Zod: e-mail válido e senha não vazia. O botão exige valores com texto e bloqueia novo envio enquanto a requisição está pendente.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";

const client = new QueryClient();

<QueryClientProvider client={client}>
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
    </Routes>
  </BrowserRouter>
</QueryClientProvider>
```

No sucesso envia `{ email, senha }`, atualiza o cache do usuário por `useLogin` e navega com `replace` à origem em `location.state.from`, preservando query/hash, ou a `/`. Falhas exibem alerta e mantêm o formulário. O rascunho `quimia:login-draft` salva somente e-mail. Login usa `autoComplete="current-password"`. O link “Crie já” abre `/signup`.

Testes: habilitação do botão, validação e correção depois do submit, payload, cache do usuário, retorno à origem com query/hash, destino padrão `/`, falha de autenticação, rascunho sem senha, envio pendente sem duplicação e link para cadastro. Apenas a fronteira externa `services/auth` é mockada.

Figma: tela [1:41](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=1-41), campo de senha [11:17](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=11-17). Pendências: “Esqueci minha senha” está no design e não aparece no formulário; não foi criado um fluxo de recuperação de senha. A tela usa gaps maiores e legenda do link de 20 px, enquanto o código usa `gap-6` e texto de 16 px. O design exibe senha ilustrativa como texto; o campo real preserva o comportamento de senha com ação de visibilidade.

## SignupForm

Não recebe props. Precisa do router com rota `/login` e de `localStorage`; não depende de `QueryClientProvider`. TanStack Form/Zod validam nome não vazio, CNPJ e e-mail válidos, senha não vazia. CNPJ é formatado durante a digitação. As regras adicionais de senha vêm da API.

O payload é `{ nome, cnpj, email, senha }`; o CNPJ permanece formatado, conforme o contrato atual. Após o cadastro, remove `quimia:signup-draft` e retorna a `/login` com `replace`. O rascunho salva somente nome/CNPJ/e-mail. O campo de senha usa `autoComplete="new-password"`. O link “Entre aqui” retorna ao login.

| Detail da API | Resultado |
| --- | --- |
| `email_in_use` | Erro no e-mail. |
| `cnpj_in_use`, `invalid_cnpj` | Erro no CNPJ. |
| `weak_password`, `password_too_long` | Erro na senha. |
| Erro inesperado | Alerta genérico, formulário e rascunho preservados. |

Testes: habilitação do botão, erros locais preservados em campos não editados, máscara/payload, sucesso e exclusão do rascunho, cada detail conhecido, autocomplete de nova senha, restauração do rascunho sem senha, falha inesperada, bloqueio de submissão duplicada e link de login. O router e os campos são reais; apenas `services/auth` é mockado.

Figma: tela [334:278](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=334-278), primeira linha [588:2557](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=588-2557), e-mail [334:286](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=334-286), senha [334:287](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=334-287). CNPJ/nome continuam lado a lado a partir de `md`. Pendências: código usa “Nome”/“Senha”, design usa “Razão Social”/“Crie sua senha”; design mostra gap de 36 px na primeira linha, código usa 16 px. A classe atual `*:flex1` não corresponde à utilidade Tailwind `*:flex-1`, portanto a igualdade de largura dos dois campos precisa ser avaliada no navegador. A legenda de cadastro no Figma repete o convite para criar conta; o código mantém o convite coerente para quem já tem conta.

## Validação e limites

Comando direcionado, com um worker e tempo suficiente para eventos reais durante carga concorrente:

```powershell
node ./node_modules/vitest/vitest.mjs run src/components/ActionInput.test.tsx src/components/TextField.test.tsx src/components/FormTextField.test.tsx src/components/LoginForm.test.tsx src/components/SignupForm.test.tsx --maxWorkers=1 --testTimeout=15000
```

Executar também o lint dos arquivos modificados. A execução integral, build e revisão final do React são feitos na integração do trabalho. Testes de DOM verificam comportamento e acessibilidade estrutural; não comprovam contraste, dimensões renderizadas, animação visual ou responsividade. Esses itens permanecem na revisão visual do navegador.

Verificação direcionada em 10/10/2026: 44 testes aprovados nos cinco arquivos; lint dos dez arquivos de componente/teste aprovado. Uma execução concorrente com o limite padrão de 5 segundos teve timeout no teste de validação do cadastro e interferência de digitação no teste seguinte; a repetição em série acima passou inteira, sem alterar timeouts na configuração do projeto.
