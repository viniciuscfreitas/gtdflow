'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Grid3X3, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestoreMatrix } from '@/lib/hooks/useFirestoreMatrix';
import { useAuth } from '@/lib/contexts/AuthContext';
import { QuickCapture } from '@/components/gtd/QuickCapture';
import { CompletedTasksHistory } from '@/components/ui/CompletedTasksHistory';

export default function Home() {
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

  return (
    <div className="py-6 space-y-6 max-w-4xl mx-auto">
      {/* Captura Rápida */}
      <QuickCapture />

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
