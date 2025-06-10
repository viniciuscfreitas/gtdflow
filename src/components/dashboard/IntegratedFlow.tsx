'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Target, 
  CheckSquare, 
  Grid3X3, 
  BarChart3, 
  Timer,
  Zap,
  Play,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface FlowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
  action: string;
  status: 'pending' | 'active' | 'completed';
}

export function IntegratedFlow() {
  // Definir o fluxo integrado das metodologias
  const flowSteps: FlowStep[] = [
    {
      id: 'okrs',
      title: 'OKRs - Estratégia',
      description: 'Defina objetivos claros e resultados-chave mensuráveis',
      icon: <Target className="h-5 w-5" />,
      color: 'blue',
      href: '/okrs',
      action: 'Definir Objetivos',
      status: 'pending'
    },
    {
      id: 'gtd',
      title: 'GTD - Organização',
      description: 'Capture e organize todas as suas tarefas e projetos',
      icon: <CheckSquare className="h-5 w-5" />,
      color: 'green',
      href: '/gtd',
      action: 'Capturar Tarefas',
      status: 'pending'
    },
    {
      id: 'matrix',
      title: 'Matriz - Priorização',
      description: 'Priorize tarefas por urgência e importância',
      icon: <Grid3X3 className="h-5 w-5" />,
      color: 'orange',
      href: '/matrix',
      action: 'Priorizar Tarefas',
      status: 'pending'
    },
    {
      id: 'pareto',
      title: 'Pareto - Reflexão',
      description: 'Identifique as atividades de maior impacto',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'purple',
      href: '/pareto',
      action: 'Analisar Impacto',
      status: 'pending'
    },
    {
      id: 'pomodoro',
      title: 'Pomodoro - Execução',
      description: 'Execute com foco total usando técnica Pomodoro',
      icon: <Timer className="h-5 w-5" />,
      color: 'red',
      href: '/pomodoro',
      action: 'Executar Foco',
      status: 'pending'
    }
  ];

  // Determinar classes de cor
  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'text') => {
    const colorMap = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header do Fluxo */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Fluxo Integrado GTD Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Siga este fluxo para maximizar sua produtividade combinando todas as metodologias:
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-primary">
              Estratégia → Organização → Priorização → Reflexão → Execução
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo Visual */}
      <div className="space-y-4">
        {flowSteps.map((step, index) => (
          <div key={step.id} className="relative">
            <Card className={`transition-all hover:shadow-md ${getColorClasses(step.color, 'border')} border-l-4`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Ícone e Número */}
                    <div className={`p-3 rounded-full ${getColorClasses(step.color, 'bg')}`}>
                      <div className={getColorClasses(step.color, 'text')}>
                        {step.icon}
                      </div>
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Passo {index + 1}
                        </Badge>
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {step.description}
                      </p>
                      
                      {/* Benefícios específicos */}
                      <div className="text-sm text-muted-foreground">
                        {step.id === 'okrs' && '• Direção estratégica clara • Metas mensuráveis • Alinhamento de esforços'}
                        {step.id === 'gtd' && '• Mente livre • Tudo capturado • Organização sistemática'}
                        {step.id === 'matrix' && '• Foco no importante • Redução de urgências • Melhor gestão de tempo'}
                        {step.id === 'pareto' && '• Identificação do que importa • Otimização de esforços • Máximo resultado'}
                        {step.id === 'pomodoro' && '• Foco intenso • Pausas estratégicas • Produtividade sustentável'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ação */}
                  <div className="flex flex-col items-end gap-2">
                    <Link href={step.href}>
                      <Button className={`${getColorClasses(step.color, 'text')} hover:${getColorClasses(step.color, 'bg')}`} variant="outline">
                        <Play className="h-4 w-4 mr-2" />
                        {step.action}
                      </Button>
                    </Link>
                    
                    {/* Status */}
                    <Badge 
                      variant={step.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {step.status === 'completed' ? '✅ Concluído' : 
                       step.status === 'active' ? '🔄 Em andamento' : 
                       '⏳ Pendente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Seta para próximo passo */}
            {index < flowSteps.length - 1 && (
              <div className="flex justify-center my-2">
                <div className="p-2 bg-muted rounded-full">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dicas de Integração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Dicas de Integração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Fluxo Diário Recomendado
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Manhã: Revisar OKRs e prioridades da matriz</li>
                <li>• Processar inbox GTD (máximo 10 itens)</li>
                <li>• Focar em tarefas urgentes/importantes</li>
                <li>• Executar com Pomodoro (mínimo 4 sessões)</li>
                <li>• Noite: Reflexão Pareto sobre o dia</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Sincronização Automática
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Tarefas GTD → Matriz de Eisenhower</li>
                <li>• Tarefas priorizadas → Seleção Pomodoro</li>
                <li>• Sessões Pomodoro → Análise Pareto</li>
                <li>• Progresso → Atualização OKRs</li>
                <li>• Tudo integrado em tempo real</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Comece com pequenos passos. Não precisa implementar tudo de uma vez.
              </div>
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Começar Agora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 