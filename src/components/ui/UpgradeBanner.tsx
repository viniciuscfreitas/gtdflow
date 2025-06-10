'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

interface UpgradeBannerProps {
  type: 'tasks' | 'projects' | 'premium-feature';
  title: string;
  description: string;
  currentCount?: number;
  limit?: number;
  feature?: string;
}

export function UpgradeBanner({ 
  type, 
  title, 
  description, 
  currentCount, 
  limit
}: UpgradeBannerProps) {
  const getIcon = () => {
    switch (type) {
      case 'tasks':
        return <Zap className="h-5 w-5 text-orange-600" />;
      case 'projects':
        return <Zap className="h-5 w-5 text-blue-600" />;
      default:
        return <Crown className="h-5 w-5 text-purple-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'tasks':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-900',
          subtext: 'text-orange-700',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'projects':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200', 
          text: 'text-blue-900',
          subtext: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      default:
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-900', 
          subtext: 'text-purple-700',
          button: 'bg-purple-600 hover:bg-purple-700'
        };
    }
  };

  const colors = getColors();

  return (
    <Card className={`${colors.bg} ${colors.border}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            {getIcon()}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-medium ${colors.text}`}>
                  {title}
                </p>
                {currentCount !== undefined && limit !== undefined && (
                  <span className={`text-sm ${colors.subtext} bg-white px-2 py-0.5 rounded-full`}>
                    {currentCount}/{limit}
                  </span>
                )}
              </div>
              <p className={`text-sm ${colors.subtext}`}>
                {description}
              </p>
            </div>
          </div>
          <Link href="/auth/register">
            <Button size="sm" className={colors.button}>
              Upgrade Pro
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Specific upgrade prompts based on research
export function TaskLimitBanner({ currentTasks }: { currentTasks: number }) {
  if (currentTasks < 90) return null;

  return (
    <UpgradeBanner
      type="tasks"
      title="You're productive!"
      description="Você está próximo do limite. Upgrade para tarefas ilimitadas."
      currentCount={currentTasks}
      limit={100}
    />
  );
}

export function ProjectLimitBanner({ currentProjects }: { currentProjects: number }) {
  if (currentProjects < 3) return null;

  return (
    <UpgradeBanner
      type="projects"
      title="Need more projects?"
      description="Organize projetos ilimitados e colabore com sua equipe."
      currentCount={currentProjects}
      limit={3}
    />
  );
}

export function PremiumFeatureBanner({ feature }: { feature: 'pomodoro' | 'pareto' | 'okrs' }) {
  const features = {
    pomodoro: {
      title: "Boost your focus",
      description: "Técnica Pomodoro integrada para máxima produtividade."
    },
    pareto: {
      title: "Discover your 80/20",
      description: "Análise Pareto para identificar tarefas de alto impacto."
    },
    okrs: {
      title: "Set big goals",
      description: "OKRs para alinhar tarefas com objetivos estratégicos."
    }
  };

  return (
    <UpgradeBanner
      type="premium-feature"
      title={features[feature].title}
      description={features[feature].description}
      feature={feature}
    />
  );
} 