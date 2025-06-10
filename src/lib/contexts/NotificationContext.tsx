'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications, Notification } from '@/lib/hooks/useNotifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  notifySuccess: (title: string, message: string, action?: Notification['action']) => string;
  notifyError: (title: string, message: string, action?: Notification['action']) => string;
  notifyWarning: (title: string, message: string, action?: Notification['action']) => string;
  notifyInfo: (title: string, message: string, action?: Notification['action']) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationHook = useNotifications();

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
} 