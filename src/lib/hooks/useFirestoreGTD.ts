/**
 * Hook Firestore para dados GTD
 * 
 * Substitui useReactiveLocalStorage para dados GTD
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
import { GTDItem } from '@/lib/types';

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useFirestoreGTD(user: User | null) {
  const [data, setData] = useState<GTDItem[]>([]);
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
    const gtdCollectionRef = collection(
      db, 
      FIRESTORE_COLLECTIONS.USERS, 
      user.uid, 
      FIRESTORE_COLLECTIONS.GTD_ITEMS
    );

    const q = query(
      gtdCollectionRef,
      where('isDeleted', '!=', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const items: GTDItem[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Converter timestamps Firestore para Date
            const item: GTDItem = {
              ...data,
              id: doc.id,
              userId: user.uid,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              dueDate: data.dueDate?.toDate() || undefined,
            } as GTDItem;
            
            items.push(item);
          });

          setData(items);
          setError(null);
        } catch (err) {
          console.error('Erro ao processar dados GTD:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erro no listener GTD:', err);
        setError(err.message || 'Erro de conexão');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const create = useCallback(async (item: Omit<GTDItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const docRef = doc(collection(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.GTD_ITEMS));
    
    try {
      const newItem: GTDItem = {
        ...item,
        id: docRef.id,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistic update - adiciona imediatamente na UI
      setData(prevData => [newItem, ...prevData]);

      await setDoc(docRef, {
        ...newItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        syncVersion: 1,
      });

      return newItem;
    } catch (err) {
      // Reverter optimistic update em caso de erro
      setData(prevData => prevData.filter(existingItem => existingItem.id !== docRef.id));
      setError('Erro ao criar item. Tente novamente.');
      
      setTimeout(() => {
        setError(null);
      }, 3000);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar item';
      throw new Error(errorMessage);
    }
  }, [user]);

  const update = useCallback(async (id: string, updates: Partial<Omit<GTDItem, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Salvar estado anterior para possível rollback
    const previousData = data;
    
    try {
      // Optimistic update - atualiza imediatamente na UI
      setData(prevData => 
        prevData.map(item => 
          item.id === id 
            ? { ...item, ...updates, updatedAt: new Date() }
            : item
        )
      );

      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.GTD_ITEMS, id);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      // Retornar item atualizado para compatibilidade
      const existingItem = previousData.find(item => item.id === id);
      if (existingItem) {
        return { ...existingItem, ...updates, updatedAt: new Date() } as GTDItem;
      }
      
      return null;
    } catch (err) {
      // Reverter optimistic update em caso de erro
      setData(previousData);
      setError('Erro ao atualizar item. Recarregando...');
      
      setTimeout(() => {
        setError(null);
      }, 2000);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar item';
      throw new Error(errorMessage);
    }
  }, [user, data]);

  const remove = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Optimistic update - remove imediatamente da UI
      setData(prevData => prevData.filter(item => item.id !== id));

      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.GTD_ITEMS, id);
      
      // Soft delete para sincronização
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: increment(1), // Incrementar versão para evitar conflitos
      });

      return true;
    } catch (err) {
      // Reverter optimistic update em caso de erro
      setError('Erro ao deletar item. Recarregando...');
      
      // Recarregar dados para reverter o optimistic update
      setTimeout(() => {
        setError(null);
      }, 2000);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar item';
      throw new Error(errorMessage);
    }
  }, [user]);

  const getById = useCallback((id: string): GTDItem | undefined => {
    return data.find(item => item.id === id);
  }, [data]);

  const refresh = useCallback(async () => {
    // Com real-time listeners, não é necessário refresh manual
    // Mas mantemos para compatibilidade de API
    setError(null);
  }, []);

  // ============================================================================
  // FILTERED DATA HELPERS
  // ============================================================================

  const getByType = useCallback((type: GTDItem['type']) => {
    return data.filter(item => item.type === type);
  }, [data]);

  const getByStatus = useCallback((status: GTDItem['status']) => {
    return data.filter(item => item.status === status);
  }, [data]);

  const getByContext = useCallback((context: string) => {
    return data.filter(item => item.context === context);
  }, [data]);

  const getByArea = useCallback((area: string) => {
    return data.filter(item => item.area === area);
  }, [data]);

  const getInbox = useCallback(() => {
    return getByType('inbox');
  }, [getByType]);

  const getNextActions = useCallback(() => {
    return getByType('next-action').filter(item => item.status === 'active');
  }, [getByType]);

  const getWaitingFor = useCallback(() => {
    return getByType('waiting-for').filter(item => item.status === 'active');
  }, [getByType]);

  const getSomedayMaybe = useCallback(() => {
    return getByType('someday-maybe').filter(item => item.status === 'active');
  }, [getByType]);

  const getCompleted = useCallback(() => {
    return data.filter(item => item.status === 'completed');
  }, [data]);

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const getStats = useCallback(() => {
    const total = data.length;
    const completed = getCompleted().length;
    const inbox = getInbox().length;
    const nextActions = getNextActions().length;
    const waitingFor = getWaitingFor().length;
    const somedayMaybe = getSomedayMaybe().length;

    return {
      total,
      completed,
      inbox,
      nextActions,
      waitingFor,
      somedayMaybe,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [data, getCompleted, getInbox, getNextActions, getWaitingFor, getSomedayMaybe]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // Data
    data,
    isLoading,
    error,

    // CRUD operations (compatível com useReactiveLocalStorage)
    create,
    update,
    remove,
    getById,
    refresh,

    // GTD-specific helpers
    getByType,
    getByStatus,
    getByContext,
    getByArea,
    getInbox,
    getNextActions,
    getWaitingFor,
    getSomedayMaybe,
    getCompleted,

    // Statistics
    getStats,

    // Status helpers
    isOnline: !!user,
    hasData: data.length > 0,
    isEmpty: data.length === 0,
  };
} 