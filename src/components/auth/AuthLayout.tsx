'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  CheckSquare, 
  Mail, 
  Lock, 
  Chrome, 
  AlertCircle, 
  ArrowRight,
  Zap,
  Target,
  Calendar,
  Users,
  Shield,
  Smartphone,
  Clock,
  UserPlus
} from 'lucide-react';

interface AuthLayoutProps {
  mode: 'login' | 'register';
}

export function AuthLayout({ mode }: AuthLayoutProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const router = useRouter();

  const isLogin = mode === 'login';

  // Reset form when mode changes
  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          return;
        }
        await register(email, password);
      }
      router.push('/');
    } catch (error) {
      setError(
        isLogin 
          ? 'Email ou senha incorretos. Tente novamente.'
          : 'Erro ao criar conta. Tente novamente.'
      );
      console.error('Erro na autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      await loginWithGoogle();
      router.push('/');
    } catch (error) {
      setError('Erro ao autenticar com Google. Tente novamente.');
      console.error('Erro no Google Auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    if (newMode === mode) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      router.push(newMode === 'login' ? '/auth/login' : '/auth/register');
    }, 150);
  };

  // Features for branding section
  const loginFeatures = [
    {
      icon: Zap,
      title: "GTD - Getting Things Done",
      description: "Capture, processe e organize todas as suas tarefas de forma eficiente"
    },
    {
      icon: Target,
      title: "Matriz de Eisenhower",
      description: "Priorize tarefas por urgência e importância para máxima eficiência"
    },
    {
      icon: Calendar,
      title: "Sincronização Multi-Dispositivo",
      description: "Acesse suas tarefas em qualquer lugar, a qualquer momento"
    },
    {
      icon: Users,
      title: "Delegação Inteligente",
      description: "Gerencie tarefas delegadas com follow-ups automáticos"
    }
  ];

  const registerFeatures = [
    {
      icon: Shield,
      title: "100% Gratuito",
      description: "Todas as funcionalidades sem custo, para sempre"
    },
    {
      icon: Smartphone,
      title: "Multi-Dispositivo",
      description: "Sincronize entre celular, tablet e computador automaticamente"
    },
    {
      icon: Clock,
      title: "Setup em 2 Minutos",
      description: "Comece a organizar suas tarefas imediatamente após o cadastro"
    },
    {
      icon: Target,
      title: "Metodologias Comprovadas",
      description: "GTD + Matriz de Eisenhower para máxima eficiência"
    }
  ];

  const features = isLogin ? loginFeatures : registerFeatures;
  const brandingColor = isLogin ? 'from-blue-600 via-blue-700 to-green-600' : 'from-green-600 via-blue-600 to-purple-600';

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Coluna Esquerda - Branding */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${brandingColor} relative overflow-hidden transition-all duration-700 ease-in-out`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full bg-white/5 animate-pulse transition-all duration-1000 ${isLogin ? 'scale-100' : 'scale-110'}`}></div>
          <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-white/5 animate-pulse transition-all duration-1000 delay-300 ${isLogin ? 'scale-110' : 'scale-100'}`}></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-12 text-white">
          {/* Logo */}
          <div className={`flex items-center gap-4 mb-12 transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <CheckSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">GTD Flow</h1>
              <p className={`transition-all duration-300 ${isLogin ? 'text-blue-100' : 'text-green-100'}`}>
                {isLogin ? 'Sistema Integrado de Produtividade' : 'Comece sua jornada de produtividade'}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className={`space-y-8 transition-all duration-500 delay-100 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                {isLogin ? 'Organize sua vida com metodologias comprovadas' : 'Junte-se a milhares de pessoas produtivas'}
              </h2>
              <div className="space-y-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div 
                      key={feature.title}
                      className={`flex items-start gap-4 transition-all duration-300 delay-${index * 100}`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className={`text-sm transition-colors duration-300 ${isLogin ? 'text-blue-100' : 'text-green-100'}`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl font-bold">98%</div>
                <div className={`text-xs transition-colors duration-300 ${isLogin ? 'text-blue-100' : 'text-green-100'}`}>
                  Produtividade
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">24/7</div>
                <div className={`text-xs transition-colors duration-300 ${isLogin ? 'text-blue-100' : 'text-green-100'}`}>
                  Disponível
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">∞</div>
                <div className={`text-xs transition-colors duration-300 ${isLogin ? 'text-blue-100' : 'text-green-100'}`}>
                  Dispositivos
                </div>
              </div>
            </div>

                         {/* Testimonial for Register */}
             {!isLogin && (
               <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transition-all duration-500 delay-300">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                     <span className="text-sm font-semibold">JS</span>
                   </div>
                   <div>
                     <div className="font-semibold text-sm">João Silva</div>
                     <div className="text-xs text-green-100">Empreendedor</div>
                   </div>
                 </div>
                 <p className="text-sm text-green-100 italic">
                   &ldquo;Aumentei minha produtividade em 300% usando o GTD Flow. 
                   Finalmente consigo focar no que realmente importa!&rdquo;
                 </p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Coluna Direita - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 relative">
        {/* Transition Overlay */}
        <div className={`absolute inset-0 bg-white/80 backdrop-blur-sm z-50 transition-all duration-300 ${isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>

        <div className={`w-full max-w-md transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CheckSquare className={`h-8 w-8 transition-colors duration-300 ${isLogin ? 'text-blue-600' : 'text-green-600'}`} />
              <h1 className="text-2xl font-bold text-gray-900">GTD Flow</h1>
            </div>
            <p className="text-gray-600">
              {isLogin ? 'Acesse sua conta e organize sua produtividade' : 'Crie sua conta e comece a organizar sua produtividade'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                {isLogin ? (
                  <CheckSquare className="h-6 w-6 text-blue-600" />
                ) : (
                  <UserPlus className="h-6 w-6 text-green-600" />
                )}
                <h2 className="text-2xl font-bold text-gray-900">
                  {isLogin ? 'Bem-vindo de volta!' : 'Criar Conta'}
                </h2>
              </div>
              <p className="text-gray-600">
                {isLogin ? 'Entre na sua conta para continuar' : 'Junte-se a milhares de pessoas produtivas'}
              </p>
            </div>

            {/* Mode Switch */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => handleModeSwitch('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  isLogin 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => handleModeSwitch('register')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  !isLogin 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Registrar
              </button>
            </div>

            {/* Google Auth */}
            <Button
              type="button"
              variant="outline"
              className="w-full mb-6 h-12 text-base"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <Chrome className="h-5 w-5 mr-3" />
              {isLogin ? 'Continuar com Google' : 'Registrar com Google'}
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">
                  {isLogin ? 'ou continue com email' : 'ou registre com email'}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-11 h-12 text-base border-gray-200 transition-colors duration-200 ${
                      isLogin 
                        ? 'focus:border-blue-500 focus:ring-blue-500' 
                        : 'focus:border-green-500 focus:ring-green-500'
                    }`}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-11 h-12 text-base border-gray-200 transition-colors duration-200 ${
                      isLogin 
                        ? 'focus:border-blue-500 focus:ring-blue-500' 
                        : 'focus:border-green-500 focus:ring-green-500'
                    }`}
                    required
                    disabled={loading}
                  />
                </div>
                {!isLogin && (
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo de 6 caracteres
                  </p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmar Senha
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-11 h-12 text-base border-gray-200 focus:border-green-500 focus:ring-green-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className={`w-full h-12 text-base text-white transition-all duration-200 ${
                  isLogin 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={loading}
              >
                {loading ? (
                  isLogin ? 'Entrando...' : 'Criando conta...'
                ) : (
                  <>
                    {isLogin ? 'Entrar' : 'Criar Conta Gratuita'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-xs text-gray-500">
                {isLogin 
                  ? 'Seus dados estão seguros e criptografados'
                  : 'Ao criar uma conta, você concorda com nossos termos de uso'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 