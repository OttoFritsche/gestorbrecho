import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoricoSaldoItem } from '@/types/financeiro';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp } from 'lucide-react'; // Ou outro ícone relevante

interface GraficoSaldoCaixaProps {
  data: HistoricoSaldoItem[];
}

// Tooltip customizado para o gráfico de saldo
const SaldoTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Formata o label (data)
    let formattedLabel = label;
    try {
      // Tenta formatar como dd/MM
      formattedLabel = format(parse(label, 'yyyy-MM-dd', new Date()), 'dd/MM', { locale: ptBR });
    } catch (e) { /* Usa label original se o parse falhar */ }

    return (
      <div className="bg-background border p-2 rounded shadow-sm text-sm">
        <p className="font-semibold">{formattedLabel}</p>
        <p style={{ color: payload[0].stroke }}>
          Saldo: {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const GraficoSaldoCaixa: React.FC<GraficoSaldoCaixaProps> = ({ data }) => {

  // Formata a data para exibição no eixo X (ex: 01/05)
  const formatXAxis = (tickItem: string) => {
     try {
      return format(parse(tickItem, 'yyyy-MM-dd', new Date()), 'dd/MM', { locale: ptBR });
    } catch (e) {
      return tickItem; // Retorna original em caso de erro
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600"/>
            Evolução do Saldo do Caixa (Últimos 30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[250px] w-full pt-4"> {/* Ajustar altura conforme necessário */} 
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 20, // Espaço para o tick do Y
              left: 10, // Espaço para o tick do Y
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="data"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd" // Mostrar início e fim
              // Considerar mostrar menos ticks se houver muitos dias:
              // minTickGap={30} 
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value, { notation: 'compact'})} 
              tick={{ fontSize: 10 }}
              width={60} // Ajustar largura para caber os valores formatados
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<SaldoTooltip />} />
            {/* <Legend /> - Legenda pode ser desnecessária com apenas uma linha */}
            <Line 
              type="monotone"
              dataKey="saldo"
              name="Saldo"
              stroke="#2563eb" // Azul
              strokeWidth={2}
              dot={false} // Remover pontos para um visual mais limpo
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default GraficoSaldoCaixa; 