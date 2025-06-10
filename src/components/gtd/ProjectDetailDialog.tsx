'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Pause, 
  X,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useAuth } from '@/lib/contexts/AuthContext';
import { GTDItem } from '@/lib/types';
import { CreateActionDialog } from './CreateActionDialog';
import { EditProjectDialog } from './EditProjectDialog';
import { EditActionDialog } from './EditActionDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProjectDetailDialogProps {
  project: GTDItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailDialog({ project, open, onOpenChange }: ProjectDetailDialogProps) {
  const [showCreateAction, setShowCreateAction] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { data: items, update, remove } = useFirestoreGTD(user);
  
  // Filtrar ações relacionadas ao projeto
  const projectActions = items.filter(item => 
    item.projectId === project.id && 
    item.type === 'next-action'
  );
  
  const completedActions = projectActions.filter(action => action.status === 'completed');
  const activeActions = projectActions.filter(action => action.status === 'active');
  
  const progressPercentage = projectActions.length > 0 
    ? Math.round((completedActions.length / projectActions.length) * 100)
    : 0;

  // Funções para ações rápidas
  const handleCompleteAction = async (actionId: string) => {
    try {
      update(actionId, { 
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      });
      toast.success('Ação concluída!');
    } catch (error) {
      toast.error('Erro ao concluir ação');
      console.error('Error completing action:', error);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta ação?')) {
      try {
        remove(actionId);
        toast.success('Ação excluída');
      } catch (error) {
        toast.error('Erro ao excluir ação');
        console.error('Error deleting action:', error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Circle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'on-hold':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      case 'on-hold':
        return 'Em Pausa';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Verificação de segurança
  if (!project) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{project.title}</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditProject(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Status e Informações Básicas */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(project.status)}
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
              
              {project.area && (
                <Badge variant="outline">
                  {project.area}
                </Badge>
              )}
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Criado em {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>

            {/* Descrição */}
            {project.description && (
              <div>
                <h3 className="font-medium mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Progresso */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Progresso</h3>
                <span className="text-sm text-muted-foreground">
                  {completedActions.length} de {projectActions.length} ações concluídas
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {progressPercentage}% concluído
              </p>
            </div>

            <Separator />

            {/* Próximas Ações */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Próximas Ações ({activeActions.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateAction(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ação
                </Button>
              </div>
              
              {activeActions.length > 0 ? (
                <div className="space-y-2">
                  {activeActions.map((action) => (
                    <Card key={action.id} className="p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        {/* Complete Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteAction(action.id)}
                          className="flex-shrink-0 h-7 w-7 p-0 rounded-full hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                          title="Marcar como concluída"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{action.title}</h4>
                          {action.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {action.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {action.context && (
                              <Badge variant="secondary" className="text-xs">
                                {action.context}
                              </Badge>
                            )}
                            {action.energy && (
                              <Badge variant="outline" className="text-xs">
                                {action.energy === 'high' ? 'Alta energia' : 
                                 action.energy === 'medium' ? 'Média energia' : 'Baixa energia'}
                              </Badge>
                            )}
                            {action.estimatedTime && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {action.estimatedTime}min
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingAction(action.id)}
                            className="h-7 px-2"
                            title="Editar ação"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAction(action.id)}
                            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Excluir ação"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Circle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma ação pendente</p>
                  <p className="text-sm">Adicione a primeira ação para este projeto</p>
                </div>
              )}
            </div>

            {/* Ações Concluídas */}
            {completedActions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-4">Ações Concluídas ({completedActions.length})</h3>
                  <div className="space-y-2">
                    {completedActions.slice(0, 5).map((action) => (
                      <div key={action.id} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm line-through text-muted-foreground">
                          {action.title}
                        </span>
                      </div>
                    ))}
                    {completedActions.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{completedActions.length - 5} ações concluídas
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs aninhados */}
      {showCreateAction && (
        <CreateActionDialog
          projectId={project.id}
          onClose={() => setShowCreateAction(false)}
          onSuccess={() => {
            setShowCreateAction(false);
            // Refresh será automático devido ao hook
          }}
        />
      )}
      
      <EditProjectDialog
        project={project}
        open={showEditProject}
        onOpenChange={setShowEditProject}
      />
      
      {editingAction && (
        <EditActionDialog
          actionId={editingAction}
          onClose={() => setEditingAction(null)}
          onSuccess={() => {
            setEditingAction(null);
            toast.success('Ação atualizada com sucesso!');
          }}
        />
      )}
    </>
  );
} 