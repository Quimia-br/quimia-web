# Proposta de adequação integral do Quimia Web

Data: 02/11/2026. Estado: aprovada pelo usuário; implementação iniciada. Uma revisão independente do documento não identificou perguntas importantes pendentes para o planejamento.

## Intenção e limites

Atender aos 14 requisitos obrigatórios e aos dez extras fornecidos pelo usuário, preservando o produto, o visual existente e os contratos válidos da API. O Render foi expressamente aceito como hospedagem. A auditoria inicial e as evidências estão em [auditoria-web-2026-11-02.md](auditoria-web-2026-11-02.md).

Não reescrever o histórico, fabricar semanas de desenvolvimento, inventar ganhos de performance ou declarar conformidade de acessibilidade sem execução. Não alterar a API ou o aplicativo mobile nesta adequação. Preservar alterações concorrentes: a execução deve começar comparando o estado atual com o auditado.

## Abordagens consideradas

1. **Ajustes pontuais e wrappers:** acrescentar exports `index.tsx`, um Context superficial e exemplos de hooks seria menor, mas deixaria código misturando responsabilidades, formatos persistidos sem contrato e componentes fora da convenção. Não alcança a exigência de consistência integral.
2. **Refatoração incremental da aplicação existente, recomendada:** mover componentes/páginas com atualização dos consumidores, extrair lógica para hooks/controladores e corrigir os fluxos existentes. Mantém as funcionalidades e permite validar cada etapa com a suíte existente.
3. **Reescrita da aplicação:** abriria risco desnecessário de perder o fluxo FDS, proteção de sessão e recursos de acessibilidade já presentes. Não há motivo para substituir a stack.

A recomendação é a segunda abordagem. É uma adequação ampla, envolvendo estrutura, autenticação e estados assíncronos, não apenas formatação.

## Estrutura e responsabilidade

- Cada componente de produto, primitiva UI e página ficará em sua pasta com `index.tsx`, inclusive os componentes copiados de bibliotecas. Componentes auxiliares com identidade própria também serão separados quando necessário. Não manter cópias antigas só para compatibilidade de imports; atualizar consumidores e testes.
- Apenas `.ts`/`.tsx` permanecerão em `src/`, eliminando a ambiguidade literal do enunciado. CSS e assets sairão para diretórios próprios fora de `src/`; imports de CSS, fontes e mídia continuarão passando pelo build quando necessário.
- Conforme orientação posterior do usuário, **as interfaces de props ficam nos próprios componentes**. `src/types/` reunirá entidades e contratos por domínio e contratos de estado. Tipos utilitários, unions e genéricos continuarão sendo usados onde tecnicamente apropriados; componentes com props terão interfaces explícitas locais.
- `src/services/` conterá transporte, cliente HTTP, refresh e recursos, com `Promise<T>` explícito e `try/catch` que normalize falhas e preserve cancelamento e causa. Hooks serão a fronteira entre serviços e UI. Um catch que apenas relança o mesmo erro não conta como melhoria.
- `src/utils/` conterá validação e normalização tipadas por domínio e leitura/gravação versionada. Conteúdo textual será renderizado via JSX; não usar remoção indiscriminada de caracteres como substituto de segurança contextual.

## Autenticação

Criar `AuthProvider` dedicado e `useAuth` com contrato explícito. `PrivateRoute` consumirá esse Context; páginas não consultarão o store para decidir autenticação. Diferenciar inicialização, sessão válida, sessão ausente e falha recuperável de rede. Preservar token só em memória, renovação HttpOnly/CSRF, proteção contra refresh/login tardio após logout, versão de sessão e limpeza do cache por empresa.

O store de sessão pode continuar como detalhe interno consumido por interceptors e pelo Provider. Ele não será a interface pública das páginas. Isso evita reimplementar mecanismos corretos apenas para trocar de biblioteca e entrega Context como ponto real de distribuição da sessão.

## Estado e operações assíncronas

Manter `useState` para estado local simples e objetos de campos relacionados. O fluxo de cadastro/FDS usará `useReducer`: estados discriminados de detalhes, seleção de PDF, validação/análise, revisão, pronto para envio, envio, sucesso e erro recuperável. Actions tipadas representarão eventos reais; o reducer rejeitará transições incoerentes e não fará chamadas HTTP.

Hooks controlarão validação de arquivo, análise, descarte e envio, preservando o cuidado atual de não perder o identificador de uma análise criada no servidor ao cancelar a operação. Não aplicar abort indiscriminado a mutações que exigem compensação no servidor.

Consultas terão retorno público tipado com loading, dados e erro, além de `AbortSignal` encaminhado ao transporte. Usar o AbortController gerenciado pelo TanStack Query quando atender ao contrato; demonstrar o abort real ao desmontar. Separar testes de cancelamento de leitura dos testes de compensação de escrita.

