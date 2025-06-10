import { BaseEntity, SyncStatus } from '@/lib/types';

// Utility function to generate UUID with fallback for non-secure contexts
function generateId(): string {
  // Try to use crypto.randomUUID if available (secure contexts)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (error) {
      console.warn('crypto.randomUUID failed, using fallback:', error);
    }
  }
  
  // Fallback for non-secure contexts (HTTP, non-localhost)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Storage keys
export const STORAGE_KEYS = {
  OBJECTIVES: 'gtd_objectives',
  KEY_RESULTS: 'gtd_key_results',
  GTD_ITEMS: 'gtd_items',
  GTD_PROJECTS: 'gtd_projects',
  EISENHOWER_TASKS: 'gtd_eisenhower_tasks',
  PARETO_ANALYSES: 'gtd_pareto_analyses',
  POMODORO_SESSIONS: 'gtd_pomodoro_sessions',
  POMODORO_STATS: 'gtd_pomodoro_stats',
  USER_SETTINGS: 'gtd_user_settings',
  SYNC_STATUS: 'gtd_sync_status',
  CALENDAR_EVENTS: 'gtd_calendar_events',
  ACTION_HISTORY: 'gtd_action_history',
} as const;

// Generic localStorage operations
export class LocalStorageManager<T extends BaseEntity> {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  // Get all items
  getAll(): T[] {
    try {
      const data = localStorage.getItem(this.key);
      if (!data) return [];
      
      const items = JSON.parse(data);
      // Convert date strings back to Date objects
      return items.map((item: Record<string, string | number | boolean | null>) => ({
        ...item,
        createdAt: new Date(item.createdAt as string),
        updatedAt: new Date(item.updatedAt as string),
        dueDate: item.dueDate ? new Date(item.dueDate as string) : undefined,
        startTime: item.startTime ? new Date(item.startTime as string) : undefined,
        endTime: item.endTime ? new Date(item.endTime as string) : undefined,
      }));
    } catch (error) {
      console.error(`Error reading from localStorage key ${this.key}:`, error);
      return [];
    }
  }

  // Get item by ID
  getById(id: string): T | null {
    const items = this.getAll();
    return items.find(item => item.id === id) || null;
  }

  // Get items by user ID (for sync)
  getByUserId(userId: string): T[] {
    const items = this.getAll();
    return items.filter(item => item.userId === userId);
  }

  // Create new item
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const newItem: T = {
      ...item,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as T;

    const items = this.getAll();
    items.push(newItem);
    this.saveAll(items);
    
    // Mark as pending sync
    this.markPendingSync();
    
    return newItem;
  }

  // Update existing item
  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): T | null {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;

    const updatedItem: T = {
      ...items[index],
      ...updates,
      updatedAt: new Date(),
    };

    items[index] = updatedItem;
    this.saveAll(items);
    
    // Mark as pending sync
    this.markPendingSync();
    
    return updatedItem;
  }

  // Delete item
  delete(id: string): boolean {
    const items = this.getAll();
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) return false;
    
    this.saveAll(filteredItems);
    
    // Mark as pending sync
    this.markPendingSync();
    
    return true;
  }

  // Save all items
  private saveAll(items: T[]): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
    } catch (error) {
      console.error(`Error saving to localStorage key ${this.key}:`, error);
      throw new Error('Failed to save data to localStorage');
    }
  }

  // Clear all items
  clear(): void {
    localStorage.removeItem(this.key);
    this.markPendingSync();
  }

  // Mark data as pending sync
  private markPendingSync(): void {
    try {
      const syncStatus = this.getSyncStatus();
      const updatedStatus: SyncStatus = {
        ...syncStatus,
        pendingChanges: syncStatus.pendingChanges + 1,
        status: 'pending',
      };
      localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(updatedStatus));
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  // Get sync status
  private getSyncStatus(): SyncStatus {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      if (!data) {
        return {
          lastSync: new Date(0),
          pendingChanges: 0,
          conflicts: [],
          status: 'synced',
        };
      }
      
      const status = JSON.parse(data);
      return {
        ...status,
        lastSync: new Date(status.lastSync),
      };
    } catch (error) {
      console.error('Error reading sync status:', error);
      return {
        lastSync: new Date(0),
        pendingChanges: 0,
        conflicts: [],
        status: 'error',
      };
    }
  }
}

// Utility functions for common operations
export const storageUtils = {
  // Export all data for backup
  exportAllData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    });
    
    return data;
  },

  // Import data from backup
  importAllData(data: Record<string, unknown>): void {
    Object.entries(data).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch (error) {
        console.error(`Error importing data for key ${key}:`, error);
      }
    });
  },

  // Clear all app data
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    let used = 0;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        used += new Blob([value]).size;
      }
    });

    // Estimate available space (localStorage limit is usually 5-10MB)
    const estimated = 5 * 1024 * 1024; // 5MB
    
    return {
      used,
      available: estimated - used,
      percentage: (used / estimated) * 100,
    };
  },

  // Check if localStorage is available
  isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
};

// Sync utilities (basic implementation for NextAuth integration)
export const syncUtils = {
  // Mark sync as completed
  markSyncCompleted(): void {
    const status: SyncStatus = {
      lastSync: new Date(),
      pendingChanges: 0,
      conflicts: [],
      status: 'synced',
    };
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
  },

  // Get pending changes count
  getPendingChangesCount(): number {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      if (!data) return 0;
      
      const status = JSON.parse(data);
      return status.pendingChanges || 0;
    } catch {
      return 0;
    }
  },

  // Add sync conflict
  addSyncConflict(conflict: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
      const status = data ? JSON.parse(data) : {
        lastSync: new Date(0),
        pendingChanges: 0,
        conflicts: [],
        status: 'error',
      };
      
      status.conflicts.push(conflict);
      status.status = 'error';
      
      localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
    } catch (error) {
      console.error('Error adding sync conflict:', error);
    }
  },
}; 