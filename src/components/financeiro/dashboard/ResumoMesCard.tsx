// src/components/financeiro/dashboard/ResumoMesCard.tsx

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Scale, MinusCircle, DollarSign, CheckCircle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Interface atualizada para receber os novos campos calculados
interface ResumoMesCardProps {
  totalVendido: number;         // Era totalReceitas
  custoItensVendidos: number;
  sobrouDasVendas: number;    // Era saldoMes (parcialmente)
  gastosGerais: number;       // Era totalDespesas
  resultadoFinal: number;     // Era saldoMes (resultado final)
  mesReferencia: string; 
}

const ResumoMesCard: React.FC<ResumoMesCardProps> = ({
  totalVendido,
  custoItensVendidos,
  sobrouDasVendas,
  gastosGerais,
  resultadoFinal,
  mesReferencia,
}) => {
  return (
    <TooltipProvider>
      <Card className="col-span-1 md:col-span-2"> {/* Ocupa mais espaço */}
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold font-serif text-[#92400e]">
            Resultado de {mesReferencia}
          </CardTitle>
          <CardDescription>Visão detalhada das vendas, custos e gastos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {/* Total Vendido */}
          <Link to="/app/vendas" className="flex items-center justify-between border-b pb-2 hover:bg-gray-50 rounded p-1 transition-colors duration-150">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Vendido</span>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Soma de todas as vendas realizadas no mês.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-lg font-semibold text-green-700">
              {formatCurrency(totalVendido)}
            </span>
          </Link>

          {/* Custo dos Itens Vendidos */}
          <div className="flex items-center justify-between border-b pb-2 p-1">
            <div className="flex items-center gap-2">
              <MinusCircle className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">(-) Custo dos Itens Vendidos</span>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Soma do custo de aquisição (preço de custo) dos produtos vendidos neste mês.</p>
                  <Link to="/app/vendas" className="text-blue-500 hover:underline text-xs mt-1 block">Ver vendas do mês</Link>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-lg font-semibold text-orange-600">
              {formatCurrency(custoItensVendidos)}
            </span>
          </div>

          {/* Sobrou das Vendas (Lucro Bruto) */}
          <div className="flex items-center justify-between border-b pb-2 font-medium bg-blue-50 p-2 rounded">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-600" />
              <span className="text-sm">(=) Sobrou das Vendas</span>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resultado do Total Vendido menos o Custo dos Itens Vendidos.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-lg font-semibold text-blue-700">
              {formatCurrency(sobrouDasVendas)}
            </span>
          </div>

          {/* Gastos Gerais */}
          <Link to="/app/financeiro/despesas" className="flex items-center justify-between border-b pb-2 hover:bg-gray-50 rounded p-1 transition-colors duration-150">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-sm text-muted-foreground">(-) Gastos Gerais</span>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Soma de todas as despesas registradas no mês (exceto custo dos itens vendidos).</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-lg font-semibold text-red-700">
              {formatCurrency(gastosGerais)}
            </span>
          </Link>

          {/* Resultado Final (Lucro Líquido) */}
          <div className="flex items-center justify-between pt-2 font-bold bg-green-50 p-3 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-5 w-5 ${resultadoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-sm uppercase">(=) Resultado Final do Mês</span>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resultado do que Sobrou das Vendas menos os Gastos Gerais. Lucro ou prejuízo final do mês.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className={`text-xl font-extrabold ${resultadoFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(resultadoFinal)}
            </span>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ResumoMesCard; 