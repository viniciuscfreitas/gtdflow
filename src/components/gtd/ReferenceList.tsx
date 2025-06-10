'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Archive, 
  Search,
  Filter,
  Edit,
  Trash2,
  ArrowRight,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useGTDItems } from '@/lib/hooks/useLocalStorage';
import { toast } from 'sonner';
import { GTDItem } from '@/lib/types';
import { ViewReferenceDialog } from './ViewReferenceDialog';
import { EditReferenceDialog } from './EditReferenceDialog';

export function ReferenceList() {
  const { data: gtdItems, remove } = useGTDItems();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<GTDItem | null>(null);
  const [viewingItem, setViewingItem] = useState<GTDItem | null>(null);

  // Filter reference items
  const referenceItems = gtdItems.filter((item: GTDItem) => 
    item.type === 'reference'
  );

  // Apply filters
  const filteredItems = referenceItems.filter((item: GTDItem) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir esta referência?')) {
      try {
        remove(itemId);
        toast.success('Referência excluída');
      } catch (error) {
        toast.error('Erro ao excluir referência');
        console.error('Error deleting reference:', error);
      }
    }
  };

  const handleViewItem = (item: GTDItem) => {
    setViewingItem(item);
  };

  const handleEditItem = (item: GTDItem) => {
    setEditingItem(item);
  };

  const handleEditSuccess = () => {
    setEditingItem(null);
    toast.success('Referência atualizada com sucesso!');
  };

  const handleViewToEdit = () => {
    if (viewingItem) {
      setEditingItem(viewingItem);
      setViewingItem(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (referenceItems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma referência</h3>
            <p className="text-muted-foreground mb-4">
              Documentos e informações de referência aparecerão aqui
            </p>
            <Button onClick={() => window.location.hash = '#inbox'}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Ir para Inbox
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Material de Referência</h3>
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} de {referenceItems.length} referência{referenceItems.length !== 1 ? 's' : ''} 
            {filteredItems.length !== referenceItems.length && ' (filtradas)'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos e informações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clear Filters */}
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item: GTDItem) => (
          <Card key={item.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Title and Description */}
                  <h4 className="font-medium text-sm mb-1 line-clamp-2">
                    {item.title}
                  </h4>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {item.description}
                    </p>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Created Date */}
                    <Badge variant="outline" className="text-xs">
                      <Archive className="h-3 w-3 mr-1" />
                      Arquivado {formatDate(item.createdAt.toISOString())}
                    </Badge>
                    
                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <>
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Actions Menu */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewItem(item)}
                    className="h-8 px-3"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditItem(item)}
                    className="h-8 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredItems.length === 0 && referenceItems.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">Nenhuma referência encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar o termo de busca
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GTD Tips */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Archive className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Dicas para Material de Referência</h4>
              <div className="text-sm text-gray-800 space-y-1">
                <p>• <strong>Organize por categorias:</strong> Use tags para classificar por tipo ou área</p>
                <p>• <strong>Seja descritivo:</strong> Inclua contexto suficiente para encontrar depois</p>
                <p>• <strong>Revise periodicamente:</strong> Remova referências obsoletas</p>
                <p>• <strong>Acesso rápido:</strong> Mantenha links e informações importantes visíveis</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      {viewingItem && (
        <ViewReferenceDialog
          reference={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={handleViewToEdit}
        />
      )}

      {/* Edit Dialog */}
      {editingItem && (
        <EditReferenceDialog
          referenceId={editingItem.id}
          onClose={() => setEditingItem(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
} 