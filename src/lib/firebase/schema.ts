/**
 * Firebase Firestore Schema Design
 * 
 * Estrutura de dados para sincronização entre localStorage e Firestore
 * Mantém compatibilidade com estruturas existentes do GTD Flow MVP
 */

import type { 
  BaseEntity
} from '@/lib/types';

// ============================================================================
// FIRESTORE COLLECTIONS STRUCTURE
// ============================================================================

/**
 * Estrutura principal do Firestore:
 * 
 * /users/{userId}/
 *   ├── profile/                    # Perfil do usuário
 *   ├── gtd_items/                  # Itens GTD (inbox, next-actions, waiting-for, etc)
 *   ├── gtd_projects/               # Projetos GTD
 *   ├── eisenhower_tasks/           # Tarefas da Matriz de Eisenhower
 *   ├── objectives/                 # OKRs - Objetivos
 *   ├── key_results/                # OKRs - Key Results
 *   ├── pomodoro_sessions/          # Sessões Pomodoro
 *   ├── pomodoro_stats/             # Estatísticas Pomodoro
 *   ├── pareto_analyses/            # Análises Pareto
 *   ├── calendar_events/            # Eventos de calendário
 *   ├── action_history/             # Histórico de ações (para undo)
 *   ├── settings/                   # Configurações do usuário
 *   └── sync_metadata/              # Metadados de sincronização
 */

// ============================================================================
// FIRESTORE DOCUMENT INTERFACES
// ============================================================================

/**
 * Base para todos os documentos Firestore
 * Adiciona campos específicos para sincronização
 */
export interface FirestoreBaseEntity extends Omit<BaseEntity, 'userId'> {
  // userId é implícito na estrutura /users/{userId}/collection
  
  // Metadados de sincronização
  lastSyncedAt?: Date;
  syncVersion: number;
  deviceId?: string; // Identificador do dispositivo que fez a última alteração
  conflictResolution?: 'local' | 'remote' | 'manual';
  
  // Soft delete para sincronização
  isDeleted?: boolean;
  deletedAt?: Date;
}

/**
 * Perfil do usuário
 */
export interface UserProfile {
  id: string; // mesmo que userId
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  
  // Configurações de sincronização
  syncEnabled: boolean;
  autoSync: boolean;
  syncFrequency: 'realtime' | 'manual' | 'periodic';
  
  // Estatísticas gerais
  totalTasks: number;
  completedTasks: number;
  totalProjects: number;
  joinedAt: Date;
}

/**
 * GTD Items no Firestore
 */
export interface FirestoreGTDItem extends FirestoreBaseEntity {
  title: string;
  description?: string;
  type: 'inbox' | 'next-action' | 'waiting-for' | 'someday-maybe' | 'project' | 'reference';
  context?: string;
  area?: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending-approval' | 'needs-revision';
  dueDate?: Date;
  completedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  energy: 'low' | 'medium' | 'high';
  estimatedTime?: number;
  projectId?: string;
  tags: string[];
  stakeholder?: string;
  
  // Campos específicos para delegação (waiting-for)
  delegatedTo?: string;
  delegationType?: 'internal' | 'external' | 'waiting';
  followUpDate?: Date;
  deadline?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  followUpContext?: string;
}

/**
 * Projetos GTD no Firestore
 */
export interface FirestoreGTDProject extends FirestoreBaseEntity {
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  area?: string;
  
  // Referências para next actions (mantidas como IDs)
  nextActionIds: string[];
  
  // Metadados do projeto
  startDate?: Date;
  targetDate?: Date;
  completedAt?: Date;
  progress: number; // 0-100%
}

/**
 * Tarefas da Matriz de Eisenhower no Firestore
 */
export interface FirestoreEisenhowerTask extends FirestoreBaseEntity {
  gtdItemId?: string;
  title: string;
  description?: string;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
  urgency: number;
  importance: number;
  status: 'pending' | 'in-progress' | 'completed' | 'pending-approval' | 'needs-revision';
  dueDate?: Date;
  completedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  stakeholder?: string;
  
