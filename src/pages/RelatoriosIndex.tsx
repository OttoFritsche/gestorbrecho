import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChartHorizontalBig, PieChart, TrendingUp, DollarSign, LineChartIcon, Filter, Calendar, Download, ArrowUpRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const RelatoriosIndex: React.FC = () => {
  const { data, isLoading } = useDashboard();
  const saldoAtual = data?.saldoAtual ?? 0;
  
  // Agrupar relatórios por categoria
  const reportGroups = [
    {
      title: "Visão Geral",
      reports: [
        {
          title: "Resumo Financeiro Mensal",
          description: "Visão geral de receitas, despesas e saldo.",
          path: "/app/relatorios/resumo",
          icon: BarChartHorizontalBig,
          color: "text-blue-600",
          bgColor: "bg-blue-50/50",
          borderColor: "border-blue-100",
        },
        {
          title: "Comparativo Mensal",
          description: "Compare receitas, despesas e lucro mês a mês.",
          path: "/app/relatorios/comparativo-mensal",
          icon: LineChartIcon,
          color: "text-cyan-600",
          bgColor: "bg-cyan-50/50",
          borderColor: "border-cyan-100",
        },
      ]
    },
    {
      title: "Análises por Categoria",
      reports: [
        {
          title: "Despesas por Categoria",
          description: "Analise seus gastos agrupados por categoria.",
          path: "/app/relatorios/despesas-categoria",
          icon: PieChart,
          color: "text-red-600",
          bgColor: "bg-red-50/50",
          borderColor: "border-red-100",
        },
        { 
          title: "Receitas por Categoria",
          description: "Veja a origem das suas receitas por categoria.",
          path: "/app/relatorios/receitas-categoria",
          icon: TrendingUp,
          color: "text-green-600",
          bgColor: "bg-green-50/50",
          borderColor: "border-green-100",
        },
      ]
    },
    {
      title: "Lucratividade",
      reports: [
        {
          title: "Lucratividade Mensal",
          description: "Calcule o lucro bruto e a margem do mês.",
          path: "/app/relatorios/lucratividade-mensal",
          icon: DollarSign,
          color: "text-amber-600",
          bgColor: "bg-amber-50/50",
          borderColor: "border-amber-100",
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="mb-6 pb-4 border-b border-gray-200/60 text-center">
        <h1 className="text-3xl font-bold font-serif text-[#92400e] flex items-center gap-2 justify-center">
          <FileText className="h-7 w-7" /> Relatórios
        </h1>
        <p className="text-muted-foreground mt-1">
          Analise suas finanças com relatórios detalhados.
        </p>
      </div>

      {/* Grupos de relatórios */}
      {reportGroups.map((group) => (
        <div key={group.title} className="mb-6">
          {/* Título do grupo */}
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">{group.title}</h3>
            <Separator className="flex-1 ml-3" />
          </div>
          
          {/* Grid para os relatórios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.reports.map((report) => (
              <Link to={report.path} key={report.path} className="group block h-full">
                <Card className={`h-full transition-all duration-200 ease-in-out ${report.bgColor} ${report.borderColor} group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col`}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold font-serif flex items-center gap-2">
                        {report.title}
                      </CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                    <report.icon className={`${report.color} h-6 w-6 flex-shrink-0 ml-4 mt-1`} />
                  </CardHeader>
                  <CardFooter className="mt-auto pt-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`p-0 h-8 ${report.color} hover:bg-transparent`}
                    >
                      <span className="text-sm">Visualizar Relatório</span>
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

export default RelatoriosIndex; 