// src/components/financeiro/dashboard/GraficoReceitaDespesa.tsx

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from '@/lib/utils'; // Importa o formatador de moeda

interface GraficoData {
  mes: string; // Ex: "Jan/24"
  receitas: number;
  despesas: number;
}

interface GraficoReceitaDespesaProps {
  data: GraficoData[];
}

// Componente de Tooltip customizado para formatar valores
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded shadow-sm">
        <p className="label font-semibold">{`${label}`}</p>
        <p className="text-green-600">{`Receitas: ${formatCurrency(payload[0].value)}`}</p>
        <p className="text-red-600">{`Despesas: ${formatCurrency(payload[1].value)}`}</p>
      </div>
    );
  }
  return null;
};

const GraficoReceitaDespesa: React.FC<GraficoReceitaDespesaProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-serif text-[#92400e]">
          Receitas vs. Despesas (Últimos 6 Meses)
        </CardTitle>
        <CardDescription>Comparativo mensal de entradas e saídas pagas.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {data.length === 0 ? (
           <p className="text-sm text-muted-foreground text-center py-8">
             Dados insuficientes para gerar o gráfico.
           </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 10, // Aumentado para não cortar labels
                left: 15, // Aumentado para caber valores maiores no eixo Y
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })} // Formato compacto (ex: 10k)
                tick={{ fontSize: 12 }}
                width={80} // Largura do eixo Y para acomodar valores formatados
               />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(206, 212, 218, 0.3)' }}/>
              <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}/>
              <Bar dataKey="receitas" fill="#22c55e" name="Receitas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default GraficoReceitaDespesa; 