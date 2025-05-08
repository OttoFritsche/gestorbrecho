import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Landmark, HandCoins, Wallet, Scale, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { calcularBalancoPatrimonial } from '@/services/balanco';
import { BalancoPatrimonialData } from '@/types/financeiro';
import { formatCurrency } from '@/lib/utils';

const BalancoPatrimonialPage: React.FC = () => {
  const [dataReferencia, setDataReferencia] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();

  const dataRefFormatada = dataReferencia ? format(dataReferencia, 'yyyy-MM-dd') : '';

  const { data: balancoData, isLoading, error } = useQuery<BalancoPatrimonialData>({
    queryKey: ['balancoPatrimonial', dataRefFormatada],
    queryFn: () => calcularBalancoPatrimonial(dataRefFormatada),
    enabled: !!dataRefFormatada,
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col items-center justify-center mb-6 pb-4 border-b w-full">
        <h2 className="text-3xl font-bold font-serif text-[#92400e]">Balanço Patrimonial</h2>
        <p className="text-muted-foreground mt-1">Visualize seus ativos, passivos e patrimônio líquido.</p>
      </div>

      <div className="flex justify-center my-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !dataReferencia && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataReferencia ? format(dataReferencia, "dd/MM/yyyy", { locale: ptBR }) : <span>Escolha a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={dataReferencia}
              onSelect={setDataReferencia}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Calculando balanço...</span>
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center py-10 text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>Erro ao calcular balanço: {error.message}</span>
        </div>
      )}

      {!isLoading && !error && balancoData && (
        <div className="space-y-6">
          <p className="text-center text-muted-foreground">
            Balanço calculado com base em receitas e despesas registradas até {format(new Date(balancoData.dataReferencia + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-green-300 bg-green-50/30">
              <CardHeader className="pb-2">
                 <CardTitle className="text-lg font-semibold font-serif text-green-800 flex items-center gap-2">
                   <Landmark className="h-5 w-5" />
                   Total de Ativos
                 </CardTitle>
                 <CardDescription>Bens e direitos (total de receitas).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">{formatCurrency(balancoData.totalAtivos)}</div>
              </CardContent>
            </Card>

            <Card className="border-red-300 bg-red-50/30">
              <CardHeader className="pb-2">
                 <CardTitle className="text-lg font-semibold font-serif text-red-800 flex items-center gap-2">
                   <HandCoins className="h-5 w-5" />
                   Total de Passivos
                 </CardTitle>
                  <CardDescription>Obrigações e dívidas (total de despesas).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">{formatCurrency(balancoData.totalPassivos)}</div>
              </CardContent>
            </Card>

            <Card className="border-blue-300 bg-blue-50/30">
              <CardHeader className="pb-2">
                 <CardTitle className="text-lg font-semibold font-serif text-blue-800 flex items-center gap-2">
                   <Wallet className="h-5 w-5" />
                   Patrimônio Líquido
                 </CardTitle>
                  <CardDescription>Diferença entre ativos e passivos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${balancoData.patrimonioLiquido >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {formatCurrency(balancoData.patrimonioLiquido)}
                </div>
                 <p className={`text-sm mt-2 ${balancoData.patrimonioLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                   {balancoData.patrimonioLiquido >= 0 ? 'Situação positiva' : 'Situação negativa'}
                 </p>
              </CardContent>
            </Card>
          </div>

          <Separator />
          <div className="text-center text-lg font-medium text-muted-foreground">
             <span className="text-green-700">Ativos ({formatCurrency(balancoData.totalAtivos)})</span>
             <span className="mx-2">-</span>
             <span className="text-red-700">Passivos ({formatCurrency(balancoData.totalPassivos)})</span>
             <span className="mx-2">=</span>
             <span className={`font-bold ${balancoData.patrimonioLiquido >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Patrimônio Líquido ({formatCurrency(balancoData.patrimonioLiquido)})</span>
          </div>
         </div>
       )}
    </div>
  );
};

export default BalancoPatrimonialPage;
