// src/pages/relatorios/ComparativoMensal.tsx

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Scale, Percent, Calendar, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

// Importa a função e o tipo
import { getComparativoMensal } from '@/services/relatorios';
import { LucratividadeMensalData } from '@/types/financeiro'; // Reutiliza este tipo
import { formatCurrency, formatPercentage } from '@/lib/utils';

// Componente Tooltip customizado para gráficos
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Formata o label (mês)
    let formattedLabel = label;
    try {
        formattedLabel = format(parse(label, 'yyyy-MM', new Date()), 'MMM/yy', { locale: ptBR });
    } catch (e) { /* Usa label original se o parse falhar */ }

    return (
      <div className="bg-background border p-2 rounded shadow-sm text-sm">
        <p className="font-semibold">{formattedLabel}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color }}>
            {pld.name}: {pld.dataKey === 'margemLucroBruta' ? formatPercentage(pld.value) : formatCurrency(pld.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const ComparativoMensalPage: React.FC = () => {
  const [numeroMeses, setNumeroMeses] = useState<number>(6);
  const navigate = useNavigate();

  // Busca os dados comparativos
  const { data: comparativoData, isLoading, error } = useQuery<LucratividadeMensalData[]>({    queryKey: ['comparativoMensal', numeroMeses], // Chave inclui o número de meses
    queryFn: () => getComparativoMensal(numeroMeses),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Formata os dados para a tabela e gráficos
  const dadosFormatados = useMemo(() => {
    return comparativoData?.map(item => ({
      ...item,
      // Formata o mês para exibição (ex: Jan/24)
      mesLabel: format(parse(item.mesReferencia, 'yyyy-MM', new Date()), 'MMM/yy', { locale: ptBR }),
    })) ?? [];
  }, [comparativoData]);


  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Cabeçalho e Seletor de Período - Atualizado */}
      <div className="pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          {/* Lado Esquerdo: Botão Voltar e Título */}
          <div className="flex items-center gap-4">
            {/* Botão Voltar Adicionado Aqui */}
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {/* Título com a cor padrão */}
            <h1 className="text-3xl font-bold font-serif text-[#92400e]">Comparativo Mensal</h1>
          </div>

          {/* Lado Direito: Seletor de Período */}
          <div>
            <Select
              value={numeroMeses.toString()}
              onValueChange={(value) => setNumeroMeses(parseInt(value, 10))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
         {/* Descrição */}
         <p className="text-muted-foreground mt-1 sm:ml-[52px]"> {/* Ajustar marginLeft se necessário */}
           Evolução de Receitas, Despesas e Lucratividade nos últimos meses.
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
            Não foi possível carregar os dados comparativos: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Conteúdo Principal */}
      {!isLoading && !error && dadosFormatados && dadosFormatados.length > 0 && (
        <>
          {/* Tabela Comparativa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                 <Calendar className="h-5 w-5"/> Tabela Comparativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Receitas</TableHead>
                    <TableHead className="text-right">Despesas</TableHead>
                    <TableHead className="text-right">Lucro Bruto</TableHead>
                    <TableHead className="text-right">Margem Bruta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosFormatados.map((item) => (
                    <TableRow key={item.mesReferencia}>
                      <TableCell className="font-medium">{item.mesLabel}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(item.totalReceitas)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(item.totalDespesas)}</TableCell>
                      <TableCell className={`text-right font-semibold ${item.lucroBruto >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                        {formatCurrency(item.lucroBruto)}
                      </TableCell>
                      <TableCell className={`text-right ${item.margemLucroBruta >= 0 ? 'text-gray-600' : 'text-red-700'}`}>
                        {formatPercentage(item.margemLucroBruta)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Separator />

          {/* Gráficos de Tendência */}
          <div className="grid gap-6 md:grid-cols-2">
             {/* Gráfico Lucro e Margem */}
             <Card>
                <CardHeader>
                   <CardTitle className="text-lg">Tendência de Lucro e Margem</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={dadosFormatados} margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                       <YAxis yAxisId="left" orientation="left" stroke="#1d4ed8" tickFormatter={(value) => formatCurrency(value, {notation: 'compact'})} tick={{ fontSize: 12 }} width={70}/>
                       <YAxis yAxisId="right" orientation="right" stroke="#f97316" tickFormatter={(value) => formatPercentage(value)} tick={{ fontSize: 12 }} width={50}/>
                       <Tooltip content={<CustomTooltip />} />
                       <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}/>
                       <Line yAxisId="left" type="monotone" dataKey="lucroBruto" name="Lucro" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                       <Line yAxisId="right" type="monotone" dataKey="margemLucroBruta" name="Margem (%)" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                     </LineChart>
                   </ResponsiveContainer>
                 </CardContent>
             </Card>

              {/* Gráfico Receitas e Despesas */}
               <Card>
                 <CardHeader>
                    <CardTitle className="text-lg">Tendência de Receitas e Despesas</CardTitle>
                 </CardHeader>
                 <CardContent className="h-[300px] w-full pt-4">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dadosFormatados} margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                         <YAxis tickFormatter={(value) => formatCurrency(value, {notation: 'compact'})} tick={{ fontSize: 12 }} width={70}/>
                         <Tooltip content={<CustomTooltip />} />
                         <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}/>
                         <Line type="monotone" dataKey="totalReceitas" name="Receitas" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                         <Line type="monotone" dataKey="totalDespesas" name="Despesas" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                       </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
               </Card>
          </div>
        </>
      )}

       {/* Mensagem se não houver dados (após carregamento e sem erro) */}
        {!isLoading && !error && (!dadosFormatados || dadosFormatados.length === 0) && (
             <p className="text-center text-muted-foreground py-10">Nenhum dado encontrado para gerar o comparativo.</p>
        )}
    </div>
  );
};

export default ComparativoMensalPage; 