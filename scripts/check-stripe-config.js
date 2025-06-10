#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 GTD Flow - Verificação de Configuração Stripe\n');

// Check .env.local
const envPath = path.join(process.cwd(), '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      envVars[key.trim()] = value.trim();
    }
  });
}

// Check Stripe config
const configPath = path.join(process.cwd(), 'src/lib/stripe/config.ts');
let priceIds = {};

if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  const monthlyMatch = configContent.match(/GTD_PRO_MONTHLY: '([^']*)'/);
  const yearlyMatch = configContent.match(/GTD_PRO_YEARLY: '([^']*)'/);
  
  if (monthlyMatch) priceIds.monthly = monthlyMatch[1];
  if (yearlyMatch) priceIds.yearly = yearlyMatch[1];
}

console.log('📋 STATUS DA CONFIGURAÇÃO:\n');

// Check Firebase
console.log('🔥 FIREBASE:');
const firebaseVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

firebaseVars.forEach(varName => {
  const value = envVars[varName];
  const status = value && !value.includes('YOUR_') ? '✅' : '❌';
  console.log(`  ${status} ${varName}`);
});

// Check Stripe
console.log('\n💳 STRIPE:');
const stripeVars = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

stripeVars.forEach(varName => {
  const value = envVars[varName];
  const status = value && !value.includes('YOUR_') ? '✅' : '❌';
  console.log(`  ${status} ${varName}`);
});

// Check Price IDs
console.log('\n💰 PRICE IDs:');
const monthlyStatus = priceIds.monthly && priceIds.monthly.startsWith('price_') && !priceIds.monthly.includes('_gtd_pro_') ? '✅' : '❌';
const yearlyStatus = priceIds.yearly && priceIds.yearly.startsWith('price_') && !priceIds.yearly.includes('_gtd_pro_') ? '✅' : '❌';

console.log(`  ${monthlyStatus} Monthly: ${priceIds.monthly || 'não configurado'}`);
console.log(`  ${yearlyStatus} Yearly: ${priceIds.yearly || 'não configurado'}`);

// Overall status
const allConfigured = firebaseVars.every(v => envVars[v] && !envVars[v].includes('YOUR_')) &&
                     stripeVars.every(v => envVars[v] && !envVars[v].includes('YOUR_')) &&
                     monthlyStatus === '✅' && yearlyStatus === '✅';

console.log('\n🎯 STATUS GERAL:');
if (allConfigured) {
  console.log('✅ Tudo configurado! Pronto para testar.');
  console.log('\n🚀 Próximo passo: npm run dev');
} else {
  console.log('❌ Configuração incompleta.');
  console.log('\n📝 Siga o guia STRIPE_SETUP.md para completar.');
} 