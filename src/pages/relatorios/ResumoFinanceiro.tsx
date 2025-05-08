import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, getYear, getMonth, setYear, setMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Wallet, AlertCircle, BookOpen, ArrowLeft, Calendar } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

import { getResumoFinanceiroMesAtual } from '@/services/relatorios';
import { ResumoFinanceiroData } from '@/types/financeiro';
import { formatCurrency } from '@/lib/utils';

// Função auxiliar para gerar opções de ano
const gerarAnos = (anosAtras = 4): { value: string; label: string }[] => {
  const anoAtual = getYear(new Date());
  const anos = [];
  for (let i = 0; i <= anosAtras; i++) {
    const ano = anoAtual - i;
    anos.push({ value: ano.toString(), label: ano.toString() });
  }
  return anos;
};

// Função auxiliar para gerar opções de mês
const gerarMeses = (): { value: string; label: string }[] => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: (i).toString(), // 0-indexed para date-fns
    label: format(setMonth(new Date(), i), 'MMMM', { locale: ptBR }),
  }));
};

const ResumoFinanceiroPage: React.FC = () => {
  const navigate = useNavigate();
  const hoje = new Date();

  // Estados para ano e mês selecionados
  const [anoSelecionado, setAnoSelecionado] = useState<string>(getYear(hoje).toString());
  const [mesSelecionado, setMesSelecionado] = useState<string>(getMonth(hoje).toString()); // date-fns month (0-11)

  // Opções para os selects
  const anosOptions = gerarAnos();
  const mesesOptions = gerarMeses();

  // Busca os dados do resumo financeiro com base no período selecionado
  const { data: resumoData, isLoading, error, isFetching } = useQuery<ResumoFinanceiroData>({
    // Query key dinâmica baseada no ano e mês
    queryKey: ['resumoFinanceiro', anoSelecionado, mesSelecionado],
    // Passa ano e mês para a função de fetch, agora que a função foi adaptada
    queryFn: () => getResumoFinanceiroMesAtual(parseInt(anoSelecionado), parseInt(mesSelecionado)),
    // Executa a query apenas se ano e mês estiverem definidos
    enabled: !!anoSelecionado && mesSelecionado !== undefined && mesSelecionado !== null,
    // Mantém dados anteriores enquanto busca novos para uma transição suave (opcional)
    keepPreviousData: true,
  });

  // Formata o período selecionado para exibição
  const periodoFormatado = React.useMemo(() => {
    if (anoSelecionado && mesSelecionado !== undefined && mesSelecionado !== null) {
      const dataSelecionada = setMonth(setYear(new Date(), parseInt(anoSelecionado)), parseInt(mesSelecionado));
      return format(dataSelecionada, 'MMMM/yyyy', { locale: ptBR });
    }
    return '...';
  }, [anoSelecionado, mesSelecionado]);

  // Mostra spinner global ou específico durante fetching
  const showGlobalLoader = isLoading && !resumoData; // Mostra global apenas no carregamento inicial
  const showFetchingIndicator = isFetching && !showGlobalLoader; // Mostra indicador menor durante refetch

  if (showGlobalLoader) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !resumoData) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar o resumo financeiro: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!resumoData) {
    return (
       <div className="container mx-auto py-8 text-center">
         <p>Nenhum dado encontrado para o resumo financeiro.</p>
       </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Cabeçalho com Botão Voltar e Seletores de Período */}
      <div className="pb-4 border-b mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          {/* Lado Esquerdo: Botão Voltar e Título */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold font-serif text-[#92400e]">Resumo Financeiro</h1>
             {/* Indicador de carregamento durante refetch */}
             {showFetchingIndicator && <Loader2 className="h-5 w-5 animate-spin text-primary/70" />}
          </div>

          {/* Lado Direito: Seletores de Período */}
          <div className="flex items-center gap-2 justify-end flex-wrap">
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="w-[150px]">
                 <Calendar className="h-4 w-4 mr-2 opacity-70" />
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {mesesOptions.map(mes => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anosOptions.map(ano => (
                  <SelectItem key={ano.value} value={ano.value}>
                    {ano.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Descrição alinhada com o título */}
        <p className="text-muted-foreground mt-1 sm:ml-[52px]"> {/* Ajustar marginLeft se necessário */}
          Visão geral das suas finanças para {periodoFormatado}.
        </p>
         {/* Mostrar erro como alerta abaixo da descrição se houver erro mas ainda tiver dados antigos */}
         {error && resumoData && (
           <Alert variant="destructive" className="mt-4">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Erro ao atualizar</AlertTitle>
             <AlertDescription>
               Não foi possível carregar os dados para {periodoFormatado}. Exibindo último resumo carregado. Erro: {error.message}
             </AlertDescription>
           </Alert>
         )}
      </div>

       {/* Exibe mensagem se não houver dados e não estiver carregando/com erro inicial */}
       {!resumoData && !isLoading && !error && (
         <div className="text-center text-muted-foreground py-10">
           Nenhum dado financeiro encontrado para {periodoFormatado}.
         </div>
       )}

      {/* Renderiza o conteúdo apenas se houver dados (mesmo que antigos durante o fetch) */}
      {resumoData && (
        <>
          {/* Cards de Resumo */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-green-300 bg-green-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold font-serif text-green-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Receitas ({periodoFormatado}) {/* Atualiza Título */}
                </CardTitle>
                 <CardDescription>Total de receitas registradas em {periodoFormatado}.</CardDescription> {/* Atualiza Descrição */}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">{formatCurrency(resumoData.totalReceitas)}</div>
              </CardContent>
            </Card>

            <Card className="border-red-300 bg-red-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold font-serif text-red-800 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                   Despesas Pagas ({periodoFormatado}) {/* Atualiza Título */}
                </CardTitle>
                 <CardDescription>Total de despesas pagas em {periodoFormatado}.</CardDescription> {/* Atualiza Descrição */}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">{formatCurrency(resumoData.totalDespesas)}</div>
              </CardContent>
            </Card>

            <Card className="border-blue-300 bg-blue-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold font-serif text-blue-800 flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Saldo Atual (Caixa)
                </CardTitle>
                 {/* A descrição do saldo atual pode não depender diretamente do período selecionado */}
                 <CardDescription>Último saldo registrado no fluxo de caixa.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className={`text-3xl font-bold ${resumoData.saldoAtual >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                   {formatCurrency(resumoData.saldoAtual)}
                 </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Últimas Movimentações (do período selecionado) */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Últimas Receitas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-700" />
                  Últimas Receitas ({periodoFormatado}) {/* Atualiza Título */}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumoData.ultimasReceitas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          Nenhuma receita recente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      resumoData.ultimasReceitas.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{format(parseISO(r.data), 'dd/MM/yy')}</TableCell>
                          <TableCell className="font-medium">{r.descricao}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(r.valor)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Últimas Despesas */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <BookOpen className="h-5 w-5 text-red-700" />
                   Últimas Despesas Pagas ({periodoFormatado}) {/* Atualiza Título */}
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Data Pgto.</TableHead>
                       <TableHead>Descrição</TableHead>
                       <TableHead className="text-right">Valor</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {resumoData.ultimasDespesas.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                           Nenhuma despesa recente.
                         </TableCell>
                       </TableRow>
                     ) : (
                       resumoData.ultimasDespesas.map((d) => (
                         <TableRow key={d.id}>
                           <TableCell>{format(parseISO(d.data), 'dd/MM/yy')}</TableCell>
                           <TableCell className="font-medium">{d.descricao}</TableCell>
                           <TableCell className="text-right text-red-600">{formatCurrency(d.valor)}</TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ResumoFinanceiroPage; 