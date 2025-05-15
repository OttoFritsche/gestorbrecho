import { 
  LayoutDashboard, 
  CreditCard, 
  CircleDollarSign,
  ShoppingBasket, 
  Package, 
  Users, 
  Tags, 
  Settings, 
  Bot,
  MessagesSquare,
  BarChart2,
  DollarSign,
  ShoppingCart,
  Truck,
  UserRound,
  Banknote,
  BookMarked,
  Archive,
  UserSquare,
  UserCog,
  ClipboardList,
  BadgePercent,
  Landmark,
  FileText,
  BrainCircuit,
  Sparkles,
  MessageCircle,
  ChevronRight,
  LucideIcon
} from 'lucide-react';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  hrefCollapsed?: string;
  onClick?: () => void;
  children?: NavItem[];
  activeWhen?: (pathname: string) => boolean; // Para casos especiais de ativação
  parentNavigatesWhenOpen?: boolean;
}

// Função auxiliar para verificar rotas ativas
const isActiveRoute = (currentPath: string, routePath: string): boolean => {
  if (routePath === '/app' && currentPath === '/app') {
    return true;
  }
  return currentPath.startsWith(routePath) && routePath !== '/app';
};

export const sidebarNavItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/app",
    // Ativo apenas na rota exata do dashboard
    activeWhen: (pathname) => pathname === '/app'
  },
  {
    label: "Catálogo",
    icon: BookMarked,
    hrefCollapsed: "/app/estoque",
    parentNavigatesWhenOpen: false,
    children: [
      { 
        label: "Produtos", 
        icon: Package, 
        href: "/app/estoque"
      },
      { 
        label: "Categorias", 
        icon: Tags, 
        href: "/app/categorias"
      }
    ]
  },
  {
    label: "Pessoas",
    icon: Users,
    hrefCollapsed: "/app/clientes",
    parentNavigatesWhenOpen: false,
    children: [
      { 
        label: "Clientes", 
        icon: UserSquare, 
        href: "/app/clientes"
      },
      { 
        label: "Fornecedores", 
        icon: Truck, 
        href: "/app/fornecedores"
      },
      { 
        label: "Vendedores", 
        icon: UserCog, 
        href: "/app/vendedores"
      }
    ]
  },
  {
    label: "Operacional",
    icon: ClipboardList,
    hrefCollapsed: "/app/vendas",
    parentNavigatesWhenOpen: false,
    children: [
      {
        label: "Vendas",
        icon: ShoppingCart,
        href: "/app/vendas"
      },
      {
        label: "Comissões",
        icon: BadgePercent,
        href: "/app/comissoes"
      }
    ]
  },
  {
    label: "Financeiro",
    icon: DollarSign,
    href: "/app/financeiro",
    hrefCollapsed: "/app/financeiro",
    parentNavigatesWhenOpen: false,
    children: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/app/financeiro/dashboard"
      },
      {
        label: "Receitas",
        icon: CreditCard,
        href: "/app/receitas"
      },
      {
        label: "Despesas",
        icon: CircleDollarSign,
        href: "/app/despesas"
      },
      {
        label: "Fluxo de Caixa",
        icon: Landmark,
        href: "/app/fluxo-caixa"
      },
      {
        label: "Metas",
        icon: ShoppingBasket,
        href: "/app/metas"
      }
    ]
  },
  {
    label: "Análises",
    icon: BarChart2,
    hrefCollapsed: "/app/relatorios",
    parentNavigatesWhenOpen: false,
    children: [
      {
        label: "Relatórios",
        icon: FileText,
        href: "/app/relatorios"
      }
    ]
  },
  {
    label: "IA & Suporte",
    icon: Sparkles,
    hrefCollapsed: "/app/assistente",
    parentNavigatesWhenOpen: false,
    children: [
      {
        label: "Assistente de IA",
        icon: MessagesSquare,
        href: "/app/assistente"
      },   
    ]
  },
  {
    label: "Configurações",
    icon: Settings,
    href: "/app/configuracoes"
  }
]; 