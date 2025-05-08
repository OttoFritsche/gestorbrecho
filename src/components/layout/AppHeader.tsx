import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logoHeader from '@/assets/logo/3.png';
import { format as formatTz } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/constants';

const AppHeader = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState<{
    email?: string | null;
    name?: string | null;
  }>({});

  const [currentTime, setCurrentTime] = useState<string>('');

  const getFormattedTime = () => {
    const now = new Date();
    return formatTz(now, 'dd/MM/yyyy HH:mm:ss', { timeZone: TIMEZONE });
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserData({
            email: user.email,
            name: user.user_metadata?.name || user.user_metadata?.full_name
          });
        }
      } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
      }
    };

    getUserData();

    setCurrentTime(getFormattedTime());

    const intervalId = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, 1000);

    return () => clearInterval(intervalId);

  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error);
        return;
      }
      queryClient.clear();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erro inesperado ao fazer logout:', error);
    }
  };

  const displayName = userData.name || userData.email || 'Minha Conta';

  return (
    <header className="bg-amber-50 px-6 py-3 flex items-center justify-between shadow-sm border-b border-amber-200">
      <div className="flex items-center">
        <img 
          src={logoHeader} 
          alt="Logo Gestor Brecho" 
          className="h-16 mr-4"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-amber-800/70" aria-live="polite">
          {currentTime}
        </span>
        
        {displayName !== 'Minha Conta' && (
          <span className="text-sm text-amber-800 font-medium">
            Olá, {displayName}!
          </span>
        )}
        
        <Button variant="ghost" size="icon" className="text-amber-800 hover:bg-amber-100/80 rounded-full">
          <Bell className="h-5 w-5 text-amber-700" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-100/80">
              <User className="h-5 w-5 text-amber-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/perfil')}>
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/configuracoes')}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
