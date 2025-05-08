import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChartHorizontalBig, PieChart, TrendingUp, DollarSign, LineChart as LineChartIcon } from 'lucide-react';

const RelatoriosIndex: React.FC = () => {
  useEffect(() => {
    console.log("Componente RelatoriosIndex montado!");
  }, []);

  const reports = [
    {
      title: "Resumo Financeiro Mensal",
      description: "Visão geral de receitas, despesas e saldo.",
      path: "/app/relatorios/resumo",
      icon: BarChartHorizontalBig,
      color: "text-blue-600",
    },
    {
      title: "Despesas por Categoria",
      description: "Analise seus gastos agrupados por categoria.",
      path: "/app/relatorios/despesas-categoria",
      icon: PieChart,
      color: "text-red-600",
    },
     { 
      title: "Receitas por Categoria",
      description: "Veja a origem das suas receitas por categoria.",
      path: "/app/relatorios/receitas-categoria",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Lucratividade Mensal",
      description: "Calcule o lucro bruto e a margem do mês.",
      path: "/app/relatorios/lucratividade-mensal",
      icon: DollarSign,
      color: "text-amber-600",
    },
    {
      title: "Comparativo Mensal",
      description: "Compare receitas, despesas e lucro mês a mês.",
      path: "/app/relatorios/comparativo-mensal",
      icon: LineChartIcon,
      color: "text-cyan-600",
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 pb-4 border-b text-center">
        <h1 className="text-3xl font-bold font-serif text-[#92400e] flex items-center gap-2 justify-center">
          <FileText className="h-7 w-7" /> Relatórios Financeiros
        </h1>
        <p className="text-muted-foreground mt-1">
          Analise suas finanças com relatórios detalhados.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Link to={report.path} key={report.path} className="group block h-full">
            <Card className="h-full transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:border-primary/50 group-hover:-translate-y-1 flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold font-serif">
                    {report.title}
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </div>
                <report.icon className={`h-6 w-6 ${report.color} flex-shrink-0 ml-4 mt-1`} />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatoriosIndex; 