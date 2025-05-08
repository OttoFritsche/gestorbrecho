import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, Tooltip, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FluxoCaixaData {
  data: string;
  entradas: number;
  saidas: number;
}

interface Props {
  fluxoCaixaData: FluxoCaixaData[];
}

const DashboardCharts: React.FC<Props> = ({ fluxoCaixaData }) => {
  const chartConfig = {
    entradas: { label: 'Receitas', theme: { light: '#92400e', dark: '#f59e0b' } },
    saidas: { label: 'Despesas', theme: { light: '#b91c1c', dark: '#f87171' } },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ChartContainer config={chartConfig}>
            <AreaChart
              width={389}
              height={219}
              data={fluxoCaixaData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <XAxis
                dataKey="data"
                tickFormatter={(value) => {
                  const date = new Date(`${value}T00:00:00`); 
                  return isValid(date) ? format(date, 'dd/MM', { locale: ptBR }) : '';
                }}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;

                  const dateString = payload[0]?.payload?.data;
                  let formattedDate = "Data inválida";

                  if (dateString) {
                    const dateObject = new Date(`${dateString}T00:00:00`); 
                    if (isValid(dateObject)) {
                      formattedDate = format(dateObject, 'dd/MM/yyyy', { locale: ptBR });
                    }
                  }

                  return (
                    <div className="rounded-lg border border-amber-200 bg-white p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[0.70rem] uppercase text-amber-800/70">
                            {formattedDate}
                          </span>
                        </div>
                        {payload.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-[0.70rem] capitalize text-amber-800/80">
                              {item.name === 'entradas' ? 'Receitas' : 'Despesas'}
                            </span>
                            <span className={`text-[0.70rem] font-bold ${item.name === 'entradas' ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                dataKey="entradas"
                name="entradas"
                strokeWidth={2}
                stroke="#16a34a"
                fill="#16a34a"
                fillOpacity={0.1}
              />
              <Area
                dataKey="saidas"
                name="saidas"
                strokeWidth={2}
                stroke="var(--color-saidas)"
                fill="var(--color-saidas)"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCharts;
