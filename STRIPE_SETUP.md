# 🚀 GTD Flow - Guia de Configuração Stripe

## 📋 **PASSO A PASSO PARA CONFIGURAR STRIPE**

### **ETAPA 1: Criar/Acessar Conta Stripe**

1. **Acesse**: https://dashboard.stripe.com/
2. **Crie conta** ou faça login se já tiver
3. **Ative modo Test** (toggle no canto superior direito)
4. **Anote**: Você verá as chaves de teste

### **ETAPA 2: Criar Produtos GTD Flow Pro**

#### **Produto 1: GTD Flow Pro Monthly**
1. Vá para **Products** → **Add Product**
2. **Name**: `GTD Flow Pro`
3. **Description**: `Unlimited tasks, advanced methodologies, team features`
4. **Pricing Model**: `Recurring`
5. **Price**: `$12.00 USD`
6. **Billing Period**: `Monthly`
7. **Price ID**: Anote o `price_xxxxx` gerado

#### **Produto 2: GTD Flow Pro Yearly**
1. **Same Product** → **Add another price**
2. **Price**: `$99.00 USD`
3. **Billing Period**: `Yearly`
4. **Price ID**: Anote o `price_xxxxx` gerado

### **ETAPA 3: Configurar Webhook**

1. Vá para **Developers** → **Webhooks**
2. **Add endpoint**
3. **Endpoint URL**: `https://seu-dominio.vercel.app/api/stripe/webhook`
4. **Events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Signing secret**: Anote o `whsec_xxxxx`

### **ETAPA 4: Coletar Chaves**

#### **API Keys** (Developers → API Keys):
- **Publishable key**: `pk_test_xxxxx`
- **Secret key**: `sk_test_xxxxx`

#### **Webhook**:
- **Signing secret**: `whsec_xxxxx`

#### **Price IDs**:
- **Monthly**: `price_xxxxx`
- **Yearly**: `price_xxxxx`

---

## 🔧 **CONFIGURAÇÃO NO PROJETO**

### **Arquivo .env.local** (criar na raiz do projeto):

```bash
# Firebase Configuration (já existentes)
NEXT_PUBLIC_FIREBASE_API_KEY=your_existing_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_existing_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_existing_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_existing_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_existing_sender
NEXT_PUBLIC_FIREBASE_APP_ID=your_existing_app

# Firebase Admin (já existentes)
FIREBASE_CLIENT_EMAIL=your_existing_email
FIREBASE_PRIVATE_KEY="your_existing_private_key"

# Stripe Configuration (ADICIONAR)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Atualizar Price IDs no código**:

Arquivo: `src/lib/stripe/config.ts`
```typescript
PRODUCTS: {
  GTD_PRO_MONTHLY: 'price_SEU_PRICE_ID_MONTHLY',
  GTD_PRO_YEARLY: 'price_SEU_PRICE_ID_YEARLY',
},
```

---

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

- [ ] Conta Stripe criada/acessada
- [ ] Modo Test ativado
- [ ] Produto GTD Flow Pro criado
- [ ] Price Monthly ($12) criado
- [ ] Price Yearly ($99) criado
- [ ] Webhook configurado
- [ ] Chaves coletadas
- [ ] .env.local atualizado
- [ ] Price IDs atualizados no código
- [ ] Teste local funcionando

---

## 🧪 **COMO TESTAR**

1. **Start local**: `npm run dev`
2. **Acesse**: http://localhost:3000
3. **Login** com sua conta
4. **Clique** em qualquer botão "Upgrade Pro"
5. **Deve abrir**: Stripe Checkout
6. **Use cartão teste**: `4242 4242 4242 4242`
7. **Verifique**: Webhook recebido no Stripe Dashboard

---

## 🚀 **PRÓXIMOS PASSOS APÓS CONFIGURAÇÃO**

1. Testar fluxo completo
2. Verificar subscription sync no Firestore
3. Testar cancelamento
4. Configurar para produção (chaves live)

---

**📞 PRECISA DE AJUDA?**
- Stripe Docs: https://stripe.com/docs
- Webhook Testing: https://stripe.com/docs/webhooks/test 