  // Campos adicionais para matriz
  estimatedTime?: number;
  actualTime?: number;
  energy: 'low' | 'medium' | 'high';
  context?: string;
}

/**
 * Objetivos (OKRs) no Firestore
 */
export interface FirestoreObjective extends FirestoreBaseEntity {
  title: string;
  description?: string;
  quarter: string;
  year: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  
  // Referências para Key Results (mantidas como IDs)
  keyResultIds: string[];
  
  // Metadados
  progress: number; // 0-100% calculado dos Key Results
  startDate?: Date;
  targetDate?: Date;
}

/**
 * Key Results no Firestore
 */
export interface FirestoreKeyResult extends FirestoreBaseEntity {
  objectiveId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk';
  
  // Histórico de progresso
  progressHistory: Array<{
    date: Date;
    value: number;
    note?: string;
  }>;
}

/**
 * Sessões Pomodoro no Firestore
 */
export interface FirestorePomodoroSession extends FirestoreBaseEntity {
  taskId?: string;
  taskTitle: string;
  duration: number;
  breakDuration: number;
  status: 'planned' | 'active' | 'completed' | 'interrupted';
  startTime?: Date;
  endTime?: Date;
  interruptions: number;
  notes?: string;
  
  // Metadados adicionais
  productivity?: number; // 1-10 autoavaliação
  mood?: 'great' | 'good' | 'okay' | 'poor';
  environment?: string; // casa, escritório, café, etc
}

/**
 * Estatísticas Pomodoro no Firestore
 */
export interface FirestorePomodoroStats extends FirestoreBaseEntity {
  date: Date;
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number;
  totalBreakTime: number;
  interruptions: number;
  productivity: number;
  
  // Breakdown por período do dia
  morningStats?: { sessions: number; focusTime: number; productivity: number };
  afternoonStats?: { sessions: number; focusTime: number; productivity: number };
  eveningStats?: { sessions: number; focusTime: number; productivity: number };
}

/**
 * Análises Pareto no Firestore
 */
export interface FirestoreParetoAnalysis extends FirestoreBaseEntity {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: Date;
  endDate: Date;
  insights: string[];
  highImpactTaskIds: string[];
  
  // Tarefas analisadas
  tasks: Array<{
    taskId: string;
    title: string;
    timeSpent: number;
    impact: number;
    value: number;
    category: string;
    efficiency: number; // valor/tempo
  }>;
  
  // Métricas calculadas
  totalTimeSpent: number;
  highImpactPercentage: number; // % de tempo em tarefas de alto impacto
  efficiency: number; // valor total / tempo total
}

/**
 * Eventos de calendário no Firestore
 */
export interface FirestoreCalendarEvent extends FirestoreBaseEntity {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  source: 'google' | 'manual';
  taskId?: string;
  pomodoroSessionId?: string;
  
  // Metadados adicionais
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  recurrence?: string; // RRULE format
}

/**
 * Histórico de ações no Firestore
 */
export interface FirestoreActionHistory extends FirestoreBaseEntity {
  entityType: 'gtd' | 'eisenhower' | 'objective' | 'keyresult' | 'project' | 'pomodoro';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'complete' | 'uncomplete' | 'status-change';
  previousState: Record<string, unknown>;
  newState: Record<string, unknown>;
  description: string;
  canUndo: boolean;
  undoneAt?: Date;
  
  // Metadados de contexto
  deviceInfo?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Configurações do usuário no Firestore
 */
export interface FirestoreUserSettings extends FirestoreBaseEntity {
  pomodoroSettings: {
    workDuration: number;
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    notifications: boolean;
    soundEnabled: boolean;
    soundVolume: number;
  };
  gtdSettings: {
    defaultContext: string;
    defaultArea: string;
    weeklyReview: boolean;
    inboxReminders: boolean;
    autoArchive: boolean;
    archiveDays: number;
  };
  eisenhowerSettings: {
    autoCalculatePriority: boolean;
    showQuadrantLabels: boolean;
    defaultView: 'grid' | 'list';
  };
  theme: 'light' | 'dark' | 'system';
  language: 'pt' | 'en';
  
