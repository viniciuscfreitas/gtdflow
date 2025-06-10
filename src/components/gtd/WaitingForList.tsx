'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Search,
  Filter,
  CheckCircle2,
  Edit,
  Trash2,
  Grid3X3,
  ArrowRight,
  Target,
  User,
  Calendar,
  AlertTriangle,
  Users
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestoreMatrix } from '@/lib/hooks/useFirestoreMatrix';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCrossMethodologySync } from '@/lib/hooks/useCrossMethodologySync';
import { EditWaitingDialog } from './EditWaitingDialog';
import { GTDItem, EisenhowerQuadrant } from '@/lib/types';
import { useNotificationContext } from '@/lib/contexts/NotificationContext';

export function WaitingForList() {
  const { user } = useAuth();
  const { data: gtdItems, update } = useFirestoreGTD(user);
  const { data: eisenhowerTasks, create: createEisenhowerTask } = useFirestoreMatrix(user);
  const { syncTaskCompletion, syncTaskDeletion } = useCrossMethodologySync();
  const { notifySuccess, notifyError } = useNotificationContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Filter waiting items
  const waitingItems = gtdItems.filter((item: GTDItem) => 
    item.type === 'waiting-for' && item.status === 'active'
  );

  // Apply search filter
  const filteredItems = waitingItems.filter((item: GTDItem) => {
    const searchLower = searchTerm.toLowerCase();
    return item.title.toLowerCase().includes(searchLower) ||
           (item.description && item.description.toLowerCase().includes(searchLower));
  });

  // Função para sugerir quadrante baseado nos dados GTD
  const suggestQuadrant = (item: GTDItem): EisenhowerQuadrant => {
    const hasDeadline = item.dueDate && new Date(item.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const isHighEnergy = item.energy === 'high';
    const isWorkContext = item.context?.includes('@trabalho') || item.context?.includes('@office') || item.context?.includes('@work');
    const hasLongEstimate = item.estimatedTime && item.estimatedTime > 60;
    
    // Lógica melhorada de classificação
    if (hasDeadline && (isHighEnergy || isWorkContext || hasLongEstimate)) {
      return 'urgent-important';
    } else if (!hasDeadline && (isHighEnergy || isWorkContext || hasLongEstimate)) {
      return 'not-urgent-important';
    } else if (hasDeadline && !isHighEnergy) {
      return 'urgent-not-important';
    } else {
      return 'not-urgent-not-important';
    }
  };

  const getQuadrantValues = (quadrant: EisenhowerQuadrant) => {
    switch (quadrant) {
      case 'urgent-important': return { urgency: 4, importance: 4 };
      case 'not-urgent-important': return { urgency: 2, importance: 4 };
      case 'urgent-not-important': return { urgency: 4, importance: 2 };
      case 'not-urgent-not-important': return { urgency: 2, importance: 2 };
    }
  };

  // Verificar se tarefa já está na matriz
  const isTaskInMatrix = (gtdItemId: string) => {
    return eisenhowerTasks.some(task => task.gtdItemId === gtdItemId);
  };

  const handleCompleteItem = async (itemId: string) => {
    try {
      // Atualizar localmente primeiro
      update(itemId, { 
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      });

      // Sincronizar com Eisenhower
      await syncTaskCompletion(itemId, 'gtd', true);
      
      notifySuccess('Item concluído', 'Sincronizado automaticamente com a Matriz de Eisenhower');
    } catch (error) {
      notifyError('Erro', 'Não foi possível concluir o item');
      console.error('Error completing item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await syncTaskDeletion(itemId, 'gtd');
      } catch (error) {
        notifyError('Erro', 'Não foi possível excluir o item');
        console.error('Error deleting item:', error);
      }
    }
  };

  const handlePrioritizeInMatrix = async (item: GTDItem) => {
    try {
      // Verificar se já está na matriz
      if (isTaskInMatrix(item.id)) {
        return;
      }

      const suggestedQuadrant = suggestQuadrant(item);
      const { urgency, importance } = getQuadrantValues(suggestedQuadrant);
      
      const eisenhowerTask = {
        gtdItemId: item.id,
        title: item.title,
        description: item.description,
        quadrant: suggestedQuadrant,
        urgency,
        importance,
        status: 'pending' as const,
        dueDate: item.dueDate,
      };
      
      createEisenhowerTask(eisenhowerTask);
      
      // Feedback com informação do quadrante sugerido
      const quadrantNames = {
        'urgent-important': 'Fazer Agora (Urgente + Importante)',
        'not-urgent-important': 'Agendar (Importante)',
        'urgent-not-important': 'Delegar (Urgente)',
        'not-urgent-not-important': 'Eliminar (Baixa prioridade)'
      };
      
      notifySuccess('Item adicionado à Matriz', `Sugerido: ${quadrantNames[suggestedQuadrant]}`);
    } catch (error) {
      notifyError('Erro', 'Não foi possível priorizar na matriz');
      console.error('Error prioritizing in matrix:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays < 0) return `${Math.abs(diffDays)} dias atrás`;
    if (diffDays <= 7) return `Em ${diffDays} dias`;
    
    return date.toLocaleDateString('pt-BR');
  };

  // Funções auxiliares para delegação
  const getFollowUpDate = (item: GTDItem) => {
    const followUpTag = item.tags?.find(tag => tag.startsWith('follow-up:'));
    return followUpTag ? followUpTag.split(':')[1] : null;
  };

  const getPriority = (item: GTDItem) => {
    const priorityTag = item.tags?.find(tag => tag.startsWith('priority:'));
    return priorityTag ? priorityTag.split(':')[1] : 'medium';
  };

  const getDelegationType = (item: GTDItem) => {
    const typeTag = item.tags?.find(tag => tag.startsWith('type:'));
    return typeTag ? typeTag.split(':')[1] : 'waiting';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delegated': return <Users className="h-3 w-3" />;
      case 'waiting': return <Clock className="h-3 w-3" />;
      case 'external': return <AlertTriangle className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const getDaysUntilFollowUp = (followUpDate: string | null) => {
    if (!followUpDate) return null;
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = followUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (waitingItems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nada aguardando</h3>
            <p className="text-muted-foreground mb-4">
              Itens delegados ou que dependem de outras pessoas aparecerão aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Aguardando Por</h3>
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} de {waitingItems.length} item{waitingItems.length !== 1 ? 's' : ''} 
            {filteredItems.length !== waitingItems.length && ' (filtrados)'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou pessoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clear Filters */}
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item: GTDItem) => {
          const inMatrix = isTaskInMatrix(item.id);
          const suggestedQuadrant = suggestQuadrant(item);
          const followUpDate = getFollowUpDate(item);
          const priority = getPriority(item);
          const delegationType = getDelegationType(item);
          const daysUntilFollowUp = getDaysUntilFollowUp(followUpDate);
          
          return (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {/* Complete Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompleteItem(item.id)}
                    className="flex-shrink-0 h-8 w-8 p-0 rounded-full hover:bg-green-50 hover:border-green-300"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    {/* Title and Description */}
                    <div className="flex items-start gap-2 mb-1">
                      <h4 className="font-medium text-sm line-clamp-2 flex-1">
                        {item.title}
                      </h4>
                      {getTypeIcon(delegationType)}
                    </div>
                    
                    {/* Delegated To */}
                    {item.stakeholder && (
                      <p className="text-sm text-blue-700 mb-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {delegationType === 'delegated' ? 'Delegado para:' : 'Aguardando de:'} <strong>{item.stakeholder}</strong>
                      </p>
                    )}
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority */}
                      <Badge className={`text-xs ${getPriorityColor(priority)}`}>
                        {priority === 'urgent' ? '🔴 Urgente' : 
                         priority === 'high' ? '🟠 Alta' : 
                         priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                      </Badge>

                      {/* Follow-up Date */}
                      {followUpDate && (
                        <Badge variant="outline" className={`text-xs ${
                          daysUntilFollowUp !== null && daysUntilFollowUp <= 0 ? 'bg-red-50 text-red-700 border-red-200' :
                          daysUntilFollowUp !== null && daysUntilFollowUp <= 2 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {daysUntilFollowUp !== null && daysUntilFollowUp <= 0 ? 'Follow-up hoje!' :
                           daysUntilFollowUp !== null && daysUntilFollowUp === 1 ? 'Follow-up amanhã' :
                           daysUntilFollowUp !== null ? `Follow-up em ${daysUntilFollowUp}d` :
                           'Follow-up agendado'}
                        </Badge>
                      )}

                      {/* Due Date */}
                      {item.dueDate && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Prazo: {formatDate(item.dueDate.toISOString())}
                        </Badge>
                      )}

                      {/* Matrix Status */}
                      {inMatrix && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          <Grid3X3 className="h-3 w-3 mr-1" />
                          Na Matriz
                        </Badge>
                      )}

                      {/* Suggested Quadrant Preview for non-matrix items */}
                      {!inMatrix && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                          <Target className="h-3 w-3 mr-1" />
                          Sugestão: {suggestedQuadrant.replace('urgent-', 'U+').replace('not-urgent-', '').replace('important', 'I').replace('not-important', 'NI')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="flex items-center gap-1">
                    {/* Prioritize in Matrix Button */}
                    {!inMatrix && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrioritizeInMatrix(item)}
                        className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                        title={`Priorizar na Matriz (sugestão: ${suggestedQuadrant})`}
                      >
                        <Grid3X3 className="h-3 w-3 mr-1" />
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingItem(item.id)}
                      className="h-8 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No results */}
      {filteredItems.length === 0 && waitingItems.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">Nenhum item encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar o termo de busca
              </p>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Dialogs */}
      {editingItem && (
        <EditWaitingDialog
          item={gtdItems.find(item => item.id === editingItem)!}
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
        />
      )}
    </div>
  );
} 