#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 GTD Flow - Setup Environment Variables\n');

const envTemplate = `# Firebase Configuration (valores atuais do projeto)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyACQ3HnDS7PP1rYlQqY-WhWZg9R8hoBoew
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gtd-flow-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gtd-flow-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gtd-flow-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=368779095930
NEXT_PUBLIC_FIREBASE_APP_ID=1:368779095930:web:05d67e63672433dc45b0c3

# Firebase Admin (CONFIGURAR - necessário para webhooks Stripe)
# Obter em: Firebase Console → Project Settings → Service Accounts → Generate new private key
FIREBASE_CLIENT_EMAIL=your_service_account_email@gtd-flow-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"

# Stripe Configuration (CONFIGURAR - seguir STRIPE_SETUP.md)
# Obter em: https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Stripe Webhook (CONFIGURAR após criar webhook)
# Obter em: https://dashboard.stripe.com/test/webhooks
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    const currentContent = fs.readFileSync(envPath, 'utf8');
    if (currentContent.trim().length > 0) {
      console.log('⚠️  .env.local já existe com conteúdo.');
      console.log('📝 Backup será criado como .env.local.backup\n');
      fs.writeFileSync(envPath + '.backup', currentContent);
    }
  }

  // Write new template
  fs.writeFileSync(envPath, envTemplate);
  
  console.log('✅ .env.local criado com sucesso!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Siga o guia STRIPE_SETUP.md');
  console.log('2. Configure Firebase Admin (service account)');
  console.log('3. Configure Stripe (chaves e webhook)');
  console.log('4. Execute: npm run dev');
  console.log('\n🔗 Links úteis:');
  console.log('- Stripe Dashboard: https://dashboard.stripe.com/');
  console.log('- Firebase Console: https://console.firebase.google.com/');
  
} catch (error) {
  console.error('❌ Erro ao criar .env.local:', error.message);
  process.exit(1);
} 