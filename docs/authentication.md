# Autenticação web de empresas

O web usa o `EmpresaAuthController` da pasta `api`, em `/api/v1/empresas/auth`.

| Processo | Contrato |
| --- | --- |
| Cadastro | `POST /register`, com `nome`, `cnpj`, `email` e `senha`. Retorna a empresa, sem autenticar. O web limpa o rascunho e volta para `/login`. |
| Login | `POST /login`, com `email` e `senha`. Retorna `accessToken`, `tokenType`, `expiresIn` e `empresa`; grava os cookies de refresh e CSRF. |
| Perfil | `GET /api/v1/empresas/me`, com o access token no header `Authorization: Bearer …`. |
| Refresh | `POST /refresh`, **sem corpo**, com os cookies e `X-CSRF-TOKEN`. Até `{}` é rejeitado pela API com `invalid_transport`. |
| Logout | `POST /logout`, sem corpo, com os cookies e `X-CSRF-TOKEN`. A API expira os cookies; o web limpa a identidade e o cache também em caso de erro. Se o servidor não receber o logout, seus cookies continuam válidos. |
| Recuperação | `POST /forgot-password`, com `email`, retorna 202; `POST /reset-password`, com `resetToken` e `novaSenha`, retorna 204. |

O access token fica apenas em memória. Ao recarregar, o perfil inicialmente retorna 401 e o cliente renova a sessão usando o cookie HttpOnly `quimia_rt`. Requisições simultâneas compartilham a renovação. O cookie legível `quimia_csrf` permite que o Axios preencha `X-CSRF-TOKEN`. O refresh atualiza tanto o token quanto a empresa na store. Uma requisição protegida é repetida no máximo uma vez; erros dos endpoints públicos de autenticação não disparam refresh.

## Ambiente local e produção

No desenvolvimento, o navegador chama `/api` no domínio do Vite. O proxy encaminha para `VITE_API_KEY` do `.env`, ou para `http://localhost:8080` quando vazio. A variável contém somente a origem da API, sem `/api/v1`. O proxy remove o header `Origin` local da chamada ao servidor, pois a comunicação com o navegador já ocorre na mesma origem; os cookies e o header CSRF continuam sendo verificados pela API. Isso permite usar a API remota com cookies do domínio do web local. Reinicie `pnpm dev` após mudar a configuração e faça login novamente para criar os cookies nessa origem.

Em produção, prefira publicar `/api` por um proxy no **mesmo domínio** do web e deixar `VITE_API_KEY` vazio no build. O proxy deve preservar caminhos, `Cookie`, `Set-Cookie` e os headers CSRF e Authorization. Se a API definir um domínio explícito nos cookies, o proxy precisa removê-lo ou ajustá-lo ao domínio do web. Com HTTPS, mantenha `APP_AUTH_COOKIE_SECURE=true`.

Chamadas diretas a outra origem precisam de CORS autorizado na API. Cookies `SameSite=Lax` não acompanham requisições entre sites diferentes. Além disso, JavaScript no web não consegue ler um cookie CSRF exclusivo do domínio da API; `withXSRFToken` não remove essa restrição. Alterar somente `SameSite` não resolve essa configuração. O proxy do Vite se aplica ao desenvolvimento, não à hospedagem do build.

## Limites da interface atual

Os serviços de recuperação de senha e o hook de logout existem, mas ainda não estão conectados a telas/controles de navegação. O web não registra a rota `/recuperar-senha`, usada como destino padrão dos links da API. A recuperação completa pelo navegador requer essas telas e `APP_AUTH_EMPRESA_RESET_URL` apontando para a rota implementada.

## Verificação

`pnpm test` verifica o login, o redirecionamento do cadastro, o refresh após perda do token em memória, renovação simultânea, recusa da sessão e limpeza de cache. Na API, `mvn clean test` verifica cookies, CSRF, cadastro, login, perfil e recuperação de senha com banco de testes. Esses testes não validam as configurações da hospedagem ou a entrega real de e-mails.
