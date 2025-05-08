import React from 'react';
import { CreditCard, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useDashboard } from '@/hooks/useDashboard';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import LinksRapidosFinanceiro from '@/components/financeiro/dashboard/LinksRapidosFinanceiro';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useDashboard();

  const saldoAtual = data?.saldoAtual ?? 0;
  const receitasMes = data?.receitasMes ?? 0;
  const despesasMes = data?.despesasMes ?? 0;
  const progressoMetas = data?.progressoMetas ?? 0;

  const CardSkeleton = () => (
    <Skeleton className="h-[110px] w-full" />
  );

  const dashboardCards = [
    { title: "Saldo Atual", value: formatCurrency(saldoAtual), icon: CreditCard, path: "/app/financeiro", description: "Visão Geral Financeira", color: "text-blue-600", bgColor: "border-blue-200/70", hoverColor: "group-hover:border-blue-300" },
    { title: "Receitas", value: formatCurrency(receitasMes), icon: TrendingUp, path: "/app/receitas", description: "Mês atual", color: "text-green-600", bgColor: "border-green-200/70", hoverColor: "group-hover:border-green-300" },
    { title: "Despesas", value: formatCurrency(despesasMes), icon: TrendingDown, path: "/app/despesas", description: "Mês atual", color: "text-red-600", bgColor: "border-red-200/70", hoverColor: "group-hover:border-red-300" },
    { title: "Progresso Metas", value: `${progressoMetas.toFixed(0)}%`, icon: Target, path: "/app/metas", description: "Metas em andamento", color: "text-yellow-600", bgColor: "border-yellow-200/70", hoverColor: "group-hover:border-yellow-300" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center mb-6 pb-4 border-b border-gray-200/60">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-gray-800">Dashboard Principal</h2>
        <p className="text-gray-600 mt-1">
          Visão geral rápida do seu negócio e atalhos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          dashboardCards.map((cardData) => (
            <Link to={cardData.path} key={cardData.path} className="group block h-full">
              <Card className={`h-full transition-all duration-200 ease-in-out ${cardData.bgColor} group-hover:shadow-lg group-hover:-translate-y-1 flex flex-col ${cardData.hoverColor}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className={`text-sm font-medium uppercase ${cardData.color}`}>
                      {cardData.title}
                    </CardTitle>
                    <div className={`text-2xl font-bold ${cardData.color}`}>{cardData.value}</div>
                  </div>
                  <cardData.icon className={`h-5 w-5 ${cardData.color} flex-shrink-0`} />
                </CardHeader>
                <CardContent className="pb-3 pt-1">
                    <p className="text-xs text-gray-500">{cardData.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <Separator className="bg-gray-200/60" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-gray-200/70">
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <DashboardCharts fluxoCaixaData={data?.fluxoCaixaData ?? []} />
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200/70">
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <LinksRapidosFinanceiro />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
