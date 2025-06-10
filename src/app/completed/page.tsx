'use client';

import { CompletedTasksHistory } from '@/components/ui/CompletedTasksHistory';

export default function CompletedTasksPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Histórico Completo */}
      <CompletedTasksHistory showFilters={true} />
    </div>
  );
} 