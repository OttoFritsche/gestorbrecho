// src/pages/app/financeiro/DashboardFinanceiro.tsx

import React, { useEffect } from 'react'; // Adicionar useEffect
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom'; // Importar useNavigate e Link

import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'; // Importar ArrowLeft
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { Button } from "@/components/ui/button"; // Importar Button

import { getDashboardFinanceiroData } from '@/services/dashboard';
import { DashboardFinanceiroData, GraficoData } from '@/types/financeiro';

// Importar os componentes do dashboard
import ResumoMesCard from '@/components/financeiro/dashboard/ResumoMesCard';
import SaldoAtualCard from '@/components/financeiro/dashboard/SaldoAtualCard';
import MetasAndamentoWidget from '@/components/financeiro/dashboard/MetasAndamentoWidget';
import UltimasTransacoesWidget from '@/components/financeiro/dashboard/UltimasTransacoesWidget';
import GraficoReceitaDespesa from '@/components/financeiro/dashboard/GraficoReceitaDespesa';
import GraficoSaldoCaixa from '@/components/financeiro/dashboard/GraficoSaldoCaixa';

const DashboardFinanceiroPage: React.FC = () => {
  // Log para verificar renderização do componente - REMOVIDO
  // console.log("[DashboardFinanceiroPage] Componente renderizando...");

  const navigate = useNavigate(); // Obter navigate
  // Obter o queryClient
  const queryClient = useQueryClient();

  // Lógica de busca de dados (mantida)
  const { data: dashboardData, isLoading, error, isError, refetch } = useQuery<DashboardFinanceiroData>({
    queryKey: ['dashboardFinanceiroData'],
    queryFn: getDashboardFinanceiroData,
    // staleTime: 5 * 60 * 1000, // Remover ou ajustar staleTime para teste
    // refetchInterval: 15 * 60 * 1000, // Remover ou ajustar refetchInterval para teste
  });

  // ---- INÍCIO DEBUG: Invalidar e Refetch ao montar - REMOVIDO ----
  /*
  useEffect(() => {
    console.log("[DashboardFinanceiroPage] Invalidando e Refetching query dashboardFinanceiroData...");
    queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
    // Opcional: forçar refetch imediatamente após invalidar
    // refetch();
  }, [queryClient, refetch]);
  */
 // ---- FIM DEBUG ----

  const mesAtualFormatado = format(startOfMonth(new Date()), 'MMMM/yyyy', { locale: ptBR });

  // Estado de Carregamento (restaurado)
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Estado de Erro (restaurado)
  if (isError || !dashboardData) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Dashboard</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os dados financeiros. Tente novamente mais tarde.
            {error && <p className="mt-2 text-xs">Detalhes: {error.message}</p>}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Desestruturar os dados atualizados de resumoMes
  const {
    totalVendido,
    custoItensVendidos,
    sobrouDasVendas,
    gastosGerais,
    resultadoFinal
  } = dashboardData.resumoMes;

  // Renderização do Dashboard com NOVO Layout (Cards em cima, Gráficos em baixo)
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho centralizado (mantido) */}
      <div className="flex flex-col items-center justify-center pb-4 border-b w-full mb-6">
        <h2 className="text-3xl font-bold font-serif text-[#92400e]">Dashboard Financeiro</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Sua visão geral financeira em um só lugar.
        </p>
      </div>

      {/* Linha 1: Cards - Tentativa 3 (4 colunas, 3 preenchidas) */}
      {/* Voltar para 4 colunas e ADICIONAR items-stretch */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {/* Coluna 1: Resumo do Mês */}
          <ResumoMesCard
            totalVendido={totalVendido}
            custoItensVendidos={custoItensVendidos}
            sobrouDasVendas={sobrouDasVendas}
            gastosGerais={gastosGerais}
            resultadoFinal={resultadoFinal}
            mesReferencia={mesAtualFormatado}
          />

          {/* Coluna 2: Saldo e Metas Empilhados */}
          <div className="flex flex-col gap-6"> 
            <SaldoAtualCard saldo={dashboardData.saldoAtualCaixa} />
            <MetasAndamentoWidget count={dashboardData.contagemMetasAndamento} />
          </div>
          
          {/* Coluna 3: Últimas Transações */}
          <UltimasTransacoesWidget ultimasTransacoes={dashboardData.ultimasTransacoes} />

          {/* Coluna 4: Vazia (para manter proporção) */}
          {/* Pode adicionar algo aqui no futuro, se desejar */}
      </div>

      {/* Linha 2: Gráficos Lado a Lado */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico Receita x Despesa */}
        {/* Remover div lg:col-span-2 externa */}
        <GraficoReceitaDespesa data={dashboardData.graficoReceitaDespesa} />
        {/* Gráfico Evolução Saldo */}
        <GraficoSaldoCaixa data={dashboardData.historicoSaldoCaixa} />
      </div>

    </div> // Fechamento da div principal
  ); // Fechamento do return
}; // Fechamento do componente

export default DashboardFinanceiroPage; 