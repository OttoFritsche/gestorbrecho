import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  ShoppingCart, 
  Package, 
  Receipt, 
  CircleDollarSign,
  CreditCard,
  UserPlus,
  Truck
} from 'lucide-react';

const AcoesRapidas: React.FC = () => {
  const navigate = useNavigate();
  
  const acoes = [
    { 
      label: 'Nova Venda', 
      icon: ShoppingCart, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100',
      onClick: () => navigate('/app/vendas/nova')
    },
    { 
      label: 'Adicionar Produto', 
      icon: Package, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100',
      onClick: () => navigate('/app/estoque/novo')
    },
    { 
      label: 'Registrar Receita', 
      icon: CreditCard, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100',
      onClick: () => navigate('/app/receitas/nova')
    },
    { 
      label: 'Registrar Despesa', 
      icon: CircleDollarSign, 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverColor: 'hover:bg-red-100',
      onClick: () => navigate('/app/despesas/nova')
    },
    { 
      label: 'Novo Cliente', 
      icon: UserPlus, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      hoverColor: 'hover:bg-amber-100',
      onClick: () => navigate('/app/clientes/novo')
    },
    { 
      label: 'Novo Fornecedor', 
      icon: Truck, 
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      hoverColor: 'hover:bg-teal-100',
      onClick: () => navigate('/app/fornecedores/novo')
    },
  ];

  return (
    <Card className="border border-amber-200/70 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold font-serif text-[#92400e] flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-amber-500" />
          Ações Rápidas
        </CardTitle>
        <CardDescription>
          Acesse rapidamente as principais funções do sistema.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {acoes.map((acao) => (
            <Button
              key={acao.label}
              variant="outline"
              className={`h-auto py-3 justify-start gap-3 ${acao.bgColor} ${acao.borderColor} ${acao.hoverColor}`}
              onClick={acao.onClick}
            >
              <acao.icon className={`h-5 w-5 ${acao.color}`} />
              <span className="text-sm">{acao.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AcoesRapidas; 