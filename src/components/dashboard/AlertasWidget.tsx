import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CalendarDays, 
  Package, 
  Receipt,
  InfoIcon
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Parcela {
  id: string;
  valor: number;
  data_vencimento: string;
  venda_id: string;
}

interface Despesa {
  id: string;
  valor: number;
  data_vencimento: string;
  descricao: string;
}

interface ProdutoEstoque {
  id: string;
  nome: string;
  quantidade: number;
  categoria_id: string;
}

interface AlertasProps {
  parcelasReceber: {
    itens: Parcela[];
    quantidade: number;
    valorTotal: number;
  };
  contasPagar: {
    itens: Despesa[];
    quantidade: number;
    valorTotal: number;
  };
  estoqueBaixo: {
    itens: ProdutoEstoque[];
    quantidade: number;
  };
}

const AlertasWidget: React.FC<AlertasProps> = ({ 
  parcelasReceber, 
  contasPagar, 
  estoqueBaixo 
}) => {
  // Verificar se há alertas ativos (despesas a pagar ou produtos com estoque baixo)
  // Nota: ignoramos parcelasReceber pois sabemos que está vazio
  const temAlertas = contasPagar.quantidade > 0 || estoqueBaixo.quantidade > 0;

  // Formatação das datas
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return format(data, 'dd/MM/yyyy', { locale: ptBR });
  };

  // Componente para exibir quando não há alertas
  const SemAlertas = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-amber-50 p-3 rounded-full mb-3">
        <AlertCircle className="h-6 w-6 text-amber-500" />
      </div>
      <h3 className="text-sm font-medium text-gray-700 mb-1">Tudo em ordem</h3>
      <p className="text-xs text-gray-500">
        Não há alertas pendentes para hoje.
      </p>
    </div>
  );

  return (
    <Card className="border border-amber-200/70 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold font-serif text-[#92400e] flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Alertas e Lembretes
        </CardTitle>
        <CardDescription>
          Itens que requerem sua atenção nos próximos dias.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mensagem sobre parcelas - funcionalidade em desenvolvimento */}
        <Alert className="bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <InfoIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <AlertTitle className="text-blue-800 text-sm font-medium">
                Parcelas a Receber
              </AlertTitle>
              <AlertDescription className="text-blue-700 mt-1 text-xs">
                Funcionalidade em desenvolvimento. Em breve você poderá visualizar parcelas a receber.
              </AlertDescription>
            </div>
          </div>
        </Alert>
          
        {!temAlertas ? (
          // Se não há outros alertas além da mensagem de parcelas, mostramos essa mensagem
          <Alert className="bg-green-50 border-green-200">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <AlertTitle className="text-green-800 text-sm font-medium">
                  Sem pendências
                </AlertTitle>
                <AlertDescription className="text-green-700 mt-1 text-xs">
                  Não há contas a pagar próximas do vencimento ou produtos com estoque baixo.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ) : (
          <>            
            {/* Contas a pagar */}
            {contasPagar.quantidade > 0 && (
              <Alert className="bg-red-50 border-red-200">
                <div className="flex items-start">
                  <Receipt className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <AlertTitle className="text-red-800 text-sm font-medium">
                      Contas a Pagar
                    </AlertTitle>
                    <AlertDescription className="text-red-700 mt-1 text-xs">
                      {contasPagar.quantidade} despesas próximas do vencimento,
                      totalizando {formatCurrency(contasPagar.valorTotal)}
                    </AlertDescription>
                    
                    {contasPagar.itens.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {contasPagar.itens.slice(0, 3).map(despesa => (
                          <div key={despesa.id} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3 text-red-600" />
                              <span className="text-red-800">
                                {formatarData(despesa.data_vencimento)}
                              </span>
                            </div>
                            <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">
                              {formatCurrency(despesa.valor)}
                            </Badge>
                          </div>
                        ))}
                        
                        {contasPagar.itens.length > 3 && (
                          <div className="text-xs text-red-700 italic mt-1">
                            E mais {contasPagar.itens.length - 3} despesas...
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-red-700 hover:text-red-800 hover:bg-red-100 p-0 h-auto text-xs"
                      asChild
                    >
                      <Link to="/app/despesas">Ver todas as despesas</Link>
                    </Button>
                  </div>
                </div>
              </Alert>
            )}
            
            {/* Estoque baixo */}
            {estoqueBaixo.quantidade > 0 && (
              <Alert className="bg-blue-50 border-blue-200">
                <div className="flex items-start">
                  <Package className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <AlertTitle className="text-blue-800 text-sm font-medium">
                      Estoque Baixo
                    </AlertTitle>
                    <AlertDescription className="text-blue-700 mt-1 text-xs">
                      {estoqueBaixo.quantidade} produtos com estoque crítico
                    </AlertDescription>
                    
                    {estoqueBaixo.itens.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {estoqueBaixo.itens.slice(0, 3).map(produto => (
                          <div key={produto.id} className="flex justify-between items-center text-xs">
                            <span className="text-blue-800 truncate max-w-[70%]">{produto.nome}</span>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {produto.quantidade} un
                            </Badge>
                          </div>
                        ))}
                        
                        {estoqueBaixo.itens.length > 3 && (
                          <div className="text-xs text-blue-700 italic mt-1">
                            E mais {estoqueBaixo.itens.length - 3} produtos...
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-blue-700 hover:text-blue-800 hover:bg-blue-100 p-0 h-auto text-xs"
                      asChild
                    >
                      <Link to="/app/estoque">Ver todos os produtos</Link>
                    </Button>
                  </div>
                </div>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertasWidget; 