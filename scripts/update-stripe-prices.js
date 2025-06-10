#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 GTD Flow - Update Stripe Price IDs\n');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log('❌ Uso incorreto!');
  console.log('\n📝 Como usar:');
  console.log('node scripts/update-stripe-prices.js <monthly_price_id> <yearly_price_id>');
  console.log('\n📋 Exemplo:');
  console.log('node scripts/update-stripe-prices.js price_1234monthly price_5678yearly');
  console.log('\n💡 Obtenha os Price IDs no Stripe Dashboard → Products');
  process.exit(1);
}

const [monthlyPriceId, yearlyPriceId] = args;

// Validate price IDs format
if (!monthlyPriceId.startsWith('price_') || !yearlyPriceId.startsWith('price_')) {
  console.log('❌ Price IDs devem começar com "price_"');
  console.log('📋 Exemplo: price_1234567890abcdef');
  process.exit(1);
}

const configPath = path.join(process.cwd(), 'src/lib/stripe/config.ts');

try {
  // Read current config
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Update price IDs
  configContent = configContent.replace(
    /GTD_PRO_MONTHLY: '[^']*'/,
    `GTD_PRO_MONTHLY: '${monthlyPriceId}'`
  );
  
  configContent = configContent.replace(
    /GTD_PRO_YEARLY: '[^']*'/,
    `GTD_PRO_YEARLY: '${yearlyPriceId}'`
  );
  
  // Write updated config
  fs.writeFileSync(configPath, configContent);
  
  console.log('✅ Price IDs atualizados com sucesso!');
  console.log(`📅 Monthly: ${monthlyPriceId}`);
  console.log(`📅 Yearly: ${yearlyPriceId}`);
  console.log('\n🔄 Reinicie o servidor de desenvolvimento:');
  console.log('npm run dev');
  
} catch (error) {
  console.error('❌ Erro ao atualizar Price IDs:', error.message);
  process.exit(1);
} 