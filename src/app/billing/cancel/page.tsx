'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useStripeSubscription } from '@/lib/hooks/useStripeSubscription';
import { useState } from 'react';

export default function BillingCancelPage() {
  const { upgradeToProMonthly } = useStripeSubscription();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    try {
      setLoading(true);
      await upgradeToProMonthly();
    } catch (error) {
      console.error('Retry upgrade error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-900">
            Pagamento Cancelado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Não se preocupe! Você pode tentar novamente a qualquer momento.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Com o GTD Flow Pro você teria:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>🚀 Tarefas e projetos ilimitados</li>
              <li>🍅 Pomodoro Timer integrado</li>
              <li>📊 Análise Pareto avançada</li>
              <li>🎯 Sistema OKRs completo</li>
              <li>👥 Recursos de colaboração</li>
              <li>⚡ Suporte prioritário</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleRetry}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </>
              )}
            </Button>
            
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Você pode continuar usando o GTD Flow gratuitamente com até 100 tarefas e 3 projetos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 