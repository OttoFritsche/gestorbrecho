import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SaldoAtualCardProps {
  saldo: number;
}

const SaldoAtualCard: React.FC<SaldoAtualCardProps> = ({ saldo }) => {
  return (
    <Card className="border-blue-300 bg-blue-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold font-serif text-blue-800 flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Saldo Atual (Caixa)
        </CardTitle>
        <CardDescription>Último saldo registrado no fluxo de caixa.</CardDescription>
      </CardHeader>
      <CardContent className="pb-12">
        <div className={`text-3xl font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
          {formatCurrency(saldo)}
        </div>
      </CardContent>
    </Card>
  );
};

export default SaldoAtualCard; 