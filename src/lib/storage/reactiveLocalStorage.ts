import { BaseEntity } from '@/lib/types';
import { LocalStorageManager, STORAGE_KEYS } from './localStorage';

// Event types for reactive updates
export interface StorageChangeEvent<T = BaseEntity> {
  action: 'create' | 'update' | 'delete' | 'clear' | 'sync-required';
  key: string;
  item?: T;
  itemId?: string;
  items?: T[];
}

// Global event emitter for storage changes
class StorageEventEmitter extends EventTarget {
  private static instance: StorageEventEmitter;

  static getInstance(): StorageEventEmitter {
    if (!StorageEventEmitter.instance) {
      StorageEventEmitter.instance = new StorageEventEmitter();
    }
    return StorageEventEmitter.instance;
  }

  emitChange<T>(event: StorageChangeEvent<T>) {
    // Emit specific key event
    this.dispatchEvent(new CustomEvent(`storage-${event.key}`, { 
      detail: event 
    }));
    
    // Emit global storage event
    this.dispatchEvent(new CustomEvent('storage-change', { 
      detail: event 
    }));

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ReactiveStorage] ${event.action} on ${event.key}`, event);
    }
  }

  subscribe<T>(key: string, callback: (event: StorageChangeEvent<T>) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };

    this.addEventListener(`storage-${key}`, handler);
    
    return () => {
      this.removeEventListener(`storage-${key}`, handler);
    };
  }

  subscribeGlobal(callback: (event: StorageChangeEvent) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };

    this.addEventListener('storage-change', handler);
    
    return () => {
      this.removeEventListener('storage-change', handler);
    };
  }
}

// Reactive LocalStorage Manager
export class ReactiveLocalStorageManager<T extends BaseEntity> extends LocalStorageManager<T> {
  private eventEmitter: StorageEventEmitter;

  constructor(key: string) {
    super(key);
    this.eventEmitter = StorageEventEmitter.getInstance();
  }

  // Override create to emit events
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const newItem = super.create(item);
    
    this.eventEmitter.emitChange<T>({
      action: 'create',
      key: this.getKey(),
      item: newItem,
    });

    // Emit cross-storage events for related data
    this.emitCrossStorageEvents('create', newItem);
    
    return newItem;
  }

  // Override update to emit events
  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): T | null {
    const updatedItem = super.update(id, updates);
    
    if (updatedItem) {
      this.eventEmitter.emitChange<T>({
        action: 'update',
        key: this.getKey(),
        item: updatedItem,
        itemId: id,
      });

      // Emit cross-storage events for related data
      this.emitCrossStorageEvents('update', updatedItem);
    }
    
    return updatedItem;
  }

  // Override delete to emit events
  delete(id: string): boolean {
    const item = this.getById(id);
    const success = super.delete(id);
    
    if (success && item) {
      this.eventEmitter.emitChange<T>({
        action: 'delete',
        key: this.getKey(),
        item,
        itemId: id,
      });

      // Emit cross-storage events for related data
      this.emitCrossStorageEvents('delete', item);
    }
    
    return success;
  }

  // Override clear to emit events
  clear(): void {
    const items = this.getAll();
    super.clear();
    
    this.eventEmitter.emitChange<T>({
      action: 'clear',
      key: this.getKey(),
      items,
    });
  }

  // Get the storage key
  private getKey(): string {
    return (this as unknown as { key: string }).key;
  }

  // Emit cross-storage events for related data synchronization
  private emitCrossStorageEvents(action: string, item: T): void {
    const key = this.getKey();
    
    // GTD Items ↔ Eisenhower Tasks synchronization
    if (key === STORAGE_KEYS.GTD_ITEMS) {
      this.eventEmitter.emitChange({
        action: 'sync-required',
        key: STORAGE_KEYS.EISENHOWER_TASKS,
        item,
      });
    }
    
    if (key === STORAGE_KEYS.EISENHOWER_TASKS) {
      this.eventEmitter.emitChange({
        action: 'sync-required',
        key: STORAGE_KEYS.GTD_ITEMS,
        item,
      });
    }

    // OKRs ↔ GTD Projects synchronization
    if (key === STORAGE_KEYS.OBJECTIVES) {
      this.eventEmitter.emitChange({
        action: 'sync-required',
        key: STORAGE_KEYS.GTD_PROJECTS,
        item,
      });
    }

    // GTD Projects ↔ GTD Items synchronization
    if (key === STORAGE_KEYS.GTD_PROJECTS) {
      this.eventEmitter.emitChange({
        action: 'sync-required',
        key: STORAGE_KEYS.GTD_ITEMS,
        item,
      });
    }
  }

  // Subscribe to changes for this storage key
  subscribe(callback: (event: StorageChangeEvent<T>) => void): () => void {
    return this.eventEmitter.subscribe<T>(this.getKey(), callback);
  }

  // Subscribe to global storage changes
  subscribeGlobal(callback: (event: StorageChangeEvent) => void): () => void {
    return this.eventEmitter.subscribeGlobal(callback);
  }
}

// Export singleton event emitter for direct access
export const storageEventEmitter = StorageEventEmitter.getInstance();

// Utility function to create reactive managers
export function createReactiveManager<T extends BaseEntity>(key: string): ReactiveLocalStorageManager<T> {
  return new ReactiveLocalStorageManager<T>(key);
}

 