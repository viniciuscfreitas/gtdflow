# 🔥 Configuração do Firebase - GTD Flow

## 📋 Passos para Configurar Firebase

### 1. Criar Projeto Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Add project" ou "Criar um projeto"
3. Nome sugerido: `gtd-flow-app`
4. Ative Google Analytics (opcional)

### 2. Configurar Authentication
1. No console Firebase, vá em **Authentication** > **Get started**
2. Aba **Sign-in method**:
   - Ative **Email/Password**
   - Ative **Google** (configure OAuth)

### 3. Configurar Firestore Database
1. Vá em **Firestore Database** > **Create database**
2. Escolha **Start in test mode** (por enquanto)
3. Selecione uma localização (ex: `us-central1`)

### 4. Obter Credenciais Web App
1. Vá em **Project Settings** (ícone de engrenagem)
2. Aba **General** > seção **Your apps**
3. Clique em **Add app** > **Web** (ícone `</>`)
4. Nome: `gtd-flow-web`
5. **NÃO** ative Firebase Hosting por enquanto
6. Copie as credenciais que aparecem

### 5. Configurar Variáveis de Ambiente
Crie o arquivo `.env.local` na raiz do projeto com:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

### 6. Regras de Segurança Firestore
No console Firebase > **Firestore Database** > **Rules**, substitua por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários só podem acessar seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcolecoes do usuário
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## ✅ Verificação
Após configurar, o app deve:
- Conectar com Firebase sem erros
- Permitir registro de usuários
- Permitir login com email/senha
- Permitir login com Google

## 🚨 Importante
- **NÃO** commite o arquivo `.env.local`
- Mantenha as credenciais seguras
- Use regras de segurança no Firestore 