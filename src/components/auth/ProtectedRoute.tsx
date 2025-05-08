import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Navigate, Outlet } from 'react-router-dom'; // Usaremos Outlet para renderizar rotas filhas
import { Loader2 } from 'lucide-react'; // Indicador de carregamento

interface ProtectedRouteProps {
  children?: ReactNode; // Aceita children, embora usaremos Outlet com mais frequência
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 2. Ouve mudanças no estado de autenticação (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Se onAuthStateChange for chamado, a verificação inicial já terminou
        if (isLoading) {
          setIsLoading(false);
        }
      }
    );

    // 3. Limpa o listener quando o componente desmontar
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [isLoading]); // Dependência em isLoading para garantir que ele só mude para false uma vez

  if (isLoading) {
    // Mostra um spinner enquanto verifica a sessão
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    // Se não há sessão e não está carregando, redireciona para login
    // 'replace' evita que a página protegida entre no histórico do navegador
    return <Navigate to="/login" replace />;
  }

  // Se há sessão, renderiza o conteúdo protegido
  // Usa Outlet para renderizar as rotas filhas definidas em App.tsx
  // Ou renderiza `children` se passado diretamente
  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute; 