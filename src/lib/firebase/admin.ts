import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Check if all required config is available
const hasRequiredConfig = firebaseAdminConfig.projectId && 
                          firebaseAdminConfig.clientEmail && 
                          firebaseAdminConfig.privateKey;

// Check if Firebase Admin is already initialized
const app = hasRequiredConfig && getApps().length === 0 
  ? initializeApp({
      credential: cert(firebaseAdminConfig),
      projectId: firebaseAdminConfig.projectId,
    })
  : getApps()[0] || null;

// Export Firebase Admin services
export const auth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null; 