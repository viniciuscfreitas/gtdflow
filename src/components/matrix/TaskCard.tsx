'use client';

// import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MoreHorizontal, 
  GripVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEisenhowerTasks } from '@/lib/hooks/useLocalStorage';
import { useCrossMethodologySync } from '@/lib/hooks/useCrossMethodologySync';
import { EisenhowerTask } from '@/lib/types';
// import { EditTaskDialog } from './EditTaskDialog';
import { toast } from 'sonner';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { TaskStatusManager } from '@/components/ui/TaskStatusManager';
import { useTaskCompletionHistory } from '@/lib/hooks/useActionHistory';
import { useUndoToast } from '@/components/ui/UndoToast';

interface TaskCardProps {
  task: EisenhowerTask;
  quadrantColor: string;
  isDragging?: boolean;
}

export function TaskCard({ task, quadrantColor, isDragging = false }: TaskCardProps) {
  // const [showEditDialog, setShowEditDialog] = useState(false);
  const { update: updateTask } = useEisenhowerTasks();
  const { syncTaskCompletion, syncTaskDeletion } = useCrossMethodologySync();
  const { recordCompletion, recordStatusChange } = useTaskCompletionHistory();
  const { showUndoToast } = useUndoToast();

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging: isDraggingFromHook,
  } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleStatusChange = async (newStatus: 'pending' | 'in-progress' | 'completed' | 'pending-approval' | 'needs-revision' | 'active' | 'cancelled', metadata?: { stakeholder?: string; rejectionReason?: string; approvedAt?: string; rejectedAt?: string }) => {
    const previousState = { ...task };
    
    // Mapear status para tipos válidos do EisenhowerTask
    let mappedStatus: 'pending' | 'in-progress' | 'completed' | 'pending-approval' | 'needs-revision';
    if (newStatus === 'active') {
      mappedStatus = 'in-progress';
    } else if (newStatus === 'cancelled') {
      mappedStatus = 'pending';
    } else {
      mappedStatus = newStatus;
    }
    
    const newState = { 
      status: mappedStatus,
      updatedAt: new Date(),
      ...metadata
    };

    // Atualizar a tarefa localmente primeiro
    updateTask(task.id, newState);

    // Sincronizar com GTD se for conclusão/reativação
    if (mappedStatus === 'completed' || (task.status === 'completed' && mappedStatus === 'pending')) {
      try {
        await syncTaskCompletion(task.id, 'eisenhower', mappedStatus === 'completed');
      } catch (error) {
        console.error('Erro na sincronização:', error);
        // Reverter mudança local se sincronização falhar
        updateTask(task.id, previousState);
        toast.error('Erro ao sincronizar com GTD');
        return;
      }
    }

    // Registrar no histórico
    if (newStatus === 'completed' && task.status !== 'completed') {
      const historyEntry = recordCompletion(
        'eisenhower',
        task.id,
        previousState,
        newState,
        task.title
      );
      
      // Mostrar toast de desfazer
      if (historyEntry) {
        showUndoToast(historyEntry);
      }
    } else if (newStatus !== task.status) {
      recordStatusChange(
        'eisenhower',
        task.id,
        previousState,
        newState,
        task.title,
        task.status,
        newStatus
      );
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await handleStatusChange(newStatus);
  };

  const handleDelete = async () => {
    await syncTaskDeletion(task.id, 'eisenhower');
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const isCompleted = task.status === 'completed';

  return (
    <Card 
      ref={setDraggableRef}
      style={style}
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing",
        isDragging || isDraggingFromHook ? "opacity-50 rotate-3 shadow-lg" : "",
        isCompleted ? "opacity-60" : "",
        isOverdue ? "border-red-300 bg-red-50" : ""
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div className="flex-shrink-0 mt-1">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>

          {/* Status Manager */}
          <div onClick={(e) => e.stopPropagation()}>
            <TaskStatusManager
              task={task}
              onStatusChange={handleStatusChange}
              showAdvancedOptions={false}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium text-sm mb-1",
              isCompleted ? "line-through text-muted-foreground" : ""
            )}>
              {task.title}
            </h4>
            
            {task.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {/* Urgência/Importância */}
              <Badge variant="outline" className="text-xs">
                U:{task.urgency} I:{task.importance}
              </Badge>

              {/* Data de vencimento */}
              {task.dueDate && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-red-600" : "text-muted-foreground"
                )}>
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                </div>
              )}

              {/* Status */}
              <Badge 
                variant={isCompleted ? "default" : "secondary"}
                className="text-xs"
              >
                {isCompleted ? 'Concluída' : 'Pendente'}
              </Badge>

              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Atrasada
                </Badge>
              )}

              {/* GTD Sync Indicator */}
              {task.gtdItemId && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  GTD
                </Badge>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-shrink-0 p-1 h-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                Editar
              </DropdownMenuItem> */}
              <DropdownMenuItem 
                onClick={handleToggleStatus}
                className={quadrantColor}
              >
                {isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600"
              >
                Remover da Matriz
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* Edit Dialog - TODO: Implementar */}
      {/* <EditTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={task}
      /> */}
    </Card>
  );
} 