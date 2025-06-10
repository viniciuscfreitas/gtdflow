// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // Para sync com NextAuth
}

// Action History for Undo functionality
export interface ActionHistory extends BaseEntity {
  entityType: 'gtd' | 'eisenhower' | 'objective' | 'keyresult' | 'project' | 'pomodoro';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'complete' | 'uncomplete' | 'status-change';
  previousState: Record<string, unknown>;
  newState: Record<string, unknown>;
  description: string;
  canUndo: boolean;
  undoneAt?: Date;
}

// OKRs (Estratégia)
export interface Objective extends BaseEntity {
  title: string;
  description?: string;
  quarter: string; // Q1 2024, Q2 2024, etc
  year: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  keyResults: KeyResult[];
}

export interface KeyResult extends BaseEntity {
  objectiveId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string; // %, units, $, etc
  status: 'not-started' | 'in-progress' | 'completed' | 'at-risk';
}

// GTD (Organização) - Extended with new statuses
export interface GTDItem extends BaseEntity {
  title: string;
  description?: string;
  type: 'inbox' | 'next-action' | 'waiting-for' | 'someday-maybe' | 'project' | 'reference';
  context?: string; // @home, @office, @calls, etc
  area?: string; // Work, Personal, Health, etc
  status: 'active' | 'completed' | 'cancelled' | 'pending-approval' | 'needs-revision';
  dueDate?: Date;
  completedAt?: string; // ISO string quando foi concluído
  approvedAt?: string; // ISO string quando foi aprovado
  rejectedAt?: string; // ISO string quando foi rejeitado
  rejectionReason?: string; // Motivo da rejeição
  energy: 'low' | 'medium' | 'high';
  estimatedTime?: number; // em minutos
  projectId?: string;
  tags: string[];
  stakeholder?: string; // Quem precisa aprovar
}

export interface GTDProject extends BaseEntity {
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  area?: string;
  nextActions: GTDItem[];
}

// Matriz de Eisenhower (Priorização) - Extended with new statuses
export type EisenhowerQuadrant = 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';

export interface EisenhowerTask extends BaseEntity {
  gtdItemId?: string; // Referência para item GTD
  title: string;
  description?: string;
  quadrant: EisenhowerQuadrant;
  urgency: number; // 1-5
  importance: number; // 1-5
  status: 'pending' | 'in-progress' | 'completed' | 'pending-approval' | 'needs-revision';
  dueDate?: Date;
  completedAt?: string; // ISO string quando foi concluído
  approvedAt?: string; // ISO string quando foi aprovado
  rejectedAt?: string; // ISO string quando foi rejeitado
  rejectionReason?: string; // Motivo da rejeição
  stakeholder?: string; // Quem precisa aprovar
}

// Princípio de Pareto (Reflexão)
export interface ParetoAnalysis extends BaseEntity {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: Date;
  endDate: Date;
  tasks: ParetoTask[];
  insights: string[];
  highImpactTasks: string[]; // IDs das tarefas de alto impacto
}

export interface ParetoTask {
  taskId: string;
  title: string;
  timeSpent: number; // em minutos
  impact: number; // 1-10
  value: number; // resultado/benefício obtido
  category: string;
}

// Método Pomodoro (Execução)
export interface PomodoroSession extends BaseEntity {
  taskId?: string; // Referência para tarefa
  taskTitle: string;
  duration: number; // em minutos (25, 15, 45, etc)
  breakDuration: number; // em minutos (5, 15, 30)
  status: 'planned' | 'active' | 'completed' | 'interrupted';
  startTime?: Date;
  endTime?: Date;
  interruptions: number;
  notes?: string;
}

export interface PomodoroStats extends BaseEntity {
  date: Date;
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // em minutos
  totalBreakTime: number;
  interruptions: number;
  productivity: number; // 1-10
}

// Dashboard e Analytics
export interface ProductivityMetrics {
  date: Date;
  okrProgress: number; // % média de progresso dos OKRs
  gtdItemsCompleted: number;
  eisenhowerDistribution: Record<EisenhowerQuadrant, number>;
  pomodoroSessions: number;
  focusTime: number; // em minutos
  paretoEfficiency: number; // % de tempo em tarefas de alto impacto
}

// Integrações
export interface CalendarEvent extends BaseEntity {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  source: 'google' | 'manual';
  taskId?: string; // Referência para tarefa
  pomodoroSessionId?: string;
}

// User Settings
export interface UserSettings extends BaseEntity {
  pomodoroSettings: {
    workDuration: number;
    shortBreak: number;
    longBreak: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    notifications: boolean;
  };
  gtdSettings: {
    defaultContext: string;
    defaultArea: string;
    weeklyReview: boolean;
    inboxReminders: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: 'pt' | 'en';
}

// Sync and Storage
export interface SyncStatus {
  lastSync: Date;
  pendingChanges: number;
  conflicts: string[];
  status: 'synced' | 'pending' | 'error';
} 