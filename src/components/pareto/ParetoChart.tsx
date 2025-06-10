'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface TaskAnalysis {
  id: string;
  title: string;
  timeSpent: number;
  impact: number;
  value: number;
  category: string;
  completedAt: string;
  isHighImpact: boolean;
}

interface ParetoChartProps {
  data: TaskAnalysis[];
}

export function ParetoChart({ data }: ParetoChartProps) {
  // Preparar dados para gráfico de Pareto
  const paretoData = useMemo(() => {
    if (data.length === 0) return [];

    // Ordenar por valor decrescente
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    // Calcular valores cumulativos
    const totalValue = sortedData.reduce((sum, item) => sum + item.value, 0);
    let cumulativeValue = 0;
    
    return sortedData.map((item, index) => {
      cumulativeValue += item.value;
      const cumulativePercentage = (cumulativeValue / totalValue) * 100;
      
      return {
        name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
        value: Math.round(item.value),
        percentage: Math.round((item.value / totalValue) * 100),
        cumulative: Math.round(cumulativePercentage),
        isHighImpact: item.isHighImpact,
        rank: index + 1
      };
    });
  }, [data]);

  // Dados para gráfico de pizza (categorias)
  const categoryData = useMemo(() => {
    const categoryMap = data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { value: 0, time: 0, count: 0 };
      }
      acc[item.category].value += item.value;
      acc[item.category].time += item.timeSpent;
      acc[item.category].count += 1;
      return acc;
    }, {} as Record<string, { value: number; time: number; count: number }>);

    return Object.entries(categoryMap)
      .map(([category, stats]) => ({
        name: category,
        value: Math.round(stats.value),
        time: stats.time,
        count: stats.count
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Dados para análise temporal
  const timeData = useMemo(() => {
    const timeMap = data.reduce((acc, item) => {
      const date = new Date(item.completedAt).toLocaleDateString('pt-BR');
      if (!acc[date]) {
        acc[date] = { highImpact: 0, lowImpact: 0, total: 0 };
      }
      if (item.isHighImpact) {
        acc[date].highImpact += item.value;
      } else {
        acc[date].lowImpact += item.value;
      }
      acc[date].total += item.value;
      return acc;
    }, {} as Record<string, { highImpact: number; lowImpact: number; total: number }>);

    return Object.entries(timeMap)
      .map(([date, stats]) => ({
        date,
        highImpact: Math.round(stats.highImpact),
        lowImpact: Math.round(stats.lowImpact),
        total: Math.round(stats.total),
        efficiency: stats.total > 0 ? Math.round((stats.highImpact / stats.total) * 100) : 0
      }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - 
                     new Date(b.date.split('/').reverse().join('-')).getTime());
  }, [data]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gráfico de Pareto - Distribuição de Impacto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Gráfico será exibido aqui</h3>
              <p className="text-muted-foreground">
                Complete algumas tarefas para visualizar a regra 80/20
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Pareto Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gráfico de Pareto - Distribuição de Valor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paretoData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'value' ? `${value} pontos` : `${value}%`,
                    name === 'value' ? 'Valor' : 'Acumulado'
                  ]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="value" 
                  fill="#8884d8"
                  name="value"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#ff7300"
                  strokeWidth={2}
                  name="cumulative"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>📊 Este gráfico mostra as tarefas ordenadas por valor (impacto × tempo)</p>
            <p>🎯 Idealmente, as primeiras 20% das tarefas devem gerar 80% do valor total</p>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos secundários */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} pontos`, 'Valor']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Eficiência ao Longo do Tempo */}
        <Card>
          <CardHeader>
            <CardTitle>Eficiência ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'efficiency' ? `${value}%` : `${value} pontos`,
                      name === 'efficiency' ? 'Eficiência' : 
                      name === 'highImpact' ? 'Alto Impacto' : 'Baixo Impacto'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="efficiency"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="highImpact" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="highImpact"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lowImpact" 
                    stroke="#ffc658" 
                    strokeWidth={2}
                    name="lowImpact"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo dos Top 20% */}
      <Card>
        <CardHeader>
          <CardTitle>Top 20% - Tarefas de Maior Impacto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paretoData.slice(0, Math.max(1, Math.ceil(paretoData.length * 0.2))).map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50 border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-semibold text-sm">
                    {item.rank}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.percentage}% do valor total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-700">
                    {item.value} pts
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Acum: {item.cumulative}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 