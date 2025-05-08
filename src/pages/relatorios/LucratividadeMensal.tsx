// src/pages/relatorios/LucratividadeMensal.tsx

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, getYear, getMonth, set } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Scale, Percent, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Importa a função e o tipo corretos
import { getLucratividadeMensal } from '@/services/relatorios';
import { LucratividadeMensalData } from '@/types/financeiro';
import { formatCurrency, formatPercentage } from '@/lib/utils';

const LucratividadeMensalPage: React.FC = () => {
  const hoje = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState<number>(getYear(hoje));
  const [mesSelecionado, setMesSelecionado] = useState<number>(getMonth(hoje));
  const navigate = useNavigate();

  const anosDisponiveis = useMemo(() => {
    const anoAtual = getYear(hoje);
    const anos = [];
    for (let i = anoAtual; i >= anoAtual - 5; i--) {
      anos.push(i);
    }
    return anos;
  }, []);

  const mesesDisponiveis = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: format(set(hoje, { month: i }), 'MMMM', { locale: ptBR }),
    }));
  }, [hoje]);

  // Calcula as datas e o mês de referência para a query
  const { dataInicio, dataFim, mesReferenciaQuery } = useMemo(() => {
    const dataBase = set(hoje, { year: anoSelecionado, month: mesSelecionado });
    return {
      dataInicio: format(startOfMonth(dataBase), 'yyyy-MM-dd'),
      dataFim: format(endOfMonth(dataBase), 'yyyy-MM-dd'),
      mesReferenciaQuery: format(dataBase, 'yyyy-MM'), // Formato para a função de serviço
    };
  }, [anoSelecionado, mesSelecionado, hoje]);

  // Busca os dados da lucratividade para o período selecionado
  const { data: lucratividadeData, isLoading, error } = useQuery<LucratividadeMensalData>({
    queryKey: ['lucratividadeMensal', mesReferenciaQuery], // Usa mesReferenciaQuery na chave
    queryFn: () => getLucratividadeMensal(dataInicio, dataFim, mesReferenciaQuery),
    staleTime: 5 * 60 * 1000,
    enabled: !!mesReferenciaQuery, // Garante que a query só rode com a referência válida
  });

  const periodoFormatado = format(set(hoje, { year: anoSelecionado, month: mesSelecionado }), 'MMMM/yyyy', { locale: ptBR });

  // Prepara dados para um gráfico simples de Receita x Despesa
  const graficoData = useMemo(() => {
    if (!lucratividadeData) return [];
    return [
      { name: periodoFormatado, Receitas: lucratividadeData.totalReceitas, Despesas: lucratividadeData.totalDespesas }
    ];
  }, [lucratividadeData, periodoFormatado]);


  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Cabeçalho e Seletores - Atualizado */}
      <div className="pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          {/* Lado Esquerdo: Botão Voltar e Título */}
          <div className="flex items-center gap-4">
            {/* Botão Voltar Adicionado Aqui */}
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {/* Título com a cor padrão do projeto */}
            <h1 className="text-3xl font-bold font-serif text-[#92400e]">Lucratividade Mensal</h1>
          </div>

          {/* Lado Direito: Seletores de Período */}
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {/* Seletores */}
            <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>{mesesDisponiveis.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
              <SelectTrigger className="w-[100px]"><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>{anosDisponiveis.map(a => <SelectItem key={a} value={a.toString()}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
         {/* Descrição */}
         <p className="text-muted-foreground mt-1 sm:ml-[52px]"> {/* Ajustar marginLeft se necessário */}
           Resultado financeiro (Receitas - Despesas Pagas) para {periodoFormatado}.
         </p>
      </div>

      {/* Carregamento */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Erro */}
      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível calcular a lucratividade: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Conteúdo Principal */}
      {!isLoading && !error && lucratividadeData && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
           {/* Card Receitas */}
           <Card className="border-green-300 bg-green-50/30">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4"/> Total Receitas
                </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-green-700">{formatCurrency(lucratividadeData.totalReceitas)}</div>
             </CardContent>
           </Card>

           {/* Card Despesas */}
           <Card className="border-red-300 bg-red-50/30">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-1">
                   <TrendingDown className="h-4 w-4"/> Total Despesas Pagas
                </CardTitle>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold text-red-700">{formatCurrency(lucratividadeData.totalDespesas)}</div>
             </CardContent>
           </Card>

           {/* Card Lucro Bruto */}
           <Card className={lucratividadeData.lucroBruto >= 0 ? "border-blue-300 bg-blue-50/30" : "border-orange-300 bg-orange-50/30"}>
             <CardHeader className="pb-2">
                 <CardTitle className={`text-sm font-medium flex items-center gap-1 ${lucratividadeData.lucroBruto >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                   <Scale className="h-4 w-4"/> Lucro Bruto
                 </CardTitle>
             </CardHeader>
             <CardContent>
                 <div className={`text-2xl font-bold ${lucratividadeData.lucroBruto >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {formatCurrency(lucratividadeData.lucroBruto)}
                 </div>
             </CardContent>
           </Card>

           {/* Card Margem Bruta */}
           <Card>
             <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-800 flex items-center gap-1">
                    <Percent className="h-4 w-4"/> Margem Bruta
                  </CardTitle>
             </CardHeader>
             <CardContent>
                  <div className={`text-2xl font-bold ${lucratividadeData.margemLucroBruta >= 0 ? 'text-gray-700' : 'text-red-700'}`}>
                     {formatPercentage(lucratividadeData.margemLucroBruta)}
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">(Lucro / Receitas)</p>
             </CardContent>
           </Card>

            {/* Gráfico Comparativo Simples */}
            <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader>
                    <CardTitle className="text-lg">Comparativo Receitas vs. Despesas</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={graficoData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                            <XAxis type="number" tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })} />
                            <YAxis type="category" dataKey="name" hide /> {/* Esconde o nome do mês no eixo Y */}
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="Receitas" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={30} />
                            <Bar dataKey="Despesas" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

        </div>
      )}

      {/* Mensagem se não houver dados (após carregamento e sem erro) */}
       {!isLoading && !error && !lucratividadeData && (
            <p className="text-center text-muted-foreground py-10">Não foi possível calcular a lucratividade para o período selecionado.</p>
       )}

    </div>
  );
};

export default LucratividadeMensalPage; 