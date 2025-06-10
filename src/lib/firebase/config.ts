import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyACQ3HnDS7PP1rYlQqY-WhWZg9R8hoBoew",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gtd-flow-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gtd-flow-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gtd-flow-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "368779095930",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:368779095930:web:05d67e63672433dc45b0c3",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Emulators desabilitados - usando Firebase em produção
// Para habilitar emulators em desenvolvimento, descomente as linhas abaixo
// if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//   } catch {
//     console.log('Auth emulator already connected');
//   }
//   
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//   } catch {
//     console.log('Firestore emulator already connected');
//   }
// }

export { auth, db };
export default app; 