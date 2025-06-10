/**
 * Firebase Sync Service
 * 
 * Gerencia sincronização bidirecional entre localStorage e Firestore
 * Implementa estratégias de resolução de conflitos e sincronização incremental
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './config';
import { 
  FirestoreBaseEntity, 
  UserProfile, 
  SyncMetadata,
  FIRESTORE_COLLECTIONS,
  mapLocalToFirestore,
  mapFirestoreToLocal,
  generateDeviceId,
  canSync
} from './schema';
import { BaseEntity } from '@/lib/types';
import { LocalStorageManager, STORAGE_KEYS } from '@/lib/storage/localStorage';

// ============================================================================
// SYNC SERVICE CLASS
// ============================================================================

export class FirebaseSyncService {
  private user: User | null = null;
  private deviceId: string;
  private syncInProgress = false;
  private realtimeListeners: Array<() => void> = [];

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Inicializa o serviço de sincronização com usuário autenticado
   */
  async initialize(user: User): Promise<void> {
    this.user = user;
    
    // Criar/atualizar perfil do usuário
    await this.createOrUpdateUserProfile(user);
    
    // Configurar listeners em tempo real se habilitado
    const settings = await this.getUserSettings();
    if (settings?.syncSettings?.frequency === 'realtime') {
      this.setupRealtimeListeners();
    }
  }

  /**
   * Finaliza o serviço e limpa listeners
   */
  cleanup(): void {
    this.realtimeListeners.forEach(unsubscribe => unsubscribe());
    this.realtimeListeners = [];
    this.user = null;
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Sincronização completa (upload + download)
   */
  async fullSync(): Promise<SyncResult> {
    if (!this.user) throw new Error('Usuário não autenticado');
    if (this.syncInProgress) throw new Error('Sincronização já em andamento');

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      console.log('🔄 Iniciando sincronização completa...');

      // 1. Upload de mudanças locais
      const uploadResult = await this.uploadLocalChanges();
      
      // 2. Download de mudanças remotas
      const downloadResult = await this.downloadRemoteChanges();
      
      // 3. Limpeza de itens deletados há mais de 30 dias - TEMPORARIAMENTE DESABILITADA
      // await this.cleanupOldDeletedItems();
      console.log('⚠️ Limpeza automática desabilitada temporariamente devido a problemas de índice');
      
      // 4. Atualizar metadados de sincronização
      const currentMetadata = await this.getSyncMetadata();
      await this.updateSyncMetadata({
        lastFullSync: new Date(),
        lastIncrementalSync: new Date(),
        pendingChanges: 0,
        syncStatus: 'synced',
        totalSyncs: (currentMetadata?.totalSyncs || 0) + 1,
        successfulSyncs: (currentMetadata?.successfulSyncs || 0) + 1,
        averageSyncTime: Date.now() - startTime,
      });

      const result: SyncResult = {
        success: true,
        uploaded: uploadResult.count,
        downloaded: downloadResult.count,
        conflicts: downloadResult.conflicts,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      console.log('✅ Sincronização completa finalizada:', result);
      return result;

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      
      const errorMetadata = await this.getSyncMetadata();
      await this.updateSyncMetadata({
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        failedSyncs: (errorMetadata?.failedSyncs || 0) + 1,
      });

      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: [],
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sincronização incremental (apenas mudanças desde última sync)
   */
  async incrementalSync(): Promise<SyncResult> {
    if (!this.user) throw new Error('Usuário não autenticado');

    const metadata = await this.getSyncMetadata();
    const lastSync = metadata?.lastIncrementalSync || new Date(0);

    // Implementar lógica de sincronização incremental
    // Por enquanto, fazer sync completa
    return this.fullSync();
  }

  // ============================================================================
  // UPLOAD OPERATIONS
  // ============================================================================

  /**
   * Upload de todas as mudanças locais para Firestore
   */
  private async uploadLocalChanges(): Promise<{ count: number }> {
    let totalUploaded = 0;

    // Upload de cada tipo de entidade
    const collections = [
      { key: STORAGE_KEYS.GTD_ITEMS, collection: FIRESTORE_COLLECTIONS.GTD_ITEMS },
      { key: STORAGE_KEYS.GTD_PROJECTS, collection: FIRESTORE_COLLECTIONS.GTD_PROJECTS },
      { key: STORAGE_KEYS.EISENHOWER_TASKS, collection: FIRESTORE_COLLECTIONS.EISENHOWER_TASKS },
      { key: STORAGE_KEYS.OBJECTIVES, collection: FIRESTORE_COLLECTIONS.OBJECTIVES },
      { key: STORAGE_KEYS.KEY_RESULTS, collection: FIRESTORE_COLLECTIONS.KEY_RESULTS },
      { key: STORAGE_KEYS.POMODORO_SESSIONS, collection: FIRESTORE_COLLECTIONS.POMODORO_SESSIONS },
      { key: STORAGE_KEYS.POMODORO_STATS, collection: FIRESTORE_COLLECTIONS.POMODORO_STATS },
      { key: STORAGE_KEYS.PARETO_ANALYSES, collection: FIRESTORE_COLLECTIONS.PARETO_ANALYSES },
      { key: STORAGE_KEYS.CALENDAR_EVENTS, collection: FIRESTORE_COLLECTIONS.CALENDAR_EVENTS },
      { key: STORAGE_KEYS.ACTION_HISTORY, collection: FIRESTORE_COLLECTIONS.ACTION_HISTORY },
    ];

    for (const { key, collection: collectionName } of collections) {
      const manager = new LocalStorageManager(key);
      const localItems = manager.getAll();
      
      for (const item of localItems) {
        if (canSync(item)) {
          await this.uploadEntity(item, collectionName);
          totalUploaded++;
        }
      }
    }

    // Upload de configurações
    const settingsManager = new LocalStorageManager(STORAGE_KEYS.USER_SETTINGS);
    const settings = settingsManager.getAll()[0];
    if (settings && canSync(settings)) {
      await this.uploadEntity(settings, FIRESTORE_COLLECTIONS.SETTINGS);
      totalUploaded++;
    }

    return { count: totalUploaded };
  }

  /**
   * Upload de uma entidade específica
   */
  private async uploadEntity(entity: BaseEntity, collectionName: string): Promise<void> {
    if (!this.user) return;

    const firestoreEntity = mapLocalToFirestore(entity, this.deviceId);
    const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, this.user.uid, collectionName, entity.id);
    
    await setDoc(docRef, {
      ...firestoreEntity,
      lastSyncedAt: serverTimestamp(),
    }, { merge: true });
  }

  // ============================================================================
  // DOWNLOAD OPERATIONS
  // ============================================================================

  /**
   * Download de todas as mudanças remotas do Firestore
   */
  private async downloadRemoteChanges(): Promise<{ count: number; conflicts: SyncConflict[] }> {
    let totalDownloaded = 0;
    const conflicts: SyncConflict[] = [];

    const collections = [
      { collection: FIRESTORE_COLLECTIONS.GTD_ITEMS, key: STORAGE_KEYS.GTD_ITEMS },
      { collection: FIRESTORE_COLLECTIONS.GTD_PROJECTS, key: STORAGE_KEYS.GTD_PROJECTS },
      { collection: FIRESTORE_COLLECTIONS.EISENHOWER_TASKS, key: STORAGE_KEYS.EISENHOWER_TASKS },
      { collection: FIRESTORE_COLLECTIONS.OBJECTIVES, key: STORAGE_KEYS.OBJECTIVES },
      { collection: FIRESTORE_COLLECTIONS.KEY_RESULTS, key: STORAGE_KEYS.KEY_RESULTS },
      { collection: FIRESTORE_COLLECTIONS.POMODORO_SESSIONS, key: STORAGE_KEYS.POMODORO_SESSIONS },
      { collection: FIRESTORE_COLLECTIONS.POMODORO_STATS, key: STORAGE_KEYS.POMODORO_STATS },
      { collection: FIRESTORE_COLLECTIONS.PARETO_ANALYSES, key: STORAGE_KEYS.PARETO_ANALYSES },
      { collection: FIRESTORE_COLLECTIONS.CALENDAR_EVENTS, key: STORAGE_KEYS.CALENDAR_EVENTS },
      { collection: FIRESTORE_COLLECTIONS.ACTION_HISTORY, key: STORAGE_KEYS.ACTION_HISTORY },
    ];

    for (const { collection: collectionName, key } of collections) {
      const result = await this.downloadCollection(collectionName, key);
      totalDownloaded += result.count;
      conflicts.push(...result.conflicts);
    }

    // Download de configurações
    const settingsResult = await this.downloadCollection(FIRESTORE_COLLECTIONS.SETTINGS, STORAGE_KEYS.USER_SETTINGS);
    totalDownloaded += settingsResult.count;
    conflicts.push(...settingsResult.conflicts);

    return { count: totalDownloaded, conflicts };
  }

  /**
   * Download de uma coleção específica
   */
  private async downloadCollection(collectionName: string, storageKey: string): Promise<{ count: number; conflicts: SyncConflict[] }> {
    if (!this.user) return { count: 0, conflicts: [] };

    const collectionRef = collection(db, FIRESTORE_COLLECTIONS.USERS, this.user.uid, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    const manager = new LocalStorageManager(storageKey);
    const localItems = manager.getAll();
    const conflicts: SyncConflict[] = [];
    let downloadedCount = 0;

    for (const docSnapshot of snapshot.docs) {
      const remoteEntity = docSnapshot.data() as FirestoreBaseEntity;
      
      // Converter timestamps do Firestore para Date
      if (remoteEntity.createdAt instanceof Timestamp) {
        remoteEntity.createdAt = remoteEntity.createdAt.toDate();
      }
      if (remoteEntity.updatedAt instanceof Timestamp) {
        remoteEntity.updatedAt = remoteEntity.updatedAt.toDate();
      }
      if (remoteEntity.lastSyncedAt instanceof Timestamp) {
        remoteEntity.lastSyncedAt = remoteEntity.lastSyncedAt.toDate();
      }

      // Verificar se é soft delete
      if (remoteEntity.isDeleted) {
        manager.delete(remoteEntity.id);
        downloadedCount++;
        continue;
      }

      const localEntity = localItems.find(item => item.id === remoteEntity.id);
      
      if (!localEntity) {
        // Entidade não existe localmente, criar
        const localEntity = mapFirestoreToLocal(remoteEntity, this.user.uid);
        manager.create(localEntity);
        downloadedCount++;
      } else {
        // Verificar conflitos
        const conflict = this.detectConflict(localEntity, remoteEntity);
        if (conflict) {
          conflicts.push(conflict);
          // Por enquanto, priorizar versão remota
          const updatedEntity = mapFirestoreToLocal(remoteEntity, this.user.uid);
          manager.update(localEntity.id, updatedEntity);
          downloadedCount++;
        } else if (remoteEntity.updatedAt > localEntity.updatedAt) {
          // Versão remota é mais recente, atualizar
          const updatedEntity = mapFirestoreToLocal(remoteEntity, this.user.uid);
          manager.update(localEntity.id, updatedEntity);
          downloadedCount++;
        }
      }
    }

    return { count: downloadedCount, conflicts };
  }

  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================

  /**
   * Detecta conflitos entre versões local e remota
   */
  private detectConflict(localEntity: BaseEntity, remoteEntity: FirestoreBaseEntity): SyncConflict | null {
    // Conflito se ambas foram modificadas após a última sincronização
    const lastSync = remoteEntity.lastSyncedAt || new Date(0);
    
    if (localEntity.updatedAt > lastSync && remoteEntity.updatedAt > lastSync) {
      return {
        id: localEntity.id,
        collection: 'unknown', // Seria necessário passar o nome da coleção
        localEntity,
        remoteEntity,
        timestamp: new Date(),
        resolved: false,
      };
    }

    return null;
  }

  // ============================================================================
  // REALTIME LISTENERS
  // ============================================================================

  /**
   * Configura listeners em tempo real para sincronização automática
   */
  private setupRealtimeListeners(): void {
    if (!this.user) return;

    const collections = [
      FIRESTORE_COLLECTIONS.GTD_ITEMS,
      FIRESTORE_COLLECTIONS.GTD_PROJECTS,
      FIRESTORE_COLLECTIONS.EISENHOWER_TASKS,
      FIRESTORE_COLLECTIONS.OBJECTIVES,
      FIRESTORE_COLLECTIONS.KEY_RESULTS,
    ];

    collections.forEach(collectionName => {
      const collectionRef = collection(db, FIRESTORE_COLLECTIONS.USERS, this.user!.uid, collectionName);
      
      const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            // Processar mudança remota
            this.handleRealtimeChange(change.doc.data() as FirestoreBaseEntity, collectionName);
          } else if (change.type === 'removed') {
            // Processar remoção remota
            this.handleRealtimeRemoval(change.doc.id, collectionName);
          }
        });
      });

      this.realtimeListeners.push(unsubscribe);
    });
  }

  /**
   * Processa mudança em tempo real
   */
  private handleRealtimeChange(remoteEntity: FirestoreBaseEntity, collectionName: string): void {
    // Evitar loop infinito - não processar mudanças do próprio dispositivo
    if (remoteEntity.deviceId === this.deviceId) return;

    // Mapear para storage key apropriado
    const storageKey = this.getStorageKeyFromCollection(collectionName);
    if (!storageKey) return;

    const manager = new LocalStorageManager(storageKey);
    const localEntity = manager.getById(remoteEntity.id);

    if (!localEntity) {
      // Criar nova entidade
      const newEntity = mapFirestoreToLocal(remoteEntity, this.user!.uid);
      manager.create(newEntity);
    } else {
      // Atualizar entidade existente
      const updatedEntity = mapFirestoreToLocal(remoteEntity, this.user!.uid);
      manager.update(localEntity.id, updatedEntity);
    }
  }

  /**
   * Processa remoção em tempo real
   */
  private handleRealtimeRemoval(entityId: string, collectionName: string): void {
    const storageKey = this.getStorageKeyFromCollection(collectionName);
    if (!storageKey) return;

    const manager = new LocalStorageManager(storageKey);
    manager.delete(entityId);
  }

  // ============================================================================
  // USER PROFILE & SETTINGS
  // ============================================================================

  /**
   * Cria ou atualiza perfil do usuário
   */
  private async createOrUpdateUserProfile(user: User): Promise<void> {
    const profileRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
    const profileDoc = await getDoc(profileRef);

    const profileData = {
      email: user.email || '',
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      lastLoginAt: new Date(),
    };

    if (!profileDoc.exists()) {
      // Criar novo perfil
      const newProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        syncEnabled: true,
        autoSync: true,
        syncFrequency: 'manual',
        totalTasks: 0,
        completedTasks: 0,
        totalProjects: 0,
        joinedAt: new Date(),
      };
      
      await setDoc(profileRef, newProfile);
    } else {
      // Atualizar perfil existente
      await updateDoc(profileRef, profileData);
    }
  }

  /**
   * Obtém configurações do usuário
   */
  private async getUserSettings(): Promise<any> {
    if (!this.user) return null;

    const settingsRef = collection(db, FIRESTORE_COLLECTIONS.USERS, this.user.uid, FIRESTORE_COLLECTIONS.SETTINGS);
    const snapshot = await getDocs(settingsRef);
    
    return snapshot.docs[0]?.data() || null;
  }

  // ============================================================================
  // SYNC METADATA
  // ============================================================================

  /**
   * Obtém metadados de sincronização
   */
  private async getSyncMetadata(): Promise<SyncMetadata | null> {
    if (!this.user) return null;

    const metadataRef = doc(db, FIRESTORE_COLLECTIONS.USERS, this.user.uid, FIRESTORE_COLLECTIONS.SYNC_METADATA, 'main');
    const docSnapshot = await getDoc(metadataRef);
    
    return docSnapshot.exists() ? docSnapshot.data() as SyncMetadata : null;
  }

  /**
   * Atualiza metadados de sincronização
   */
  private async updateSyncMetadata(updates: Partial<SyncMetadata>): Promise<void> {
    if (!this.user) return;

    const metadataRef = doc(db, FIRESTORE_COLLECTIONS.USERS, this.user.uid, FIRESTORE_COLLECTIONS.SYNC_METADATA, 'main');
    
    await setDoc(metadataRef, {
      id: 'main',
      deviceId: this.deviceId,
      deviceName: this.getDeviceName(),
      lastActiveAt: new Date(),
      ...updates,
    }, { merge: true });
  }

  // ============================================================================
  // CLEANUP OPERATIONS
  // ============================================================================

  /**
   * Remove permanentemente itens deletados há mais de 30 dias
   */
  private async cleanupOldDeletedItems(): Promise<void> {
    if (!this.user) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const collections = [
      FIRESTORE_COLLECTIONS.GTD_ITEMS,
      FIRESTORE_COLLECTIONS.GTD_PROJECTS,
      FIRESTORE_COLLECTIONS.EISENHOWER_TASKS,
      FIRESTORE_COLLECTIONS.OBJECTIVES,
      FIRESTORE_COLLECTIONS.KEY_RESULTS,
      FIRESTORE_COLLECTIONS.POMODORO_SESSIONS,
      FIRESTORE_COLLECTIONS.POMODORO_STATS,
      FIRESTORE_COLLECTIONS.PARETO_ANALYSES,
      FIRESTORE_COLLECTIONS.CALENDAR_EVENTS,
      FIRESTORE_COLLECTIONS.ACTION_HISTORY,
    ];

    for (const collectionName of collections) {
      try {
        const collectionRef = collection(db, FIRESTORE_COLLECTIONS.USERS, this.user.uid, collectionName);
        const q = query(
          collectionRef,
          where('isDeleted', '==', true),
          where('deletedAt', '<=', thirtyDaysAgo)
        );
        
        const snapshot = await getDocs(q);
        
        // Deletar documentos em lotes para performance
        const batch: any[] = [];
        snapshot.forEach((docSnapshot) => {
          batch.push(docSnapshot.ref);
        });

        // Deletar em lotes de 500 (limite do Firestore)
        for (let i = 0; i < batch.length; i += 500) {
          const batchSlice = batch.slice(i, i + 500);
          await Promise.all(batchSlice.map(ref => ref.delete()));
        }

        if (batch.length > 0) {
          console.log(`🧹 Limpeza: ${batch.length} itens removidos permanentemente de ${collectionName}`);
        }
      } catch (error) {
        console.warn(`Erro na limpeza de ${collectionName}:`, error);
        // Continuar com outras coleções mesmo se uma falhar
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Obtém ou cria ID do dispositivo
   */
  private getOrCreateDeviceId(): string {
    // Verificar se estamos no browser
    if (typeof window === 'undefined') {
      return generateDeviceId(); // Gerar ID temporário no servidor
    }
    
    let deviceId = localStorage.getItem('gtd_device_id');
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem('gtd_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Obtém nome do dispositivo
   */
  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  /**
   * Mapeia nome da coleção para storage key
   */
  private getStorageKeyFromCollection(collectionName: string): string | null {
    const mapping: Record<string, string> = {
      [FIRESTORE_COLLECTIONS.GTD_ITEMS]: STORAGE_KEYS.GTD_ITEMS,
      [FIRESTORE_COLLECTIONS.GTD_PROJECTS]: STORAGE_KEYS.GTD_PROJECTS,
      [FIRESTORE_COLLECTIONS.EISENHOWER_TASKS]: STORAGE_KEYS.EISENHOWER_TASKS,
      [FIRESTORE_COLLECTIONS.OBJECTIVES]: STORAGE_KEYS.OBJECTIVES,
      [FIRESTORE_COLLECTIONS.KEY_RESULTS]: STORAGE_KEYS.KEY_RESULTS,
      [FIRESTORE_COLLECTIONS.POMODORO_SESSIONS]: STORAGE_KEYS.POMODORO_SESSIONS,
      [FIRESTORE_COLLECTIONS.POMODORO_STATS]: STORAGE_KEYS.POMODORO_STATS,
      [FIRESTORE_COLLECTIONS.PARETO_ANALYSES]: STORAGE_KEYS.PARETO_ANALYSES,
      [FIRESTORE_COLLECTIONS.CALENDAR_EVENTS]: STORAGE_KEYS.CALENDAR_EVENTS,
      [FIRESTORE_COLLECTIONS.ACTION_HISTORY]: STORAGE_KEYS.ACTION_HISTORY,
      [FIRESTORE_COLLECTIONS.SETTINGS]: STORAGE_KEYS.USER_SETTINGS,
    };

    return mapping[collectionName] || null;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  conflicts: SyncConflict[];
  duration: number;
  timestamp: Date;
  error?: string;
}

export interface SyncConflict {
  id: string;
  collection: string;
  localEntity: BaseEntity;
  remoteEntity: FirestoreBaseEntity;
  timestamp: Date;
  resolved: boolean;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const syncService = new FirebaseSyncService(); 