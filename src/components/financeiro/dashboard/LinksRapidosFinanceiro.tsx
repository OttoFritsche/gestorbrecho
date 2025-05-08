import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, TrendingDown, Wallet, Target, BarChart3, FileText } from 'lucide-react';

const LinksRapidosFinanceiro: React.FC = () => {
  const links = [
    { label: 'Receitas', path: '/app/receitas', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Despesas', path: '/app/despesas', icon: TrendingDown, color: 'text-red-600' },
    { label: 'Fluxo de Caixa', path: '/app/fluxo-caixa', icon: Wallet, color: 'text-blue-600' },
    { label: 'Metas', path: '/app/metas', icon: Target, color: 'text-purple-600' },
    { label: 'Balanço', path: '/app/balanco', icon: BarChart3, color: 'text-indigo-600' },
    { label: 'Relatórios', path: '/app/relatorios', icon: FileText, color: 'text-gray-600' }, // Link para índice de relatórios
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-serif text-[#92400e]">
          Acesso Rápido
        </CardTitle>
        <CardDescription>Navegue pelas seções financeiras.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map((link) => (
          <Button
            key={link.path}
            variant="ghost"
            className="w-full justify-start px-3"
            asChild
          >
            <Link to={link.path}>
              <link.icon className={`mr-2 h-4 w-4 ${link.color}`} />
              <span>{link.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default LinksRapidosFinanceiro; 