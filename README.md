# gtd

Projeto criado com a stack completa do v0.dev.

## 🚀 Stack Tecnológica

### Frontend

- **Next.js 15** - App Router, Server Components, Turbopack
- **React 19** - Últimas funcionalidades e hooks
- **TypeScript 5** - Tipagem estática avançada
- **Tailwind CSS v4** - Styling utilitário moderno
- **Shadcn/ui** - Componentes acessíveis e customizáveis
- **Radix UI** - Primitivos de UI robustos
- **Lucide React** - Ícones modernos e otimizados

### Bibliotecas Incluídas

- **React Query** - Gerenciamento de estado e cache
- **Next Auth** - Autenticação robusta
- **Zod + React Hook Form** - Validação de formulários
- **Framer Motion** - Animações fluidas
- **Axios** - Requisições HTTP
- **React Hot Toast** - Notificações elegantes

### Desenvolvimento

- **Jest + Testing Library** - Testes unitários
- **ESLint + Prettier** - Qualidade de código
- **TypeScript strict mode** - Máxima segurança de tipos

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção

# Qualidade de código
npm run lint         # ESLint
npm run lint:fix     # Corrige problemas automaticamente
npm run format       # Formata código com Prettier
npm run type-check   # Verifica tipos TypeScript

# Testes
npm test             # Executa testes
npm run test:watch   # Testes em modo watch
npm run test:coverage # Cobertura de testes

# Utilitários
npm run clean        # Limpa arquivos de build
npm run analyze      # Analisa bundle size
```

## 🎨 Componentes Inclusos

- **Básicos**: Button, Card, Input, Label
- **Navegação**: Navigation Menu, Menubar, Context Menu
- **Layouts**: Dialog, Sheet, Accordion, Tabs, Table
- **Feedback**: Progress, Skeleton, Sonner (Toast), Alert Dialog
- **Formulários**: Form, Select, Checkbox, Radio Group, Slider, Switch
- **Dados**: Calendar, Avatar, Badge, Separator, Scroll Area

## 🚀 Como usar

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Iniciar desenvolvimento:**

   ```bash
   npm run dev
   ```

3. **Adicionar componentes:**
   ```bash
   npx shadcn@latest add [component-name]
   ```

## 📁 Estrutura do Projeto

```
gtd/
├── src/
│   ├── app/                 # App Router (Next.js 15)
│   │   └── ui/             # Componentes Shadcn/ui
│   └── lib/                # Utilitários e configurações
├── public/                 # Arquivos estáticos
├── components.json         # Configuração Shadcn/ui
├── tailwind.config.js      # Configuração Tailwind
└── tsconfig.json          # Configuração TypeScript
```

## 📖 Próximos Passos

1. Configure variáveis de ambiente no `.env`
2. Adicione mais componentes: `npx shadcn@latest add [component]`
3. Configure autenticação com Next Auth
4. Para Sentry: `npx @sentry/wizard@latest -i nextjs`
5. Deploy na Vercel: `vercel --prod`

---

Criado com ❤️ usando a stack v0.dev
