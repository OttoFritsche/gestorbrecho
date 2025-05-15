import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CircleDollarSign, TrendingDown, TrendingUp, Target, Scale, LayoutDashboard, FileText, Wallet, ArrowUpRight } from 'lucide-react'; 
import { Separator } from '@/components/ui/separator';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const Financeiro: React.FC = () => {
  // Buscar dados financeiros básicos
  const { data, isLoading } = useDashboard();
  const saldoAtual = data?.saldoAtual ?? 0;

  // Agrupar seções por funcionalidade
  const sectionGroups = [
    {
      title: "Visão Geral",
      sections: [
        { 
          title: "Dashboard", 
          description: "Visão geral financeira", 
          path: "/app/financeiro/dashboard", 
          icon: LayoutDashboard, 
          color: "text-blue-600",
          bgColor: "bg-blue-50/50",
          borderColor: "border-blue-100" 
        },
        { 
          title: "Balanço", 
          description: "Veja a posição financeira", 
          path: "/app/balanco", 
          icon: Scale, 
          color: "text-indigo-600",
          bgColor: "bg-indigo-50/50",
          borderColor: "border-indigo-100" 
        },
      ]
    },
    {
      title: "Movimentações",
      sections: [
        { 
          title: "Receitas", 
          description: "Gerencie suas entradas", 
          path: "/app/receitas", 
          icon: TrendingUp, 
          color: "text-green-600",
          bgColor: "bg-green-50/50",
          borderColor: "border-green-100" 
        },
        { 
          title: "Despesas", 
          description: "Controle suas saídas", 
          path: "/app/despesas", 
          icon: TrendingDown, 
          color: "text-red-600",
          bgColor: "bg-red-50/50",
          borderColor: "border-red-100" 
        },
        { 
          title: "Fluxo de Caixa", 
          description: "Acompanhe o movimento diário", 
          path: "/app/fluxo-caixa", 
          icon: CircleDollarSign, 
          color: "text-cyan-600",
          bgColor: "bg-cyan-50/50",
          borderColor: "border-cyan-100" 
        }
      ]
    },
    {
      title: "Planejamento",
      sections: [
        { 
          title: "Metas", 
          description: "Defina e siga seus objetivos", 
          path: "/app/metas", 
          icon: Target, 
          color: "text-purple-600",
          bgColor: "bg-purple-50/50",
          borderColor: "border-purple-100" 
        },
        { 
          title: "Relatórios", 
          description: "Análises financeiras", 
          path: "/app/relatorios", 
          icon: FileText, 
          color: "text-gray-600",
          bgColor: "bg-gray-50/50",
          borderColor: "border-gray-100" 
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Cabeçalho da Página */}
      <div className="mb-6 pb-4 border-b border-gray-200/60 text-center">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Financeiro</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie as finanças do seu brechó: receitas, despesas, fluxo de caixa e metas financeiras.
        </p>
      </div>

      {/* Cards de Seção Agrupados */}
      {sectionGroups.map((group, index) => (
        <div key={group.title} className="mb-6">
          {/* Título do grupo */}
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">{group.title}</h3>
            <Separator className="flex-1 ml-3" />
          </div>
          
          {/* Grid para os Cards de Seção */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.sections.map((section) => (
              <Link to={section.path} key={section.path} className="group block h-full">
                <Card className={`h-full transition-all duration-200 ease-in-out ${section.bgColor} ${section.borderColor} group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col`}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold font-serif flex items-center gap-2">
                        {section.title}
                      </CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                    <section.icon className={`${section.color} h-6 w-6 flex-shrink-0 ml-4`} />
                  </CardHeader>
                  <CardFooter className="mt-auto pt-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`p-0 h-8 ${section.color} hover:bg-transparent`}
                    >
                      <span className="text-sm">Acessar</span>
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Financeiro;
