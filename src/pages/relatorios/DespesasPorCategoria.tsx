// src/pages/relatorios/DespesasPorCategoria.tsx

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
import { Loader2, AlertCircle, Percent, Sigma, TrendingDown, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import { getDespesasPorCategoria } from '@/services/relatorios';
import { DespesaCategoriaAgrupada } from '@/types/financeiro';
import { formatCurrency } from '@/lib/utils';

// Novas cores com melhor contraste (tons de vermelho, laranja, amarelo, roxo, etc.)
const NEW_COLORS = [
  '#e11d48', // Rose 600
  '#ea580c', // Orange 600
  '#ca8a04', // Yellow 600
  '#6d28d9', // Violet 700
  '#be185d', // Pink 700
  '#16a34a', // Green 600
  '#0284c7', // Sky 600
  '#c026d3', // Fuchsia 600
];

// Função para renderizar o rótulo da porcentagem dentro da fatia
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Posição do rótulo (meio da fatia)
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Não mostrar rótulo para fatias muito pequenas
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

const DespesasPorCategoriaPage: React.FC = () => {
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

  // Busca os dados das DESPESAS agrupadas
  const { data: despesasAgrupadas, isLoading, error } = useQuery<DespesaCategoriaAgrupada[]>({
    queryKey: ['despesasPorCategoria', dataInicio, dataFim],
    queryFn: () => getDespesasPorCategoria(dataInicio, dataFim),
    staleTime: 5 * 60 * 1000,
  });

  // Calcula o total de DESPESAS e percentuais
  const dadosProcessados = useMemo(() => {
    if (!despesasAgrupadas || despesasAgrupadas.length === 0) {
      return { itens: [], totalGeral: 0 };
    }
    const totalGeral = despesasAgrupadas.reduce((sum, item) => sum + item.total_despesa, 0);
    const itens = despesasAgrupadas.map(item => ({
      ...item,
      percentual_total: totalGeral > 0 ? (item.total_despesa / totalGeral) * 100 : 0,
    }));
    return { itens, totalGeral };
  }, [despesasAgrupadas]);

  const periodoFormatado = format(set(hoje, { year: anoSelecionado, month: mesSelecionado }), 'MMMM/yyyy', { locale: ptBR });

  // Tooltip customizado para o gráfico de pizza
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border p-2 rounded shadow-sm text-sm">
          <p className="font-semibold">{data.categoria_nome || 'Sem Categoria'}</p>
          <p>Valor: {formatCurrency(data.total_despesa)}</p>
          <p>Percentual: {data.percentual_total?.toFixed(1)}%</p>
          <p className="text-muted-foreground">Qtd: {data.quantidade_despesas}</p>
        </div>
      );
    }
    return null;
  };

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
            <h1 className="text-3xl font-bold font-serif text-[#b91c1c]">Despesas por Categoria</h1>
          </div>

          {/* Lado Direito: Seletores de Período */}
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
         {/* Descrição */}
         <p className="text-muted-foreground mt-1 sm:ml-[52px]"> {/* Ajustar marginLeft se necessário */}
           Analise a distribuição das suas despesas para {periodoFormatado}.
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
            Não foi possível carregar os dados das despesas: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Conteúdo Principal */}
      {!isLoading && !error && (
        <>
          {dadosProcessados.itens.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Nenhuma despesa encontrada para o período selecionado.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Tabela */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sigma className="h-5 w-5"/> Detalhamento por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableCaption>Total de despesas no período: {formatCurrency(dadosProcessados.totalGeral)}</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-center">Qtd.</TableHead>
                          <TableHead className="text-right">Total Gasto</TableHead>
                          <TableHead className="text-right"><Percent className="inline h-4 w-4 mr-1"/>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dadosProcessados.itens.map((item) => (
                          <TableRow key={item.categoria_id || 'sem_categoria'}>
                            <TableCell className="font-medium">{item.categoria_nome || 'Sem Categoria'}</TableCell>
                            <TableCell className="text-center text-muted-foreground">{item.quantidade_despesas}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total_despesa)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{item.percentual_total?.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico */}
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
                          dataKey="total_despesa"
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

export default DespesasPorCategoriaPage;
