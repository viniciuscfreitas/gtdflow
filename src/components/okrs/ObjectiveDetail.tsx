'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Target, 
  Calendar,
  TrendingUp,
  Edit,
  AlertCircle
} from 'lucide-react';
import { useObjectives } from '@/lib/hooks/useLocalStorage';
import { KeyResultsList } from './KeyResultsList';

interface ObjectiveDetailProps {
  objectiveId: string;
  onBack?: () => void;
}

export function ObjectiveDetail({ objectiveId, onBack }: ObjectiveDetailProps) {
  const { getById } = useObjectives();
  const [isEditing, setIsEditing] = useState(false);

  const objective = getById(objectiveId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Rascunho';
    }
  };

  const calculateOverallProgress = () => {
    if (!objective?.keyResults || objective.keyResults.length === 0) {
      return 0;
    }
    
    const totalProgress = objective.keyResults.reduce((sum: number, kr: any) => {
      const progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    
    return Math.round(totalProgress / objective.keyResults.length);
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

  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Detalhes do Objetivo</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso e gerencie Key Results
          </p>
        </div>
      </div>

      {/* Objective Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">{objective.title}</CardTitle>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{objective.quarter}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{objective.keyResults?.length || 0} Key Results</span>
                </div>
              </div>

              {objective.description && (
                <p className="text-muted-foreground">{objective.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(objective.status)}>
                {getStatusLabel(objective.status)}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Overall Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Progresso Geral</h4>
              <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {objective.keyResults?.length === 0 
                ? 'Adicione Key Results para acompanhar o progresso'
                : `Baseado em ${objective.keyResults?.length} Key Result${objective.keyResults?.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Quick Stats */}
          {objective.keyResults && objective.keyResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {objective.keyResults.filter((kr: any) => kr.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {objective.keyResults.filter((kr: any) => kr.status === 'in-progress').length}
                </div>
                <div className="text-xs text-muted-foreground">Em Progresso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {objective.keyResults.filter((kr: any) => kr.status === 'at-risk').length}
                </div>
                <div className="text-xs text-muted-foreground">Em Risco</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {objective.keyResults.filter((kr: any) => kr.status === 'not-started').length}
                </div>
                <div className="text-xs text-muted-foreground">Não Iniciados</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Results Section */}
      <KeyResultsList objectiveId={objectiveId} />
    </div>
  );
} 