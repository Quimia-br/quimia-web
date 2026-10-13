# Botões

Referência: [BasicButton no Figma](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV/Web-Componentes?node-id=11-41).

`BasicButton` é o botão principal do produto. O tamanho padrão segue a referência: altura mínima de 61 px, padding horizontal de 20 px, Aeonik Medium de 24 px e ícone de 20 px. Rótulos longos quebram linha e aumentam a altura para caber em telas menores.

O ícone opcional fica no início, separado de `children`. Um espaço equivalente no final mantém o rótulo no centro do botão. Sem ícone, `children` ocupa toda a área de conteúdo. SVGs dentro de `children` não recebem margem unilateral.

```tsx
<BasicButton icon={<Save />}>Salvar alterações</BasicButton>

<BasicButton variant="secondary" size="compact" className="w-32" icon={<Pencil />}>
  Alterar
</BasicButton>

<BasicButton variant="critical" icon={<Trash2 />}>
  Excluir
</BasicButton>

<BasicButton type="submit" disabled={isSubmitting}>
  {isSubmitting ? "Salvando..." : "Salvar"}
</BasicButton>
```

- `variant`: `primary` (padrão), `secondary` ou `critical`.
- `size`: `default` (padrão) ou `compact`, com altura mínima de 48 px e texto de 16 px.
- `className`: pode ajustar largura e layout, ou ser uma função do estado do Base UI.
- `icon`: decorativo, oculto dos leitores de tela. O nome acessível vem do rótulo ou de `aria-label`.
- `type`: `button` por padrão; use `submit` para enviar formulários.

`Button`, em `components/ui`, continua sendo a base dos controles menores. Mantém as variantes e tamanhos existentes e aceita `className` como função do estado. Prefira `BasicButton` para as ações do produto e `Button` para controles de inputs, diálogos e botões de ícone.

## Testes e revisão

`BasicButton.test.tsx` possui nove testes: ícone decorativo, clique e estado desabilitado, ausência de submit por padrão, tokens das variantes primary/secondary/critical, ativação por Enter/Espaço sem enviar um formulário, submit explícito e ref capaz de focar o botão. O ícone decorativo não participa do nome acessível.

A centralização também foi conferida no Chrome com CSS real em 900 e 375 px, temas claro/escuro: o botão padrão tem 61 px de altura e o centro do rótulo coincide com o centro do botão. A referência [11:42](https://www.figma.com/design/eYfOhBxIZfbQaq7MygMTXV?node-id=11-42) usa texto de 24 px e ícone de 20 px, preservados no tamanho padrão. Não foram criados testes adicionais para o primitive em `ui/` nesta revisão.
