# Estado e preferências da tela Produtos

A aplicação monta `QueryClientProvider` e `ThemeProvider` em `src/providers.tsx`. Assim, tema e consultas ficam disponíveis nas rotas sem que Produtos crie uma segunda instância. `ProductsProviders`, em `src/pages/Products.tsx`, monta `ToastProvider` e `DataDisplayProvider` para a tela; avisos e modo de exibição pertencem a esse escopo.

## Preferências persistidas

| Preferência | Hook | Padrão | Chave de `localStorage` | Valores aceitos |
| --- | --- | --- | --- | --- |
| Tema | `useTheme()` | `system` | `quimia:theme` | `system`, `light`, `dark` |
| Exibição | `useDataDisplay()` | `table` | `quimia:data-display` | `table`, `grid` |

Os providers validam o valor salvo. Valor ausente ou inválido usa o padrão configurado. Se o navegador negar a leitura ou a gravação, a tela continua funcional: uma escolha feita pelo usuário atualiza o estado em memória, mas pode não sobreviver à próxima montagem. As alterações feitas em outra aba não são sincronizadas automaticamente. Cada hook exige seu provider e lança um erro descritivo se for usado fora dele.

`useTheme()` expõe `theme`, `resolvedTheme` e `setTheme`. Com `theme === "system"`, `resolvedTheme` acompanha `prefers-color-scheme` enquanto o provider está montado. O provider aplica `light` ou `dark` ao elemento `html`; o botão de tema usa esse mesmo valor para o ícone atual e o nome da próxima ação. Uma escolha explícita continua explícita quando o sistema muda. Sem `matchMedia`, o tema de sistema resolve para claro.

`useDataDisplay()` expõe `dataDisplay` e `setDataDisplay`. O botão mostra o ícone do modo atual e anuncia a próxima opção. Um futuro renderizador da lista de produtos deve ler `dataDisplay` dentro do mesmo `DataDisplayProvider` e escolher a tabela ou grade a partir desse valor; o botão já atualiza todos os consumidores desse escopo. Para manter preferências distintas em outras telas, monte outro provider com outra `storageKey`. Se a chave precisar mudar durante a vida do componente, remonte o provider com `key={storageKey}`: a chave é uma configuração de inicialização.

## Escolha de estado

Context continua adequado para essas duas preferências pequenas, com poucos escritores e consumidores previsíveis. Zustand já atende outros estados da aplicação, mas migrar estas preferências acrescentaria uma store e uma adaptação de interface sem necessidade neste escopo. `next-themes` já está instalado e poderia atender ao tema em Vite; mantemos o Context público atual para preservar `useTheme`, o provider e as escolhas salvas nesta correção delimitada. Estado remoto de produtos pertence ao Query Client, não aos providers de preferência.

## Verificação

Os testes adjacentes exercitam providers e botões reais: alternância por clique/teclado, propagação a consumidores, persistência, valores inválidos, bloqueio de storage, isolamento por chave, mudanças de tema do sistema (inclusive entre renderização e assinatura) e limpeza do listener.

```powershell
node ./node_modules/vitest/vitest.mjs run src/components/ThemeToogle.test.tsx src/components/Header.test.tsx src/components/DataDisplayToggle.test.tsx src/lib/theme-provider.test.tsx src/lib/data-display-provider.test.tsx --pool=threads --maxWorkers=1 --testTimeout=15000
node ./node_modules/vitest/vitest.mjs run --pool=threads --maxWorkers=1 --testTimeout=15000
```

Na verificação inicial, o foco passou com 19/19 testes em cinco arquivos; a suíte completa passou com 267/267 em 33 arquivos. Após a correção do intervalo entre renderização e assinatura de `matchMedia`, o teste adicional em `ThemeToogle.test.tsx` teve falha RED esperada e o foco passou com 20/20 em cinco arquivos. A suíte completa inicial não foi repetida nessa correção pontual.

Na integração do controller sobre a versão inicial, o build terminou com exit 0 e aviso de bundle existente de aproximadamente 858 kB. Em Chrome nas larguras de 1280 e 375 px, passaram mudança do tema do SO, escolha explícita, teclado, navegação/remontagem/reload, isolamento por chave e storage inválido ou bloqueado, sem erros de página nem overflow. O React Doctor permaneceu em 52/100 com 33 diagnósticos já existentes. A correção pontual subsequente cobre um intervalo de tempo que esses cenários de navegador não forçavam.

Conferência final em 12/10/2026, após a correção: **268 testes passaram em 33 arquivos** (147,40 s), usando o comando de suíte completa acima. Build TypeScript/Vite e navegador passaram novamente; o bundle permaneceu em aproximadamente 858 kB. Lint dos arquivos alterados passou. React Doctor manteve 52/100 e os mesmos 33 diagnósticos da baseline; retorna código 1 por esses achados e seu escopo Git não inclui todos os arquivos novos. Revisões independentes da tarefa e da integração final foram aprovadas. Sem commits ou alteração de estado remoto.
