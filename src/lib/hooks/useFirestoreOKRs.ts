/**
 * Hook Firestore para OKRs (Objectives & Key Results)
 * 
 * Substitui useLocalStorage para dados OKRs
 * Mantém API idêntica mas usa Firestore com real-time listeners
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  orderBy,
  where,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/schema';
import { Objective, KeyResult } from '@/lib/types';

// ============================================================================
// OBJECTIVES HOOK
// ============================================================================

export function useFirestoreObjectives(user: User | null) {
  const [data, setData] = useState<Objective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // REAL-TIME LISTENER
  // ============================================================================

  useEffect(() => {
    if (!user) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Configurar listener em tempo real
    const objectivesCollectionRef = collection(
      db, 
      FIRESTORE_COLLECTIONS.USERS, 
      user.uid, 
      FIRESTORE_COLLECTIONS.OBJECTIVES
    );

    const q = query(
      objectivesCollectionRef,
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const objectives: Objective[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Pular itens deletados
            if (data.isDeleted) return;
            
            // Converter timestamps Firestore para Date
            const objective: Objective = {
              ...data,
              id: doc.id,
              userId: user.uid,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              dueDate: data.dueDate?.toDate() || undefined,
            } as unknown as Objective;
            
            objectives.push(objective);
          });

          setData(objectives);
          setError(null);
        } catch (err) {
          console.error('Erro ao processar dados de Objectives:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erro no listener de Objectives:', err);
        setError(err.message || 'Erro de conexão');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const create = useCallback(async (objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(collection(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.OBJECTIVES));
      
      const newObjective: Partial<Objective> = {
        ...objective,
        id: docRef.id,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(docRef, {
        ...newObjective,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        syncVersion: 1,
      });

      return { ...newObjective, id: docRef.id } as Objective;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar objetivo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const update = useCallback(async (id: string, updates: Partial<Omit<Objective, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.OBJECTIVES, id);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      // Retornar objetivo atualizado para compatibilidade
      const existingObjective = data.find(obj => obj.id === id);
      if (existingObjective) {
        return { ...existingObjective, ...updates, updatedAt: new Date() } as Objective;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar objetivo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, data]);

  const remove = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.OBJECTIVES, id);
      
      // Soft delete para sincronização
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar objetivo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const getById = useCallback((id: string): Objective | undefined => {
    return data.find(obj => obj.id === id);
  }, [data]);

  const refresh = useCallback(async () => {
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    create,
    update,
    remove,
    getById,
    refresh,
  };
}

// ============================================================================
// KEY RESULTS HOOK
// ============================================================================

export function useFirestoreKeyResults(user: User | null) {
  const [data, setData] = useState<KeyResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // REAL-TIME LISTENER
  // ============================================================================

  useEffect(() => {
    if (!user) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Configurar listener em tempo real
    const keyResultsCollectionRef = collection(
      db, 
      FIRESTORE_COLLECTIONS.USERS, 
      user.uid, 
      FIRESTORE_COLLECTIONS.KEY_RESULTS
    );

    const q = query(
      keyResultsCollectionRef,
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const keyResults: KeyResult[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Pular itens deletados
            if (data.isDeleted) return;
            
            // Converter timestamps Firestore para Date
            const keyResult: KeyResult = {
              ...data,
              id: doc.id,
              userId: user.uid,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              dueDate: data.dueDate?.toDate() || undefined,
            } as unknown as KeyResult;
            
            keyResults.push(keyResult);
          });

          setData(keyResults);
          setError(null);
        } catch (err) {
          console.error('Erro ao processar dados de Key Results:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erro no listener de Key Results:', err);
        setError(err.message || 'Erro de conexão');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const create = useCallback(async (keyResult: Omit<KeyResult, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(collection(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.KEY_RESULTS));
      
      const newKeyResult: Partial<KeyResult> = {
        ...keyResult,
        id: docRef.id,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(docRef, {
        ...newKeyResult,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        syncVersion: 1,
      });

      return { ...newKeyResult, id: docRef.id } as KeyResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar key result';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const update = useCallback(async (id: string, updates: Partial<Omit<KeyResult, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.KEY_RESULTS, id);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      // Retornar key result atualizado para compatibilidade
      const existingKeyResult = data.find(kr => kr.id === id);
      if (existingKeyResult) {
        return { ...existingKeyResult, ...updates, updatedAt: new Date() } as KeyResult;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar key result';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, data]);

  const remove = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.KEY_RESULTS, id);
      
      // Soft delete para sincronização
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar key result';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const getById = useCallback((id: string): KeyResult | undefined => {
    return data.find(kr => kr.id === id);
  }, [data]);

  const refresh = useCallback(async () => {
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    create,
    update,
    remove,
    getById,
    refresh,
  };
}

// ============================================================================
// COMBINED OKRs HOOK
// ============================================================================

export function useFirestoreOKRs(user: User | null) {
  const objectives = useFirestoreObjectives(user);
  const keyResults = useFirestoreKeyResults(user);

  return {
    objectives,
    keyResults,
    isLoading: objectives.isLoading || keyResults.isLoading,
    error: objectives.error || keyResults.error,
  };
} 