# NTOH - Automação de Processos

Sistema completo de automação de processos com gestão de devoluções, estoque, custos e faturamento. Desenvolvido com React, TypeScript, Tailwind CSS e Recharts.

## 🚀 Funcionalidades

### 📦 Devoluções
- Rastreamento de devoluções de clientes
- Abas para organizar por status (Pendentes, Processando, Concluídas)
- Adicionar motivo da devolução
- Mover itens entre status
- Adicionar produtos devolvidos ao estoque

### 📊 Estoque
- Gestão completa de inventário
- Cards de resumo (Total de itens, Valor total, Ticket médio)
- Adicionar produtos com SKU, cor, tamanho
- Editar, duplicar e remover produtos
- Cálculo automático do valor do inventário

### 💰 Custos
- Gestão de custos fixos (aluguel, salários, etc)
- Gestão de custos variáveis
- Cards de resumo com totalizações
- Adicionar, editar, duplicar e remover custos

### 📈 Faturamento
- Visualização de custos fixos vs variáveis
- Gráfico de distribuição de custos (Pizza)
- Gráfico de receita vs custos (Barras)
- Cards com resumo financeiro
- Análise de vendas

## 💻 Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **Vite** - Build tool
- **Recharts** - Gráficos
- **shadcn/ui** - Componentes UI
- **Lucide React** - Ícones
- **Sonner** - Notificações
- **Wouter** - Roteamento

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou pnpm

## 🛠️ Instalação

1. **Clone ou extraia o projeto:**
```bash
cd ntoh-automacao
```

2. **Instale as dependências:**
```bash
npm install
# ou
pnpm install
```

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
# ou
pnpm dev
```

4. **Abra no navegador:**
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
ntoh-automacao/
├── client/
│   ├── public/              # Arquivos estáticos
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   │   ├── ui/         # Componentes shadcn/ui
│   │   │   ├── Sidebar.tsx
│   │   │   ├── CostForm.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ReturnForm.tsx
│   │   │   └── BillingSubsidebar.tsx
│   │   ├── pages/          # Páginas
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Billing.tsx
│   │   │   └── NotFound.tsx
│   │   ├── contexts/       # React Contexts
│   │   ├── hooks/          # Custom Hooks
│   │   ├── lib/            # Utilitários
│   │   ├── App.tsx         # Componente raiz
│   │   ├── main.tsx        # Entrada da aplicação
│   │   └── index.css       # Estilos globais
│   └── index.html
├── package.json
└── vite.config.ts
```

## 🎨 Tema e Cores

O projeto utiliza um tema escuro com cores principais:
- **Roxo**: `#a855f7` - Cor primária
- **Ciano**: `#06b6d4` - Cor de destaque
- **Fundo**: `oklch(0.12 0.01 280)` - Preto profundo
- **Texto**: `oklch(0.95 0.01 280)` - Branco

## 💾 Persistência de Dados

Todos os dados são salvos automaticamente no **LocalStorage** do navegador:
- `ntoh_fixed_costs` - Custos fixos
- `ntoh_variable_costs` - Custos variáveis
- `ntoh_products` - Produtos do estoque
- `ntoh_returns` - Devoluções

Os dados persistem mesmo após fechar o navegador.

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Compila para produção

# Preview
npm run preview      # Preview da build de produção

# Verificação
npm run check        # Verifica tipos TypeScript

# Formatação
npm run format       # Formata código com Prettier
```

## 📝 Como Usar

### Adicionar uma Devolução
1. Clique em "Nova Devolução"
2. Preencha os dados (nome, SKU, cor, tamanho, custo, quantidade, motivo)
3. Clique em "Adicionar"
4. Mova entre abas conforme o status muda

### Gerenciar Estoque
1. Clique em "Novo Produto"
2. Preencha os dados do produto
3. O valor total é calculado automaticamente
4. Use os botões de ação para editar, duplicar ou remover

### Controlar Custos
1. Vá para a aba "Custos"
2. Adicione custos fixos e variáveis
3. Visualize os totalizadores em tempo real

### Analisar Faturamento
1. Vá para a aba "Faturamento"
2. Visualize gráficos de distribuição de custos
3. Acompanhe receita vs custos

## 🐛 Troubleshooting

### Dados não aparecem após recarregar
- Verifique se o LocalStorage está habilitado no navegador
- Abra DevTools (F12) → Application → LocalStorage

### Porta 3000 já está em uso
```bash
npm run dev -- --port 3001
```

### Erro de módulos não encontrados
```bash
# Limpe node_modules e reinstale
rm -rf node_modules
npm install
```

## 📦 Build para Produção

```bash
npm run build
npm run preview
```

Os arquivos compilados estarão em `dist/`

## 🤝 Contribuindo

Sinta-se livre para fazer fork, criar branches e enviar pull requests!

## 📄 Licença

MIT

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Se todos os pré-requisitos estão instalados
2. Se as dependências foram instaladas corretamente
3. Se o servidor está rodando na porta correta

---

**Desenvolvido com ❤️ para automação de processos**