## Rotas e carregamento

Todas as páginas de rota terão imports dinâmicos com `React.lazy` e fallback de `Suspense` acessível. Remover imports estáticos que tragam a mesma página indiretamente para o bundle inicial. [Contrato de lazy/Suspense do React](https://react.dev/reference/react/lazy).

Adicionar `path: "*"` com página 404 e ação de retorno. Adicionar detalhe de produto privado em `/products/:productId`, acessível por Link na listagem. É uma escolha desta proposta para demonstrar `useParams` em um fluxo real. A API local já fornece `GET /api/v1/produtos/{id}` em `ProdutoController`; não será criado um endpoint fictício. O hook verificará presença, formato inteiro positivo e limite numérico do parâmetro antes de consultar o serviço. Tratar separadamente parâmetro inválido, produto inexistente e falha de rede. A página mostrará somente os campos de produto já existentes e retorno para a listagem, sem ampliar para novos fluxos de edição/exclusão.

## Persistência e formulários

Salvar cada objeto em localStorage com `_versao` explícito e schema de payload. Migrar formatos conhecidos de tema, modo de visualização, acessibilidade e rascunhos; descartar de forma segura dados corrompidos ou de versão desconhecida. Falta de espaço/acesso não poderá impedir o uso em memória. Não persistir tokens, senha ou códigos de recuperação. O bootstrap do tema usará o mesmo leitor para evitar divergência ou flash.

Validar e normalizar dados antes de enviar qualquer formulário ao serviço. Aplicar tipos de input, limites de tamanho e erro específico por campo. Reaproveitar os limites existentes no contrato da API; confirmar o limite em bytes para senhas e não alterar senha com `trim`/normalização automática. Testar caracteres de controle, limites, CNPJ e e-mail. Validar o resultado de API como `unknown` nas fronteiras em vez de confiar apenas no genérico de Axios.

## Segurança, listas e performance

Substituir os tooltips HTML por renderização que trate rótulos externos como texto, preferencialmente JSX. Eliminar injeção de HTML e trocar `<style dangerouslySetInnerHTML>` por conteúdo seguro quando possível. Testar rótulos hostis dos dados de relatórios, não apenas o HTML de tabelas.

Linhas de relatório carregarão identificador estável do domínio; pendências da FDS terão identidade baseada na análise/campo/composto e distinguirão duplicatas de forma estável. Índices serão reservados a placeholders realmente estáticos. As chaves precisam preservar identidade quando o ranking ou a seleção de período mudar.

Manter memoização onde estabiliza trabalho/assinaturas reais e medir antes/depois no React DevTools Profiler. Considerar o React Compiler e registrar ausência de ganho quando ele já remove o custo. Não criar listas artificiais lentas dentro do produto só para justificar hooks.

## Acessibilidade e publicação

Corrigir os tokens de contraste nos dois temas, erros, texto auxiliar e estados interativos; medir sobre o fundo efetivo. Associar labels inclusive aos inputs de arquivo. Os layouts terão header, navegação, main e footer com propósito, evitando main aninhado e landmarks duplicados. Adicionar salto para conteúdo e foco de navegação de rota quando necessário.

Verificar os diálogos/menus usando as primitivas existentes, com nome acessível, Escape, foco inicial, ciclo de foco e retorno ao disparador. Testar teclado, ampliação a 200%, reflow e NVDA/VoiceOver. Manter recursos de acessibilidade existentes e não solicitar câmera/microfone automaticamente.

No Render, manter os cabeçalhos de segurança e revisar a regra de fallback SPA no serviço realmente associado ao domínio. Confirmar rotas profundas por acesso direto e refresh. A publicação só estará comprovada quando o artefato validado estiver disponível no endereço do README. Se faltar acesso à conta ou configuração do domínio, registrar exatamente a ação externa necessária sem afirmar que foi aplicada.

## Critérios de aceite

1. `pnpm run check`, `pnpm run typecheck`, `pnpm test` e `pnpm run build` passam com configuração versionada; instalação reproduzível pelo lockfile.
2. Verificação estrutural não encontra extensões indevidas, componentes/páginas fora de `index.tsx`, `any`, imports de serviços pela UI, chaves por índice em dados dinâmicos ou retornos de serviço sem contrato.
3. Testes exercitam login/logout/refresh concorrente, rota privada, rota inválida/ausente, lazy loading, validação de payload, abort, migração de armazenamento, segurança de tooltips e transições/compensação FDS.
4. Browser QA cobre carregando/sucesso/erro, teclado e foco de overlays nos dois temas. Network comprova chunks por página; Profiler registra comparação real; leitor de tela tem ensaio registrado.
5. Render serve todas as rotas diretamente e por navegação, com README e documentação correspondentes ao código validado.
6. Relatório final reavalia os 24 critérios e identifica pendências externas ou de apresentação sem mascará-las como concluídas.
