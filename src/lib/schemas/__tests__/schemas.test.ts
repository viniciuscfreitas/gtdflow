import { describe, it, expect } from '@jest/globals';
import {
  ObjectiveSchema,
  KeyResultSchema,
  GTDItemSchema,
  EisenhowerTaskSchema,
  PomodoroSessionSchema,
  CreateObjectiveSchema,
  CreateGTDItemSchema,
} from '../index';

describe('Schemas Validation', () => {
  describe('ObjectiveSchema', () => {
    it('should validate a valid objective', () => {
      const validObjective = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Aumentar produtividade',
        quarter: 'Q1 2024',
        year: 2024,
        status: 'active' as const,
        keyResults: [],
      };

      expect(() => ObjectiveSchema.parse(validObjective)).not.toThrow();
    });

    it('should reject invalid quarter format', () => {
      const invalidObjective = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Test',
        quarter: 'Q5 2024', // Invalid quarter
        year: 2024,
        status: 'active' as const,
        keyResults: [],
      };

      expect(() => ObjectiveSchema.parse(invalidObjective)).toThrow();
    });
  });

  describe('KeyResultSchema', () => {
    it('should validate a valid key result', () => {
      const validKeyResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        objectiveId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Completar 80% das tarefas',
        targetValue: 80,
        currentValue: 45,
        unit: '%',
        status: 'in-progress' as const,
      };

      expect(() => KeyResultSchema.parse(validKeyResult)).not.toThrow();
    });

    it('should reject negative values', () => {
      const invalidKeyResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        objectiveId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test',
        targetValue: -10, // Invalid negative value
        currentValue: 0,
        unit: '%',
        status: 'in-progress' as const,
      };

      expect(() => KeyResultSchema.parse(invalidKeyResult)).toThrow();
    });
  });

  describe('GTDItemSchema', () => {
    it('should validate a valid GTD item', () => {
      const validGTDItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Revisar emails',
        type: 'next-action' as const,
        context: '@office',
        area: 'Work',
        status: 'active' as const,
        energy: 'medium' as const,
        estimatedTime: 30,
        tags: ['email', 'communication'],
      };

      expect(() => GTDItemSchema.parse(validGTDItem)).not.toThrow();
    });

    it('should reject empty title', () => {
      const invalidGTDItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: '', // Empty title
        type: 'inbox' as const,
        status: 'active' as const,
        energy: 'low' as const,
        tags: [],
      };

      expect(() => GTDItemSchema.parse(invalidGTDItem)).toThrow();
    });
  });

  describe('EisenhowerTaskSchema', () => {
    it('should validate a valid Eisenhower task', () => {
      const validTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Tarefa urgente e importante',
        quadrant: 'urgent-important' as const,
        urgency: 5,
        importance: 5,
        status: 'pending' as const,
      };

      expect(() => EisenhowerTaskSchema.parse(validTask)).not.toThrow();
    });

    it('should reject urgency/importance out of range', () => {
      const invalidTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Test',
        quadrant: 'urgent-important' as const,
        urgency: 6, // Out of range (1-5)
        importance: 3,
        status: 'pending' as const,
      };

      expect(() => EisenhowerTaskSchema.parse(invalidTask)).toThrow();
    });
  });

  describe('PomodoroSessionSchema', () => {
    it('should validate a valid pomodoro session', () => {
      const validSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        taskTitle: 'Estudar TypeScript',
        duration: 25,
        breakDuration: 5,
        status: 'planned' as const,
        interruptions: 0,
      };

      expect(() => PomodoroSessionSchema.parse(validSession)).not.toThrow();
    });

    it('should reject invalid duration', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        taskTitle: 'Test',
        duration: 0, // Invalid duration
        breakDuration: 5,
        status: 'planned' as const,
        interruptions: 0,
      };

      expect(() => PomodoroSessionSchema.parse(invalidSession)).toThrow();
    });
  });

  describe('Create Schemas', () => {
    it('should validate CreateObjectiveSchema without base fields', () => {
      const validCreateObjective = {
        title: 'Novo objetivo',
        quarter: 'Q2 2024',
        year: 2024,
        status: 'draft' as const,
      };

      expect(() => CreateObjectiveSchema.parse(validCreateObjective)).not.toThrow();
    });

    it('should validate CreateGTDItemSchema without base fields', () => {
      const validCreateGTDItem = {
        title: 'Nova tarefa',
        type: 'inbox' as const,
        status: 'active' as const,
        energy: 'medium' as const,
        tags: [],
      };

      expect(() => CreateGTDItemSchema.parse(validCreateGTDItem)).not.toThrow();
    });
  });
}); 