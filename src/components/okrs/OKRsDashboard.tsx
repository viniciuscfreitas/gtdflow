'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3
} from 'lucide-react';
import { useObjectives, useKeyResults } from '@/lib/hooks/useLocalStorage';
import { Objective, KeyResult } from '@/lib/types';
// Temporarily commented out for debugging
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Função auxiliar para garantir que um valor seja um número válido
const safeNumber = (value: unknown, fallback: number = 0): number => {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? fallback : num;
};

// Função auxiliar para calcular progresso de Key Result
const calculateKeyResultProgress = (kr: { currentValue?: number; targetValue?: number }): number => {
  const currentValue = safeNumber(kr.currentValue, 0);
  const targetValue = safeNumber(kr.targetValue, 1); // Evita divisão por zero
  
  if (targetValue <= 0) return 0;
  
  const progress = (currentValue / targetValue) * 100;
  return Math.min(Math.max(progress, 0), 100); // Garante que está entre 0 e 100
};

export function OKRsDashboard() {
  const { data: objectives } = useObjectives();
  const { data: keyResults } = useKeyResults();

  // Debug logs
  console.log('OKRsDashboard - Raw objectives:', objectives);
  console.log('OKRsDashboard - Raw keyResults:', keyResults);

  // Validate and sanitize data
  const validObjectives = useMemo(() => {
    if (!Array.isArray(objectives)) {
      console.log('OKRsDashboard - objectives is not an array:', typeof objectives, objectives);
      return [];
    }
    
    const filtered = objectives.filter((obj): obj is Objective => {
      const isValid = obj && 
             typeof obj === 'object' && 
             typeof obj.title === 'string' &&
             obj.title.trim() !== '' &&
             Array.isArray(obj.keyResults);
      
      if (!isValid) {
        console.log('OKRsDashboard - Invalid objective:', obj);
      }
      
      return isValid;
    }).map(obj => ({
      ...obj,
      keyResults: Array.isArray(obj.keyResults) ? obj.keyResults.filter((kr): kr is KeyResult => {
        const isValid = kr && 
               typeof kr === 'object' &&
               typeof kr.title === 'string' &&
               kr.title.trim() !== '' &&
               typeof kr.currentValue !== 'undefined' &&
               typeof kr.targetValue !== 'undefined';
        
        if (!isValid) {
          console.log('OKRsDashboard - Invalid key result:', kr);
        }
        
        return isValid;
      }) : []
    }));
    
    console.log('OKRsDashboard - Valid objectives:', filtered);
    return filtered;
  }, [objectives]);

  const validKeyResults = useMemo(() => {
    if (!Array.isArray(keyResults)) {
      console.log('OKRsDashboard - keyResults is not an array:', typeof keyResults, keyResults);
      return [];
    }
    
    const filtered = keyResults.filter((kr): kr is KeyResult => {
      const isValid = kr && 
             typeof kr === 'object' &&
             typeof kr.title === 'string' &&
             kr.title.trim() !== '' &&
             typeof kr.currentValue !== 'undefined' &&
             typeof kr.targetValue !== 'undefined' &&
             typeof kr.status === 'string';
      
      if (!isValid) {
        console.log('OKRsDashboard - Invalid key result:', kr);
      }
      
      return isValid;
    });
    
    console.log('OKRsDashboard - Valid key results:', filtered);
    return filtered;
  }, [keyResults]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalObjectives = validObjectives.length;
    const activeObjectives = validObjectives.filter((obj: Objective) => obj.status === 'active').length;
    const completedObjectives = validObjectives.filter((obj: Objective) => obj.status === 'completed').length;
    const totalKeyResults = validKeyResults.length;
    
    // Calculate overall progress
    let overallProgress = 0;
    if (validObjectives.length > 0) {
      const totalProgress = validObjectives.reduce((sum: number, obj: Objective) => {
        if (!obj.keyResults || obj.keyResults.length === 0) return sum;
        
        const objProgress = obj.keyResults.reduce((krSum: number, kr: KeyResult) => {
          const progress = calculateKeyResultProgress(kr);
          return krSum + progress;
        }, 0) / obj.keyResults.length;
        
        return sum + safeNumber(objProgress, 0);
      }, 0);
      
      overallProgress = Math.round(safeNumber(totalProgress / validObjectives.length, 0));
    }

    // Key Results by status
    const keyResultsByStatus = {
      'not-started': validKeyResults.filter((kr: KeyResult) => kr.status === 'not-started').length,
      'in-progress': validKeyResults.filter((kr: KeyResult) => kr.status === 'in-progress').length,
      'completed': validKeyResults.filter((kr: KeyResult) => kr.status === 'completed').length,
      'at-risk': validKeyResults.filter((kr: KeyResult) => kr.status === 'at-risk').length,
    };

    // Objectives by quarter
    const objectivesByQuarter = validObjectives.reduce((acc: Record<string, number>, obj: Objective) => {
      const quarter = obj.quarter || 'Sem trimestre';
      if (!acc[quarter]) acc[quarter] = 0;
      acc[quarter]++;
      return acc;
    }, {});

    const completionRate = totalObjectives > 0 
      ? Math.round((completedObjectives / totalObjectives) * 100) 
      : 0;

    return {
      totalObjectives,
      activeObjectives,
      completedObjectives,
      totalKeyResults,
      overallProgress: safeNumber(overallProgress, 0),
      keyResultsByStatus,
      objectivesByQuarter,
      completionRate: safeNumber(completionRate, 0)
    };
  }, [validObjectives, validKeyResults]);

  // Chart data
  const statusChartData = [
    { name: 'Não Iniciados', value: safeNumber(metrics.keyResultsByStatus['not-started'], 0), color: '#94a3b8' },
    { name: 'Em Progresso', value: safeNumber(metrics.keyResultsByStatus['in-progress'], 0), color: '#3b82f6' },
    { name: 'Concluídos', value: safeNumber(metrics.keyResultsByStatus['completed'], 0), color: '#10b981' },
    { name: 'Em Risco', value: safeNumber(metrics.keyResultsByStatus['at-risk'], 0), color: '#ef4444' },
  ].filter(item => item.value > 0); // Remove itens com valor 0 para evitar problemas no gráfico

  const quarterChartData = Object.entries(metrics.objectivesByQuarter)
    .map(([quarter, count]) => {
      const item = {
        quarter: quarter && quarter.trim() !== '' ? quarter : 'Sem trimestre',
        count: safeNumber(count, 0),
      };
      
      // Ensure count is a valid positive integer
      item.count = Math.max(0, Math.floor(item.count));
      
      return item;
    })
    .filter(item => {
      const isValid = item.quarter && 
                     item.quarter.trim() !== '' && 
                     typeof item.count === 'number' && 
                     !isNaN(item.count) && 
                     isFinite(item.count) && 
                     item.count > 0;
      
      if (!isValid) {
        console.log('OKRsDashboard - Invalid quarter chart item:', item);
      }
      
      return isValid;
    });

  // Progress by objective for bar chart
  const progressChartData = validObjectives
    .map((obj: Objective) => {
      let progress = 0;
      
      if (obj.keyResults && obj.keyResults.length > 0) {
        const totalProgress = obj.keyResults.reduce((sum: number, kr: KeyResult) => {
          return sum + calculateKeyResultProgress(kr);
        }, 0);
        progress = Math.round(safeNumber(totalProgress / obj.keyResults.length, 0));
      }
      
      const item = {
        name: obj.title && obj.title.length > 20 
          ? obj.title.substring(0, 20) + '...' 
          : obj.title || 'Objetivo sem título',
        progress: safeNumber(progress, 0),
        keyResults: safeNumber(obj.keyResults?.length, 0)
      };
      
      // Ensure progress is a valid number between 0 and 100
      item.progress = Math.max(0, Math.min(100, item.progress));
      
      return item;
    })
    .filter(item => {
      const isValid = item.name && 
                     item.name.trim() !== '' && 
                     typeof item.progress === 'number' && 
                     !isNaN(item.progress) && 
                     isFinite(item.progress);
      
      if (!isValid) {
        console.log('OKRsDashboard - Invalid progress chart item:', item);
      }
      
      return isValid;
    });

  const COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#ef4444'];

  // Debug logs for chart data
  console.log('OKRsDashboard - statusChartData:', JSON.stringify(statusChartData, null, 2));
  console.log('OKRsDashboard - quarterChartData:', JSON.stringify(quarterChartData, null, 2));
  console.log('OKRsDashboard - progressChartData:', JSON.stringify(progressChartData, null, 2));
  console.log('OKRsDashboard - progressChartData sanitized:', JSON.stringify(progressChartData.map(item => ({
    ...item,
    progress: safeNumber(item.progress, 0)
  })), null, 2));
  console.log('OKRsDashboard - metrics:', JSON.stringify(metrics, null, 2));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Dashboard OKRs</h2>
          <p className="text-muted-foreground">
            Visão geral do progresso e métricas dos seus objetivos
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metrics.overallProgress}%</div>
            <div className="mt-2">
              <Progress value={metrics.overallProgress} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Baseado em {metrics.totalKeyResults} Key Results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objetivos Ativos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeObjectives}</div>
            <p className="text-xs text-muted-foreground">
              de {metrics.totalObjectives} total
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {metrics.completionRate}% concluídos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Key Results</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalKeyResults}</div>
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">
                {metrics.keyResultsByStatus.completed} concluídos
              </span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600">
                {metrics.keyResultsByStatus['at-risk']} em risco
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Trimestre</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(metrics.objectivesByQuarter).length}
            </div>
            <p className="text-xs text-muted-foreground">
              trimestres com objetivos
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Clock className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">
                {metrics.keyResultsByStatus['in-progress']} em progresso
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Results Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Key Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              Status dos resultados-chave por categoria
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {statusChartData.length > 0 && statusChartData.every(item => 
                typeof item.value === 'number' && 
                !isNaN(item.value) && 
                isFinite(item.value) &&
                item.value > 0
              ) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${safeNumber(percent * 100, 0).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Nenhum Key Result encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Objectives by Quarter */}
        <Card>
          <CardHeader>
            <CardTitle>Objetivos por Trimestre</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribuição temporal dos objetivos
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {quarterChartData.length > 0 && quarterChartData.every(item => 
                typeof item.count === 'number' && 
                !isNaN(item.count) && 
                isFinite(item.count) &&
                item.count > 0
              ) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quarterChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="quarter"
                      interval={0}
                    />
                    <YAxis 
                      allowDecimals={false}
                      domain={[0, 'dataMax']}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Nenhum objetivo encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress by Objective */}
      {(() => {
        // Sanitizar e validar dados do gráfico de progresso
        const sanitizedProgressData = progressChartData
          .filter(item => 
            item && 
            typeof item.progress === 'number' && 
            !isNaN(item.progress) && 
            isFinite(item.progress) &&
            item.progress >= 0 && 
            item.progress <= 100 &&
            typeof item.name === 'string' &&
            item.name.length > 0
          )
          .map(item => ({
            ...item,
            progress: Math.max(0, Math.min(100, safeNumber(item.progress, 0))),
            name: item.name.substring(0, 30) + (item.name.length > 30 ? '...' : '')
          }));

        console.log('OKRsDashboard - sanitizedProgressData final:', JSON.stringify(sanitizedProgressData, null, 2));

        if (sanitizedProgressData.length === 0) {
          return null;
        }

        // Verificação adicional para garantir que há dados válidos para o gráfico
        const hasValidData = sanitizedProgressData.some(item => 
          typeof item.progress === 'number' && 
          isFinite(item.progress) && 
          item.progress >= 0
        );

        if (!hasValidData) {
          return null;
        }

        // Log dos dados finais que serão passados para o gráfico
        const finalChartData = sanitizedProgressData.map(item => ({
          ...item,
          progress: Math.max(0.1, item.progress)
        }));
        console.log('OKRsDashboard - finalChartData for BarChart:', JSON.stringify(finalChartData, null, 2));

        return (
          <Card>
            <CardHeader>
              <CardTitle>Progresso por Objetivo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Percentual de conclusão de cada objetivo baseado nos Key Results
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={finalChartData} 
                    layout="horizontal"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis 
                    type="number" 
                    domain={[
                      (min: number) => {
                        if (isFinite(min) && min >= 0) {
                          return Math.max(0, min);
                        }
                        return 0;
                      },
                      (max: number) => {
                        if (isFinite(max) && max <= 100) {
                          return Math.min(100, max);
                        }
                        return 100;
                      }
                    ]}
                    ticks={[0, 25, 50, 75, 100]}
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    axisLine={true}
                    tickLine={true}
                  />
                                      <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150}
                    interval={0}
                    tick={{ fontSize: 12 }}
                    axisLine={true}
                    tickLine={true}
                    domain={['dataMin', 'dataMax']}
                  />
                                      <Tooltip 
                    formatter={(value, name, props) => {
                      // Encontrar o valor original dos dados sanitizados
                      const originalItem = sanitizedProgressData.find(item => item.name === props.payload?.name);
                      const originalProgress = originalItem ? originalItem.progress : value;
                      return [`${safeNumber(originalProgress, 0)}%`, 'Progresso'];
                    }}
                    labelFormatter={(label) => `Objetivo: ${label}`}
                  />
                    <Bar 
                      dataKey="progress" 
                      fill="#10b981"
                      minPointSize={3}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Excelente Progresso */}
            {metrics.overallProgress >= 80 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Excelente Progresso!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Você está com {metrics.overallProgress}% de progresso geral. Continue assim!
                </p>
              </div>
            )}

            {/* Progresso Moderado */}
            {metrics.overallProgress >= 30 && metrics.overallProgress < 80 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">Progresso Consistente</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {metrics.overallProgress}% concluído. Você está no caminho certo!
                </p>
              </div>
            )}

            {/* Início da Jornada */}
            {metrics.overallProgress >= 0 && metrics.overallProgress < 30 && metrics.totalObjectives > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-800">
                  <Target className="h-5 w-5" />
                  <span className="font-medium">Início da Jornada</span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  {metrics.totalObjectives} objetivo{metrics.totalObjectives !== 1 ? 's' : ''} definido{metrics.totalObjectives !== 1 ? 's' : ''}. 
                  Foque nos primeiros Key Results!
                </p>
              </div>
            )}

            {/* Key Results em Risco */}
            {metrics.keyResultsByStatus['at-risk'] > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Atenção Necessária</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  {metrics.keyResultsByStatus['at-risk']} Key Result{metrics.keyResultsByStatus['at-risk'] !== 1 ? 's' : ''} em risco. 
                  Revise e ajuste as estratégias.
                </p>
              </div>
            )}

            {/* Key Results em Progresso */}
            {metrics.keyResultsByStatus['in-progress'] > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-orange-800">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Em Andamento</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  {metrics.keyResultsByStatus['in-progress']} Key Result{metrics.keyResultsByStatus['in-progress'] !== 1 ? 's' : ''} em progresso. 
                  Mantenha o foco!
                </p>
              </div>
            )}

            {/* Key Results Concluídos */}
            {metrics.keyResultsByStatus['completed'] > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Conquistas</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {metrics.keyResultsByStatus['completed']} Key Result{metrics.keyResultsByStatus['completed'] !== 1 ? 's' : ''} concluído{metrics.keyResultsByStatus['completed'] !== 1 ? 's' : ''}! 
                  Parabéns pelo progresso.
                </p>
              </div>
            )}

            {/* Nenhum Objetivo */}
            {metrics.totalObjectives === 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Target className="h-5 w-5" />
                  <span className="font-medium">Comece Agora</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Defina seus primeiros objetivos para começar a acompanhar seu progresso.
                </p>
              </div>
            )}

            {/* Objetivos sem Key Results */}
            {metrics.totalKeyResults === 0 && metrics.totalObjectives > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Award className="h-5 w-5" />
                  <span className="font-medium">Adicione Key Results</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Seus objetivos precisam de Key Results para serem mensuráveis.
                </p>
              </div>
            )}

            {/* Dica de Produtividade */}
            {metrics.totalKeyResults >= 3 && metrics.keyResultsByStatus['not-started'] > 0 && (
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 text-indigo-800">
                  <Award className="h-5 w-5" />
                  <span className="font-medium">Dica de Foco</span>
                </div>
                <p className="text-sm text-indigo-700 mt-1">
                  Concentre-se em 2-3 Key Results por vez para maximizar o impacto.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 