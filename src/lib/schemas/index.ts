import { z } from 'zod';

// Base schema
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string().optional(),
});

// OKRs Schemas
export const KeyResultSchema = BaseEntitySchema.extend({
  objectiveId: z.string().uuid(),
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().optional(),
  targetValue: z.number().min(0),
  currentValue: z.number().min(0),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  status: z.enum(['not-started', 'in-progress', 'completed', 'at-risk']),
});

export const ObjectiveSchema = BaseEntitySchema.extend({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().optional(),
  quarter: z.string().regex(/^Q[1-4] \d{4}$/, 'Formato deve ser Q1 2024'),
  year: z.number().min(2020).max(2030),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
  keyResults: z.array(KeyResultSchema),
});

// Action History Schema
export const ActionHistorySchema = BaseEntitySchema.extend({
  entityType: z.enum(['gtd', 'eisenhower', 'objective', 'keyresult', 'project', 'pomodoro']),
  entityId: z.string().uuid(),
  action: z.enum(['create', 'update', 'delete', 'complete', 'uncomplete', 'status-change']),
  previousState: z.record(z.unknown()),
  newState: z.record(z.unknown()),
  description: z.string().min(1),
  canUndo: z.boolean(),
  undoneAt: z.date().optional(),
});

// GTD Schemas
export const GTDItemSchema = BaseEntitySchema.extend({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().optional(),
  type: z.enum(['inbox', 'next-action', 'waiting-for', 'someday-maybe', 'project']),
  context: z.string().optional(),
  area: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'pending-approval', 'needs-revision']),
  dueDate: z.date().optional(),
  completedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  energy: z.enum(['low', 'medium', 'high']),
  estimatedTime: z.number().min(1).optional(),
  projectId: z.string().uuid().optional(),
  tags: z.array(z.string()),
  stakeholder: z.string().optional(),
});

export const GTDProjectSchema = BaseEntitySchema.extend({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'on-hold', 'cancelled']),
  area: z.string().optional(),
  nextActions: z.array(GTDItemSchema),
});

// Eisenhower Schemas
export const EisenhowerQuadrantSchema = z.enum([
  'urgent-important',
  'not-urgent-important', 
  'urgent-not-important',
  'not-urgent-not-important'
]);

export const EisenhowerTaskSchema = BaseEntitySchema.extend({
  gtdItemId: z.string().uuid().optional(),
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().optional(),
  quadrant: EisenhowerQuadrantSchema,
  urgency: z.number().min(1).max(5),
  importance: z.number().min(1).max(5),
  status: z.enum(['pending', 'in-progress', 'completed', 'pending-approval', 'needs-revision']),
  dueDate: z.date().optional(),
  completedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  stakeholder: z.string().optional(),
});

// Pareto Schemas
export const ParetoTaskSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1),
  timeSpent: z.number().min(0),
  impact: z.number().min(1).max(10),
  value: z.number().min(0),
  category: z.string().min(1),
});

export const ParetoAnalysisSchema = BaseEntitySchema.extend({
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  startDate: z.date(),
  endDate: z.date(),
  tasks: z.array(ParetoTaskSchema),
  insights: z.array(z.string()),
  highImpactTasks: z.array(z.string().uuid()),
});

// Pomodoro Schemas
export const PomodoroSessionSchema = BaseEntitySchema.extend({
  taskId: z.string().uuid().optional(),
  taskTitle: z.string().min(1, 'Título da tarefa é obrigatório'),
  duration: z.number().min(1).max(120), // 1-120 minutos
  breakDuration: z.number().min(1).max(60), // 1-60 minutos
  status: z.enum(['planned', 'active', 'completed', 'interrupted']),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  interruptions: z.number().min(0),
  notes: z.string().optional(),
});

export const PomodoroStatsSchema = BaseEntitySchema.extend({
  date: z.date(),
  totalSessions: z.number().min(0),
  completedSessions: z.number().min(0),
  totalFocusTime: z.number().min(0),
  totalBreakTime: z.number().min(0),
  interruptions: z.number().min(0),
  productivity: z.number().min(1).max(10),
});

// Dashboard Schemas
export const ProductivityMetricsSchema = z.object({
  date: z.date(),
  okrProgress: z.number().min(0).max(100),
  gtdItemsCompleted: z.number().min(0),
  eisenhowerDistribution: z.record(EisenhowerQuadrantSchema, z.number().min(0)),
  pomodoroSessions: z.number().min(0),
  focusTime: z.number().min(0),
  paretoEfficiency: z.number().min(0).max(100),
});

// Calendar Integration Schema
export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  source: z.enum(['google', 'manual']),
  taskId: z.string().uuid().optional(),
  pomodoroSessionId: z.string().uuid().optional(),
});

// User Settings Schema
export const UserSettingsSchema = BaseEntitySchema.extend({
  pomodoroSettings: z.object({
    workDuration: z.number().min(1).max(120).default(25),
    shortBreak: z.number().min(1).max(30).default(5),
    longBreak: z.number().min(1).max(60).default(15),
    longBreakInterval: z.number().min(2).max(10).default(4),
    autoStartBreaks: z.boolean().default(false),
    autoStartPomodoros: z.boolean().default(false),
    notifications: z.boolean().default(true),
  }),
  gtdSettings: z.object({
    defaultContext: z.string().default('@home'),
    defaultArea: z.string().default('Personal'),
    weeklyReview: z.boolean().default(true),
    inboxReminders: z.boolean().default(true),
  }),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['pt', 'en']).default('pt'),
});

// Sync Schema
export const SyncStatusSchema = z.object({
  lastSync: z.date(),
  pendingChanges: z.number().min(0),
  conflicts: z.array(z.string()),
  status: z.enum(['synced', 'pending', 'error']),
});

// Form Schemas (para React Hook Form)
export const CreateObjectiveSchema = ObjectiveSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  keyResults: true,
});

export const CreateKeyResultSchema = KeyResultSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export const CreateGTDItemSchema = GTDItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export const CreateEisenhowerTaskSchema = EisenhowerTaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export const CreatePomodoroSessionSchema = PomodoroSessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  startTime: true,
  endTime: true,
});

// Export types inferred from schemas
export type CreateObjectiveInput = z.infer<typeof CreateObjectiveSchema>;
export type CreateKeyResultInput = z.infer<typeof CreateKeyResultSchema>;
export type CreateGTDItemInput = z.infer<typeof CreateGTDItemSchema>;
export type CreateEisenhowerTaskInput = z.infer<typeof CreateEisenhowerTaskSchema>;
export type CreatePomodoroSessionInput = z.infer<typeof CreatePomodoroSessionSchema>; 