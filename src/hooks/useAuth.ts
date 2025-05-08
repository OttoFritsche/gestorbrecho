import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface que define as informações retornadas pelo hook de autenticação
 */
interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook que gerencia as informações do usuário autenticado
 * 
 * Fornece:
 * - Usuário atual
 * - Estado de carregamento
 * - Erros de autenticação
 */
export const useAuth = (): UseAuthReturn => {
  // Estado para armazenar o usuário atual
  const [user, setUser] = useState<User | null>(null);
  
  // Estado para controlar o carregamento das informações
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Estado para armazenar erros que possam ocorrer
  const [error, setError] = useState<Error | null>(null);
  
  // Carrega o usuário atual quando o hook é montado
  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
      try {
        setIsLoading(true);
        
        // Obtém a sessão atual
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Atualiza o estado com o usuário encontrado
        if (isMounted) {
          setUser(data.session?.user || null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadUser();
    
    // Configura um listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          setUser(session?.user || null);
        }
      }
    );
    
    // Limpa o listener quando o componente é desmontado
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  return { user, isLoading, error };
}; 