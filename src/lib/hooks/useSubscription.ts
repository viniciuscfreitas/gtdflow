import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { GTDItem, EisenhowerTask } from '@/lib/types';
import { useStripeSubscription } from './useStripeSubscription';

export interface SubscriptionStatus {
  plan: 'free' | 'pro';
  isActive: boolean;
  expiresAt?: Date;
  trialEndsAt?: Date;
}

export interface FreemiumLimits {
  maxTasks: number;
  maxProjects: number;
  historyDays: number;
  hasPomodoro: boolean;
  hasPareto: boolean;
  hasOKRs: boolean;
  hasTeamFeatures: boolean;
}

export interface UsageStats {
  activeTasks: number;
  totalProjects: number;
  accountAge: number; // days
  isNearTaskLimit: boolean;
  isNearProjectLimit: boolean;
}

export function useSubscription(user: User | null) {
  const { isProUser, loading: stripeLoading } = useStripeSubscription();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    plan: 'free',
    isActive: true
  });
  
  const [loading, setLoading] = useState(true);

  // Integrate with Stripe subscription status
  useEffect(() => {
    if (user) {
      setSubscription({
        plan: isProUser ? 'pro' : 'free',
        isActive: true
      });
    }
    setLoading(stripeLoading);
  }, [user, isProUser, stripeLoading]);

  const limits: FreemiumLimits = {
    maxTasks: subscription.plan === 'free' ? 100 : -1, // -1 = unlimited
    maxProjects: subscription.plan === 'free' ? 3 : -1,
    historyDays: subscription.plan === 'free' ? 30 : -1,
    hasPomodoro: subscription.plan === 'pro',
    hasPareto: subscription.plan === 'pro',
    hasOKRs: subscription.plan === 'pro',
    hasTeamFeatures: subscription.plan === 'pro'
  };

  const isPro = subscription.plan === 'pro';
  const isFree = subscription.plan === 'free';

  const canCreateTask = (currentCount: number) => {
    return isPro || currentCount < limits.maxTasks;
  };

  const canCreateProject = (currentCount: number) => {
    return isPro || currentCount < limits.maxProjects;
  };

  const getUpgradeMessage = (feature: string) => {
    const messages = {
      tasks: "You're productive! Upgrade to Pro for unlimited tasks",
      projects: "Need more projects? Upgrade to Pro for unlimited organization",
      pomodoro: "Boost focus with Pomodoro technique - available in Pro",
      pareto: "Discover your 80/20 with Pareto analysis - upgrade to Pro",
      okrs: "Set and track big goals with OKRs - available in Pro",
      teams: "Collaborate with your team - upgrade to Pro"
    };
    return messages[feature as keyof typeof messages] || "Upgrade to Pro for full access";
  };

  return {
    subscription,
    limits,
    loading,
    isPro,
    isFree,
    canCreateTask,
    canCreateProject,
    getUpgradeMessage
  };
}

export function useUsageStats(user: User | null, gtdItems: GTDItem[], eisenhowerTasks: EisenhowerTask[]) {
  const [stats, setStats] = useState<UsageStats>({
    activeTasks: 0,
    totalProjects: 0,
    accountAge: 0,
    isNearTaskLimit: false,
    isNearProjectLimit: false
  });

  useEffect(() => {
    if (!user || !gtdItems.length) return;

    // Count active tasks across all systems
    const activeTasks = gtdItems.filter(item => 
      item.status === 'active'
    ).length + eisenhowerTasks.filter(task => 
      task.status === 'pending'
    ).length;

    // Count projects (unique project names from GTD items)
    const projects = new Set(
      gtdItems
        .filter(item => item.projectId && item.projectId.trim())
        .map(item => item.projectId)
    );
    const totalProjects = projects.size;

    // Calculate account age (mock for now)
    const accountAge = user.metadata.creationTime 
      ? Math.floor((Date.now() - new Date(user.metadata.creationTime).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    setStats({
      activeTasks,
      totalProjects,
      accountAge,
      isNearTaskLimit: activeTasks >= 90, // Warning at 90+ tasks
      isNearProjectLimit: totalProjects >= 3 // Warning at 3 projects
    });
  }, [user, gtdItems, eisenhowerTasks]);

  return stats;
} 