  // Configurações de sincronização
  syncSettings: {
    enabled: boolean;
    frequency: 'realtime' | 'manual' | 'periodic';
    conflictResolution: 'ask' | 'local' | 'remote';
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
  
  // Configurações de notificação
  notificationSettings: {
    enabled: boolean;
    email: boolean;
    push: boolean;
    reminders: boolean;
    deadlines: boolean;
    achievements: boolean;
  };
}

/**
 * Metadados de sincronização
 */
export interface SyncMetadata {
  id: string;
  lastFullSync: Date;
  lastIncrementalSync: Date;
  pendingChanges: number;
  conflicts: Array<{
    id: string;
    collection: string;
    field: string;
    localValue: unknown;
    remoteValue: unknown;
    timestamp: Date;
    resolved: boolean;
  }>;
  syncStatus: 'synced' | 'pending' | 'error' | 'conflict';
  errorMessage?: string;
  
  // Estatísticas de sincronização
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number; // em ms
  
  // Configurações de dispositivo
  deviceId: string;
  deviceName: string;
  lastActiveAt: Date;
}

// ============================================================================
// COLLECTION NAMES
// ============================================================================

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  GTD_ITEMS: 'gtd_items',
  GTD_PROJECTS: 'gtd_projects',
  EISENHOWER_TASKS: 'eisenhower_tasks',
  OBJECTIVES: 'objectives',
  KEY_RESULTS: 'key_results',
  POMODORO_SESSIONS: 'pomodoro_sessions',
  POMODORO_STATS: 'pomodoro_stats',
  PARETO_ANALYSES: 'pareto_analyses',
  CALENDAR_EVENTS: 'calendar_events',
  ACTION_HISTORY: 'action_history',
  SETTINGS: 'settings',
  SYNC_METADATA: 'sync_metadata',
} as const;

// ============================================================================
// MAPPING UTILITIES
// ============================================================================

/**
 * Remove campos undefined de um objeto (Firestore não aceita undefined)
 */
function removeUndefinedFields(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursivamente limpar objetos aninhados
        cleaned[key] = removeUndefinedFields(value as Record<string, unknown>);
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * Mapeia entidade local para Firestore
 */
export function mapLocalToFirestore<T extends BaseEntity>(
  localEntity: T,
  deviceId: string
): FirestoreBaseEntity {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId, ...entityWithoutUserId } = localEntity;
  
  const firestoreEntity = {
    ...entityWithoutUserId,
    syncVersion: 1,
    deviceId,
    lastSyncedAt: new Date(),
    isDeleted: false,
  };
  
  // Remove campos undefined que causam erro no Firestore
  return removeUndefinedFields(firestoreEntity) as unknown as FirestoreBaseEntity;
}

/**
 * Mapeia entidade Firestore para local
 */
export function mapFirestoreToLocal<T extends FirestoreBaseEntity>(
  firestoreEntity: T,
  userId: string
): BaseEntity {
  // Remove campos específicos do Firestore
  const localEntity = { ...firestoreEntity };
  delete (localEntity as any).syncVersion;
  delete (localEntity as any).deviceId;
  delete (localEntity as any).lastSyncedAt;
  delete (localEntity as any).conflictResolution;
  delete (localEntity as any).isDeleted;
  delete (localEntity as any).deletedAt;
  
  return {
    ...localEntity,
    userId,
  } as BaseEntity;
}

/**
 * Gera ID único para dispositivo
 */
export function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `device_${timestamp}_${random}`;
}

/**
 * Valida se entidade pode ser sincronizada
 */
export function canSync(entity: BaseEntity): boolean {
  // Regras de validação para sincronização
  return !!(
    entity.id &&
    entity.createdAt &&
    entity.updatedAt
  );
} 