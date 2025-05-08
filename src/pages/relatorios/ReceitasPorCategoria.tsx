// src/pages/relatorios/ReceitasPorCategoria.tsx

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, getYear, getMonth, set } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, Percent, Sigma, TrendingUp, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import { getReceitasPorCategoria } from '@/services/relatorios';
import { ReceitaCategoriaAgrupada } from '@/types/financeiro';
import { formatCurrency } from '@/lib/utils';

const NEW_COLORS = [
  '#16a34a', // Green 600
  '#0284c7', // Sky 600
  '#22c55e', // Green 500
  '#0ea5e9', // Sky 500
  '#10b981', // Emerald 500
  '#06b6d4', // Cyan 500
  '#3b82f6', // Blue 500
  '#8b5cf6', // Violet 500
];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if ((percent * 100) < 3) { // Limite de 3%
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      fill="white" // Cor do texto do rótulo
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="10px" // Tamanho da fonte do rótulo
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ReceitasPorCategoriaPage: React.FC = () => {
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

  const { dataInicio, dataFim } = useMemo(() => {
    const dataBase = set(hoje, { year: anoSelecionado, month: mesSelecionado });
    return {
      dataInicio: format(startOfMonth(dataBase), 'yyyy-MM-dd'),
      dataFim: format(endOfMonth(dataBase), 'yyyy-MM-dd'),
    };
  }, [anoSelecionado, mesSelecionado, hoje]);

  const { data: receitasAgrupadas, isLoading, error } = useQuery<ReceitaCategoriaAgrupada[]>({
    queryKey: ['receitasPorCategoria', dataInicio, dataFim],
    queryFn: () => getReceitasPorCategoria(dataInicio, dataFim),
    staleTime: 5 * 60 * 1000,
  });

  const dadosProcessados = useMemo(() => {
    if (!receitasAgrupadas || receitasAgrupadas.length === 0) {
      return { itens: [], totalGeral: 0 };
    }
    const totalGeral = receitasAgrupadas.reduce((sum, item) => sum + item.total_receita, 0);
    const itens = receitasAgrupadas.map(item => ({
      ...item,
      quantidade_receitas: item.quantidade_receitas,
      percentual_total: totalGeral > 0 ? (item.total_receita / totalGeral) * 100 : 0,
    }));
    return { itens, totalGeral };
  }, [receitasAgrupadas]);

  const periodoFormatado = format(set(hoje, { year: anoSelecionado, month: mesSelecionado }), 'MMMM/yyyy', { locale: ptBR });

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border p-2 rounded shadow-sm text-sm">
          <p className="font-semibold">{data.categoria_nome || 'Sem Categoria'}</p>
          <p>Valor: {formatCurrency(data.total_receita)}</p>
          <p>Percentual: {data.percentual_total?.toFixed(1)}%</p>
          <p className="text-muted-foreground">Qtd: {data.quantidade_receitas}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold font-serif text-[#166534]">Receitas por Categoria</h1>
          </div>
          <div className="flex items-center gap-2 justify-end flex-wrap">
             <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
               <SelectTrigger className="w-[150px] "><SelectValue placeholder="Mês" /></SelectTrigger>
               <SelectContent>{mesesDisponiveis.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}</SelectContent>
             </Select>
             <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
               <SelectTrigger className="w-[100px]"><SelectValue placeholder="Ano" /></SelectTrigger>
               <SelectContent>{anosDisponiveis.map(a => <SelectItem key={a} value={a.toString()}>{a}</SelectItem>)}</SelectContent>
             </Select>
           </div>
        </div>
        <p className="text-muted-foreground mt-1 sm:ml-[52px]">
           Analise a origem das suas receitas para {periodoFormatado}.
         </p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados das receitas: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (
        <>
          {dadosProcessados.itens.length === 0 ? (
             <p className="text-center text-muted-foreground py-10">Nenhuma receita encontrada para o período selecionado.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sigma className="h-5 w-5"/> Detalhamento por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableCaption>Total de receitas no período: {formatCurrency(dadosProcessados.totalGeral)}</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-center">Qtd.</TableHead>
                          <TableHead className="text-right">Total Recebido</TableHead>
                          <TableHead className="text-right"><Percent className="inline h-4 w-4 mr-1"/>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosProcessados.itens.map((item) => (
                          <TableRow key={item.categoria_id || 'sem_categoria'}>
                            <TableCell className="font-medium">{item.categoria_nome || 'Sem Categoria'}</TableCell>
                            <TableCell className="text-center text-muted-foreground">{item.quantidade_receitas}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total_receita)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{item.percentual_total?.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição Percentual</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosProcessados.itens}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="total_receita"
                          nameKey="categoria_nome"
                          label={renderCustomizedLabel}
                        >
                          {dadosProcessados.itens.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={NEW_COLORS[index % NEW_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', lineHeight: '1.5' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReceitasPorCategoriaPage; 