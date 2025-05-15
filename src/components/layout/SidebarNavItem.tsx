import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { NavItem } from "@/config/sidebarNavItems";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarNavItemProps {
  item: NavItem;
  level?: number;
  onNavItemClick?: () => void;
  toggleChat?: () => void;
}

export function SidebarNavItem({ 
  item, 
  level = 0, 
  onNavItemClick,
  toggleChat 
}: SidebarNavItemProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  
  // Acessa o estado do sidebar para saber se está colapsado
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // Verificar alterações na rota para fechar os dropdowns quando apropriado
  React.useEffect(() => {
    // Remover tratamento especial para "Financeiro"
    if (!isActive && !hasActiveChild && open) {
      setOpen(false);
    }
  }, [location.pathname]);
  
  // Verifica se algum filho está ativo para expandir automaticamente o pai
  React.useEffect(() => {
    if (item.children) {
      const hasActiveChild = item.children.some(child => {
        if (child.href) {
          return location.pathname.startsWith(child.href);
        }
        if (child.activeWhen) {
          return child.activeWhen(location.pathname);
        }
        return false;
      });
      
      if (hasActiveChild) {
        setOpen(true);
      }
    }
  }, [item.children, location.pathname]);
  
  // Determina se o item atual está ativo
  const isActive = React.useMemo(() => {
    if (item.activeWhen) {
      return item.activeWhen(location.pathname);
    }
    if (item.href) {
      if (item.href === '/app') {
        return location.pathname === '/app';
      }
      return location.pathname.startsWith(item.href);
    }
    return false;
  }, [item, location.pathname]);
  
  // Determina se qualquer filho está ativo (para destacar o pai mesmo quando fechado)
  const hasActiveChild = React.useMemo(() => {
    if (!item.children) return false;
    
    return item.children.some(child => {
      if (child.activeWhen) {
        return child.activeWhen(location.pathname);
      }
      if (child.href) {
        return location.pathname.startsWith(child.href);
      }
      return false;
    });
  }, [item.children, location.pathname]);
  
  // Função para lidar com o clique no item
  const handleItemClick = (e?: React.MouseEvent) => {
    // Para o item especial "Chat Rápido"
    if (item.label === "Chat Rápido" && toggleChat) {
      if (e) e.preventDefault();
      toggleChat();
      if (onNavItemClick) onNavItemClick();
      return;
    }
    
    // Lógica para itens pai quando o sidebar está colapsado
    if (isCollapsed && item.children && item.hrefCollapsed) {
      if (e) e.preventDefault();
      navigate(item.hrefCollapsed);
      if (onNavItemClick) onNavItemClick();
      return;
    }
    
    // Lógica para itens pai quando o sidebar está aberto
    if (!isCollapsed && item.children && item.href && item.parentNavigatesWhenOpen) {
      if (e) e.preventDefault();
      navigate(item.href);
      if (onNavItemClick) onNavItemClick();
      return;
    }
    
    if (onNavItemClick) {
      onNavItemClick();
    }
  };
  
  // Handler para navegação de itens filhos que fechará o dropdown do pai
  const handleChildNavigation = () => {
    // Fechar dropdown após navegação para um item filho
    // Remover tratamento especial para "Financeiro"
    // Fechar com um pequeno atraso para melhorar a UX para todos os itens
    setTimeout(() => {
      setOpen(false);
    }, 150);
    
    if (onNavItemClick) {
      onNavItemClick();
    }
  };
  
  // Item com filhos - lógica condicional baseada no estado do sidebar
  if (item.children && item.children.length > 0) {
    // Quando o sidebar está colapsado, renderiza como link direto
    if (isCollapsed) {
      // Determina para onde navegar quando colapsado
      const targetHref = item.hrefCollapsed || (item.children[0]?.href || item.href || "#");
      
      return (
        <Button
          variant={hasActiveChild || isActive ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "w-full justify-start font-medium rounded-md mb-1 hover:bg-secondary/80",
            level > 0 ? "pl-8" : "pl-3",
            (hasActiveChild || isActive) && "bg-secondary text-secondary-foreground"
          )}
          onClick={(e) => {
            e.preventDefault();
            navigate(targetHref);
            if (onNavItemClick) onNavItemClick();
          }}
        >
          <item.icon className={cn(
            "mr-2 h-4 w-4 flex-shrink-0",
            item.label.includes("IA") && "text-amber-500"
          )} />
          <span>{item.label}</span>
        </Button>
      );
    }
    
    // Quando o sidebar está aberto, renderiza como item colapsável
    return (
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant={hasActiveChild || isActive ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "w-full justify-start font-medium rounded-md mb-1 hover:bg-secondary/80",
              level > 0 ? "pl-8" : "pl-3",
              (hasActiveChild || isActive) && "bg-secondary text-secondary-foreground"
            )}
            onClick={(e) => {
              // Se o item pai deve navegar quando aberto, fazemos isso aqui
              if (item.parentNavigatesWhenOpen && item.href) {
                e.preventDefault();
                e.stopPropagation();
                navigate(item.href);
                if (onNavItemClick) onNavItemClick();
              }
              // Caso contrário, deixa o comportamento padrão do CollapsibleTrigger acontecer
            }}
          >
            <item.icon className={cn(
              "mr-2 h-4 w-4 flex-shrink-0",
              item.label.includes("IA") && "text-amber-500"
            )} />
            <span>{item.label}</span>
            <ChevronRight className={cn(
              "ml-auto h-4 w-4 transition-transform duration-200", 
              open && "rotate-90"
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1 space-y-1 overflow-hidden">
          <div className={cn(
            "pl-3 border-l-2 ml-4 space-y-1", 
            hasActiveChild ? "border-primary/30" : "border-muted-foreground/20"
          )}>
            {item.children.map((child) => (
              <SidebarNavItem 
                key={child.label} 
                item={child} 
                level={level + 1}
                onNavItemClick={handleChildNavigation} // Usar o handler modificado
                toggleChat={toggleChat}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
  
  // Item sem filhos - renderiza como um link (não muda com o estado de colapso)
  const isIAItem = item.label === "Assistente de IA" || item.label === "Chat Rápido";
  
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      className={cn(
        "w-full justify-start mb-1 rounded-md hover:bg-secondary/80",
        level > 0 ? "pl-5" : "pl-3",
        isActive && "bg-secondary text-secondary-foreground"
      )}
      asChild={!!item.href}
      onClick={item.onClick || handleItemClick}
    >
      {item.href ? (
        <NavLink to={item.href} className="flex items-center w-full">
          <item.icon className={cn(
            "mr-2 h-4 w-4 flex-shrink-0",
            isIAItem && "text-amber-500"
          )} />
          <span>{isCollapsed ? "" : item.label}</span>
        </NavLink>
      ) : (
        <div className="flex items-center">
          <item.icon className={cn(
            "mr-2 h-4 w-4 flex-shrink-0",
            isIAItem && "text-amber-500"
          )} />
          <span>{isCollapsed ? "" : item.label}</span>
        </div>
      )}
    </Button>
  );
} 