# Como contribuir

As convenções da organização estão em:

- [Conventional Commits](docs/contributing/conventional-commits-padrao.md): tipo/scope em inglês e descrição em PT-BR.
- [Branches e pull requests](docs/contributing/branch-e-pull-request-padrao.md): GitHub Flow, branch `QUI-<id-clickup>` e PR para `main`.

Use o [template da PR](.github/pull_request_template.md) e descreva como validar a mudança. Para alterações de interface, inclua evidências visuais dos estados relevantes.

Antes de abrir a PR:

```powershell
pnpm run lint
pnpm run build
pnpm test --pool=threads --maxWorkers=1 --testTimeout=15000
```

O [índice dos componentes](docs/components/components.md) contém os guias de uso.
