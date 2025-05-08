// src/components/financeiro/dashboard/UltimasTransacoesWidget.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UltimaTransacao } from '@/types/financeiro'; // Importar o tipo correto
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns'; // Para formatar a data
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, List } from 'lucide-react'; // Ícones para tipo

// Definir a interface das props
interface UltimasTransacoesWidgetProps {
  ultimasTransacoes: UltimaTransacao[];
}

const UltimasTransacoesWidget: React.FC<UltimasTransacoesWidgetProps> = ({ ultimasTransacoes }) => {
  return (
    <Card className="h-full flex flex-col"> {/* Adicionado flex flex-col e h-full para melhor layout */}
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <List className="h-5 w-5 text-gray-500" /> {/* Ícone genérico ou outro */} 
          Últimas Transações
        </CardTitle>
        <CardDescription>Feed das movimentações mais recentes.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto"> {/* Adicionado flex-grow e overflow */}
        {ultimasTransacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma transação recente.
          </p>
        ) : (
          <ul className="space-y-3">
            {ultimasTransacoes.map((transacao) => (
              <li key={transacao.id} className="flex items-center justify-between text-sm gap-2 border-b pb-2 last:border-b-0">
                <div className="flex items-center gap-2 flex-shrink min-w-0"> {/* Flex shrink e min-width para evitar quebra */}
                  {transacao.tipo === 'receita' ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-grow min-w-0"> {/* Flex grow e min-width */} 
                    <p className="font-medium truncate" title={transacao.descricao}>{transacao.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(transacao.data), 'dd/MM/yy HH:mm', { locale: ptBR })}
                       {transacao.categoria_nome ? ` • ${transacao.categoria_nome}` : ''}
                    </p>
                  </div>
                </div>
                <span 
                  className={`font-semibold whitespace-nowrap ${transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                  {transacao.tipo === 'receita' ? '+' : '-'}{formatCurrency(transacao.valor)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default UltimasTransacoesWidget; 