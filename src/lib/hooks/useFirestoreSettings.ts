/**
 * Hook Firestore para User Settings
 * 
 * Substitui useLocalStorage para configurações do usuário
 * Mantém API idêntica mas usa Firestore com real-time listeners
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/schema';
import { UserSettings } from '@/lib/types';

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useFirestoreSettings(user: User | null) {
  const [data, setData] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // REAL-TIME LISTENER
  // ============================================================================

  useEffect(() => {
    if (!user) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Configurar listener em tempo real para documento único de settings
    const settingsDocRef = doc(
      db, 
      FIRESTORE_COLLECTIONS.USERS, 
      user.uid, 
      'settings',
      'user-settings'
    );

    const unsubscribe = onSnapshot(
      settingsDocRef,
      (doc) => {
        try {
          if (doc.exists()) {
            const data = doc.data();
            
            // Converter timestamps Firestore para Date
            const settings: UserSettings = {
              ...data,
              id: doc.id,
              userId: user.uid,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as UserSettings;
            
            setData(settings);
          } else {
            // Criar settings padrão se não existir
            const defaultSettings: UserSettings = {
              id: 'user-settings',
              userId: user.uid,
              theme: 'light',
              language: 'pt',
              pomodoroSettings: {
                workDuration: 25,
                shortBreak: 5,
                longBreak: 15,
                longBreakInterval: 4,
                autoStartBreaks: false,
                autoStartPomodoros: false,
                notifications: true,
              },
              gtdSettings: {
                defaultContext: '@home',
                defaultArea: 'Personal',
                weeklyReview: true,
                inboxReminders: true,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            setData(defaultSettings);
          }
          
          setError(null);
        } catch (err) {
          console.error('Erro ao processar settings:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erro no listener de Settings:', err);
        setError(err.message || 'Erro de conexão');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const update = useCallback(async (updates: Partial<Omit<UserSettings, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Salvar estado anterior para possível rollback
    const previousData = data;
    
    try {
      // Optimistic update - atualiza imediatamente na UI
      if (data) {
        setData({ ...data, ...updates, updatedAt: new Date() });
      }

      const settingsDocRef = doc(
        db, 
        FIRESTORE_COLLECTIONS.USERS, 
        user.uid, 
        'settings',
        'user-settings'
      );
      
      // Se é a primeira vez, criar documento
      if (!data) {
        const newSettings: UserSettings = {
          id: 'user-settings',
          userId: user.uid,
          theme: 'light',
          language: 'pt',
          pomodoroSettings: {
            workDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            longBreakInterval: 4,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            notifications: true,
          },
          gtdSettings: {
            defaultContext: '@home',
            defaultArea: 'Personal',
            weeklyReview: true,
            inboxReminders: true,
          },
          ...updates,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(settingsDocRef, {
          ...newSettings,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          syncVersion: 1,
        });

        return newSettings;
      } else {
        // Atualizar documento existente
        await updateDoc(settingsDocRef, {
          ...updates,
          updatedAt: serverTimestamp(),
          syncVersion: increment(1),
        });

        return { ...data, ...updates, updatedAt: new Date() } as UserSettings;
      }
    } catch (err) {
      // Reverter optimistic update em caso de erro
      setData(previousData);
      setError('Erro ao salvar configurações. Tente novamente.');
      
      setTimeout(() => {
        setError(null);
      }, 3000);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar configurações';
      throw new Error(errorMessage);
    }
  }, [user, data]);

  const refresh = useCallback(async () => {
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    update,
    refresh,
  };
} 