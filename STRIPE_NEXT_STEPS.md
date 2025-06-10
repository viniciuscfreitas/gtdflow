# 🚀 GTD Flow - Próximos Passos Stripe

## ✅ **PROGRESSO ATUAL:**
- ✅ Firebase Admin: 100% configurado
- ✅ Produto Stripe: Criado (`prod_STWoY1M7ZPhFuh`)
- ❌ Price IDs: Precisam ser obtidos
- ❌ API Keys: Precisam ser copiadas
- ❌ Webhook: Precisa ser configurado

---

## 📋 **PASSO 1: OBTER PRICE IDs**

1. **Acesse**: https://dashboard.stripe.com/test/products
2. **Clique** no produto "GTD Flow Pro" (`prod_STWoY1M7ZPhFuh`)
3. **Verifique** se tem 2 preços:
   - **Monthly**: $12.00 USD
   - **Yearly**: $99.00 USD

4. **Se NÃO tem os preços**, crie:
   - **Add price** → $12.00 USD → Monthly
   - **Add price** → $99.00 USD → Yearly

5. **Copie os Price IDs**:
   - Monthly: `price_xxxxxxxxx`
   - Yearly: `price_xxxxxxxxx`

---

## 📋 **PASSO 2: OBTER API KEYS**

1. **Acesse**: https://dashboard.stripe.com/test/apikeys
2. **Copie**:
   - **Publishable key**: `pk_test_xxxxxxxxx`
   - **Secret key**: `sk_test_xxxxxxxxx` (clique "Reveal")

---

## 📋 **PASSO 3: CONFIGURAR WEBHOOK**

1. **Acesse**: https://dashboard.stripe.com/test/webhooks
2. **Add endpoint**
3. **Endpoint URL**: `http://localhost:3000/api/stripe/webhook` (para teste local)
4. **Events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copie** o **Signing secret**: `whsec_xxxxxxxxx`

---

## 🔧 **PASSO 4: ATUALIZAR CONFIGURAÇÃO**

### **Atualizar .env.local**:
```bash
# Substitua pelos valores reais:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SEU_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_SEU_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_SEU_WEBHOOK_SECRET
```

### **Atualizar Price IDs**:
```bash
# Execute com os Price IDs reais:
node scripts/update-stripe-prices.js price_MONTHLY_ID price_YEARLY_ID
```

---

## ✅ **PASSO 5: VERIFICAR E TESTAR**

```bash
# Verificar configuração
node scripts/check-stripe-config.js

# Se tudo OK, iniciar servidor
npm run dev

# Testar em: http://localhost:3000
# Cartão teste: 4242 4242 4242 4242
```

---

## 🎯 **RESULTADO ESPERADO**

Após completar estes passos:
- ✅ Botões "Upgrade Pro" funcionando
- ✅ Stripe Checkout abrindo
- ✅ Pagamento teste funcionando
- ✅ Webhook recebendo eventos
- ✅ Subscription sync no Firestore

---

**💡 DICA**: Mantenha o Stripe Dashboard aberto para ver os eventos em tempo real! 