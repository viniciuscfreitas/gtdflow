/**
 * Hooks de compatibilidade Firestore
 * 
 * Mantém API idêntica ao useLocalStorage para facilitar migração
 * Wraps os hooks Firestore complexos em interfaces simples
 */

'use client';

import { User } from 'firebase/auth';
import { useFirestoreGTD } from './useFirestoreGTD';
import { useFirestoreMatrix } from './useFirestoreMatrix';
import { useFirestoreOKRs } from './useFirestoreOKRs';
import { useFirestorePomodoro } from './useFirestorePomodoro';
import { useFirestorePareto } from './useFirestorePareto';
import { useFirestoreSettings } from './useFirestoreSettings';

// ============================================================================
// COMPATIBILITY HOOKS - API SIMPLES IGUAL AO LOCALSTORAGE
// ============================================================================

/**
 * Hook compatível para GTD Items
 * API idêntica ao useLocalStorage
 */
export function useGTDItemsFirestore(user: User | null) {
  return useFirestoreGTD(user);
}

/**
 * Hook compatível para Eisenhower Tasks
 * API idêntica ao useLocalStorage
 */
export function useEisenhowerTasksFirestore(user: User | null) {
  return useFirestoreMatrix(user);
}

/**
 * Hook compatível para Objectives
 * API idêntica ao useLocalStorage
 */
export function useObjectivesFirestore(user: User | null) {
  const { objectives } = useFirestoreOKRs(user);
  return objectives;
}

/**
 * Hook compatível para Key Results
 * API idêntica ao useLocalStorage
 */
export function useKeyResultsFirestore(user: User | null) {
  const { keyResults } = useFirestoreOKRs(user);
  return keyResults;
}

/**
 * Hook compatível para Pomodoro Sessions
 * API idêntica ao useLocalStorage
 */
export function usePomodoroSessionsFirestore(user: User | null) {
  const { sessions } = useFirestorePomodoro(user);
  return sessions;
}

/**
 * Hook compatível para Pomodoro Stats
 * API idêntica ao useLocalStorage
 */
export function usePomodoroStatsFirestore(user: User | null) {
  const { stats } = useFirestorePomodoro(user);
  return stats;
}

/**
 * Hook compatível para Pareto Analyses
 * API idêntica ao useLocalStorage
 */
export function useParetoAnalysesFirestore(user: User | null) {
  return useFirestorePareto(user);
}

/**
 * Hook compatível para User Settings
 * API idêntica ao useLocalStorage (mas retorna objeto único, não array)
 */
export function useUserSettingsFirestore(user: User | null) {
  return useFirestoreSettings(user);
} 