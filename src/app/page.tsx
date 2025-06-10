'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Grid3X3, 
  ArrowRight,
  CheckCircle2,
  Target,
  Clock,
  Zap,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestoreMatrix } from '@/lib/hooks/useFirestoreMatrix';
import { useAuth } from '@/lib/contexts/AuthContext';
import { QuickCapture } from '@/components/gtd/QuickCapture';
import { CompletedTasksHistory } from '@/components/ui/CompletedTasksHistory';
import { TaskLimitBanner, ProjectLimitBanner } from '@/components/ui/UpgradeBanner';

// Landing Page Component for non-logged users
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Organize tarefas e priorize o que
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600"> importa</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Pare de usar 5 apps diferentes - organize tudo em um sistema que realmente funciona
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  Começar Grátis
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Já tenho conta
                </Button>
              </Link>
            </div>

            <p className="text-sm text-gray-500">
              ✅ Grátis para sempre • ✅ Sem cartão de crédito • ✅ Setup em 2 minutos
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gray-500 mb-4">Usado por profissionais em:</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <span className="text-lg font-semibold">Startups</span>
              <span className="text-lg font-semibold">Empresas</span>
              <span className="text-lg font-semibold">Freelancers</span>
              <span className="text-lg font-semibold">Estudantes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              O problema que você conhece bem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Você tem tarefas espalhadas em emails, notas, apps diferentes... e nunca sabe o que fazer primeiro
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Target className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Tarefas espalhadas</h3>
                    <p className="text-gray-600">Email, WhatsApp, papel, apps... você nunca lembra onde anotou</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Não sabe priorizar</h3>
                    <p className="text-gray-600">Tudo parece urgente, você se perde no que é realmente importante</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Perde tempo organizando</h3>
                    <p className="text-gray-600">Gasta mais tempo organizando do que fazendo o trabalho</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-green-600 p-8 rounded-2xl text-white">
              <h3 className="text-2xl font-bold mb-6">GTD Flow resolve isso</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Captura tudo em um lugar só</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Prioriza automaticamente por importância</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Organiza sem você perder tempo</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Sincroniza em todos seus dispositivos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Duas metodologias poderosas em um só lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              GTD para organizar + Matriz de Eisenhower para priorizar = Produtividade sem stress
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-2 hover:border-blue-200 transition-colors">
              <div className="text-center">
                <CheckSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Sistema GTD</h3>
                <p className="text-gray-600 mb-6">
                  Capture, organize e processe tudo que está na sua mente de forma sistemática
                </p>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• Inbox para captura rápida</li>
                  <li>• Próximas ações organizadas</li>
                  <li>• Lista &quot;Aguardando&quot;</li>
                  <li>• Arquivo de referência</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-2 hover:border-green-200 transition-colors">
              <div className="text-center">
                <Grid3X3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Matriz de Eisenhower</h3>
                <p className="text-gray-600 mb-6">
                  Priorize automaticamente por urgência e importância
                </p>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• Importante + Urgente (Crise)</li>
                  <li>• Importante + Não urgente (Planejamento)</li>
                  <li>• Não importante + Urgente (Delegue)</li>
                  <li>• Não importante + Não urgente (Elimine)</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Comece grátis, evolua quando precisar
            </h2>
            <p className="text-xl text-gray-600">
              Use o GTD Flow gratuitamente para sempre, ou desbloqueie recursos avançados
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 border-2">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Grátis</h3>
                <p className="text-gray-600 mb-6">Para começar sua jornada</p>
                <div className="text-4xl font-bold mb-6">R$ 0<span className="text-lg text-gray-500">/mês</span></div>
                
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>100 tarefas ativas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>3 projetos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Matriz de Eisenhower completa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Sync em tempo real</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>App mobile (PWA)</span>
                  </li>
                </ul>

                <Link href="/auth/register">
                  <Button size="lg" variant="outline" className="w-full">
                    Começar Grátis
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-8 border-2 border-blue-200 bg-blue-50 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-gray-600 mb-6">Para profissionais sérios</p>
                <div className="text-4xl font-bold mb-2">R$ 29<span className="text-lg text-gray-500">/mês</span></div>
                <p className="text-sm text-gray-500 mb-6">ou R$ 249/ano (30% off)</p>
                
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span><strong>Tudo do Grátis +</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Tarefas e projetos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Técnica Pomodoro integrada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Análise Pareto (80/20)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>OKRs para grandes objetivos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Colaboração em equipe</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>

                <Link href="/auth/register">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                    Teste 7 dias grátis
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para ter controle total das suas tarefas?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de profissionais que já organizaram sua produtividade
          </p>
          
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100">
              Começar Grátis Agora
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <p className="text-blue-200 mt-4 text-sm">
            Sem compromisso • Cancele quando quiser • Setup em 2 minutos
          </p>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component for logged users (existing code)
