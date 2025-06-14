'use client';

import { useState, useCallback, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { PomodoroTimer, PomodoroSessionType } from '@/components/pomodoro/PomodoroTimer';
import { PomodoroStats } from '@/components/pomodoro/PomodoroStats';
import { TaskSelector } from '@/components/pomodoro/TaskSelector';
import { SessionHistory } from '@/components/pomodoro/SessionHistory';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePomodoroSessionsFirestore, useGTDItemsFirestore } from '@/lib/hooks/useFirestoreCompat';
import { PomodoroSession } from '@/lib/types';
import { toast } from 'sonner';

export default function PomodoroPage() {
  // Estados
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string } | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  // Dados persistidos via Firestore (API compatível com localStorage)
  const { data: sessions = [], create: createSession, update: updateSession } = usePomodoroSessionsFirestore(user);
  const { data: gtdItems = [], update: updateGtdItem } = useGTDItemsFirestore(user);

  // Calcular streak atual (dias consecutivos com pelo menos 1 pomodoro)
  const calculateStreak = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    const currentDate = new Date(today);
    
    while (true) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayHasPomodoro = sessions.some(session => {
        if (!session.startTime) return false;
        const sessionDate = new Date(session.startTime);
        return sessionDate >= dayStart && 
               sessionDate < dayEnd && 
               session.status === 'completed';
      });
      
      if (dayHasPomodoro) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }, [sessions]);

  // Callback quando sessão é iniciada
  const handleSessionStart = useCallback(async (sessionType: PomodoroSessionType) => {
    const newSession: Omit<PomodoroSession, 'id' | 'createdAt' | 'updatedAt'> = {
      taskId: selectedTask?.id,
      taskTitle: selectedTask?.title || 'Sessão sem tarefa específica',
      duration: sessionType === 'work' ? 25 : sessionType === 'shortBreak' ? 5 : 15,
      breakDuration: sessionType === 'work' ? 5 : 0,
      status: 'active',
      startTime: new Date(),
      interruptions: 0,
      notes: ''
    };
    
    const createdSession = await createSession(newSession);
    setActiveSessionId(createdSession.id);
    
    toast.success(
      sessionType === 'work' ? '🍅 Pomodoro iniciado!' : '☕ Pausa iniciada!',
      {
        description: sessionType === 'work'
          ? `Focando em: ${selectedTask?.title || 'Sessão livre'}`
          : 'Hora de relaxar!'
      }
    );
    
    console.log('Sessão iniciada:', {
      id: createdSession.id,
      type: sessionType,
      task: selectedTask?.title || 'Sem tarefa',
      duration: newSession.duration
    });
  }, [selectedTask, createSession]);

  // Callback quando sessão é completada
  const handleSessionComplete = useCallback(async (sessionType: PomodoroSessionType, duration: number) => {
    if (!activeSessionId) return;
    
    // Atualizar sessão como completada
    const updatedSession = await updateSession(activeSessionId, {
      status: 'completed',
      endTime: new Date()
    });
    
    if (updatedSession) {
      // Se foi um pomodoro de trabalho e há tarefa selecionada, perguntar se quer marcar como concluída
      if (sessionType === 'work' && selectedTask) {
        const shouldCompleteTask = window.confirm(
          `Pomodoro concluído! Deseja marcar a tarefa "${selectedTask.title}" como concluída?`
        );
        
        if (shouldCompleteTask) {
          // Marcar tarefa GTD como concluída
          const gtdItem = gtdItems.find(item => item.id === selectedTask.id);
          if (gtdItem) {
            updateGtdItem(selectedTask.id, {
              status: 'completed',
              completedAt: new Date().toISOString()
            });
            
            toast.success('✅ Tarefa concluída!', {
              description: `"${selectedTask.title}" foi marcada como concluída`
            });
            
            // Limpar seleção de tarefa
            setSelectedTask(null);
          }
        }
      }
      
      // Feedback de conclusão
      if (sessionType === 'work') {
        toast.success('🍅 Pomodoro concluído!', {
          description: `Você focou por ${duration} minutos. Parabéns!`
        });
      } else {
        toast.success('☕ Pausa concluída!', {
          description: 'Hora de voltar ao foco!'
        });
      }
      
      console.log('Sessão completada:', {
        sessionId: activeSessionId,
        type: sessionType,
        duration,
        task: updatedSession.taskTitle
      });
    }
    
    setActiveSessionId(null);
  }, [activeSessionId, selectedTask, updateSession, gtdItems, updateGtdItem]);

  // Callback quando sessão é interrompida
  const handleSessionInterrupt = useCallback(() => {
    if (!activeSessionId) return;
    
    updateSession(activeSessionId, {
      status: 'interrupted',
      endTime: new Date()
    });
    
    toast.warning('⏸️ Sessão interrompida', {
      description: 'Não se preocupe, você pode tentar novamente!'
    });
    
    setActiveSessionId(null);
  }, [activeSessionId, updateSession]);

  // Navegar para criar tarefa GTD
  const handleCreateTask = () => {
    // Redirecionar para página GTD
    window.location.href = '/gtd';
    toast.info('Redirecionando para GTD...', {
      description: 'Crie uma tarefa para focar com Pomodoro'
    });
  };

  // Limpar sessão ativa se não existir mais
  useEffect(() => {
    if (activeSessionId) {
      const activeSession = sessions.find(s => s.id === activeSessionId);
      if (!activeSession || activeSession.status !== 'active') {
        setActiveSessionId(null);
      }
    }
  }, [activeSessionId, sessions]);

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Timer className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Método Pomodoro</h1>
          <p className="text-muted-foreground">
            Técnica de foco - 25 minutos de trabalho, 5 minutos de pausa
          </p>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timer e Seleção de Tarefa */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer Principal */}
          <PomodoroTimer
            currentTask={selectedTask}
            onSessionStart={handleSessionStart}
            onSessionComplete={handleSessionComplete}
            onSessionInterrupt={handleSessionInterrupt}
          />
          
          {/* Seleção de Tarefa */}
          <TaskSelector
            selectedTask={selectedTask}
            onTaskSelect={setSelectedTask}
            onCreateTask={handleCreateTask}
          />
        </div>

        {/* Sidebar com Estatísticas */}
        <div className="space-y-6">
          <PomodoroStats 
            sessions={sessions}
            currentStreak={calculateStreak()}
          />
          
          <SessionHistory 
            sessions={sessions}
            limit={5}
          />
        </div>
      </div>
    </div>
  );
} 