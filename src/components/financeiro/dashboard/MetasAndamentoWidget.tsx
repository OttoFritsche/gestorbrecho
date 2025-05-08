import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Target, ArrowRight } from 'lucide-react';

interface MetasAndamentoWidgetProps {
  count: number;
}

const MetasAndamentoWidget: React.FC<MetasAndamentoWidgetProps> = ({ count }) => {
  return (
    <Card className="border-purple-300 bg-purple-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold font-serif text-purple-800 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas em Andamento
        </CardTitle>
        <CardDescription>Acompanhe seus objetivos financeiros.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-3 pt-4">
        <div className="text-4xl font-bold text-purple-700">{count}</div>
        <Button variant="ghost" size="sm" asChild className="text-purple-700 hover:bg-purple-100">
          <Link to="/app/metas">
            Ver Todas as Metas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default MetasAndamentoWidget; 