function Dashboard() {
  const { user } = useAuth();
  const { data: gtdItems } = useFirestoreGTD(user);
  const { data: eisenhowerTasks } = useFirestoreMatrix(user);

  // Estatísticas essenciais
  const stats = {
    inbox: gtdItems.filter(item => item.type === 'inbox').length,
    nextActions: gtdItems.filter(item => item.type === 'next-action' && item.status === 'active').length,
    waiting: gtdItems.filter(item => item.type === 'waiting-for' && item.status === 'active').length,
    matrixTasks: eisenhowerTasks.filter(task => task.status === 'pending').length,
    completedToday: eisenhowerTasks.filter(task => 
      task.status === 'completed' && 
      task.completedAt && 
      new Date(task.completedAt).toDateString() === new Date().toDateString()
    ).length
  };

  const needsAttention = stats.inbox > 0;

  const totalActiveTasks = stats.inbox + stats.nextActions + stats.matrixTasks;
  const projects = new Set(
    gtdItems
      .filter(item => item.projectId && item.projectId.trim())
      .map(item => item.projectId)
  );
  const totalProjects = projects.size;

  return (
    <div className="py-6 space-y-6 max-w-4xl mx-auto">
      {/* Captura Rápida */}
      <QuickCapture />

      {/* Upgrade Banners - Strategic Friction */}
      <TaskLimitBanner currentTasks={totalActiveTasks} />
      <ProjectLimitBanner currentProjects={totalProjects} />

      {/* Estatísticas Essenciais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link href="/gtd">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${needsAttention ? 'ring-2 ring-orange-200 bg-orange-50' : 'hover:bg-muted/50'}`}>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.inbox}</div>
              <div className="text-sm font-medium">Inbox</div>
              {needsAttention && (
                <div className="text-xs text-orange-700 mt-1">Processar</div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/gtd">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:bg-muted/50">
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.nextActions}</div>
              <div className="text-sm font-medium">Ações</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/gtd">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:bg-muted/50">
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
              <div className="text-sm font-medium">Aguardando</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/matrix">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:bg-muted/50">
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.matrixTasks}</div>
              <div className="text-sm font-medium">Matriz</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/completed">
          <Card className="cursor-pointer transition-all hover:shadow-md bg-green-50 border-green-200 hover:border-green-300">
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
              <div className="text-sm font-medium">Hoje</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Ações Rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/gtd">
          <Card className="cursor-pointer transition-all hover:shadow-md border-green-200 hover:border-green-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold">GTD</h3>
                    <p className="text-sm text-muted-foreground">Organizar tarefas</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/matrix">
          <Card className="cursor-pointer transition-all hover:shadow-md border-blue-200 hover:border-blue-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Grid3X3 className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Matriz</h3>
                    <p className="text-sm text-muted-foreground">Priorizar tarefas</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alerta de Ação (apenas se necessário) */}
      {needsAttention && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-900">
                  {stats.inbox} item{stats.inbox !== 1 ? 's' : ''} no inbox
                </p>
                <p className="text-sm text-orange-700">Processe para manter clareza mental</p>
              </div>
              <Link href="/gtd">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Processar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview de Tarefas Concluídas Recentes */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Conquistas Recentes</h3>
            </div>
            <Link href="/completed">
              <Button variant="outline" size="sm">
                Ver Todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <CompletedTasksHistory limit={3} showFilters={false} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show landing page for non-logged users, dashboard for logged users
  return user ? <Dashboard /> : <LandingPage />;
}
