require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');
const { getAuth, GoogleAuthProvider, signInWithPopup } = require('firebase/auth');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Coleções para limpar
const COLLECTIONS = [
  'gtd_items',
  'gtd_projects', 
  'eisenhower_tasks',
  'objectives',
  'key_results',
  'pomodoro_sessions',
  'pomodoro_stats',
  'pareto_analyses',
  'calendar_events',
  'action_history'
];

async function cleanupUserDataWithGoogle() {
  try {
    console.log('🔐 Iniciando login com Google...');
    console.log('📱 Uma janela do navegador vai abrir para você fazer login');
    
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const userId = userCredential.user.uid;
    const userEmail = userCredential.user.email;
    
    console.log(`👤 Usuário autenticado: ${userId}`);
    console.log(`📧 Email: ${userEmail}`);
    
    // Confirmar antes de deletar
    console.log('\n⚠️  ATENÇÃO: Você está prestes a DELETAR TODOS os seus dados!');
    console.log('📋 Coleções que serão limpas:', COLLECTIONS.join(', '));
    console.log('\n⏳ Aguardando 5 segundos antes de iniciar...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    let totalDeleted = 0;
    
    for (const collectionName of COLLECTIONS) {
      console.log(`\n🗂️ Limpando coleção: ${collectionName}`);
      
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where('userId', '==', userId));
      
      const snapshot = await getDocs(q);
      console.log(`📄 Encontrados ${snapshot.docs.length} documentos`);
      
      let deletedInCollection = 0;
      
      for (const docSnapshot of snapshot.docs) {
        try {
          await deleteDoc(doc(db, collectionName, docSnapshot.id));
          deletedInCollection++;
          console.log(`✅ Deletado: ${docSnapshot.id}`);
        } catch (error) {
          console.error(`❌ Erro ao deletar ${docSnapshot.id}:`, error.message);
        }
      }
      
      console.log(`🧹 ${deletedInCollection} documentos deletados de ${collectionName}`);
      totalDeleted += deletedInCollection;
    }
    
    console.log(`\n🎉 LIMPEZA CONCLUÍDA!`);
    console.log(`📊 Total de documentos deletados: ${totalDeleted}`);
    console.log(`👤 Usuário: ${userEmail} (${userId})`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

// Executar limpeza com Google Auth
console.log('🧹 Script de Limpeza de Dados GTD');
console.log('🔐 Usando autenticação Google');

cleanupUserDataWithGoogle()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script falhou:', error);
    process.exit(1);
  }); 