'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const session = searchParams.get('session_id');
    setSessionId(session);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-900">
            Pagamento Confirmado!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Bem-vindo ao GTD Flow Pro! Sua assinatura foi ativada com sucesso.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">
              Agora você tem acesso a:
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ Tarefas e projetos ilimitados</li>
              <li>✅ Pomodoro Timer integrado</li>
              <li>✅ Análise Pareto avançada</li>
              <li>✅ Sistema OKRs completo</li>
              <li>✅ Recursos de colaboração</li>
              <li>✅ Suporte prioritário</li>
            </ul>
          </div>

          {sessionId && (
            <p className="text-xs text-gray-500">
              ID da sessão: {sessionId.slice(0, 20)}...
            </p>
          )}

          <div className="space-y-2">
            <Link href="/gtd" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Começar a usar o Pro
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 