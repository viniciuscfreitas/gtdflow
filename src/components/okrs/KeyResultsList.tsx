'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useFirestoreKeyResults, useFirestoreObjectives } from '@/lib/hooks/useFirestoreOKRs';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CreateKeyResultForm } from './CreateKeyResultForm';
import { toast } from 'sonner';

interface KeyResultsListProps {
  objectiveId: string;
}

export function KeyResultsList({ objectiveId }: KeyResultsListProps) {
  const { user } = useAuth();
  const { data: keyResults, remove: removeKeyResult, update: updateKeyResult } = useFirestoreKeyResults(user);
  const { getById: getObjective, update: updateObjective } = useFirestoreObjectives(user);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingKeyResult, setEditingKeyResult] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  const objective = getObjective(objectiveId);
  const objectiveKeyResults = keyResults.filter((kr: any) => kr.objectiveId === objectiveId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'at-risk':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in-progress':
        return 'Em Progresso';
      case 'at-risk':
        return 'Em Risco';
      default:
        return 'Não Iniciado';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'in-progress':
        return <Clock className="h-4 w-4" />;
      case 'at-risk':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const calculateProgress = (keyResult: any) => {
    if (keyResult.targetValue <= 0) return 0;
    return Math.min(Math.round((keyResult.currentValue / keyResult.targetValue) * 100), 100);
  };

  const handleDelete = async (keyResultId: string) => {
    if (confirm('Tem certeza que deseja excluir este Key Result?')) {
      try {
        removeKeyResult(keyResultId);
        
        // Update objective to remove this key result
        if (objective) {
          const updatedKeyResults = (objective.keyResults || []).filter((kr: any) => kr.id !== keyResultId);
          updateObjective(objectiveId, { keyResults: updatedKeyResults } as any);
        }
        
        toast.success('Key Result excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir Key Result');
        console.error('Error deleting key result:', error);
      }
    }
  };

  const handleUpdateProgress = async (keyResultId: string, newValue: number) => {
    try {
      const keyResult = objectiveKeyResults.find((kr: any) => kr.id === keyResultId);
      if (!keyResult) return;

      // Update key result
      updateKeyResult(keyResultId, { currentValue: newValue } as any);
      
      // Update objective's key results array
      if (objective) {
        const updatedKeyResults = (objective.keyResults || []).map((kr: any) => 
          kr.id === keyResultId ? { ...kr, currentValue: newValue } : kr
        );
        updateObjective(objectiveId, { keyResults: updatedKeyResults } as any);
      }
      
      setEditingKeyResult(null);
      toast.success('Progresso atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar progresso');
      console.error('Error updating progress:', error);
    }
  };

  const startEditing = (keyResult: any) => {
    setEditingKeyResult(keyResult.id);
    setEditingValue(keyResult.currentValue);
  };

  const cancelEditing = () => {
    setEditingKeyResult(null);
    setEditingValue(0);
  };

  if (!objective) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>Objetivo não encontrado</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showCreateForm) {
    return (
      <CreateKeyResultForm
        objectiveId={objectiveId}
        onSuccess={() => setShowCreateForm(false)}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Key Results</h3>
          <p className="text-sm text-muted-foreground">
            {objectiveKeyResults.length} resultado{objectiveKeyResults.length !== 1 ? 's' : ''} definido{objectiveKeyResults.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Key Result
        </Button>
      </div>

      {/* Key Results List */}
      {objectiveKeyResults.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-medium mb-2">Nenhum Key Result definido</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione resultados-chave mensuráveis para acompanhar o progresso
              </p>
              <Button onClick={() => setShowCreateForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Key Result
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {objectiveKeyResults.map((keyResult: any) => {
            const progress = calculateProgress(keyResult);
            const isEditing = editingKeyResult === keyResult.id;
            
            return (
              <Card key={keyResult.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">{keyResult.title}</CardTitle>
                      {keyResult.description && (
                        <p className="text-sm text-muted-foreground">{keyResult.description}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(keyResult.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(keyResult.status)}
                        {getStatusLabel(keyResult.status)}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Current Value Editor */}
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(Number(e.target.value))}
                          className="w-24"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-sm text-muted-foreground">
                          de {keyResult.targetValue} {keyResult.unit}
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateProgress(keyResult.id, editingValue)}
                        >
                          Salvar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={cancelEditing}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm">
                          <span className="font-medium">{keyResult.currentValue}</span> de{' '}
                          <span className="font-medium">{keyResult.targetValue}</span> {keyResult.unit}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => startEditing(keyResult)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Atualizar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(keyResult.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 