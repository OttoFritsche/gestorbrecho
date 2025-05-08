import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getYear, getMonth, set, parseISO, startOfDay, endOfDay, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import { format as formatTz, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/constants';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, Scale, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

import { getFluxoCaixaPeriodo, getSaldoInicialPeriodo } from '@/services/fluxoCaixa';
import { FluxoCaixa } from '@/types/financeiro';
import { formatCurrency, formatDate } from '@/lib/utils';
import FluxoCaixaDetalhesModal from '@/components/financeiro/FluxoCaixaDetalhesModal';

const FluxoCaixaPage: React.FC = () => {
  const navigate = useNavigate();
  const hoje = new Date();
  
  // --- Estados para o Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);

  // Debug: Verificação de fuso horário
  useEffect(() => {
    console.log('Debug de horário:');
    console.log('- Horário local do navegador:', new Date().toString());
    console.log('- Horário convertido para Brasil:', 
      formatTz(new Date(), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: TIMEZONE }));
    console.log('- Offset do fuso horário:', new Date().getTimezoneOffset(), 'minutos');
  }, []);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return {
      from: inicioMes,
      to: hoje,
    };
  });

  const timeZone = 'America/Sao_Paulo';

  // Lógica de Datas Aprimorada
  const dataInicioObj = dateRange?.from ? startOfDay(dateRange.from) : null;
  // Se 'to' não estiver definido (seleção de dia único), usar 'from'
  const dataFimObj = dateRange?.to ? endOfDay(dateRange.to) : (dateRange?.from ? endOfDay(dateRange.from) : null);

  const dataInicioISO = dataInicioObj
    ? utcToZonedTime(dataInicioObj, timeZone).toISOString()
    : '';
  const dataFimISO = dataFimObj
    ? utcToZonedTime(dataFimObj, timeZone).toISOString()
    : '';

  // Debug Log para verificar as datas ISO enviadas
  useEffect(() => {
    console.log('[FluxoCaixaPage] DEBUG: Datas ISO calculadas para query de período:', { dataInicioISO, dataFimISO });
  }, [dataInicioISO, dataFimISO]);

  // --- useQuery para Saldo Inicial ---
  const { data: saldoInicial = 0, isLoading: isLoadingSaldo } = useQuery<number>({
    queryKey: ['saldoInicial', dataInicioISO],
    // Busca o saldo ANTES do início do período selecionado
    queryFn: () => {
      const dataAnteriorInicio = dataInicioObj ? subDays(dataInicioObj, 1) : new Date();
      // Precisamos buscar o saldo final do dia anterior para ser o inicial de hoje
      const dataAnteriorInicioISO = utcToZonedTime(endOfDay(dataAnteriorInicio), timeZone).toISOString(); 
      console.log(`[FluxoCaixaPage] Buscando saldo inicial ANTES de ${dataInicioISO} (data ref: ${dataAnteriorInicioISO})`);
      return getSaldoInicialPeriodo(dataAnteriorInicioISO);
    },
    enabled: !!dataInicioISO, 
  });

  const { data: fluxoCaixa = [], isLoading: isLoadingFluxo, error: errorFluxo } = useQuery<FluxoCaixa[]>({
    queryKey: ['fluxoCaixaPeriodo', dataInicioISO, dataFimISO],
    queryFn: () => getFluxoCaixaPeriodo(dataInicioISO, dataFimISO),
    enabled: !!dataInicioISO && !!dataFimISO,
  });

  // Corrigir os dados do fluxo de caixa para garantir que valores NaN sejam tratados como 0
  const fluxoCaixaCorrigido = useMemo(() => {
    if (!Array.isArray(fluxoCaixa)) return [];
    
    return fluxoCaixa.map(dia => {
      // Verificar se os valores são números válidos e substituir por 0 se não forem
      return {
        ...dia,
        entradas: isNaN(dia.entradas) ? 0 : dia.entradas,
        saidas: isNaN(dia.saidas) ? 0 : dia.saidas,
        saldo_inicial: isNaN(dia.saldo_inicial) ? 0 : dia.saldo_inicial,
        saldo_final: isNaN(dia.saldo_final) ? 0 : dia.saldo_final
      };
    });
  }, [fluxoCaixa]);

  const totaisPeriodo = useMemo(() => {
    if (!Array.isArray(fluxoCaixaCorrigido)) {
        console.error("[FluxoCaixaPage] ERRO: fluxoCaixa não é um array!", fluxoCaixaCorrigido);
        return { totalEntradas: 0, totalSaidas: 0, saldoFinal: 0 };
    }

    const totalEntradas = fluxoCaixaCorrigido.reduce((acc, dia) => {
        const entradaDia = dia?.entradas ?? 0; 
        if (typeof entradaDia !== 'number' || isNaN(entradaDia)) {
            console.warn(`[FluxoCaixaPage] Valor inválido para entradas no dia ${dia?.data}:`, dia?.entradas);
            return acc; 
        }
        return acc + entradaDia;
    }, 0);

    const totalSaidas = fluxoCaixaCorrigido.reduce((acc, dia) => {
        const saidaDia = dia?.saidas ?? 0; 
        if (typeof saidaDia !== 'number' || isNaN(saidaDia)) {
            console.warn(`[FluxoCaixaPage] Valor inválido para saidas no dia ${dia?.data}:`, dia?.saidas);
            return acc;
        }
        return acc + saidaDia;
    }, 0);

    const saldoInicialValido = typeof saldoInicial === 'number' && !isNaN(saldoInicial) ? saldoInicial : 0;
    const saldoFinal = saldoInicialValido + totalEntradas - totalSaidas;

    return {
      totalEntradas,
      totalSaidas,
      saldoFinal,
    };
  }, [fluxoCaixaCorrigido, saldoInicial]);

  const isLoading = isLoadingSaldo || isLoadingFluxo;

  // --- Handler para clique na linha ---
  const handleRowClick = (dataFormatada: string) => {
    try {
      // 1. Certifica-se que a data base está no formato YYYY-MM-DD
      if (!dataFormatada.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.error(`[FluxoCaixaPage] Formato de data inválido: ${dataFormatada}`);
        return;
      }
      
      // 2. Cria um objeto Date com a data completa (assume meio-dia local para parseISO)
      // IMPORTANTE: parseISO interpreta a string como LOCAL se não houver offset
      const dataObjLocal = parseISO(`${dataFormatada}T12:00:00`); 
      
      // 3. Converte para ISO string UTC
      // IMPORTANTE: toISOString SEMPRE retorna em UTC (Z)
      const dataUTCString = dataObjLocal.toISOString();
      
      console.log(`[FluxoCaixaPage] DEBUG: Linha clicada:
        - Data Formatada Clicada (YYYY-MM-DD): ${dataFormatada}
        - Data Obj Local (via parseISO T12): ${dataObjLocal.toString()}
        - Data UTC String (via toISOString): ${dataUTCString}`);
      
      // Passa a string UTC para o modal
      setSelectedDateForModal(dataUTCString); 
      setIsModalOpen(true);
    } catch (error) {
      console.error(`[FluxoCaixaPage] Erro ao processar data para modal:`, error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho APENAS com título/subtítulo centralizados */}
      <div className="flex flex-col items-center justify-center mb-6 pb-4 border-b w-full"> 
        <h2 className="text-3xl font-bold font-serif text-[#92400e]">Fluxo de Caixa</h2>
        <p className="text-muted-foreground mt-1">Acompanhe as entradas e saídas diárias.</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Card Saldo Inicial */}
        <Card className="border border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="h-4 w-4 text-gray-500" />
              Saldo Inicial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">
              {formatCurrency(saldoInicial || 0)}
            </div>
          </CardContent>
        </Card>
        
        {/* Card Entradas */}
        <Card className="border border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totaisPeriodo.totalEntradas || 0)}
            </div>
          </CardContent>
        </Card>
        
        {/* Card Saídas */}
        <Card className="border border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totaisPeriodo.totalSaidas || 0)}
            </div>
          </CardContent>
        </Card>
        
        {/* Card Saldo Final */}
        <Card className="border border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-500" />
              Saldo Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totaisPeriodo.saldoFinal >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatCurrency(totaisPeriodo.saldoFinal || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Picker ABAIXO dos cards e centralizado */}
      <div className="flex justify-center my-4"> 
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[260px] justify-start text-left font-normal", 
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/y", { locale: ptBR })} - {" "}
                    {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/y", { locale: ptBR })
                )
              ) : (
                <span>Escolha um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center"> 
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Tabela de Detalhes Diários */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando fluxo de caixa...</span>
        </div>
      )}

      {!isLoading && errorFluxo && (
        <div className="text-center py-10 text-red-600 flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          <span>Erro ao carregar o fluxo de caixa: {errorFluxo.message}</span>
          <span>Tente atualizar a página ou verificar sua conexão.</span>
        </div>
      )}

      {!isLoading && !errorFluxo && fluxoCaixaCorrigido.length === 0 && (
        <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          <span>Nenhum movimento encontrado para o período selecionado.</span>
        </div>
      )}

      {!isLoading && !errorFluxo && fluxoCaixaCorrigido.length > 0 && (
        <Card className="border border-primary/50">
          <CardContent className="p-0">
            <Table>
              <TableCaption className="py-4">Detalhes do fluxo de caixa para o período selecionado.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead className="text-right">Saldo Inicial</TableHead>
                  <TableHead className="text-right text-green-600">Entradas (+)</TableHead>
                  <TableHead className="text-right text-red-600">Saídas (-)</TableHead>
                  <TableHead className="text-right">Saldo Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fluxoCaixaCorrigido.map((dia) => (
                  <TableRow key={dia.data} onClick={() => handleRowClick(dia.data)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {format(parseISO(dia.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(dia.saldo_inicial)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(dia.entradas)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(dia.saidas)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(dia.saldo_final)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes */}
      {selectedDateForModal && (
        <FluxoCaixaDetalhesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDateForModal}
        />
      )}
    </div>
  );
};

export default FluxoCaixaPage;
