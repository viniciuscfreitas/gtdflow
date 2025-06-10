#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔥 GTD Flow - Update Firebase Admin Credentials\n');

const envPath = path.join(process.cwd(), '.env.local');

// Firebase Admin credentials
const clientEmail = 'firebase-adminsdk-fbsvc@gtd-flow-app.iam.gserviceaccount.com';
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCIF3gPjUUTYYe+
jROsjHPfZL4+spJnYbEL12BEelqN9RA6WvV/dcPksAdWo6juLGix0o0xck2BZ7KG
OoF5GaHA8CR+XuiMa6jMAtr+d7cAzr5dp49Za9gfKviLt1+4HmXvFvNHqkJzIHOw
0AKtlxq36NzBe66vS5/x2xcxVek02jfLqBURCL8c3dtvpzTWCEMMBKFjtVIFztIO
Ed1fC12QvmykhILDtnvmNMGd68m+iXUqhhEjc75AwRXxpVkO7N2uSfRGZ9u4Mjc+
AdLQiZc1ZbEB0ntTg4NrbWFXWp4ecgyoEG/QgQvYR6/w3gLhfM25b9o2IOnCvTb2
54xEbnPdAgMBAAECggEAAMNc7X1lz0ODPtrMqvGIrs6CUJiwwHqoQwA8rnWfL1+Z
7THYYZQX+p7QE7jMODWwipq7JvVUoO6jbiRC2Jp/sTTHh5vhovPxmN9FOhsSwCLo
p17Kq34y0o3roeDv3PjyqmIPEC5QvBOJAotQEIgh4rkgD8exRZNffLw1R5YLPjwe
7xOcuZCf+qitRC3qTKFR9Y26W5l0Kp+MtFp2IQi7n4OUGcuu+JjYUzl422d3+Jv9
G651NKZZreFifh7jA9g6M3aqMLVDuBQyvn19AHX8hu9QqB4UOGI/rdLrcJgapPAn
DtC8fySQozCW98e0fJVHOaLa4fzXXYiVKsDayC6GAwKBgQC641CwWDLrh00uOtCX
Nk6gehcRmDSb5+4FCnqpOJUBmS/dxWclzvuBw+Ej8MlKnpy9Y5bLX/TElQ88kCKC
VoMJJITetv2TPlJHvDi4lsigu2Bsyo/VQzpfdR1bmUitbmwHpsI+dd2QprxB8pM1
vG0aX6xl/PMraOYDGuDx2Lq+jwKBgQC6a0USZmSZOHXo3aMVDxkBvmFCPpKjQUEN
Ky5gvFPEohVFHqfM6baA4KOq/3RvDHKpYNZGCXcVX7iOJP2xo7HleMvxbPcL+ybD
fXGvVUcRAJL15T7uMACmhhdqCwN+aoFSAGdmumDCxAU5faY33zeKT5ti6wDqUuks
qM+MHXhc0wKBgFgBJQT1c3z/qLOFVKZwF1RwSZ6qatOjwqyzA5HeKCSpiyXGiE0A
i+TOZZ10DIXL7Qkt9VttoyhS/OrLAMUZkfjjLoJl70DADyTimF8r+evecIiqVlLZ
poo+7wUsSFIK9mof98ZL4Hr2WR5A6VtbkJDjzp30IFonunBp3tVj9oQ3AoGBAIqI
OLYpvUxXttesDQsTQyQWlDQkR9hmH69njXl5uk5/nIrW8x/F9kfjp/zlBWOYvoS8
X7+APSx3C7EmMBkYapT6paPts9EFfJL938PJ/ZvW718oUxGyPmmBcFjvglMpVpzX
i/+9NTbHcJJ+m00d5io0amah+PYpUvpLIKEhLVbdAoGAdK2nXySx9H7uSt+F2NLJ
WTOC1EPdeVEhyw/u+RrOA6FHfPtv9tJCr6Y+1TtPpQk5AsxvwWv/ital0c0efE+K
+8w2T3MvrBxgg757lKh3daAxWNKOA6x/ic6YQ3yp5xFXADxAbgupRXYn0tjNgkYJ
5sDaYe1T3tNVFUbXzFyRQ44=
-----END PRIVATE KEY-----`;

try {
  // Read current .env.local
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update Firebase Admin credentials
  envContent = envContent.replace(
    /FIREBASE_CLIENT_EMAIL=.*/,
    `FIREBASE_CLIENT_EMAIL=${clientEmail}`
  );
  
  envContent = envContent.replace(
    /FIREBASE_PRIVATE_KEY=".*"/s,
    `FIREBASE_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"`
  );
  
  // Write updated .env.local
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Firebase Admin credentials atualizadas!');
  console.log(`📧 Client Email: ${clientEmail}`);
  console.log('🔑 Private Key: Configurada');
  console.log('\n🔄 Próximo passo: Configurar Stripe');
  
} catch (error) {
  console.error('❌ Erro ao atualizar Firebase Admin:', error.message);
  process.exit(1);
} 