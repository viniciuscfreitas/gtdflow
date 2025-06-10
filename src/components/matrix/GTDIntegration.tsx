'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowRight, 
  Import, 
  CheckCircle2, 
  AlertTriangle,
  Target,
  Clock,
  Archive
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestoreMatrix } from '@/lib/hooks/useFirestoreMatrix';
import { useAuth } from '@/lib/contexts/AuthContext';
import { GTDItem, EisenhowerQuadrant } from '@/lib/types';
import { toast } from 'sonner';

interface GTDIntegrationProps {
  onClose: () => void;
}

export function GTDIntegration({ onClose }: GTDIntegrationProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const { user } = useAuth();
  const { data: gtdItems } = useFirestoreGTD(user);
  const { create: createEisenhowerTask } = useFirestoreMatrix(user);

  // Filtrar apenas próximas ações ativas
  const availableItems = gtdItems.filter(item => 
    item.type === 'next-action' && 
    item.status === 'active'
  );

  // Sugerir quadrante baseado no contexto e energia da tarefa GTD
  const suggestQuadrant = (item: GTDItem): EisenhowerQuadrant => {
    const hasDeadline = item.dueDate && new Date(item.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // próximos 7 dias
    const isHighEnergy = item.energy === 'high';
    const isWorkContext = item.context?.includes('@trabalho') || item.context?.includes('@office');
    
    // Lógica de sugestão baseada em heurísticas
    if (hasDeadline && (isHighEnergy || isWorkContext)) {
      return 'urgent-important';
    } else if (!hasDeadline && (isHighEnergy || isWorkContext)) {
      return 'not-urgent-important';
    } else if (hasDeadline && !isHighEnergy) {
      return 'urgent-not-important';
    } else {
      return 'not-urgent-not-important';
    }
  };

  const getQuadrantInfo = (quadrant: EisenhowerQuadrant) => {
    switch (quadrant) {
      case 'urgent-important':
        return { 
          name: 'Fazer Agora', 
          color: 'text-red-600', 
          bg: 'bg-red-50',
          icon: AlertTriangle,
          urgency: 4,
          importance: 4
        };
      case 'not-urgent-important':
        return { 
          name: 'Agendar', 
          color: 'text-blue-600', 
          bg: 'bg-blue-50',
          icon: Target,
          urgency: 2,
          importance: 4
        };
      case 'urgent-not-important':
        return { 
          name: 'Delegar', 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-50',
          icon: Clock,
          urgency: 4,
          importance: 2
        };
      case 'not-urgent-not-important':
        return { 
          name: 'Eliminar', 
          color: 'text-gray-600', 
          bg: 'bg-gray-50',
          icon: Archive,
          urgency: 2,
          importance: 2
        };
    }
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === availableItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(availableItems.map(item => item.id));
    }
  };

  const handleImport = async () => {
    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos uma tarefa para importar');
      return;
    }

    setImporting(true);
    
    try {
      const itemsToImport = availableItems.filter(item => selectedItems.includes(item.id));
      
      for (const item of itemsToImport) {
        const suggestedQuadrant = suggestQuadrant(item);
        const quadrantInfo = getQuadrantInfo(suggestedQuadrant);
        
        const eisenhowerTask = {
          gtdItemId: item.id,
          title: item.title,
          description: item.description,
          quadrant: suggestedQuadrant,
          urgency: quadrantInfo.urgency,
          importance: quadrantInfo.importance,
          status: 'pending' as const,
          dueDate: item.dueDate,
        };
        
        createEisenhowerTask(eisenhowerTask);
      }
      
      toast.success(`${itemsToImport.length} tarefa(s) importada(s) com sucesso`);
      onClose();
    } catch (error) {
      toast.error('Erro ao importar tarefas');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Import className="h-5 w-5" />
          Importar Tarefas do GTD
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Selecione as próximas ações do GTD para importar para a Matriz de Eisenhower.
          O quadrante será sugerido automaticamente baseado no contexto e energia.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {availableItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma próxima ação disponível no GTD</p>
            <p className="text-sm">Adicione algumas tarefas no sistema GTD primeiro</p>
          </div>
        ) : (
          <>
            {/* Controles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.length === availableItems.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">
                  Selecionar todas ({availableItems.length} tarefas)
                </span>
              </div>
              <Badge variant="outline">
                {selectedItems.length} selecionada(s)
              </Badge>
            </div>

            {/* Lista de tarefas */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableItems.map((item) => {
                const suggestedQuadrant = suggestQuadrant(item);
                const quadrantInfo = getQuadrantInfo(suggestedQuadrant);
                const Icon = quadrantInfo.icon;
                const isSelected = selectedItems.includes(item.id);
                
                return (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg transition-all ${
                      isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          {item.context && (
                            <Badge variant="secondary" className="text-xs">
                              {item.context}
                            </Badge>
                          )}
                          {item.energy && (
                            <Badge variant="outline" className="text-xs">
                              {item.energy === 'high' ? 'Alta energia' : 
                               item.energy === 'medium' ? 'Média energia' : 'Baixa energia'}
                            </Badge>
                          )}
                          {item.dueDate && (
                            <Badge variant="outline" className="text-xs">
                              {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${quadrantInfo.bg}`}>
                          <Icon className={`h-3 w-3 ${quadrantInfo.color}`} />
                          <span className={quadrantInfo.color}>
                            {quadrantInfo.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleImport}
                disabled={selectedItems.length === 0 || importing}
              >
                {importing ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Import className="h-4 w-4 mr-2" />
                    Importar {selectedItems.length} tarefa(s)
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 