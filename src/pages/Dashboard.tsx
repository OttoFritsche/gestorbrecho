import React from 'react';
import { CreditCard, TrendingUp, Target, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import AlertasWidget from '@/components/dashboard/AlertasWidget';
import AcoesRapidas from '@/components/dashboard/AcoesRapidas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useDashboard();

  // Valores padrão seguros caso data ainda seja undefined
  const saldoAtual = data?.saldoAtual ?? 0;
  const vendasHoje = data?.vendasHoje ?? { valorTotal: 0, quantidade: 0 };
  const progressoMetas = data?.progressoMetas ?? 0;
  const alertas = data?.alertas ?? {
    parcelasReceber: { itens: [], quantidade: 0, valorTotal: 0 },
    contasPagar: { itens: [], quantidade: 0, valorTotal: 0 },
    estoqueBaixo: { itens: [], quantidade: 0 }
  };

  const CardSkeleton = () => (
    <Skeleton className="h-[110px] w-full" />
  );

  const dashboardCards = [
    { 
      title: "Saldo Atual", 
      value: formatCurrency(saldoAtual), 
      icon: CreditCard, 
      path: "/app/financeiro", 
      description: "Visão Geral Financeira", 
      color: "text-blue-600", 
      bgColor: "border-blue-200/70", 
      hoverColor: "group-hover:border-blue-300" 
    },
    { 
      title: "Vendas Hoje", 
      value: formatCurrency(vendasHoje.valorTotal), 
      icon: ShoppingCart, 
      path: "/app/vendas", 
      description: `${vendasHoje.quantidade} ${vendasHoje.quantidade === 1 ? 'venda' : 'vendas'} realizadas`, 
      color: "text-green-600", 
      bgColor: "border-green-200/70", 
      hoverColor: "group-hover:border-green-300" 
    },
    { 
      title: "Progresso Metas", 
      value: `${progressoMetas.toFixed(0)}%`, 
      icon: Target, 
      path: "/app/metas", 
      description: "Metas em andamento", 
      color: "text-yellow-600", 
      bgColor: "border-yellow-200/70", 
      hoverColor: "group-hover:border-yellow-300" 
    },
    { 
      title: "Estoque Baixo", 
      value: `${alertas.estoqueBaixo.quantidade}`, 
      icon: TrendingUp, 
      path: "/app/estoque", 
      description: "Produtos para repor", 
      color: "text-red-600", 
      bgColor: "border-red-200/70", 
      hoverColor: "group-hover:border-red-300" 
    },
  ];

  // Componente para mensagem de erro
  const ErrorMessage = () => (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Erro ao carregar dados</AlertTitle>
      <AlertDescription>
        Ocorreu um erro ao buscar os dados do dashboard. Por favor, tente novamente mais tarde.
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center mb-6 pb-4 border-b border-gray-200/60">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Dashboard Operacional</h2>
        <p className="text-gray-600 mt-1">
          Ações rápidas, alertas e visão operacional do seu negócio.
        </p>
      </div>

      {/* Mensagem de erro se houver */}
      {error && <ErrorMessage />}
      
      {/* KPIs */}
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

      {/* Ações Rápidas e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ações Rápidas */}
        <div className="h-full">
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <AcoesRapidas />
          )}
        </div>

        {/* Alertas e Lembretes */}
        <div className="h-full">
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <AlertasWidget 
              parcelasReceber={alertas.parcelasReceber}
              contasPagar={alertas.contasPagar}
              estoqueBaixo={alertas.estoqueBaixo}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
