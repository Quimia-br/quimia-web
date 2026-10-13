# Ocorrências revisadas

## react-doctor/query-mutation-missing-invalidation — use-register.ts

React Doctor 0.9.18, schema 3, escopo completo. Classificação: falso positivo, confiança alta. A regra continua habilitada; não foi adicionada supressão.

O cadastro cria uma empresa nova, sem autenticar a conta e sem emitir cookie de sessão. O endpoint `EmpresaAuthController.register` retorna `EmpresaSummary`; somente login/refresh emitem a sessão. O web possui a query `authKeys.user()`, referente ao usuário atual, e não possui query de listagem de empresas que precise ser invalidada após cadastro. `useLogin` atualiza esse cache com a identidade autenticada; `useLogout` limpa o cache. `SignupForm` retorna à tela de login após criar a empresa.

Invalidar o perfil atual apenas para zerar o aviso causaria refetch sem mudança desse dado. Os testes em `auth-mutations.test.tsx` cobrem o cadastro sem autenticação. Revisar esta conclusão quando houver query de listagem/contagem de empresas ou quando o contrato de cadastro passar a autenticar o usuário.
