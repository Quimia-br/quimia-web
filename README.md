<div align="center">

# Quimia Web

**O portal das empresas parceiras do Quimia: produtos, FDS, indicadores e a assistente Kemi.**

[![CI](https://github.com/Quimia-br/quimia-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Quimia-br/quimia-web/actions/workflows/ci.yml)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Funcionalidades](#funcionalidades) · [Stack](#stack) · [Como rodar](#como-rodar) · [Variáveis](#variáveis-de-ambiente) · [Estrutura](#estrutura-do-projeto) · [Rotas](#rotas-da-aplicação) · [Autenticação](#autenticação) · [Testes e CI](#testes-e-ci) · [Deploy](#deploy)

**Publicado em:** https://quimia.app/login

</div>

---

Portal web das empresas parceiras do Quimia. Permite cadastrar e acompanhar os produtos (com envio de FDS),
ver indicadores em gráficos e conversar com a assistente Kemi. Consome a
[quimia-api](https://github.com/Quimia-br/quimia-api).

- **Aplicação publicada:** https://quimia.app
- **API:** https://quimia.discloud.app (Swagger em `/swagger-ui.html`)

## Visão geral

| Tema | Como é tratado |
| --- | --- |
| **Sessão** | Token de acesso só em memória; renovação por cookie HttpOnly e CSRF. |
| **Dados** | Toda chamada à API isolada em `src/services`, com TanStack Query e Axios. |
| **Rotas** | React Router com rotas protegidas e página 404. |
| **Acessibilidade** | WCAG 2.1 AA, tema claro/escuro e fonte para dislexia. |
| **Entrega** | Site estático no Render, publicado ao criar uma Release. |

## Funcionalidades

- Cadastro, login e recuperação de senha da empresa.
- Lista de produtos com busca, filtros e exibição em cartões ou tabela.
- Cadastro e edição de produtos com upload de imagem (recorte) e de FDS.
- Painel de gráficos (KPIs) da empresa.
- Perfil da empresa, com foto.
- Tema claro/escuro e fonte para dislexia (OpenDyslexic).
- Entrada de mensagem por voz.

## Stack

| Área | Tecnologia |
|---|---|
| Base | React 19, TypeScript, Vite, React Compiler |
| Rotas | React Router 7 |
| Dados | TanStack Query, Axios, Zod |
| Formulários | TanStack Form |
| Estado | Zustand |
| UI | Tailwind CSS 4, shadcn/ui, Base UI, Motion |
| Gráficos | ECharts |
| Testes | Vitest, Testing Library |
| Qualidade | ESLint, React Doctor |
| Gerenciador de pacotes | pnpm |

## Como rodar

Requisitos: Node.js 24 e pnpm (`corepack enable`).

```bash
pnpm install
cp .env.example .env     # opcional: aponta o proxy para outra API
pnpm dev                 # http://localhost:5173
```

Sem configurar nada, o servidor de desenvolvimento encaminha `/api` para `http://localhost:8080`, que é a
quimia-api rodando localmente (veja o README dela).

## Variáveis de ambiente

| Variável | Finalidade |
|---|---|
| `VITE_API_KEY` | Origem da API, **sem** `/api/v1`. No desenvolvimento o Vite faz proxy de `/api` para ela. Vazio usa `http://localhost:8080`. Em produção deixe vazio e publique `/api` por proxy no mesmo domínio |

Nenhuma chave privada deve ir para o repositório: o `.env` é ignorado pelo Git.

## Scripts

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Checagem de tipos (`tsc -b`) e build de produção em `dist/` |
| `pnpm preview` | Serve o build localmente |
| `pnpm lint` | ESLint |
| `pnpm test` | Testes (Vitest) |

## Estrutura do projeto

```
src/
├── pages/         uma página por rota (Login, Signup, Home, Products, Graphs, Profile...)
├── components/    componentes reutilizáveis de responsabilidade única, com testes ao lado
├── services/      toda a comunicação com a API (auth.ts, empresas.ts)
├── hooks/         hooks customizados (login, logout, busca, rascunhos, voz...)
├── lib/           cliente HTTP, rota protegida, tema, query client, utilitários
├── types/         interfaces e tipos do domínio
├── routes.ts      definição das rotas
└── providers.tsx  providers globais
docs/              autenticação, componentes e convenções de contribuição
```

## Rotas da aplicação

| Rota | Página | Acesso |
|---|---|---|
| `/login`, `/signup`, `/reset-password` | Autenticação | Pública |
| `/` | Início | Autenticada |
| `/products` | Produtos | Autenticada |
| `/graphs` | Gráficos | Autenticada |
| `/profile` | Perfil da empresa | Autenticada |
| `*` | Página de erro 404 com botão de retorno | Pública |

Rotas autenticadas passam por `ProtectedRoute` (`src/lib/ProtectedRoute.tsx`), que redireciona para o login
quando não há sessão.

## Autenticação

O token de acesso fica **apenas em memória**; a renovação usa o cookie HttpOnly `quimia_rt` e o header
`X-CSRF-TOKEN`. Detalhes dos endpoints e do fluxo de refresh em [`docs/authentication.md`](docs/authentication.md).

## Acessibilidade

Segue a WCAG 2.1 AA: elementos nativos (`button`, `label` com `htmlFor`), `alt` nas imagens, mensagens de erro
no DOM e navegação por teclado com foco visível. Há preferências de tema e de fonte para dislexia.

## Testes e CI

```bash
pnpm test
pnpm lint
pnpm build
```

O workflow [`ci.yml`](.github/workflows/ci.yml) roda em PRs e pushes para `main`, valida o build e os testes,
e publica no Render ao criar uma Release. Há ainda a checagem
[`react-doctor.yml`](.github/workflows/react-doctor.yml) e a validação de título de PR em
[`pr-title.yml`](.github/workflows/pr-title.yml). Todo PR usa o
[template](.github/pull_request_template.md). Convenções: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Deploy

Site estático no Render (`render.yaml`): `pnpm install --frozen-lockfile && pnpm run build`, publicando `dist/`
com *rewrite* de todas as rotas para `index.html`. O deploy é disparado pelo workflow ao publicar uma Release.

## Documentação adicional

- [`docs/authentication.md`](docs/authentication.md): fluxo de autenticação.
- [`docs/components/`](docs/components): documentação de cada componente.
- [`docs/contributing/`](docs/contributing): padrão de branch/PR e de commits.

## Padrão de projeto

> **Preencher pelo responsável do repositório:** indicar o padrão, o arquivo (com link) e a finalidade.
> Sugestões a confirmar no código: **Provider** (`providers.tsx`, `data-display-provider.tsx`,
> `theme-provider.tsx`) ou **Custom Hook / Facade** sobre `src/services`.

> **Atenção (ajuste antes de publicar):** o `render.yaml` declara `VITE_API_URL`, mas o código e o
> `.env.example` usam `VITE_API_KEY`. Alinhar os nomes e remover esta nota.
