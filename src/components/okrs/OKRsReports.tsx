'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Target,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useObjectives, useKeyResults } from '@/lib/hooks/useLocalStorage';

export function OKRsReports() {
  const { data: objectives } = useObjectives();
  const { data: keyResults } = useKeyResults();

  // Generate detailed report data
  const reportData = useMemo(() => {
    const currentDate = new Date();
    const currentQuarter = `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${currentDate.getFullYear()}`;
    
    // Filter objectives by current quarter
    const currentQuarterObjectives = objectives.filter((obj: any) => obj.quarter === currentQuarter);
    
    // Calculate detailed metrics
    const totalObjectives = objectives.length;
    const currentQuarterTotal = currentQuarterObjectives.length;
    const completedObjectives = objectives.filter((obj: any) => obj.status === 'completed').length;
    const activeObjectives = objectives.filter((obj: any) => obj.status === 'active').length;
    const atRiskObjectives = objectives.filter((obj: any) => 
      obj.keyResults && obj.keyResults.some((kr: any) => kr.status === 'at-risk')
    ).length;

    // Key Results metrics
    const totalKeyResults = keyResults.length;
    const completedKeyResults = keyResults.filter((kr: any) => kr.status === 'completed').length;
    const inProgressKeyResults = keyResults.filter((kr: any) => kr.status === 'in-progress').length;
    const atRiskKeyResults = keyResults.filter((kr: any) => kr.status === 'at-risk').length;

    // Performance metrics
    const overallProgress = objectives.length > 0 
      ? Math.round(objectives.reduce((sum: number, obj: any) => {
          if (!obj.keyResults || obj.keyResults.length === 0) return sum;
          const objProgress = obj.keyResults.reduce((krSum: number, kr: any) => {
            const progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
            return krSum + Math.min(progress, 100);
          }, 0) / obj.keyResults.length;
          return sum + objProgress;
        }, 0) / objectives.length)
      : 0;

    const completionRate = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;
    const keyResultCompletionRate = totalKeyResults > 0 ? Math.round((completedKeyResults / totalKeyResults) * 100) : 0;

    // Top performing objectives
    const topObjectives = objectives
      .map((obj: any) => {
        const progress = obj.keyResults && obj.keyResults.length > 0
          ? Math.round(obj.keyResults.reduce((sum: number, kr: any) => {
              const krProgress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
              return sum + Math.min(krProgress, 100);
            }, 0) / obj.keyResults.length)
          : 0;
        return { ...obj, calculatedProgress: progress };
      })
      .sort((a: any, b: any) => b.calculatedProgress - a.calculatedProgress)
      .slice(0, 5);

    // Objectives needing attention
    const needsAttention = objectives
      .filter((obj: any) => {
        const hasAtRiskKR = obj.keyResults && obj.keyResults.some((kr: any) => kr.status === 'at-risk');
        const lowProgress = obj.keyResults && obj.keyResults.length > 0 
          ? obj.keyResults.reduce((sum: number, kr: any) => {
              const progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
              return sum + Math.min(progress, 100);
            }, 0) / obj.keyResults.length < 30
          : false;
        return hasAtRiskKR || lowProgress;
      })
      .slice(0, 5);

    return {
      currentQuarter,
      totalObjectives,
      currentQuarterTotal,
      completedObjectives,
      activeObjectives,
      atRiskObjectives,
      totalKeyResults,
      completedKeyResults,
      inProgressKeyResults,
      atRiskKeyResults,
      overallProgress,
      completionRate,
      keyResultCompletionRate,
      topObjectives,
      needsAttention
    };
  }, [objectives, keyResults]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Relatório de OKRs</h2>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho dos seus objetivos
          </p>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo - {reportData.currentQuarter}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{reportData.overallProgress}%</div>
              <div className="text-sm text-muted-foreground">Progresso Geral</div>
              <Progress value={reportData.overallProgress} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{reportData.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Taxa de Conclusão</div>
              <div className="text-xs text-muted-foreground mt-1">
                {reportData.completedObjectives} de {reportData.totalObjectives} objetivos
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{reportData.keyResultCompletionRate}%</div>
              <div className="text-sm text-muted-foreground">Key Results Concluídos</div>
              <div className="text-xs text-muted-foreground mt-1">
                {reportData.completedKeyResults} de {reportData.totalKeyResults} resultados
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{reportData.atRiskObjectives}</div>
              <div className="text-sm text-muted-foreground">Objetivos em Risco</div>
              <div className="text-xs text-muted-foreground mt-1">
                Requerem atenção imediata
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objectives Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Breakdown de Objetivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total de Objetivos</span>
              <span className="font-bold">{reportData.totalObjectives}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Trimestre Atual</span>
              <span className="font-bold">{reportData.currentQuarterTotal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Concluídos
              </span>
              <span className="font-bold text-green-600">{reportData.completedObjectives}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-600" />
                Ativos
              </span>
              <span className="font-bold text-blue-600">{reportData.activeObjectives}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                Em Risco
              </span>
              <span className="font-bold text-red-600">{reportData.atRiskObjectives}</span>
            </div>
          </CardContent>
        </Card>

        {/* Key Results Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Breakdown de Key Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total de Key Results</span>
              <span className="font-bold">{reportData.totalKeyResults}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Concluídos
              </span>
              <span className="font-bold text-green-600">{reportData.completedKeyResults}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-600" />
                Em Progresso
              </span>
              <span className="font-bold text-blue-600">{reportData.inProgressKeyResults}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                Em Risco
              </span>
              <span className="font-bold text-red-600">{reportData.atRiskKeyResults}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
              <div className="text-2xl font-bold text-primary">{reportData.keyResultCompletionRate}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Objectives */}
      {reportData.topObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Objetivos com Melhor Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topObjectives.map((obj: any, index: number) => (
                <div key={obj.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{obj.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(obj.status)}>
                        {getStatusLabel(obj.status)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{obj.quarter}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{obj.calculatedProgress}%</div>
                    <div className="text-xs text-muted-foreground">
                      {obj.keyResults?.length || 0} Key Results
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objectives Needing Attention */}
      {reportData.needsAttention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Objetivos que Precisam de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.needsAttention.map((obj: any) => (
                <div key={obj.id} className="flex items-center gap-4 p-4 border border-red-200 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium">{obj.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(obj.status)}>
                        {getStatusLabel(obj.status)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{obj.quarter}</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {obj.keyResults?.some((kr: any) => kr.status === 'at-risk') 
                        ? 'Contém Key Results em risco'
                        : 'Progresso abaixo do esperado'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.overallProgress < 50 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Progresso Baixo:</strong> Considere revisar as estratégias e recursos alocados para os objetivos.
                </p>
              </div>
            )}
            
            {reportData.atRiskKeyResults > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Key Results em Risco:</strong> Priorize a revisão dos {reportData.atRiskKeyResults} Key Results em risco.
                </p>
              </div>
            )}
            
            {reportData.totalKeyResults === 0 && reportData.totalObjectives > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Faltam Key Results:</strong> Adicione Key Results mensuráveis aos seus objetivos para melhor acompanhamento.
                </p>
              </div>
            )}
            
            {reportData.overallProgress >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Excelente Performance:</strong> Parabéns! Considere definir objetivos mais ambiciosos para o próximo trimestre.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 