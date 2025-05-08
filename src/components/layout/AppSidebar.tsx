import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  CircleDollarSign,
  ShoppingBasket, 
  Package, 
  Users, 
  Tags, 
  Settings, 
  LogOut,
  Bot,
  MessagesSquare,
  BarChart2,
  DollarSign,
  ShoppingCart,
  Truck,
  UserRound
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/logo/5.png';
import { useIA } from '@/contexts/IAContext';

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toggleChat } = useIA();
  
  // Função helper para verificar rota ativa
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

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
      
      <SidebarContent className="py-2">
        <SidebarMenu>
          {/* Dashboard */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
                end
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Categorias */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app/categorias" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
              >
                <Tags />
                <span>Categorias</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Produtos */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app/estoque" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
              >
                <Package />
                <span>Produtos</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Fornecedores */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app/fornecedores" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
              >
                <Truck />
                <span>Fornecedores</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Clientes */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app/clientes" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
              >
                <Users />
                <span>Clientes</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Vendedores */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app/vendedores" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
              >
                <UserRound />
                <span>Vendedores</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Vendas */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app/vendas" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
              >
                <ShoppingCart />
                <span>Vendas</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Financeiro */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              isActive={isActive("/app/financeiro") || isActive("/app/receitas") || isActive("/app/metas")}
            >
              <NavLink to="/app/financeiro">
                <DollarSign />
                <span>Financeiro</span>
              </NavLink>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <NavLink to="/app/receitas" className={({ isActive }) => isActive ? 'data-[active=true]' : ''}>
                    <span>Receitas</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <NavLink to="/app/despesas" className={({ isActive }) => isActive ? 'data-[active=true]' : ''}>
                    <span>Despesas</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <NavLink to="/app/fluxo-caixa" className={({ isActive }) => isActive ? 'data-[active=true]' : ''}>
                    <span>Fluxo de Caixa</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <NavLink to="/app/metas" className={({ isActive }) => isActive ? 'data-[active=true]' : ''}>
                    <span>Metas</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
          
          {/* Relatórios */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app/relatorios" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
              >
                <BarChart2 />
                <span>Relatórios</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Assistente IA */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app/assistente" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
              >
                <MessagesSquare className="text-amber-500" />
                <span>Assistente de IA</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Chat rápido */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleChat}>
              <Bot className="text-amber-500" />
              <span>Chat Rápido</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* Configurações */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/app/configuracoes" 
                className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
              >
                <Settings />
                <span>Configurações</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
