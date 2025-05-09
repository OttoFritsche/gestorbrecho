import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/logo/5.png';
import { useIA } from '@/contexts/IAContext';
import { sidebarNavItems } from '@/config/sidebarNavItems';
import { SidebarNavItem } from './SidebarNavItem';

const AppSidebar = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toggleChat } = useIA();
  const { state } = useSidebar(); // Acessa o estado do sidebar
  const isCollapsed = state === "collapsed";
  
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

  // Processar os itens para garantir que cada item pai com filhos tenha um hrefCollapsed definido
  const processedNavItems = React.useMemo(() => {
    return sidebarNavItems.map(item => {
      // Se é um item pai com filhos e não tem hrefCollapsed definido, use o href do primeiro filho
      if (item.children && item.children.length > 0 && !item.hrefCollapsed) {
        return {
          ...item,
          hrefCollapsed: item.children[0].href || item.href
        };
      }
      return item;
    });
  }, [sidebarNavItems]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 group">
          <img 
            src={logoImage} 
            alt="Gestor Brechó Logo" 
            className="h-10 group-data-[collapsible=icon]:hidden" 
          /> 
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-2 flex-1 flex flex-col">
        <ScrollArea className="flex-1"> {/* Uso de flex-1 para preencher o espaço disponível */}
          <SidebarMenu className="px-2">
            {processedNavItems.map((item) => (
              <SidebarMenuItem key={item.label} className="mb-1">
                <SidebarNavItem 
                  item={{
                    ...item,
                    // Substitui a função onClick vazia pelo toggleChat para o item "Chat Rápido"
                    ...(item.label === "IA & Suporte" && item.children 
                      ? {
                          children: item.children.map(child => 
                            child.label === "Chat Rápido" 
                              ? { ...child, onClick: toggleChat } 
                              : child
                          )
                        } 
                      : {})
                  }} 
                  toggleChat={toggleChat}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
      
      <SidebarFooter className="p-4 mt-auto">
        <Separator className="mb-4" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isCollapsed ? "" : "Sair"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
