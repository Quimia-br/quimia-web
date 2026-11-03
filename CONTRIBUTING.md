# Como contribuir

As convenções da organização estão em:

- [Conventional Commits](docs/contributing/conventional-commits-padrao.md): tipo/scope em inglês e descrição em PT-BR.
- [Branches e pull requests](docs/contributing/branch-e-pull-request-padrao.md): GitHub Flow, branch `QUI-<id-clickup>` e PR para `main`.

Use o [template da PR](.github/pull_request_template.md) e descreva como validar a mudança. Para alterações de interface, inclua evidências visuais dos estados relevantes.

Antes de abrir a PR:

```powershell
pnpm run check
pnpm run build
pnpm test
```

`check` combina Oxfmt, Oxlint e a checagem TypeScript da aplicação e dos testes.
Use `pnpm run format` para corrigir a formatação. A toolchain Vite+ é local ao
projeto e não exige instalação global; consulte o [README](README.md).

O [índice dos componentes](docs/components/components.md) contém os guias de uso.

Os testes ficam em `tests/`, espelhando os caminhos de `src/`. Consulte o [guia de testes](tests/README.md) para executar a suíte, escrever novos casos e verificar os tipos dos testes.
