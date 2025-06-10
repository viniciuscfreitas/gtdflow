'use client';

import { useUndoToast, UndoToast } from './UndoToast';
import { useEisenhowerTasks, useGTDItems } from '@/lib/hooks/useLocalStorage';
import { ActionHistory } from '@/lib/types';

export function UndoToastContainer() {
  const { activeToasts, hideUndoToast, handleUndo } = useUndoToast();
  const { update: updateEisenhowerTask } = useEisenhowerTasks();
  const { update: updateGTDItem } = useGTDItems();

  const handleUndoAction = async (historyId: string, historyEntry: ActionHistory) => {
    const undoCallback = async (previousState: Record<string, unknown>) => {
      // Determinar o tipo de entidade e fazer o undo apropriado
      switch (historyEntry.entityType) {
        case 'eisenhower':
          await updateEisenhowerTask(historyEntry.entityId, {
            status: previousState.status as 'pending' | 'in-progress' | 'completed' | 'pending-approval' | 'needs-revision',
            updatedAt: new Date(),
          });
          break;
        case 'gtd':
          await updateGTDItem(historyEntry.entityId, {
            status: previousState.status as 'active' | 'completed' | 'cancelled' | 'pending-approval' | 'needs-revision',
            updatedAt: new Date(),
          });
          break;
        default:
          throw new Error(`Tipo de entidade não suportado: ${historyEntry.entityType}`);
      }
    };

    await handleUndo(historyId, undoCallback);
  };

  if (activeToasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {activeToasts.map((historyEntry) => (
        <UndoToast
          key={historyEntry.id}
          historyEntry={historyEntry}
          onUndo={(historyId) => handleUndoAction(historyId, historyEntry)}
          onDismiss={() => hideUndoToast(historyEntry.id)}
          autoHideDelay={10}
        />
      ))}
    </div>
  );
} 