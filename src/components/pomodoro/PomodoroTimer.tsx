'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';

export type PomodoroSessionType = 'work' | 'shortBreak' | 'longBreak';
export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'completed';

interface PomodoroSettings {
  workDuration: number; // em minutos
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // a cada quantos pomodoros
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

interface PomodoroTimerProps {
  onSessionComplete?: (sessionType: PomodoroSessionType, duration: number) => void;
  onSessionStart?: (sessionType: PomodoroSessionType) => void;
  onSessionInterrupt?: () => void;
  currentTask?: { id: string; title: string } | null;
}

export function PomodoroTimer({ 
  onSessionComplete, 
  onSessionStart,
  onSessionInterrupt,
  currentTask 
}: PomodoroTimerProps) {
  // Estados do timer
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutos em segundos
  const [status, setStatus] = useState<PomodoroStatus>('idle');
  const [sessionType, setSessionType] = useState<PomodoroSessionType>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  
  // Configurações
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    notificationsEnabled: true
  });

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calcular duração total da sessão atual
  const getTotalDuration = useCallback(() => {
    switch (sessionType) {
      case 'work':
        return settings.workDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  }, [sessionType, settings]);

  // Calcular progresso
  const progress = ((getTotalDuration() - timeLeft) / getTotalDuration()) * 100;

  // Formatar tempo para exibição
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    
    // Criar um beep simples usando Web Audio API
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = sessionType === 'work' ? 800 : 400;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, [settings.soundEnabled, sessionType]);

  // Enviar notificação do navegador
  const sendNotification = useCallback((title: string, body: string) => {
    if (!settings.notificationsEnabled) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'pomodoro-timer'
      });
    }
  }, [settings.notificationsEnabled]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Lógica do timer
  useEffect(() => {
    if (status === 'running' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, timeLeft]);

  // Quando o timer chega a zero
  useEffect(() => {
    if (timeLeft === 0 && status === 'running') {
      handleSessionComplete();
    }
  }, [timeLeft, status]);

  // Completar sessão
  const handleSessionComplete = useCallback(() => {
    setStatus('completed');
    playNotificationSound();
    
    const duration = getTotalDuration();
    
    if (sessionType === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      toast.success('Pomodoro concluído! 🍅', {
        description: `Você focou por ${settings.workDuration} minutos. Hora da pausa!`
      });
      
      sendNotification(
        'Pomodoro Concluído! 🍅',
        `Você focou por ${settings.workDuration} minutos. Hora da pausa!`
      );
      
      // Determinar próxima sessão
      const isLongBreak = newCount % settings.longBreakInterval === 0;
      const nextSessionType = isLongBreak ? 'longBreak' : 'shortBreak';
      
      if (settings.autoStartBreaks) {
        setTimeout(() => startSession(nextSessionType), 1000);
      } else {
        setSessionType(nextSessionType);
        setTimeLeft(nextSessionType === 'longBreak' 
          ? settings.longBreakDuration * 60 
          : settings.shortBreakDuration * 60
        );
        setStatus('idle');
      }
    } else {
      toast.success('Pausa concluída! ⚡', {
        description: 'Hora de voltar ao trabalho!'
      });
      
      sendNotification(
        'Pausa Concluída! ⚡',
        'Hora de voltar ao trabalho!'
      );
      
      if (settings.autoStartPomodoros) {
        setTimeout(() => startSession('work'), 1000);
      } else {
        setSessionType('work');
        setTimeLeft(settings.workDuration * 60);
        setStatus('idle');
      }
    }
    
    // Callback para componente pai
    onSessionComplete?.(sessionType, duration);
  }, [
    sessionType, 
    completedPomodoros, 
    settings, 
    getTotalDuration, 
    playNotificationSound, 
    sendNotification, 
    onSessionComplete
  ]);

  // Iniciar sessão
  const startSession = useCallback((type?: PomodoroSessionType) => {
    const newSessionType = type || sessionType;
    setSessionType(newSessionType);
    
    const duration = newSessionType === 'work' 
      ? settings.workDuration * 60
      : newSessionType === 'shortBreak'
      ? settings.shortBreakDuration * 60
      : settings.longBreakDuration * 60;
    
    setTimeLeft(duration);
    setStatus('running');
    
    onSessionStart?.(newSessionType);
    
    toast.info(
      newSessionType === 'work' 
        ? 'Pomodoro iniciado! 🍅' 
        : 'Pausa iniciada! ☕',
      {
        description: newSessionType === 'work'
          ? `Foque por ${settings.workDuration} minutos`
          : `Relaxe por ${newSessionType === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration} minutos`
      }
    );
  }, [sessionType, settings, onSessionStart]);

  // Pausar/Retomar
  const toggleTimer = () => {
    if (status === 'running') {
      setStatus('paused');
      toast.info('Timer pausado ⏸️');
    } else if (status === 'paused') {
      setStatus('running');
      toast.info('Timer retomado ▶️');
    } else {
      startSession();
    }
  };

  // Reset
  const resetTimer = () => {
    // Se estava rodando, considerar como interrupção
    if (status === 'running') {
      onSessionInterrupt?.();
    }
    
    setStatus('idle');
    setTimeLeft(getTotalDuration());
    toast.info('Timer resetado 🔄');
  };

  // Mudar tipo de sessão
  const changeSessionType = (type: PomodoroSessionType) => {
    setSessionType(type);
    setStatus('idle');
    
    const duration = type === 'work' 
      ? settings.workDuration * 60
      : type === 'shortBreak'
      ? settings.shortBreakDuration * 60
      : settings.longBreakDuration * 60;
    
    setTimeLeft(duration);
  };

  // Determinar cor do timer baseado no tipo de sessão
  const getTimerColor = () => {
    switch (sessionType) {
      case 'work':
        return 'text-red-600 border-red-200 bg-red-50';
      case 'shortBreak':
        return 'text-green-600 border-green-200 bg-green-50';
      case 'longBreak':
        return 'text-blue-600 border-blue-200 bg-blue-50';
    }
  };

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'work':
        return 'Trabalho';
      case 'shortBreak':
        return 'Pausa Curta';
      case 'longBreak':
        return 'Pausa Longa';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Timer className="h-5 w-5" />
          Timer Pomodoro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-6">
          {/* Timer Display */}
          <div className="relative">
            <div className={`w-48 h-48 mx-auto rounded-full border-8 flex items-center justify-center ${getTimerColor()}`}>
              <div className="text-center">
                <div className="text-4xl font-mono font-bold">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm mt-1">
                  {getSessionLabel()}
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {status === 'running' && '▶️'}
                  {status === 'paused' && '⏸️'}
                  {status === 'idle' && '⏹️'}
                  {status === 'completed' && '✅'}
                </div>
              </div>
            </div>
            
            {/* Progress Ring */}
            <div className="absolute inset-0 w-48 h-48 mx-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className={sessionType === 'work' ? 'text-red-500' : sessionType === 'shortBreak' ? 'text-green-500' : 'text-blue-500'}
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
            </div>
          </div>

          {/* Current Task */}
          {currentTask && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Tarefa atual:</p>
              <p className="font-medium">{currentTask.title}</p>
            </div>
          )}

          {/* Timer Controls */}
          <div className="flex justify-center gap-3">
            <Button 
              onClick={toggleTimer}
              variant={status === 'running' ? 'secondary' : 'default'}
              size="lg"
            >
              {status === 'running' ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  {status === 'paused' ? 'Retomar' : 'Iniciar'}
                </>
              )}
            </Button>
            
            <Button 
              onClick={resetTimer}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>

          {/* Session Type Selector */}
          <div className="flex justify-center gap-2 flex-wrap">
            <Button
              variant={sessionType === 'work' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeSessionType('work')}
              disabled={status === 'running'}
            >
              <Zap className="h-4 w-4 mr-1" />
              Trabalho ({settings.workDuration}min)
            </Button>
            <Button
              variant={sessionType === 'shortBreak' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeSessionType('shortBreak')}
              disabled={status === 'running'}
            >
              <Coffee className="h-4 w-4 mr-1" />
              Pausa ({settings.shortBreakDuration}min)
            </Button>
            <Button
              variant={sessionType === 'longBreak' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeSessionType('longBreak')}
              disabled={status === 'running'}
            >
              <Coffee className="h-4 w-4 mr-1" />
              Pausa Longa ({settings.longBreakDuration}min)
            </Button>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">{completedPomodoros}</div>
              <div className="text-muted-foreground">Pomodoros</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {Math.round(progress)}%
              </div>
              <div className="text-muted-foreground">Progresso</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {Math.floor(completedPomodoros * settings.workDuration / 60)}h {(completedPomodoros * settings.workDuration) % 60}m
              </div>
              <div className="text-muted-foreground">Tempo Foco</div>
            </div>
          </div>

          {/* Settings Toggle */}
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            >
              {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 