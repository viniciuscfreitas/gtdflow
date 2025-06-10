'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Inbox, 
  Target, 
  FolderOpen, 
  Clock, 
  Archive
} from 'lucide-react';
import { QuickCapture } from '@/components/gtd/QuickCapture';
import { InboxList } from '@/components/gtd/InboxList';
import { NextActionsList } from '@/components/gtd/NextActionsList';
import { ProjectsList } from '@/components/gtd/ProjectsList';
import { WaitingForList } from '@/components/gtd/WaitingForList';
import { SomedayMaybeList } from '@/components/gtd/SomedayMaybeList';
import { ReferenceList } from '@/components/gtd/ReferenceList';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function GTDPage() {
  const { user } = useAuth();
  const { data: gtdItems } = useFirestoreGTD(user);
  const [activeTab, setActiveTab] = useState('inbox');

  // Statistics
  const stats = {
    inbox: gtdItems.filter((item) => item.type === 'inbox').length,
    nextActions: gtdItems.filter((item) => item.type === 'next-action' && item.status === 'active').length,
    projects: gtdItems.filter((item) => item.type === 'project' && item.status === 'active').length,
    waiting: gtdItems.filter((item) => item.type === 'waiting-for' && item.status === 'active').length,
    someday: gtdItems.filter((item) => item.type === 'someday-maybe' && item.status === 'active').length,
    reference: gtdItems.filter((item) => item.type === 'reference').length,
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inbox':
        return (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <QuickCapture />
            </div>
            <div className="lg:col-span-2">
              <InboxList />
            </div>
          </div>
        );
      case 'next-actions':
        return <NextActionsList />;
      case 'projects':
        return <ProjectsList />;
      case 'waiting':
        return <WaitingForList />;
      case 'someday':
        return <SomedayMaybeList />;
      case 'reference':
        return <ReferenceList />;
      default:
        return <InboxList />;
    }
  };

  return (
    <div className="py-6 max-w-6xl mx-auto">
      {/* Navigation Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'inbox' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveTab('inbox')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Inbox className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Inbox</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.inbox}</span>
              {stats.inbox > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Processar
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'next-actions' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveTab('next-actions')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Próximas Ações</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.nextActions}</span>
              {stats.nextActions > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Fazer
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'projects' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveTab('projects')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Projetos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.projects}</span>
              {stats.projects > 0 && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Ativo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'waiting' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveTab('waiting')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Aguardando</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.waiting}</span>
              {stats.waiting > 0 && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                  Pendente
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'someday' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveTab('someday')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Algum Dia</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.someday}</span>
              {stats.someday > 0 && (
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  Futuro
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'reference' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveTab('reference')}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Archive className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Referência</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.reference}</span>
              {stats.reference > 0 && (
                <Badge variant="outline" className="text-gray-600 border-gray-200">
                  Arquivo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {renderContent()}
      </div>
    </div>
  );
} 